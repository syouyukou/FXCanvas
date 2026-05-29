import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

const HASH = `
float hash1(float n) {
  return fract(sin(n) * 43758.5453);
}

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
`;

/** Effect.app glitch-digital — block corruption, RGB split, line tears. */
export const GLITCH_DIGITAL_FRAGMENT = HEADER + HASH + `
uniform float u_block_size;
uniform float u_displacement;
uniform float u_block_opacity;
uniform float u_color_split;
uniform float u_line_tear;
uniform float u_pixelate;
uniform float u_seed;

void main() {
  vec2 uv = v_texCoord;
  float pix = mix(1.0, 64.0, clamp(u_pixelate, 0.0, 1.0));
  vec2 pixUv = floor(uv * u_resolution / pix) * pix / u_resolution;

  float cellPx = mix(6.0, 140.0, clamp(u_block_size, 0.0, 1.0));
  vec2 cell = floor(pixUv * u_resolution / cellPx);
  float cellHash = hash2(cell + u_seed * 0.17);

  float row = floor(uv.y * u_resolution.y);
  float rowHash = hash2(vec2(row, u_seed + 13.0));

  float shift = 0.0;
  if (rowHash > 1.0 - u_line_tear * 0.45) {
    shift += (hash1(row + u_seed + 3.0) - 0.5) * u_line_tear * 0.18;
  }
  if (cellHash > 1.0 - u_displacement * 0.4) {
    shift += (hash1(cellHash * 97.0 + u_seed) - 0.5) * u_displacement * 0.14;
  }

  vec2 sampleUv = pixUv + vec2(shift, 0.0);
  sampleUv.x = fract(sampleUv.x);
  sampleUv = clamp(sampleUv, 0.001, 0.999);

  float split = u_color_split * 0.035;
  vec3 glitched = vec3(
    texture(u_texture, sampleUv + vec2(split, 0.0)).r,
    texture(u_texture, sampleUv).g,
    texture(u_texture, sampleUv - vec2(split, 0.0)).b
  );

  vec3 orig = texture(u_texture, pixUv).rgb;
  float displaced = step(1.0 - u_displacement * 0.4, cellHash);
  float blend = mix(1.0, clamp(u_block_opacity, 0.0, 1.0), displaced);
  vec3 col = mix(orig, glitched, blend);

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

/** Effect.app glitch-vhs — scanlines, RGB bleed, grain, tracking errors. */
export const GLITCH_VHS_FRAGMENT = HEADER + HASH + `
uniform float u_grain;
uniform float u_glitch_blocks;
uniform float u_rgb_shift;
uniform float u_scanlines;
uniform float u_noise;
uniform float u_distortion;
uniform float u_seed;

