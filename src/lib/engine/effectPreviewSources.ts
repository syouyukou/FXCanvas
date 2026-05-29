import { EFFECTS } from '../effects/index';

/** Static curated source for sidebar hover "before" + GPU "after" render. */
export const PREVIEW_SOURCE_DIR = '/previews/sources';

const PREVIEW_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png', 'svg'] as const;

/** Three art-directed heroes — effects share by category for a cohesive dock. */
export type PreviewHeroId = 'hero-portrait' | 'hero-neon' | 'hero-night';

export const PREVIEW_HERO_IDS: PreviewHeroId[] = ['hero-portrait', 'hero-neon', 'hero-night'];

const HERO_BY_CATEGORY: Record<string, PreviewHeroId> = {
	Blur: 'hero-portrait',
	Color: 'hero-portrait',
	Film: 'hero-portrait',
	Distort: 'hero-neon',
	Effects: 'hero-portrait'
};

/** Per-effect overrides when category default is not ideal. */
const HERO_EFFECT_OVERRIDES: Partial<Record<string, PreviewHeroId>> = {
	crt: 'hero-neon',
	star_glow: 'hero-night',
	bloom: 'hero-night',
	dither: 'hero-night'
};

export function previewHeroId(effectId: string): PreviewHeroId {
	const override = HERO_EFFECT_OVERRIDES[effectId];
	if (override) return override;
	const effect = EFFECTS.find((e) => e.id === effectId);
	if (effect && HERO_BY_CATEGORY[effect.category]) return HERO_BY_CATEGORY[effect.category];
	return 'hero-portrait';
}

/** Preferred static asset paths for an effect's hero (photo first, procedural SVG last). */
export function previewSourceCandidates(effectId: string): string[] {
	const hero = previewHeroId(effectId);
	return PREVIEW_EXTENSIONS.map((ext) => `${PREVIEW_SOURCE_DIR}/${hero}.${ext}`);
}

/** Primary URL — first candidate (webp when fetched via previews:fetch). */
export function previewSourceUrl(effectId: string): string {
	return previewSourceCandidates(effectId)[0];
}

/** Every registered effect should resolve to a hero under static/previews/sources/. */
export const EFFECT_PREVIEW_EFFECT_IDS = EFFECTS.map((e) => e.id);
