import type { Effect, EffectParam } from './renderer';
import { getEffectPasses, hexToRgb } from './renderer';
import { gradientToUniforms, type GradientStop } from './gradient';

export const THUMB_SIZE = 96;

const THUMB = THUMB_SIZE;

const PASSTHROUGH_FRAG = `#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
out vec4 fragColor;
void main() {
  fragColor = texture(u_texture, v_texCoord);
}`;

const VERT = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}`;

const POSITIONS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
const TEXCOORDS = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
	const s = gl.createShader(type)!;
	gl.shaderSource(s, src);
	gl.compileShader(s);
	return s;
}

function link(gl: WebGL2RenderingContext, vert: string, frag: string): WebGLProgram | null {
	const p = gl.createProgram()!;
	gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vert));
	gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
	gl.linkProgram(p);
	if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
	return p;
}

function setDefaultParams(
	gl: WebGL2RenderingContext,
	prog: WebGLProgram,
	params: EffectParam[]
): void {
	for (const p of params) {
		const val = p.default;
		if (p.type === 'gradient') {
			const { colors, positions } = gradientToUniforms(val as GradientStop[]);
			const names = ['u_grad_0', 'u_grad_1', 'u_grad_2'] as const;
			const posNames = ['u_grad_p0', 'u_grad_p1', 'u_grad_p2'] as const;
			for (let i = 0; i < 3; i++) {
				const loc = gl.getUniformLocation(prog, names[i]);
				if (loc) gl.uniform3f(loc, colors[i][0], colors[i][1], colors[i][2]);
				const pLoc = gl.getUniformLocation(prog, posNames[i]);
				if (pLoc) gl.uniform1f(pLoc, positions[i]);
			}
			continue;
		}
		const loc = gl.getUniformLocation(prog, 'u_' + p.name);
		if (loc === null) continue;
		if (p.type === 'bool') gl.uniform1i(loc, val ? 1 : 0);
		else if (p.type === 'color') {
			const [r, g, b] = hexToRgb(val as string);
			gl.uniform3f(loc, r, g, b);
		} else gl.uniform1f(loc, val as number);
	}
}

export class ThumbnailRenderer {
	private canvas: HTMLCanvasElement;
	private gl: WebGL2RenderingContext;
	private vao: WebGLVertexArrayObject;
	private sourceTex: WebGLTexture | null = null;
	private programs = new Map<string, WebGLProgram>();
	private passthrough: WebGLProgram | null = null;
	private fbos: [WebGLFramebuffer, WebGLTexture][] = [];

	constructor() {
		this.canvas = document.createElement('canvas');
		this.canvas.width = THUMB;
		this.canvas.height = THUMB;
		const gl = this.canvas.getContext('webgl2', { preserveDrawingBuffer: true })!;
		this.gl = gl;

		this.vao = gl.createVertexArray()!;
		gl.bindVertexArray(this.vao);

		const pb = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, pb);
		gl.bufferData(gl.ARRAY_BUFFER, POSITIONS, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		const tb = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, tb);
		gl.bufferData(gl.ARRAY_BUFFER, TEXCOORDS, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

		gl.bindVertexArray(null);
		this.ensureFBOs();
	}

	private ensureFBOs() {
		const gl = this.gl;
		for (const [fbo, tex] of this.fbos) {
			gl.deleteFramebuffer(fbo);
			gl.deleteTexture(tex);
		}
		this.fbos = [];
		for (let i = 0; i < 2; i++) {
			const tex = gl.createTexture()!;
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, THUMB, THUMB, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
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

	loadImage(image: HTMLImageElement | ImageBitmap) {
		const gl = this.gl;
		if (this.sourceTex) gl.deleteTexture(this.sourceTex);

		const t = gl.createTexture()!;
		gl.bindTexture(gl.TEXTURE_2D, t);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		this.sourceTex = t;
	}

	private getProgram(effect: Effect, passId: string, frag: string): WebGLProgram | null {
		const key = `${effect.id}:${passId}`;
		if (this.programs.has(key)) return this.programs.get(key)!;
		const prog = link(this.gl, VERT, frag);
		if (prog) this.programs.set(key, prog);
		return prog;
	}

	renderSource(): string {
		const gl = this.gl;
		if (!this.sourceTex) return '';

		if (!this.passthrough) {
			this.passthrough = link(gl, VERT, PASSTHROUGH_FRAG);
			if (!this.passthrough) return '';
		}

		gl.bindVertexArray(this.vao);
		gl.viewport(0, 0, THUMB, THUMB);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.useProgram(this.passthrough);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.sourceTex);
		gl.uniform1i(gl.getUniformLocation(this.passthrough, 'u_texture'), 0);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.bindVertexArray(null);
		return this.canvas.toDataURL('image/jpeg', 0.82);
	}

	renderEffect(effect: Effect): string {
		const gl = this.gl;
		if (!this.sourceTex) return '';

		const passes = getEffectPasses(effect);
		gl.bindVertexArray(this.vao);
		gl.viewport(0, 0, THUMB, THUMB);

		let currentTex = this.sourceTex;
		let pingPong = 0;
		const effectInput = this.sourceTex;
		let passInput = effectInput;

		for (let p = 0; p < passes.length; p++) {
			const pass = passes[p];
			const isLast = p === passes.length - 1;
			const prog = this.getProgram(effect, pass.id, pass.fragmentShader);
			if (!prog) return '';

			if (isLast) {
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			} else {
				gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[pingPong % 2][0]);
			}

			gl.useProgram(prog);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, passInput);
			gl.uniform1i(gl.getUniformLocation(prog, 'u_texture'), 0);
			if (pass.useOriginal) {
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, effectInput);
				gl.uniform1i(gl.getUniformLocation(prog, 'u_original'), 1);
			}
			const resLoc = gl.getUniformLocation(prog, 'u_resolution');
			if (resLoc) gl.uniform2f(resLoc, THUMB, THUMB);
			setDefaultParams(gl, prog, effect.params);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			if (!isLast) {
				passInput = this.fbos[pingPong % 2][1];
				pingPong++;
			}
		}

		gl.bindVertexArray(null);
		return this.canvas.toDataURL('image/jpeg', 0.8);
	}

	destroy() {
		const gl = this.gl;
		this.programs.forEach((p) => gl.deleteProgram(p));
		if (this.passthrough) gl.deleteProgram(this.passthrough);
		if (this.sourceTex) gl.deleteTexture(this.sourceTex);
		for (const [fbo, tex] of this.fbos) {
			gl.deleteFramebuffer(fbo);
			gl.deleteTexture(tex);
		}
	}
}
