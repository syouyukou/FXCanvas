export interface EffectParam {
	name: string;
	label: string;
	type: 'float' | 'int' | 'bool' | 'color';
	min?: number;
	max?: number;
	step?: number;
	default: number | boolean | string;
	value: number | boolean | string;
}

export interface Effect {
	id: string;
	name: string;
	category: string;
	fragmentShader: string;
	params: EffectParam[];
	enabled: boolean;
}

export interface AppliedEffect {
	effect: Effect;
	params: Record<string, number | boolean | string>;
}

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}`;

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
	const shader = gl.createShader(type)!;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error('Shader compile error: ' + log);
	}
	return shader;
}

function createProgram(
	gl: WebGL2RenderingContext,
	vertSrc: string,
	fragSrc: string
): WebGLProgram {
	const vert = createShader(gl, gl.VERTEX_SHADER, vertSrc);
	const frag = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
	const prog = gl.createProgram()!;
	gl.attachShader(prog, vert);
	gl.attachShader(prog, frag);
	gl.linkProgram(prog);
	gl.deleteShader(vert);
	gl.deleteShader(frag);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		throw new Error('Program link error: ' + gl.getProgramInfoLog(prog));
	}
	return prog;
}

const QUAD_POSITIONS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
// Standard texcoords (0,0 at bottom-left). Source image loaded with UNPACK_FLIP_Y_WEBGL
// so all passes (source→FBO and FBO→FBO) use identical coords — no even-layer flip.
const QUAD_TEXCOORDS = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

export class Renderer {
	private gl: WebGL2RenderingContext;
	private programs = new Map<string, WebGLProgram>();
	private sourceTexture: WebGLTexture | null = null;
	private fbos: [WebGLFramebuffer, WebGLTexture][] = [];
	private vao: WebGLVertexArrayObject;
	private passThrough: WebGLProgram;

	private srcWidth = 0;
	private srcHeight = 0;

	constructor(canvas: HTMLCanvasElement) {
		const gl = canvas.getContext('webgl2');
		if (!gl) throw new Error('WebGL2 not supported');
		this.gl = gl;

		// Setup fullscreen quad VAO
		this.vao = gl.createVertexArray()!;
		gl.bindVertexArray(this.vao);

		const posBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, QUAD_POSITIONS, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		const texBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, QUAD_TEXCOORDS, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

		gl.bindVertexArray(null);

		// Pass-through program (no effect)
		const passFrag = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
void main() { outColor = texture(u_texture, v_texCoord); }`;
		this.passThrough = createProgram(gl, VERTEX_SHADER, passFrag);
	}

	loadImage(image: HTMLImageElement | ImageBitmap): void {
		const gl = this.gl;
		if (this.sourceTexture) gl.deleteTexture(this.sourceTexture);

		const tex = gl.createTexture()!;
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		this.sourceTexture = tex;

		const w = 'naturalWidth' in image ? image.naturalWidth : image.width;
		const h = 'naturalHeight' in image ? image.naturalHeight : image.height;
		this.srcWidth = w;
		this.srcHeight = h;

		this.ensureFBOs(w, h);
	}

	private ensureFBOs(w: number, h: number) {
		const gl = this.gl;
		// Free old FBOs
		for (const [fbo, tex] of this.fbos) {
			gl.deleteFramebuffer(fbo);
			gl.deleteTexture(tex);
		}
		this.fbos = [];

		// Create 2 ping-pong FBOs
		for (let i = 0; i < 2; i++) {
			const tex = gl.createTexture()!;
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

			const fbo = gl.createFramebuffer()!;
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
			this.fbos.push([fbo, tex]);
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	getProgram(effect: Effect): WebGLProgram {
		if (this.programs.has(effect.id)) return this.programs.get(effect.id)!;
		const prog = createProgram(this.gl, VERTEX_SHADER, effect.fragmentShader);
		this.programs.set(effect.id, prog);
		return prog;
	}

	render(appliedEffects: AppliedEffect[]): void {
		if (!this.sourceTexture) return;
		const gl = this.gl;
		const canvas = gl.canvas as HTMLCanvasElement;

		const enabled = appliedEffects.filter((a) => a.effect.enabled);

		gl.bindVertexArray(this.vao);
		gl.viewport(0, 0, this.srcWidth, this.srcHeight);

		let currentTex = this.sourceTexture;
		let pingPong = 0;

		if (enabled.length === 0) {
			// Draw directly to canvas
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(this.passThrough);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, currentTex);
			gl.uniform1i(gl.getUniformLocation(this.passThrough, 'u_texture'), 0);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			return;
		}

		for (let i = 0; i < enabled.length; i++) {
			const { effect, params } = enabled[i];
			const isLast = i === enabled.length - 1;
			const prog = this.getProgram(effect);

			if (isLast) {
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				gl.viewport(0, 0, canvas.width, canvas.height);
			} else {
				gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[pingPong % 2][0]);
				gl.viewport(0, 0, this.srcWidth, this.srcHeight);
			}

			gl.useProgram(prog);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, currentTex);
			gl.uniform1i(gl.getUniformLocation(prog, 'u_texture'), 0);
			gl.uniform2f(
				gl.getUniformLocation(prog, 'u_resolution'),
				this.srcWidth,
				this.srcHeight
			);

			// Set effect params
			for (const param of effect.params) {
				const val = params[param.name] ?? param.default;
				const loc = gl.getUniformLocation(prog, 'u_' + param.name);
				if (loc === null) continue;
				if (param.type === 'bool') {
					gl.uniform1i(loc, val ? 1 : 0);
				} else {
					gl.uniform1f(loc, val as number);
				}
			}

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			if (!isLast) {
				currentTex = this.fbos[pingPong % 2][1];
				pingPong++;
			}
		}
		gl.bindVertexArray(null);
	}

	exportCanvas(): string {
		const gl = this.gl;
		const canvas = gl.canvas as HTMLCanvasElement;
		return canvas.toDataURL('image/png');
	}

	get imageSize(): { width: number; height: number } {
		return { width: this.srcWidth, height: this.srcHeight };
	}

	hasImage(): boolean {
		return this.sourceTexture !== null;
	}

	destroy() {
		const gl = this.gl;
		this.programs.forEach((p) => gl.deleteProgram(p));
		if (this.sourceTexture) gl.deleteTexture(this.sourceTexture);
		for (const [fbo, tex] of this.fbos) {
			gl.deleteFramebuffer(fbo);
			gl.deleteTexture(tex);
		}
	}
}
