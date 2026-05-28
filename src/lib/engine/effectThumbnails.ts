import { EFFECTS } from '../effects/index';
import { ThumbnailRenderer } from './thumbnail';
import { createDefaultPreviewImage } from './previewImage';
import { sourceThumbnail, thumbnails } from '../stores/editor';

let defaultPreviewImage: HTMLImageElement | null = null;
let initPromise: Promise<void> | null = null;
let generationToken = 0;

function yieldFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function generateEffectThumbnailsAsync(
	image: HTMLImageElement | ImageBitmap,
	token: number
): Promise<void> {
	const renderer = new ThumbnailRenderer();
	renderer.loadImage(image);

	const source = renderer.renderSource();
	if (token === generationToken) sourceThumbnail.set(source);

	const map = new Map<string, string>();
	for (const effect of EFFECTS) {
		if (token !== generationToken) break;
		await yieldFrame();
		const url = renderer.renderEffect(effect);
		if (url) {
			map.set(effect.id, url);
			if (token === generationToken) {
				thumbnails.update((prev) => {
					const next = new Map(prev);
					next.set(effect.id, url);
					return next;
				});
			}
		}
	}

	renderer.destroy();
}

function startThumbnailGeneration(image: HTMLImageElement | ImageBitmap): void {
	const token = ++generationToken;
	void generateEffectThumbnailsAsync(image, token);
}

/** Pre-render curated thumbnails on app start (no user image required). */
export function initDefaultThumbnails(): Promise<void> {
	if (initPromise) return initPromise;

	initPromise = (async () => {
		if (typeof window === 'undefined') return;
		if (!defaultPreviewImage) {
			defaultPreviewImage = await createDefaultPreviewImage();
		}
		startThumbnailGeneration(defaultPreviewImage);
	})();

	return initPromise;
}

/** Re-render sidebar thumbnails using the user's loaded image. */
export function refreshThumbnailsForImage(image: HTMLImageElement | ImageBitmap): void {
	startThumbnailGeneration(image);
}
