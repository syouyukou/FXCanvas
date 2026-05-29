import { get } from 'svelte/store';
import {
	appliedEffects,
	activeLayerIndex,
	layerGroups,
	sourceImage,
	sourceCredit,
	replaceStack
} from './editor';
import { fromSnapshot, resetHistory, toSnapshot, type StackSnapshot } from './history';
import { clearAllKeyframeTracks, keyframeTracks } from './keyframes';
import type { ParamTrack } from '../engine/keyframeEngine';
import type { SampleAuthor } from '../samples/catalog';

const META_KEY = 'fxcanvas-session-meta-v1';
const DB_NAME = 'fxcanvas';
const DB_VERSION = 1;
const IMAGE_STORE = 'images';

interface SessionMeta {
	stack: StackSnapshot;
	savedAt: number;
	imageKey: string;
	keyframeTracks?: ParamTrack[];
	sourceCredit?: SampleAuthor[] | null;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let autosaveStarted = false;

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof indexedDB === 'undefined') {
			reject(new Error('IndexedDB unavailable'));
			return;
		}
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(IMAGE_STORE)) {
				db.createObjectStore(IMAGE_STORE);
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
	});
}

async function putImage(key: string, blob: Blob): Promise<void> {
	const db = await openDb();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(IMAGE_STORE, 'readwrite');
		tx.objectStore(IMAGE_STORE).put(blob, key);
		tx.oncomplete = () => {
			db.close();
			resolve();
		};
		tx.onerror = () => {
			db.close();
			reject(tx.error);
		};
	});
}

async function getImage(key: string): Promise<Blob | null> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(IMAGE_STORE, 'readonly');
		const req = tx.objectStore(IMAGE_STORE).get(key);
		req.onsuccess = () => {
			db.close();
			resolve((req.result as Blob | undefined) ?? null);
		};
		req.onerror = () => {
			db.close();
			reject(req.error);
		};
	});
}

async function imageToBlob(img: HTMLImageElement | ImageBitmap): Promise<Blob> {
	if (img instanceof ImageBitmap) {
		const canvas = document.createElement('canvas');
		canvas.width = img.width;
		canvas.height = img.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas 2D unavailable');
		ctx.drawImage(img, 0, 0);
		return new Promise((resolve, reject) => {
			canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
		});
	}
	const canvas = document.createElement('canvas');
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D unavailable');
	ctx.drawImage(img, 0, 0);
	return new Promise((resolve, reject) => {
		canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
	});
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
	const url = URL.createObjectURL(blob);
	const img = new Image();
	await new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(new Error('Image load failed'));
		img.src = url;
	});
	URL.revokeObjectURL(url);
	return img;
}

export async function saveSession(): Promise<void> {
	if (typeof localStorage === 'undefined') return;
	const img = get(sourceImage);
	const list = get(appliedEffects);
	if (!img) {
		localStorage.removeItem(META_KEY);
		return;
	}
	if (typeof HTMLVideoElement !== 'undefined' && img instanceof HTMLVideoElement) {
		return;
	}
	const staticImage = img as HTMLImageElement | ImageBitmap;
	try {
		const imageKey = `session-${Date.now()}`;
		const blob = await imageToBlob(staticImage);
		await putImage(imageKey, blob);
		const meta: SessionMeta = {
			stack: toSnapshot(list, get(activeLayerIndex), get(layerGroups)),
			savedAt: Date.now(),
			imageKey,
			keyframeTracks: get(keyframeTracks),
			sourceCredit: get(sourceCredit)
		};
		localStorage.setItem(META_KEY, JSON.stringify(meta));
	} catch {
		// Best-effort persistence; ignore quota / private mode failures.
	}
}

export async function restoreSession(): Promise<boolean> {
	if (typeof localStorage === 'undefined') return false;
	const raw = localStorage.getItem(META_KEY);
	if (!raw) return false;
	try {
		const meta = JSON.parse(raw) as SessionMeta;
		const blob = await getImage(meta.imageKey);
		if (!blob) return false;
		// Don't clobber media the user loaded while restore was in flight.
		if (get(sourceImage)) return false;
		const img = await blobToImage(blob);
		const { list, activeIndex, groups } = fromSnapshot(meta.stack);
		sourceImage.set(img);
		replaceStack(list, activeIndex, { skipHistory: true, groups });
		if (meta.keyframeTracks?.length) keyframeTracks.set(meta.keyframeTracks);
		else clearAllKeyframeTracks();
		sourceCredit.set(meta.sourceCredit ?? null);
		resetHistory();
		return true;
	} catch {
		return false;
	}
}

function scheduleSave() {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveTimer = null;
		void saveSession();
	}, 600);
}

export function initSessionAutosave() {
	if (autosaveStarted || typeof window === 'undefined') return;
	autosaveStarted = true;
	appliedEffects.subscribe(scheduleSave);
	layerGroups.subscribe(scheduleSave);
	activeLayerIndex.subscribe(scheduleSave);
	sourceImage.subscribe(scheduleSave);
	keyframeTracks.subscribe(scheduleSave);
	sourceCredit.subscribe(scheduleSave);
}

export function clearSession() {
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem(META_KEY);
	}
}
