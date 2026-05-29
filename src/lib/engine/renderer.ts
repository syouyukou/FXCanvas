import type { GradientStop } from './gradient';
import { gradientToUniforms } from './gradient';

export type { GradientStop };

export interface EffectParam {
	name: string;
	label: string;
	/** Plain-language tooltip (shown in UI). */
	hint?: string;
	type: 'float' | 'int' | 'bool' | 'color' | 'enum' | 'gradient';
	min?: number;
	max?: number;
	step?: number;
	default: number | boolean | string | GradientStop[];
	value?: number | boolean | string | GradientStop[];
	options?: { value: number; label: string }[];
}

export interface EffectPass {
	id: string;
	fragmentShader: string;
	/** Bind chain input at start of this effect to u_original (TEXTURE1). */
	useOriginal?: boolean;
}

export interface Effect {
	id: string;
	name: string;
	category: string;
	/** Single-pass shader (used when passes is omitted). */
	fragmentShader?: string;
	/** Multi-pass shaders run in order within one layer. */
	passes?: EffectPass[];
	params: EffectParam[];
	enabled: boolean;
}

export interface AppliedEffect {
	effect: Effect;
	params: Record<string, number | boolean | string | GradientStop[]>;
	/** Layer blend strength 0–1 (default 1). */
	opacity: number;
}

export interface RenderOptions {
	fullRes?: boolean;
	width?: number;
	height?: number;
}

export interface ExportImageOptions {
	format: 'png' | 'jpeg';
	width: number;
	height: number;
	quality?: number;
}

const PREVIEW_MAX_DIM = 1920;

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}`;

const QUAD_POSITIONS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
const QUAD_TEXCOORDS = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

export function getEffectPasses(effect: Effect): EffectPass[] {
	if (effect.passes?.length) return effect.passes;
	if (!effect.fragmentShader) {
		throw new Error(`Effect "${effect.id}" has no shader`);
	}
	return [{ id: 'main', fragmentShader: effect.fragmentShader }];
}

export function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	if (h.length !== 6) return [1, 1, 1];
	return [
		parseInt(h.slice(0, 2), 16) / 255,
		parseInt(h.slice(2, 4), 16) / 255,
		parseInt(h.slice(4, 6), 16) / 255
	];
}

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

export class Renderer {
	private gl: WebGL2RenderingContext;
	private programs = new Map<string, WebGLProgram>();
	private uniformCache = new Map<string, WebGLUniformLocation | null>();
	private sourceTexture: WebGLTexture | null = null;
	private fbos: [WebGLFramebuffer, WebGLTexture][] = [];
	private vao: WebGLVertexArrayObject;
	private passThrough: WebGLProgram;
	private opacityBlend: WebGLProgram;

	private srcWidth = 0;
	private srcHeight = 0;
	private renderWidth = 0;
	private renderHeight = 0;

	constructor(canvas: HTMLCanvasElement) {
		const gl = canvas.getContext('webgl2');
		if (!gl) throw new Error('WebGL2 not supported');
		this.gl = gl;

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

		const passFrag = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
void main() { outColor = texture(u_texture, v_texCoord); }`;
		this.passThrough = createProgram(gl, VERTEX_SHADER, passFrag);

		const opacityFrag = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_base;
