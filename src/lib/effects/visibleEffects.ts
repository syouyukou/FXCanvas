/**
 * Left panel visibility — two product zones:
 *
 * - **Adjust** — single-layer fine tuning (PS-style icon grid)
 * - **Effects** — stackable creative looks (thumbnail cards, hover before/after)
 * - **Presets** — one-click multi-layer stacks (fastest path to a look)
 *
 * @see docs/product-zones.md
 */

/** Fine-tuning tools (icon grid, ADJUST tab). */
export const ADJUST_VISIBLE_EFFECT_IDS = [
	'curves',
	'gradient_map',
	'exposure',
	'levels',
	'brightness_contrast',
	'sharpen',
	'gaussian_blur',
	'motion_blur',
	'depth_of_field'
] as const;

/** Creative / stackable effects (thumbnail grid, EFFECTS tab). */
export const CREATIVE_VISIBLE_EFFECT_IDS = [
	'hue_saturation',
	'duotone',
	'monochrome',
	'noise',
	'rgb_halftone',
	'ink_bleed',
	'paper_grain',
	'glitch_digital',
	'glitch_vhs',
	'crt',
	'emboss',
	'threshold',
	'modulation_dither',
	'star_glow',
	'dither'
] as const;

/** Built-in motion on still images (ANIMATED tab). */
export const ANIMATED_VISIBLE_EFFECT_IDS = ['msx_ascii'] as const;

export const STATIC_VISIBLE_EFFECT_IDS = [
	...ADJUST_VISIBLE_EFFECT_IDS,
	...CREATIVE_VISIBLE_EFFECT_IDS
] as const;

export const VISIBLE_EFFECT_IDS = [
	...STATIC_VISIBLE_EFFECT_IDS,
	...ANIMATED_VISIBLE_EFFECT_IDS
] as const;

export type AdjustVisibleEffectId = (typeof ADJUST_VISIBLE_EFFECT_IDS)[number];
export type CreativeVisibleEffectId = (typeof CREATIVE_VISIBLE_EFFECT_IDS)[number];
export type VisibleEffectId = (typeof VISIBLE_EFFECT_IDS)[number];
export type AnimatedVisibleEffectId = (typeof ANIMATED_VISIBLE_EFFECT_IDS)[number];

const visibleSet = new Set<string>(VISIBLE_EFFECT_IDS);
const adjustSet = new Set<string>(ADJUST_VISIBLE_EFFECT_IDS);
const creativeSet = new Set<string>(CREATIVE_VISIBLE_EFFECT_IDS);
const animatedSet = new Set<string>(ANIMATED_VISIBLE_EFFECT_IDS);

export function isEffectVisibleInPanel(effectId: string): boolean {
	return visibleSet.has(effectId);
}

export function isAdjustPanelEffect(effectId: string): boolean {
	return adjustSet.has(effectId);
}

export function isCreativePanelEffect(effectId: string): boolean {
	return creativeSet.has(effectId);
}

export function isAnimatedPanelEffect(effectId: string): boolean {
	return animatedSet.has(effectId);
}

/** Hide FAVORITES tab while the feature is deprioritized. */
export const SHOW_FAVORITES_TAB = false;
