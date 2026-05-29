import { previewSourceCandidates } from './effectPreviewSources';
import { createFallbackPreviewImage } from './previewImage';

function loadImageElement(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load preview source: ${src}`));
		img.src = src;
	});
}

/** Load curated static source (webp → photo → svg), or procedural fallback. */
export async function loadPreviewSourceImage(effectId: string): Promise<HTMLImageElement> {
	for (const url of previewSourceCandidates(effectId)) {
		try {
			return await loadImageElement(url);
		} catch {
			// try next format
		}
	}
	return createFallbackPreviewImage(effectId);
}
