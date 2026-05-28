import { get, writable } from 'svelte/store';
import { appliedEffects, activeLayerIndex, replaceStack } from './editor';
import { fromSnapshot, pushHistory, toSnapshot, type StackSnapshot } from './history';

const STORAGE_KEY = 'fxcanvas-presets';

export interface SavedPreset {
	id: string;
	name: string;
	snapshot: StackSnapshot;
	createdAt: number;
}

function loadPresets(): SavedPreset[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		return JSON.parse(raw) as SavedPreset[];
	} catch {
		return [];
	}
}

function persist(list: SavedPreset[]) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const savedPresets = writable<SavedPreset[]>(loadPresets());

export function saveCurrentPreset(name: string) {
	const snapshot = toSnapshot(get(appliedEffects), get(activeLayerIndex));
	const preset: SavedPreset = {
		id: crypto.randomUUID(),
		name: name.trim() || `Preset ${get(savedPresets).length + 1}`,
		snapshot,
		createdAt: Date.now()
	};
	savedPresets.update((list) => {
		const next = [...list, preset].slice(-20);
		persist(next);
		return next;
	});
}

export function loadPreset(id: string) {
	const preset = get(savedPresets).find((p) => p.id === id);
	if (!preset) return;
	pushHistory();
	const { list, activeIndex } = fromSnapshot(preset.snapshot);
	replaceStack(list, activeIndex, { skipHistory: true });
}

export function deletePreset(id: string) {
	savedPresets.update((list) => {
		const next = list.filter((p) => p.id !== id);
		persist(next);
		return next;
	});
}
