import type { StackSnapshot } from '../stores/history';

/** Single layer in a curated preset (maps to effect.app multi-pass stacks). */
export interface BuiltinLayerDef {
	effectId: string;
	enabled?: boolean;
	opacity?: number;
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
	}
];

export const BUILTIN_PRESET_GROUPS = [...new Set(BUILTIN_PRESETS.map((p) => p.group))];

export function getBuiltinPreset(id: string): BuiltinPreset | undefined {
	return BUILTIN_PRESETS.find((p) => p.id === id);
}
