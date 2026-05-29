import type { CurvesData } from '../engine/curve';
import type { ParamValue } from '../engine/renderer';
import type { StackSnapshot } from '../stores/history';

/** Single layer in a curated preset (maps to effect.app multi-pass stacks). */
export interface BuiltinLayerDef {
	effectId: string;
	enabled?: boolean;
	opacity?: number;
	blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
	params: Record<string, ParamValue>;
}

export interface BuiltinPreset {
	id: string;
	name: string;
	group: string;
	description: string;
	layerLabels: string[];
	snapshot: StackSnapshot;
}

function snapshotFromLayers(layers: BuiltinLayerDef[]): StackSnapshot {
	return {
		layers: layers.map((l) => ({
			effectId: l.effectId,
			enabled: l.enabled ?? true,
			opacity: l.opacity ?? 1,
			...(l.blendMode && l.blendMode !== 'normal' ? { blendMode: l.blendMode } : {}),
			params: { ...l.params }
		})),
		activeIndex: Math.max(0, layers.length - 1)
	};
}

function channelCurve(points: { x: number; y: number }[]): CurvesData['rgb'] {
	return points.map((p) => ({ ...p }));
}

function curvesFromPoints(points: { x: number; y: number }[]): CurvesData {
	const ch = channelCurve(points);
	return { rgb: ch, r: ch, g: ch, b: ch };
}

const NOIR_MASTER_CURVE = curvesFromPoints([
	{ x: 0, y: 0 },
	{ x: 0.2, y: 0.04 },
	{ x: 0.5, y: 0.38 },
	{ x: 0.78, y: 0.9 },
	{ x: 1, y: 1 }
]);

const EDITORIAL_GRADIENT = [
	{ pos: 0, color: '#252220' },
	{ pos: 0.42, color: '#8f867c' },
	{ pos: 1, color: '#f2ebe3' }
];

const CYANOTYPE_GRADIENT = [
	{ pos: 0, color: '#021a2e' },
	{ pos: 0.35, color: '#0d3d5c' },
	{ pos: 0.72, color: '#5a9ec4' },
	{ pos: 1, color: '#b8dce8' }
];

/**
 * Vintage print v2 — hook: misregistered RGB halftone + physical margin.
 * Service layers kept under ~25% effective strength.
 */
const VINTAGE_PRINT_LAYERS: BuiltinLayerDef[] = [
	{ effectId: 'levels', params: { shadows: 0.1, midtones: 0.5, highlights: 0.9 } },
	{
		effectId: 'paper_grain',
		params: { amount: 0.05, scale: 3.2, contrast: 0.55, warmth: 0.42, blend: 0.25 },
		opacity: 0.35,
		blendMode: 'multiply'
	},
	{
		effectId: 'rgb_halftone',
		params: {
			cellSize: 3.2,
			gamma: 1.52,
			contrast: 1.72,
			saturation: 1.34,
			misregister: 2.85,
			dotGain: 0.38,
			sharpness: 0.9,
			inkBleed: 0.42,
			angleR: 0.12,
			angleG: 1.31,
			angleB: 2.61
		}
	},
	{
		effectId: 'dither',
		params: {
			pattern: 12,
			palette: 5,
			colors: 6,
			distance: 1,
			strength: 0.85,
			gamma: 1.55,
			pixelstep: 2
		},
		opacity: 0.16,
		blendMode: 'multiply'
	},
	{
		effectId: 'ink_bleed',
		params: { spread: 3.5, decay: 0.52, intensity: 0.42, direction: 38, noise_size: 0.28 },
		opacity: 0.32,
		blendMode: 'multiply'
	},
	{
		effectId: 'print_stamp',
		params: {
			margin: 0.056,
			fade: 0.11,
			roughness: 1.05,
			paperColor: '#f2ebe0'
		}
	},
	{ effectId: 'vignette', params: { strength: 0.08, softness: 1.85 } }
];

/** Cyanotype v3 — hook: gradient-map chemistry + threshold outline (no simple duotone). */
const CYANOTYPE_LAYERS: BuiltinLayerDef[] = [
	{ effectId: 'levels', params: { shadows: 0.06, midtones: 0.34, highlights: 0.74 } },
	{
		effectId: 'gradient_map',
		params: {
			gradient: CYANOTYPE_GRADIENT,
			grad_shift: 0.12,
			grad_repeat: 1
		},
		opacity: 0.92,
		blendMode: 'multiply'
	},
	{
		effectId: 'threshold',
		params: {
			threshold: 152,
			edge_mode: true,
			offset_amount: 11,
			distance: 2,
			outline: 1.45,
			outline_strength: 0.48,
			outline_type: 1,
			blend_strength: 0.42,
			blend_mode: 3,
			color: '#031f33'
		},
		opacity: 0.62,
		blendMode: 'overlay'
	},
	{
		effectId: 'dither',
		params: {
			pattern: 1,
			palette: 7,
			colors: 4,
			distance: 1,
			strength: 0.65,
			gamma: 1.65,
			pixelstep: 3
		},
		opacity: 0.1,
		blendMode: 'soft-light'
	},
	{ effectId: 'vignette', params: { strength: 0.38, softness: 1.15 } }
];

