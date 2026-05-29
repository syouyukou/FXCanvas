import { EFFECTS } from '../effects/index';

/** Static curated source for sidebar hover "before" + GPU "after" render. */
export const PREVIEW_SOURCE_DIR = '/previews/sources';

export function previewSourceUrl(effectId: string): string {
	return `${PREVIEW_SOURCE_DIR}/${effectId}.svg`;
}

/** Every registered effect should have a file under static/previews/sources/. */
export const EFFECT_PREVIEW_EFFECT_IDS = EFFECTS.map((e) => e.id);
