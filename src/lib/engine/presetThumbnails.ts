import { BUILTIN_PRESETS } from '../presets/builtin';
import { isPresetVisibleInPanel } from '../presets/visiblePresets';
import { fromSnapshot } from '../stores/history';
import { presetSourceThumbnails, presetThumbnails } from '../stores/editor';
import { PREVIEW_SOURCE_DIR } from './effectPreviewSources';
import { presetPreviewHeroId } from './presetPreviewSources';
import { Renderer } from './renderer';

const THUMB = 256;

function yieldFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function previewClock(presetId: string): { time: number; frame: number; duration: number } {
	if (presetId === 'lofi_vhs') {
		const time = 1.6;
		return { time, frame: Math.floor(time * 30), duration: 5 };
	}
	return { time: 0, frame: 0, duration: 5 };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load: ${src}`));
		img.src = src;
	});
}

async function loadHeroForPreset(presetId: string): Promise<HTMLImageElement> {
	const hero = presetPreviewHeroId(presetId);
	for (const ext of ['webp', 'jpg', 'jpeg', 'png'] as const) {
		try {
			return await loadImageElement(`${PREVIEW_SOURCE_DIR}/${hero}.${ext}`);
		} catch {
			/* try next */
		}
	}
	return loadImageElement(`${PREVIEW_SOURCE_DIR}/${hero}.svg`);
}

async function generatePresetThumbnailsAsync(token: number): Promise<void> {
	if (typeof window === 'undefined') return;

	const canvas = document.createElement('canvas');
	const renderer = new Renderer(canvas);

	const visible = BUILTIN_PRESETS.filter((p) => isPresetVisibleInPanel(p.id));

	for (const preset of visible) {
		if (token !== generationToken) break;
		await yieldFrame();

		try {
			const image = await loadHeroForPreset(preset.id);
			renderer.loadImage(image);
			const { list } = fromSnapshot(preset.snapshot);

			renderer.render([], { width: THUMB, height: THUMB });
			renderer.flush();
			const before = canvas.toDataURL('image/jpeg', 0.82);

			const clock = previewClock(preset.id);
			renderer.render(list, { width: THUMB, height: THUMB, ...clock });
			renderer.flush();
			const after = canvas.toDataURL('image/jpeg', 0.8);

			presetSourceThumbnails.update((prev) => {
				const next = new Map(prev);
				next.set(preset.id, before);
				return next;
			});
			presetThumbnails.update((prev) => {
				const next = new Map(prev);
				next.set(preset.id, after);
				return next;
			});
		} catch (err) {
			console.warn(`[presetThumbnails] failed for ${preset.id}`, err);
		}
	}

	renderer.destroy();
}

let generationToken = 0;
let initPromise: Promise<void> | null = null;

/** GPU bake of full preset stacks for PRESETS tab cards. */
export function initPresetThumbnails(): Promise<void> {
	if (initPromise) return initPromise;

	initPromise = (async () => {
		const token = ++generationToken;
		await generatePresetThumbnailsAsync(token);
	})();

	return initPromise;
}

/** Force regeneration (e.g. after tuning builtin.ts). */
export function refreshPresetThumbnails(): Promise<void> {
	initPromise = null;
	generationToken++;
	return initPresetThumbnails();
}