/** Soft editorial v2 — hook: sharp subject, blurred edges, matte gradient map. */
const SOFT_EDITORIAL_LAYERS: BuiltinLayerDef[] = [
	{ effectId: 'exposure', params: { exposure: 0.14, offset: 0.05, gamma: 0.92 } },
	{ effectId: 'levels', params: { shadows: 0.22, midtones: 0.5, highlights: 0.92 } },
	{
		effectId: 'gradient_map',
		params: {
			gradient: EDITORIAL_GRADIENT,
			grad_shift: 0.06,
			grad_repeat: 1
		},
		opacity: 0.38,
		blendMode: 'soft-light'
	},
	{
		effectId: 'motion_blur',
		params: {
			strength: 14,
			angle: 90,
			box: false,
			both_directions: true,
			enable_mask: true,
			mask_center: [0, 0],
			mask_radius: 0.38,
			mask_falloff: 2.8,
			mask_invert: true
		},
		opacity: 0.72
	},
	{ effectId: 'vignette', params: { strength: 0.26, softness: 1.75 } }
];

/** RGB Hatch v1 — effect.app animated scanline + cubify glitch stack. Set Animation to 5s. */
const RGB_HATCH_LAYERS: BuiltinLayerDef[] = [
	{ effectId: 'exposure', params: { exposure: 0.06, offset: -0.02, gamma: 1.08 } },
	{
		effectId: 'gaussian_blur',
		params: { radius: 2.8 },
		opacity: 0.38
	},
	{
		effectId: 'noise',
		params: {
			amount: 0.32,
			size: 1.15,
			chroma: 0.28,
			shadow: 0.9,
			midtone: 0.55,
			highlight: 0.35
		},
		opacity: 0.48,
		blendMode: 'overlay'
	},
	{
		effectId: 'rgb_shift',
		params: { amount: 0.52, angle: 0, animate: 1 }
	},
	{
		effectId: 'cubify',
		params: {
			scale: 1.1,
			aspect: 0,
			strength: 1.8,
			hard: true,
			angle: 0,
			phase: [0, 0],
			animate_speed: [0.1, 0],
			dispersion: 0.05,
			animate: 1
		}
	},
	{
		effectId: 'stripe',
		params: {
			freq: 33,
			w_min: 0.02,
			w_max: 0.92,
			angle: 90,
			edge: 0.48,
			pattern: 0,
			scroll_speed: 0.35,
			led_mode: true,
			phase_r: 0.1,
			phase_g: 0,
			phase_b: 0,
			benday_mode: false,
			shift_freq: 8,
			animate: 1
		},
		opacity: 0.88,
		blendMode: 'multiply'
	},
	{
		effectId: 'circular_blur',
		params: { radius: 28, samples: 8, passes: 1, decay: 0.4 },
		opacity: 0.55
	},
	{
		effectId: 'sharpen',
		params: { amount: 0.72, radius: 1.25, threshold: 0.02 },
		opacity: 0.65
	},
	{ effectId: 'levels', params: { shadows: 0.06, midtones: 0.38, highlights: 0.9 } },
	{ effectId: 'hue_saturation', params: { hue: -6, saturation: 0.28 } },
	{
		effectId: 'motion_blur',
		params: {
			strength: 16,
			angle: 0,
			box: false,
			both_directions: false,
			enable_mask: false,
			mask_center: [0, 0],
			mask_radius: 0.5,
			mask_falloff: 2,
			mask_invert: false
		},
		opacity: 0.42
	}
];

/** Lo-fi VHS v2 — hook: animated tracking + magenta-warm tape color. */
const LOFI_VHS_LAYERS: BuiltinLayerDef[] = [
	{
		effectId: 'glitch_vhs',
		params: {
			grain: 0.42,
			glitch_blocks: 0.52,
			rgb_shift: 0.55,
			scanlines: 0.44,
			noise: 0.22,
			distortion: 0.48,
			seed: 23,
			animate: 1
		}
	},
	{ effectId: 'crt', params: { scan_intensity: 0.42, curvature: 0.3, rgb_shift: 0.005 } },
	{
		effectId: 'duotone',
		params: { shadow: '#2a0c28', highlight: '#f2c49a' },
		opacity: 0.88,
		blendMode: 'soft-light'
	},
	{
		effectId: 'noise',
		params: { amount: 0.14, size: 1.2, chroma: 0.12, shadow: 0.85, midtone: 0.45, highlight: 0.2 },
		opacity: 0.32,
		blendMode: 'overlay'
	},
	{ effectId: 'vignette', params: { strength: 0.52, softness: 1.05 } }
];

