import type { PreviewHeroId } from './effectPreviewSources';

/** Hero image used to bake preset sidebar thumbnails. */
const PRESET_HERO: Record<string, PreviewHeroId> = {
	vintage_print: 'hero-portrait',
	cyanotype: 'hero-portrait',
	soft_editorial: 'hero-portrait',
	lofi_vhs: 'hero-neon',
	film_noir: 'hero-night'
};

export function presetPreviewHeroId(presetId: string): PreviewHeroId {
	return PRESET_HERO[presetId] ?? 'hero-portrait';
}

export function presetPreviewSourceUrl(presetId: string): string {
	const hero = presetPreviewHeroId(presetId);
	return `/previews/sources/${hero}.webp`;
}
