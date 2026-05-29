/**
 * Curated subset shown in the PRESETS tab (2026-05-29).
 * Empty while presets are being rewritten — definitions stay in builtin.ts.
 * @see docs/visible-presets.md
 */
export const VISIBLE_PRESET_IDS = [] as const;

export type VisiblePresetId = (typeof VISIBLE_PRESET_IDS)[number];

const visibleSet = new Set<string>(VISIBLE_PRESET_IDS);

export function isPresetVisibleInPanel(presetId: string): boolean {
	return visibleSet.has(presetId);
}