/** Film noir v2 — hook: hard S-curve silver + shadow grain. */
const FILM_NOIR_LAYERS: BuiltinLayerDef[] = [
	{
		effectId: 'curves',
		params: { curves: NOIR_MASTER_CURVE, apply_mode: 2 }
	},
	{ effectId: 'levels', params: { shadows: 0.04, midtones: 0.32, highlights: 0.68 } },
	{ effectId: 'monochrome', params: { mix: 1, tint: '#ccc8c0' } },
	{
		effectId: 'sharpen',
		params: { amount: 0.55, radius: 1.35, threshold: 0.06 },
		opacity: 0.5
	},
	{
		effectId: 'noise',
		params: { amount: 0.22, size: 0.95, chroma: 0, shadow: 1, midtone: 0.2, highlight: 0.05 },
		opacity: 0.42,
		blendMode: 'overlay'
	},
	{ effectId: 'vignette', params: { strength: 1.02, softness: 0.72 } }
];

/** Kept for reference / future panel — not in VISIBLE_PRESET_IDS. */
const GLITCH_CYBER_LAYERS: BuiltinLayerDef[] = [
	{
		effectId: 'glitch_digital',
		params: {
			block_size: 0.62,
			displacement: 0.72,
			block_opacity: 0.9,
			color_split: 0.62,
			line_tear: 0.52,
			pixelate: 0.28,
			seed: 7
		}
	},
	{ effectId: 'hue_saturation', params: { hue: 22, saturation: 0.42 } },
	{
		effectId: 'bloom',
		params: { threshold: 0.48, softness: 0.14, radius: 12, intensity: 0.72 },
		opacity: 0.75,
		blendMode: 'screen'
	},
	{ effectId: 'vignette', params: { strength: 0.62, softness: 0.85 } }
];

export const BUILTIN_PRESETS: BuiltinPreset[] = [
	{
		id: 'rgb_hatch',
		name: 'RGB Hatch',
		group: 'RGB HATCH',
		description:
			'Vertical LED stripes, cubify glass, RGB drift — turn Animation to 5s for the full effect.app motion.',
		layerLabels: [
			'EXPOSURE',
			'GAUSSIAN BLUR',
			'NOISE',
			'RGB SHIFT',
			'CUBIFY',
			'STRIPE',
			'CIRCULAR BLUR',
			'BLUR/SHARP',
			'LEVELS',
			'HUE/SAT',
			'MOTION BLUR'
		],
		snapshot: snapshotFromLayers(RGB_HATCH_LAYERS)
	},
	{
		id: 'vintage_print',
		name: 'Vintage print',
		group: 'OLD PAINTING',
		description:
			'Misregistered RGB halftone on warm paper with ink bleed and a print margin — reads as real Risograph, not a filter.',
		layerLabels: ['LEVELS', 'PAPER', 'RGB HATCH', 'HATCH DITHER', 'INK BLEED', 'PRINT STAMP', 'VIGNETTE'],
		snapshot: snapshotFromLayers(VINTAGE_PRINT_LAYERS)
	},
	{
		id: 'cyanotype',
		name: 'Cyanotype',
		group: 'OLD PAINTING',
		description:
			'Prussian-blue sun print: crushed silhouette, cool duotone only — no warm grain.',
		layerLabels: ['LEVELS', 'GRAD MAP', 'THRESHOLD', 'DITHER', 'VIGNETTE'],
		snapshot: snapshotFromLayers(CYANOTYPE_LAYERS)
	},
	{
		id: 'soft_editorial',
		name: 'Soft editorial',
		group: 'EDITORIAL',
		description:
			'Matte gradient tone with edge-only blur — center stays sharp for portraits.',
		layerLabels: ['EXPOSURE', 'LEVELS', 'GRAD MAP', 'EDGE BLUR', 'VIGNETTE'],
		snapshot: snapshotFromLayers(SOFT_EDITORIAL_LAYERS)
	},
	{
		id: 'lofi_vhs',
		name: 'Lo-fi VHS',
		group: 'RETRO',
		description:
			'Home-video tape: tracking wobble, CRT bend, magenta shadows — turn Animation to 5s.',
		layerLabels: ['GLITCH VHS', 'CRT', 'DUOTONE', 'GRAIN', 'VIGNETTE'],
		snapshot: snapshotFromLayers(LOFI_VHS_LAYERS)
	},
	{
		id: 'film_noir',
		name: 'Film noir',
		group: 'FILM',
		description: 'Hard S-curve silver, grain in shadows only, heavy vignette — classic noir.',
		layerLabels: ['CURVES', 'LEVELS', 'MONO', 'SHARPEN', 'GRAIN', 'VIGNETTE'],
		snapshot: snapshotFromLayers(FILM_NOIR_LAYERS)
	},
	{
		id: 'glitch_cyber',
		name: 'Glitch cyber',
		group: 'DIGITAL',
		description: 'Neon digital tear + screen bloom — cold cyber, not analog tape.',
		layerLabels: ['GLITCH DIGITAL', 'HUE/SAT', 'BLOOM', 'VIGNETTE'],
		snapshot: snapshotFromLayers(GLITCH_CYBER_LAYERS)
	}
];

export const BUILTIN_PRESET_GROUPS = [...new Set(BUILTIN_PRESETS.map((p) => p.group))];

export function getBuiltinPreset(id: string): BuiltinPreset | undefined {
	return BUILTIN_PRESETS.find((p) => p.id === id);
}