uniform sampler2D u_effect;
uniform float u_opacity;
void main() {
  vec4 base = texture(u_base, v_texCoord);
  vec4 effect = texture(u_effect, v_texCoord);
  outColor = mix(base, effect, u_opacity);
}`;
		this.opacityBlend = createProgram(gl, VERTEX_SHADER, opacityFrag);
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
		this.renderWidth = 0;
		this.renderHeight = 0;
	}

	private computeRenderSize(options: RenderOptions): { width: number; height: number } {
		if (options.width !== undefined && options.height !== undefined) {
			return { width: options.width, height: options.height };
		}

		const fullRes = options.fullRes ?? false;
		if (fullRes || Math.max(this.srcWidth, this.srcHeight) <= PREVIEW_MAX_DIM) {
			return { width: this.srcWidth, height: this.srcHeight };
		}
		const scale = PREVIEW_MAX_DIM / Math.max(this.srcWidth, this.srcHeight);
		return {
			width: Math.max(1, Math.round(this.srcWidth * scale)),
			height: Math.max(1, Math.round(this.srcHeight * scale))
		};
	}

	private ensureRenderTarget(width: number, height: number): void {
		const gl = this.gl;
		const canvas = gl.canvas as HTMLCanvasElement;

		if (width === this.renderWidth && height === this.renderHeight) return;

		this.renderWidth = width;
		this.renderHeight = height;
		canvas.width = width;
		canvas.height = height;
		this.ensureFBOs(width, height);
	}

	private ensureFBOs(w: number, h: number) {
		const gl = this.gl;
		for (const [fbo, tex] of this.fbos) {
			gl.deleteFramebuffer(fbo);
			gl.deleteTexture(tex);
		}
		this.fbos = [];

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

	private programKey(effectId: string, passId: string): string {
		return `${effectId}:${passId}`;
	}

	private getProgram(effectId: string, pass: EffectPass): WebGLProgram {
		const key = this.programKey(effectId, pass.id);
		if (this.programs.has(key)) return this.programs.get(key)!;
		const prog = createProgram(this.gl, VERTEX_SHADER, pass.fragmentShader);
		this.programs.set(key, prog);
		return prog;
	}

	private getUniform(cacheKey: string, prog: WebGLProgram, name: string): WebGLUniformLocation | null {
		const key = `${cacheKey}:${name}`;
		if (!this.uniformCache.has(key)) {
			this.uniformCache.set(key, this.gl.getUniformLocation(prog, name));
		}
		return this.uniformCache.get(key)!;
	}

	private bindTexture(
		cacheKey: string,
		unit: number,
		texture: WebGLTexture,
		uniformName: string,
		prog: WebGLProgram
	): void {
		const gl = this.gl;
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const loc = this.getUniform(cacheKey, prog, uniformName);
		if (loc) gl.uniform1i(loc, unit);
	}

	private setGradientUniforms(
		cacheKey: string,
		prog: WebGLProgram,
		stops: GradientStop[]
	): void {
		const gl = this.gl;
		const { colors, positions } = gradientToUniforms(stops);
		const names = ['u_grad_0', 'u_grad_1', 'u_grad_2'] as const;
		const posNames = ['u_grad_p0', 'u_grad_p1', 'u_grad_p2'] as const;
		for (let i = 0; i < 3; i++) {
			const loc = this.getUniform(cacheKey, prog, names[i]);
			if (loc) gl.uniform3f(loc, colors[i][0], colors[i][1], colors[i][2]);
			const pLoc = this.getUniform(cacheKey, prog, posNames[i]);
			if (pLoc) gl.uniform1f(pLoc, positions[i]);
		}
	}

	private setEffectParams(
		cacheKey: string,
		prog: WebGLProgram,
		effect: Effect,
		params: Record<string, number | boolean | string | GradientStop[]>
	): void {
		const gl = this.gl;
		for (const param of effect.params) {
			const val = params[param.name] ?? param.default;

			if (param.type === 'gradient') {
				if (effect.id === 'star_glow') {
					this.setGradientUniforms(cacheKey, prog, val as GradientStop[]);
				}
				continue;
			}

			const loc = this.getUniform(cacheKey, prog, 'u_' + param.name);
			if (loc === null) continue;

			switch (param.type) {
				case 'bool':
					gl.uniform1i(loc, val ? 1 : 0);
					break;
				case 'color': {
					const [r, g, b] = hexToRgb(val as string);
					gl.uniform3f(loc, r, g, b);
					break;
				}
				case 'int':
				case 'enum':
				case 'float':
				default:
					gl.uniform1f(loc, val as number);
					break;
			}
		}
	}

	private bindPassTextures(
		cacheKey: string,
		prog: WebGLProgram,
		inputTex: WebGLTexture,
		originalTex: WebGLTexture | null,
		useOriginal: boolean
	): void {
		this.bindTexture(cacheKey, 0, inputTex, 'u_texture', prog);
		if (useOriginal && originalTex) {
			this.bindTexture(cacheKey, 1, originalTex, 'u_original', prog);
		}
		const resLoc = this.getUniform(cacheKey, prog, 'u_resolution');
		if (resLoc) this.gl.uniform2f(resLoc, this.renderWidth, this.renderHeight);
	}

	private blendLayerOpacity(
		baseTex: WebGLTexture,
		effectTex: WebGLTexture,
		opacity: number,
		toScreen: boolean,
		pingPong: number
	): WebGLTexture | null {
		const gl = this.gl;
		const cacheKey = '__opacity_blend__';
		if (toScreen) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, (gl.canvas as HTMLCanvasElement).width, (gl.canvas as HTMLCanvasElement).height);
		} else {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[pingPong % 2][0]);
			gl.viewport(0, 0, this.renderWidth, this.renderHeight);
		}
		gl.useProgram(this.opacityBlend);
		this.bindTexture(cacheKey, 0, baseTex, 'u_base', this.opacityBlend);
		this.bindTexture(cacheKey, 1, effectTex, 'u_effect', this.opacityBlend);
		const opacityLoc = this.getUniform(cacheKey, this.opacityBlend, 'u_opacity');
		if (opacityLoc) gl.uniform1f(opacityLoc, opacity);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		return toScreen ? null : this.fbos[pingPong % 2][1];
	}

	render(appliedEffects: AppliedEffect[], options: RenderOptions = {}): void {
		if (!this.sourceTexture) return;
		const gl = this.gl;
		const canvas = gl.canvas as HTMLCanvasElement;
		const { width, height } = this.computeRenderSize(options);
		this.ensureRenderTarget(width, height);

		const enabled = appliedEffects.filter((a) => a.effect.enabled);

		gl.bindVertexArray(this.vao);
		gl.viewport(0, 0, width, height);

		let currentTex = this.sourceTexture;
		let pingPong = 0;

		if (enabled.length === 0) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.useProgram(this.passThrough);
			this.bindTexture('__passthrough__', 0, currentTex, 'u_texture', this.passThrough);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			gl.bindVertexArray(null);
			return;
		}

		for (let i = 0; i < enabled.length; i++) {
			const item = enabled[i];
			const { effect, params } = item;
			const opacity = item.opacity ?? 1;
			const needsBlend = opacity < 0.999;
			const isLastEffect = i === enabled.length - 1;
			const passes = getEffectPasses(effect);
			const baseTex = currentTex;
			let passInput = baseTex;
			let effectOutput: WebGLTexture = baseTex;

			for (let p = 0; p < passes.length; p++) {
				const pass = passes[p];
				const isLastPass = p === passes.length - 1;
				const drawToScreen = isLastPass && isLastEffect && !needsBlend;
				const cacheKey = this.programKey(effect.id, pass.id);

				if (drawToScreen) {
					gl.bindFramebuffer(gl.FRAMEBUFFER, null);
					gl.viewport(0, 0, canvas.width, canvas.height);
				} else {
					gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[pingPong % 2][0]);
					gl.viewport(0, 0, width, height);
				}

				const prog = this.getProgram(effect.id, pass);
				gl.useProgram(prog);
				this.bindPassTextures(cacheKey, prog, passInput, baseTex, pass.useOriginal ?? false);
				this.setEffectParams(cacheKey, prog, effect, params);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

				if (!drawToScreen) {
					effectOutput = this.fbos[pingPong % 2][1];
					if (!isLastPass) {
						passInput = effectOutput;
						pingPong++;
					}
				}
			}

			if (needsBlend) {
				const blended = this.blendLayerOpacity(
					baseTex,
					effectOutput,
					opacity,
					isLastEffect,
					pingPong
				);
				pingPong++;
				if (!isLastEffect && blended) currentTex = blended;
			} else if (!isLastEffect) {
				currentTex = effectOutput;
			}
		}

		gl.bindVertexArray(null);
	}

	exportImage(appliedEffects: AppliedEffect[], options: ExportImageOptions): string {
		this.render(appliedEffects, { width: options.width, height: options.height });
		const canvas = this.gl.canvas as HTMLCanvasElement;
		const url =
			options.format === 'jpeg'
				? canvas.toDataURL('image/jpeg', options.quality ?? 0.92)
				: canvas.toDataURL('image/png');
		this.render(appliedEffects, { fullRes: false });
		return url;
	}

	exportCanvas(appliedEffects: AppliedEffect[]): string {
		return this.exportImage(appliedEffects, {
			format: 'png',
			width: this.srcWidth,
			height: this.srcHeight
		});
	}

	exportJPEG(appliedEffects: AppliedEffect[], quality = 0.92): string {
		return this.exportImage(appliedEffects, {
			format: 'jpeg',
			width: this.srcWidth,
			height: this.srcHeight,
			quality
		});
	}

	get imageSize(): { width: number; height: number } {
		return { width: this.srcWidth, height: this.srcHeight };
	}

	get isPreviewScaled(): boolean {
		return this.srcWidth !== this.renderWidth || this.srcHeight !== this.renderHeight;
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
