import { get, writable } from 'svelte/store';
import { getBuiltinPreset } from '../presets/builtin';
import { builtinPresetName, t } from '$lib/i18n';
import { appendPresetGroup, appliedEffects, activeLayerIndex, layerGroups } from './editor';
import { pushHistory, toSnapshot, type StackSnapshot } from './history';

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
		name: name.trim() || t('presetsMenu.autoName', { n: get(savedPresets).length + 1 }),
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
	applySnapshotAsGroup(preset.snapshot, { name: preset.name, presetId: preset.id });
}

/**
 * Load a curated preset — replaces the stack so the look is immediately visible.
 * (Saved user presets in the header menu still append via loadPreset.)
 */
export function loadBuiltinPreset(id: string) {
	const preset = getBuiltinPreset(id);
	if (!preset) return;
	pushHistory();
	appliedEffects.set([]);
	layerGroups.set([]);
	appendPresetGroup(preset.snapshot, {
		name: builtinPresetName(preset.id, preset.name),
		presetId: preset.id
	});
}

function applySnapshotAsGroup(snapshot: StackSnapshot, meta: { name: string; presetId?: string }) {
	pushHistory();
	appendPresetGroup(snapshot, meta);
}

export function deletePreset(id: string) {
	savedPresets.update((list) => {
		const next = list.filter((p) => p.id !== id);
		persist(next);
		return next;
	});
}
