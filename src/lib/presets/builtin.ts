import type { StackSnapshot } from '../stores/history';

/** Single layer in a curated preset (maps to effect.app multi-pass stacks). */
export interface BuiltinLayerDef {
	effectId: string;
	enabled?: boolean;
	opacity?: number;
	blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
	params: Record<string, number | boolean | string>;
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

/** Vintage Print v3 — tuned for effect.app RGB HATCH + paper + stamp look. */
const VINTAGE_PRINT_LAYERS: BuiltinLayerDef[] = [
	{
		effectId: 'exposure',
		params: { exposure: 0.05, offset: -0.01, gamma: 1.08 }
	},
	{ effectId: 'levels', params: { shadows: 0.1, midtones: 0.5, highlights: 0.9 } },
	{
		effectId: 'paper_grain',
		params: { amount: 0.08, scale: 2.8, contrast: 0.7, warmth: 0.35, blend: 0.35 },
		opacity: 0.85
	},
	{
		effectId: 'rgb_halftone',
		params: {
			cellSize: 3.5,
			gamma: 1.38,
			contrast: 1.48,
			saturation: 1.22,
			misregister: 1.85,
			dotGain: 0.28,
			sharpness: 0.75,
			inkBleed: 0.32,
			angleR: 0.26,
			angleG: 1.32,
			angleB: 2.44
		}
	},
	{
		effectId: 'soft_bleed',
		params: { amount: 0.28, radius: 1.25 },
		opacity: 0.55
	},
	{
		effectId: 'dither',
		params: {
			pattern: 13,
			palette: 6,
			colors: 14,
			distance: 1,
			strength: 0.65,
			gamma: 1.25,
			pixelStep: 1
		},
		opacity: 0.18
	},
	{
		effectId: 'paper_grain',
		params: { amount: 0.26, scale: 1.1, contrast: 1.15, warmth: 0.62, blend: 0.62 }
	},
	{
		effectId: 'print_stamp',
		params: {
			margin: 0.038,
			fade: 0.085,
			roughness: 0.95,
			paperColor: '#f6f1e8'
		}
	},
	{ effectId: 'vignette', params: { strength: 0.18, softness: 1.6 } }
];

const GLITCH_CYBER_LAYERS: BuiltinLayerDef[] = [
	{
		effectId: 'glitch_digital',
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
	{ effectId: 'hue_saturation', params: { hue: 18, saturation: 0.35 } },
	{
		effectId: 'bloom',
		params: { threshold: 0.55, softness: 0.12, radius: 10, intensity: 0.55 },
		opacity: 0.7,
		blendMode: 'screen'
	},
	{ effectId: 'vignette', params: { strength: 0.55, softness: 0.9 } }
];

const LOFI_VHS_LAYERS: BuiltinLayerDef[] = [
	{
		effectId: 'glitch_vhs',
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
	{ effectId: 'crt', params: { scan_intensity: 0.45, curvature: 0.22, rgb_shift: 0.004 } },
	{
		effectId: 'noise',
		params: { amount: 0.28, size: 1.4, chroma: 0.25, shadow: 0.8, midtone: 0.5, highlight: 0.35 },
		opacity: 0.65,
		blendMode: 'overlay'
	},
	{ effectId: 'duotone', params: { shadow: '#1a1428', highlight: '#f4c4a0' } },
	{ effectId: 'vignette', params: { strength: 0.72, softness: 1.1 } }
];

const FILM_NOIR_LAYERS: BuiltinLayerDef[] = [
	{ effectId: 'curves', params: {} },
	{ effectId: 'monochrome', params: { mix: 1, tint: '#d8d4cc' } },
	{
		effectId: 'noise',
		params: { amount: 0.22, size: 1.1, chroma: 0.05, shadow: 1, midtone: 0.45, highlight: 0.2 },
		opacity: 0.45,
		blendMode: 'overlay'
	},
	{ effectId: 'vignette', params: { strength: 1.05, softness: 0.75 } }
];

export const BUILTIN_PRESETS: BuiltinPreset[] = [
	{
		id: 'vintage_print',
		name: 'Vintage print',
		group: 'OLD PAINTING',
		description:
			'RGB halftone overprint, soft bleed, Risograph grain, print stamp margin — v3 tuned for effect.app.',
		layerLabels: [
			'CURVES',
			'LEVELS',
			'PAPER SCAN',
			'RGB HATCH',
			'SOFT BLEED',
			'RISO DITHER',
			'PAPER SCAN',
			'PRINT STAMP',
			'VIGNETTE'
		],
		snapshot: snapshotFromLayers(VINTAGE_PRINT_LAYERS)
	},
	{
		id: 'glitch_cyber',
		name: 'Glitch cyber',
		group: 'DIGITAL',
		description: 'Digital corruption, neon bloom, and crushed vignette.',
		layerLabels: ['GLITCH DIGITAL', 'HUE/SAT', 'BLOOM', 'VIGNETTE'],
		snapshot: snapshotFromLayers(GLITCH_CYBER_LAYERS)
	},
	{
		id: 'lofi_vhs',
		name: 'Lo-fi VHS',
		group: 'RETRO',
		description: 'Worn tape, CRT scanlines, warm duotone, and grain.',
		layerLabels: ['GLITCH VHS', 'CRT', 'NOISE', 'DUOTONE', 'VIGNETTE'],
		snapshot: snapshotFromLayers(LOFI_VHS_LAYERS)
	},
	{
		id: 'film_noir',
		name: 'Film noir',
		group: 'FILM',
		description: 'Crushed curves, silver monochrome, overlay grain, heavy vignette.',
		layerLabels: ['CURVES', 'MONOCHROME', 'NOISE', 'VIGNETTE'],
		snapshot: snapshotFromLayers(FILM_NOIR_LAYERS)
	}
];

export const BUILTIN_PRESET_GROUPS = [...new Set(BUILTIN_PRESETS.map((p) => p.group))];

export function getBuiltinPreset(id: string): BuiltinPreset | undefined {
	return BUILTIN_PRESETS.find((p) => p.id === id);
}
