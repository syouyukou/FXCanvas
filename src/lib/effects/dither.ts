import type { Effect } from '../engine/renderer';
import { DITHER_PRO_BODY } from './ditherProShader';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_pattern;
uniform float u_palette;
uniform float u_colors;
uniform float u_distance;
uniform float u_strength;
uniform float u_gamma;
uniform float u_pixelstep;
`;

/** Effect.app Color/dither-pro — 23 patterns × 12 palettes (decrypted GLSL). */
export const DITHER_FRAGMENT = HEADER + DITHER_PRO_BODY;

export const DITHER_EFFECT: Effect = {
	id: 'dither',
	name: 'Dither',
	category: 'Effects',
	enabled: true,
	params: [
		{
			name: 'pattern',
			label: 'pattern type',
			hint: '0–22：Random、Bayer16×16、網線、半調等（同 Effect.app Dither）。',
			type: 'int',
			min: 0,
			max: 22,
			step: 1,
			default: 0,
			value: 0
		},
		{
			name: 'palette',
			label: 'palette type',
			hint: '0–11：Elevate、Imperial、Monochrome 等內建調色盤。',
			type: 'int',
			min: 0,
			max: 11,
			step: 1,
			default: 2,
			value: 2
		},
		{
			name: 'colors',
			label: 'color count',
			hint: '調色盤取色數（2–18）。',
			type: 'int',
			min: 2,
			max: 18,
			step: 1,
			default: 18,
			value: 18
		},
		{
			name: 'distance',
			label: 'distance mode',
			hint: '0=RGB 距離；1=Luma（Effect.app 預設）。',
			type: 'int',
			min: 0,
			max: 1,
			step: 1,
			default: 1,
			value: 1
		},
		{
			name: 'strength',
			label: 'dither strength',
			hint: '顆粒強度 0–2（Effect.app 預設 2.0）。',
			type: 'float',
			min: 0,
			max: 2,
			step: 0.1,
			default: 2,
			value: 2
		},
		{
			name: 'gamma',
			label: 'gamma',
			hint: '量化前 gamma（Effect.app 預設 1.6）。',
			type: 'float',
			min: 0.5,
			max: 5,
			step: 0.1,
			default: 1.6,
			value: 1.6
		},
		{
			name: 'pixelstep',
			label: 'pixelStep',
			hint: '像素化步階 1–4（log₂ 塊大小；2 ≈ 2px 格）。',
			type: 'float',
			min: 1,
			max: 4,
			step: 1,
			default: 2,
			value: 2
		}
	],
	fragmentShader: DITHER_FRAGMENT
};

/** Pattern indices — match Effect.app `pattern_type` labels. */
export const DITHER_PATTERNS = [
	'Random',
	'Bayer 16×16',
	'XOR',
	'ADD',
	'Bayer 2×2',
	'Bayer 4×4',
	'Bayer 8×8',
	'Hatch H',
	'Hatch V',
	'Hatch R',
	'Hatch L',
	'Cross hatch H',
	'Cross hatch V',
	'Zigzag H 4×4',
	'Zigzag V 4×4',
	'Zigzag H 8×8',
	'Zigzag V 8×8',
	'Checkerboard',
	'Fishnet',
	'Dot 4×4',
	'Dot 8×8',
	'Halftone',
	'Square 4×4'
] as const;

export const DITHER_PALETTES = [
	'Elevate',
	'Primaries',
	'Imperial',
	'Galaxy',
	'Ocean',
	'Sepia',
	'Neon',
	'Monochrome',
	'Wildberry',
	'Crystals',
	'Faded',
	'Sunny'
] as const;

export type DitherParams = {
	pattern: number;
	palette: number;
	colors: number;
	distance: number;
	strength: number;
	gamma: number;
	pixelstep: number;
};

export const DITHER_PRESETS: { id: string; label: string; params: DitherParams }[] = [
	{
		id: 'effect-app',
		label: 'Imperial (Effect.app)',
		params: {
			pattern: 0,
			palette: 2,
			colors: 18,
			distance: 1,
			strength: 2,
			gamma: 1.6,
			pixelstep: 2
		}
	},
	{
		id: 'mono-print',
		label: 'High-contrast B&W',
		params: {
			pattern: 1,
			palette: 7,
			colors: 18,
			distance: 1,
			strength: 2,
			gamma: 1.6,
			pixelstep: 1
		}
	},
	{
		id: 'gameboy',
		label: 'Retro 4-color',
		params: {
			pattern: 6,
			palette: 0,
			colors: 4,
			distance: 1,
			strength: 1.8,
			gamma: 1.4,
			pixelstep: 2
		}
	},
	{
		id: 'halftone',
		label: 'Halftone',
		params: {
			pattern: 21,
			palette: 7,
			colors: 8,
			distance: 1,
			strength: 2,
			gamma: 1.5,
			pixelstep: 2
		}
	},
	{
		id: 'neon',
		label: 'Neon',
		params: {
			pattern: 2,
			palette: 6,
			colors: 12,
			distance: 1,
			strength: 1.6,
			gamma: 1.4,
			pixelstep: 2
		}
	}
];
