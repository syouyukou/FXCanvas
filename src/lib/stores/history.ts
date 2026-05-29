import { get, writable } from 'svelte/store';
import { EFFECTS } from '../effects/index';
import type { AppliedEffect, BlendMode } from '../engine/renderer';
import { cloneGradient, type GradientStop } from '../engine/gradient';
import { activeLayerIndex, appliedEffects, layerGroups, type LayerGroup } from './editor';

const MAX = 50;

export interface LayerGroupSnapshot {
	id: string;
	name: string;
	presetId?: string;
	expanded?: boolean;
	enabled?: boolean;
}

export interface StackSnapshot {
		layers: {
		effectId: string;
		enabled: boolean;
		layerId?: string;
		opacity?: number;
		blendMode?: BlendMode;
		groupId?: string;
		params: Record<string, number | boolean | string | GradientStop[]>;
	}[];
	groups?: LayerGroupSnapshot[];
	activeIndex: number;
}

function cloneParams(
	params: Record<string, number | boolean | string | GradientStop[]>
): Record<string, number | boolean | string | GradientStop[]> {
	const out: Record<string, number | boolean | string | GradientStop[]> = {};
	for (const [k, v] of Object.entries(params)) {
		out[k] = Array.isArray(v) ? cloneGradient(v as GradientStop[]) : v;
	}
	return out;
}

export function toSnapshot(
	list: AppliedEffect[],
	activeIndex: number,
	groups: LayerGroup[] = get(layerGroups)
): StackSnapshot {
	return {
		layers: list.map((item) => ({
			effectId: item.effect.id,
			enabled: item.effect.enabled,
			opacity: item.opacity ?? 1,
			...(item.layerId ? { layerId: item.layerId } : {}),
			...(item.blendMode && item.blendMode !== 'normal' ? { blendMode: item.blendMode } : {}),
			...(item.groupId ? { groupId: item.groupId } : {}),
			params: cloneParams(item.params)
		})),
		groups: groups.map((g) => ({
			id: g.id,
			name: g.name,
			presetId: g.presetId,
			expanded: g.expanded,
			enabled: g.enabled
		})),
		activeIndex
	};
}

function resolveGroups(snapshot: StackSnapshot, list: AppliedEffect[]): LayerGroup[] {
	if (snapshot.groups?.length) {
		return snapshot.groups.map((g) => ({
			id: g.id,
			name: g.name,
			presetId: g.presetId,
			expanded: g.expanded ?? true,
			enabled: g.enabled ?? true
		}));
	}
	const seen = new Map<string, LayerGroup>();
	for (const item of list) {
		if (item.groupId && !seen.has(item.groupId)) {
			seen.set(item.groupId, {
				id: item.groupId,
				name: 'GROUP',
				expanded: true,
				enabled: true
			});
		}
	}
	return [...seen.values()];
}

export function fromSnapshot(snapshot: StackSnapshot): {
	list: AppliedEffect[];
	activeIndex: number;
	groups: LayerGroup[];
} {
	const list: AppliedEffect[] = [];
	for (const layer of snapshot.layers) {
		const template = EFFECTS.find((e) => e.id === layer.effectId);
		if (!template) continue;
		list.push({
			effect: {
				...template,
				params: template.params.map((p) => ({ ...p })),
				enabled: layer.enabled
			},
			params: cloneParams(layer.params),
			opacity: layer.opacity ?? 1,
			...(layer.layerId ? { layerId: layer.layerId } : {}),
			...(layer.blendMode ? { blendMode: layer.blendMode } : {}),
			...(layer.groupId ? { groupId: layer.groupId } : {})
		});
	}
	const activeIndex = Math.min(
		Math.max(snapshot.activeIndex, -1),
		list.length - 1
	);
	return { list, activeIndex, groups: resolveGroups(snapshot, list) };
}

export const canUndo = writable(false);
export const canRedo = writable(false);

const past = writable<StackSnapshot[]>([]);
const future = writable<StackSnapshot[]>([]);

function syncFlags() {
	canUndo.set(get(past).length > 0);
	canRedo.set(get(future).length > 0);
}

export function resetHistory() {
	past.set([]);
	future.set([]);
	syncFlags();
}

/** Save current stack before a mutating action. */
export function pushHistory() {
	const list = get(appliedEffects);
	const snap = toSnapshot(list, get(activeLayerIndex));
	past.update((p) => [...p.slice(-(MAX - 1)), snap]);
	future.set([]);
	syncFlags();
}

export function undo() {
	const prev = get(past);
	if (prev.length === 0) return;
	const current = toSnapshot(get(appliedEffects), get(activeLayerIndex));
	future.update((f) => [current, ...f]);
	const snap = prev[prev.length - 1];
	past.set(prev.slice(0, -1));
	const { list, activeIndex, groups } = fromSnapshot(snap);
	appliedEffects.set(list);
	layerGroups.set(groups);
	activeLayerIndex.set(activeIndex);
	syncFlags();
}

export function redo() {
	const next = get(future);
	if (next.length === 0) return;
	const current = toSnapshot(get(appliedEffects), get(activeLayerIndex));
	past.update((p) => [...p, current]);
	const snap = next[0];
	future.set(next.slice(1));
	const { list, activeIndex, groups } = fromSnapshot(snap);
	appliedEffects.set(list);
	layerGroups.set(groups);
	activeLayerIndex.set(activeIndex);
	syncFlags();
}
