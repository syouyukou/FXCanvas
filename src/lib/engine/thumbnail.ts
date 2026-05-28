import type { Effect } from './renderer';

const THUMB = 96;

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

function link(gl: WebGL2RenderingContext, vert: string, frag: string): WebGLProgram {
	const p = gl.createProgram()!;
	gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vert));
	gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
	gl.linkProgram(p);
	return p;
}

export class ThumbnailRenderer {
	private canvas: HTMLCanvasElement;
	private gl: WebGL2RenderingContext;
	private vao: WebGLVertexArrayObject;
	private sourceTex: WebGLTexture | null = null;
	private programs = new Map<string, WebGLProgram>();

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

	renderEffect(effect: Effect): string {
		const gl = this.gl;
		if (!this.sourceTex) return '';

		let prog = this.programs.get(effect.id);
		if (!prog) {
			prog = link(gl, VERT, effect.fragmentShader);
			this.programs.set(effect.id, prog);
		}

		gl.viewport(0, 0, THUMB, THUMB);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindVertexArray(this.vao);
		gl.useProgram(prog);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.sourceTex);
		gl.uniform1i(gl.getUniformLocation(prog, 'u_texture'), 0);
		gl.uniform2f(gl.getUniformLocation(prog, 'u_resolution'), THUMB, THUMB);

		for (const p of effect.params) {
			const loc = gl.getUniformLocation(prog, 'u_' + p.name);
			if (loc === null) continue;
			if (p.type === 'bool') gl.uniform1i(loc, p.default ? 1 : 0);
			else gl.uniform1f(loc, p.default as number);
		}

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.bindVertexArray(null);

		return this.canvas.toDataURL('image/jpeg', 0.8);
	}

	destroy() {
		const gl = this.gl;
		this.programs.forEach((p) => gl.deleteProgram(p));
		if (this.sourceTex) gl.deleteTexture(this.sourceTex);
	}
}
