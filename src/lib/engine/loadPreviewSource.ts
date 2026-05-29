import { previewSourceUrl } from './effectPreviewSources';
import { createFallbackPreviewImage } from './previewImage';

function loadImageElement(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load preview source: ${src}`));
		img.src = src;
	});
}

/** Load curated static source, or procedural fallback if the asset is missing. */
export async function loadPreviewSourceImage(effectId: string): Promise<HTMLImageElement> {
	const url = previewSourceUrl(effectId);
	try {
		return await loadImageElement(url);
	} catch {
		return createFallbackPreviewImage(effectId);
	}
}
