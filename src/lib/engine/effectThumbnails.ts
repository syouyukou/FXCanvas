import { EFFECTS } from '../effects/index';
import { ThumbnailRenderer } from './thumbnail';
import { createDefaultPreviewImage } from './previewImage';
import { thumbnails } from '../stores/editor';

let defaultPreviewImage: HTMLImageElement | null = null;
let initPromise: Promise<void> | null = null;

export function generateEffectThumbnails(
	image: HTMLImageElement | ImageBitmap
): Map<string, string> {
	const renderer = new ThumbnailRenderer();
	renderer.loadImage(image);
	const map = new Map<string, string>();
	for (const effect of EFFECTS) {
		const url = renderer.renderEffect(effect);
		if (url) map.set(effect.id, url);
	}
	renderer.destroy();
	return map;
}

/** Pre-render curated thumbnails on app start (no user image required). */
export function initDefaultThumbnails(): Promise<void> {
	if (initPromise) return initPromise;

	initPromise = (async () => {
		if (typeof window === 'undefined') return;
		if (!defaultPreviewImage) {
			defaultPreviewImage = await createDefaultPreviewImage();
		}
		thumbnails.set(generateEffectThumbnails(defaultPreviewImage));
	})();

	return initPromise;
}

/** Re-render sidebar thumbnails using the user's loaded image. */
export function refreshThumbnailsForImage(image: HTMLImageElement | ImageBitmap): void {
	thumbnails.set(generateEffectThumbnails(image));
}
