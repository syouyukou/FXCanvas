import { EFFECTS } from '../effects/index';
import { ThumbnailRenderer } from './thumbnail';
import { loadPreviewSourceImage } from './loadPreviewSource';
import { sourceThumbnails, thumbnails } from '../stores/editor';

let initPromise: Promise<void> | null = null;
let generationToken = 0;

function yieldFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function generateEffectThumbnailsAsync(token: number): Promise<void> {
	const renderer = new ThumbnailRenderer();

	for (const effect of EFFECTS) {
		if (token !== generationToken) break;
		await yieldFrame();

		const image = await loadPreviewSourceImage(effect.id);
		renderer.loadImage(image);

		const before = renderer.renderSource();
		const after = renderer.renderEffect(effect);

		if (token !== generationToken) break;

		if (before) {
			sourceThumbnails.update((prev) => {
				const next = new Map(prev);
				next.set(effect.id, before);
				return next;
			});
		}
		if (after) {
			thumbnails.update((prev) => {
				const next = new Map(prev);
				next.set(effect.id, after);
				return next;
			});
		}
	}

	renderer.destroy();
}

function startThumbnailGeneration(): void {
	const token = ++generationToken;
	void generateEffectThumbnailsAsync(token);
}

import { initPresetThumbnails } from './presetThumbnails';

/** Pre-render per-effect and preset thumbnails on app start. */
export function initDefaultThumbnails(): Promise<void> {
	if (initPromise) return initPromise;

	initPromise = (async () => {
		if (typeof window === 'undefined') return;
		startThumbnailGeneration();
		await initPresetThumbnails();
	})();

	return initPromise;
}
