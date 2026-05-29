/**
 * Curated subset shown in the Effects panel (2026-05-29).
 * Other effects remain in the codebase and still work on existing layers.
 * @see docs/visible-effects.md
 */
export const VISIBLE_EFFECT_IDS = [
	'gaussian_blur',
	'hue_saturation',
	'duotone',
	'monochrome',
	'noise',
	'rgb_halftone',
	'paper_grain',
	'glitch_digital',
	'glitch_vhs',
	'crt',
	'star_glow',
	'dither'
] as const;

export type VisibleEffectId = (typeof VISIBLE_EFFECT_IDS)[number];

const visibleSet = new Set<string>(VISIBLE_EFFECT_IDS);

export function isEffectVisibleInPanel(effectId: string): boolean {
	return visibleSet.has(effectId);
}

/** Hide FAVORITES tab while the feature is deprioritized. */
export const SHOW_FAVORITES_TAB = false;
