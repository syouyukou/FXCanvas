/**
 * Curated subset shown in the PRESETS tab.
 * @see docs/visible-presets.md · docs/mvp-baseline.md
 */
export const VISIBLE_PRESET_IDS = [
	'rgb_hatch',
	'vintage_print',
	'cyanotype',
	'soft_editorial',
	'lofi_vhs',
	'film_noir'
] as const;

export type VisiblePresetId = (typeof VISIBLE_PRESET_IDS)[number];

const visibleSet = new Set<string>(VISIBLE_PRESET_IDS);

export function isPresetVisibleInPanel(presetId: string): boolean {
	return visibleSet.has(presetId);
}