void main() {
  vec2 uv = v_texCoord;

  float bar = floor(uv.x * mix(28.0, 8.0, clamp(u_distortion, 0.0, 1.0)));
  uv.y += (hash1(bar + u_seed) - 0.5) * u_distortion * 0.035;
  uv.y = clamp(uv.y, 0.001, 0.999);

  float sliceH = mix(3.0, 28.0, 0.55);
  float row = floor(uv.y * u_resolution.y / sliceH);
  if (hash2(vec2(row, u_seed + 5.0)) > 1.0 - u_glitch_blocks * 0.28) {
    uv.x += (hash1(row + u_seed + 9.0) - 0.5) * u_glitch_blocks * 0.1;
    uv.x = fract(uv.x);
  }

  float split = u_rgb_shift * 0.028;
  vec3 col = vec3(
    texture(u_texture, uv + vec2(split, 0.0)).r,
    texture(u_texture, uv).g,
    texture(u_texture, uv - vec2(split, 0.0)).b
  );

  float scan = sin(uv.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
  col *= mix(1.0, 0.82 + 0.18 * scan, clamp(u_scanlines, 0.0, 1.0));

  float n = hash2(uv * u_resolution + u_seed * 0.31);
  col += (n - 0.5) * u_noise * 0.45;

  float g = hash2(uv * u_resolution * 1.7 + vec2(u_seed, u_seed * 2.0));
  col += (g - 0.5) * u_grain * 0.28;

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export type GlitchDigitalParams = {
	block_size: number;
	displacement: number;
	block_opacity: number;
	color_split: number;
	line_tear: number;
	pixelate: number;
	seed: number;
};

export type GlitchVhsParams = {
	grain: number;
	glitch_blocks: number;
	rgb_shift: number;
	scanlines: number;
	noise: number;
	distortion: number;
	seed: number;
};

export const GLITCH_DIGITAL_EFFECT: Effect = {
	id: 'glitch_digital',
	name: 'Glitch Digital',
	category: 'Distort',
	enabled: true,
	params: [
		{
			name: 'block_size',
			label: 'block size',
			hint: '故障區塊大小。越大越像大塊 JPEG 壞檔。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.5,
			value: 0.5
		},
		{
			name: 'displacement',
			label: 'displacement',
			hint: '區塊水平錯位強度。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.5,
			value: 0.5
		},
		{
			name: 'block_opacity',
			label: 'block opacity',
			hint: '錯位區塊與原圖混合比例。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.85,
			value: 0.85
		},
		{
			name: 'color_split',
			label: 'color split',
			hint: 'RGB 通道分離（色差）。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.35,
			value: 0.35
		},
		{
			name: 'line_tear',
			label: 'line tear',
			hint: '整行水平撕裂。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.4,
			value: 0.4
		},
		{
			name: 'pixelate',
			label: 'pixelate',
			hint: '區塊內像素化取樣。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.15,
			value: 0.15
		},
		{
			name: 'seed',
			label: 'seed',
			hint: '隨機種子，固定可重現相同故障圖樣。',
			type: 'float',
			min: 0,
			max: 100,
			step: 1,
			default: 42,
			value: 42
		}
	],
	fragmentShader: GLITCH_DIGITAL_FRAGMENT
};

export const GLITCH_VHS_EFFECT: Effect = {
	id: 'glitch_vhs',
	name: 'Glitch VHS',
	category: 'Distort',
	enabled: true,
	params: [
		{
			name: 'grain',
			label: 'grain',
			hint: '類比膠片顆粒。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.45,
			value: 0.45
		},
		{
			name: 'glitch_blocks',
			label: 'glitch blocks',
			hint: '磁帶 tracking 錯位色塊。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.45,
			value: 0.45
		},
		{
			name: 'rgb_shift',
			label: 'RGB shift',
			hint: '類比色差／色溢。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.4,
			value: 0.4
		},
		{
			name: 'scanlines',
			label: 'scanlines',
			hint: 'CRT 掃描線。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.35,
			value: 0.35
		},
		{
			name: 'noise',
			label: 'noise',
			hint: '雪花雜訊。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.25,
			value: 0.25
		},
		{
			name: 'distortion',
			label: 'distortion',
			hint: '垂直 bar 扭曲（磁頭偏移）。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.3,
			value: 0.3
		},
		{
			name: 'seed',
			label: 'seed',
			hint: '隨機種子。',
			type: 'float',
			min: 0,
			max: 100,
			step: 1,
			default: 17,
			value: 17
		}
	],
	fragmentShader: GLITCH_VHS_FRAGMENT
};

export const GLITCH_DIGITAL_PRESETS: {
	id: string;
	label: string;
	params: GlitchDigitalParams;
}[] = [
	{
		id: 'subtle',
		label: '輕微壞檔',
		params: {
			block_size: 0.35,
			displacement: 0.25,
			block_opacity: 0.9,
			color_split: 0.2,
			line_tear: 0.15,
			pixelate: 0.05,
			seed: 42
		}
	},
	{
		id: 'cyber',
		label: 'Cyberpunk',
		params: {
			block_size: 0.55,
			displacement: 0.65,
			block_opacity: 0.85,
			color_split: 0.55,
			line_tear: 0.45,
			pixelate: 0.2,
			seed: 7
		}
	},
	{
		id: 'broken',
		label: '嚴重損壞',
		params: {
			block_size: 0.75,
			displacement: 0.9,
			block_opacity: 0.7,
			color_split: 0.75,
			line_tear: 0.85,
			pixelate: 0.45,
			seed: 99
		}
	}
];

export const GLITCH_VHS_PRESETS: {
	id: string;
	label: string;
	params: GlitchVhsParams;
}[] = [
	{
		id: 'subtle',
		label: '輕微 VHS',
		params: {
			grain: 0.25,
			glitch_blocks: 0.2,
			rgb_shift: 0.25,
			scanlines: 0.2,
			noise: 0.1,
			distortion: 0.15,
			seed: 17
		}
	},
	{
		id: 'worn',
		label: '舊磁帶',
		params: {
			grain: 0.55,
			glitch_blocks: 0.45,
			rgb_shift: 0.5,
			scanlines: 0.4,
			noise: 0.35,
			distortion: 0.45,
			seed: 23
		}
	},
	{
		id: 'broken',
		label: '壞掉 VCR',
		params: {
			grain: 0.75,
			glitch_blocks: 0.85,
			rgb_shift: 0.7,
			scanlines: 0.55,
			noise: 0.5,
			distortion: 0.75,
			seed: 88
		}
	}
];
