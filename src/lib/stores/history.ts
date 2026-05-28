import { get, writable } from 'svelte/store';
import { EFFECTS } from '../effects/index';
import type { AppliedEffect } from '../engine/renderer';
import { cloneGradient, type GradientStop } from '../engine/gradient';
import { activeLayerIndex, appliedEffects } from './editor';

const MAX = 50;

export interface StackSnapshot {
	layers: {
		effectId: string;
		enabled: boolean;
		params: Record<string, number | boolean | string | GradientStop[]>;
	}[];
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
	activeIndex: number
): StackSnapshot {
	return {
		layers: list.map((item) => ({
			effectId: item.effect.id,
			enabled: item.effect.enabled,
			params: cloneParams(item.params)
		})),
		activeIndex
	};
}

export function fromSnapshot(snapshot: StackSnapshot): {
	list: AppliedEffect[];
	activeIndex: number;
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
			params: cloneParams(layer.params)
		});
	}
	const activeIndex = Math.min(
		Math.max(snapshot.activeIndex, -1),
		list.length - 1
	);
	return { list, activeIndex };
}

export const canUndo = writable(false);
export const canRedo = writable(false);

const past = writable<StackSnapshot[]>([]);
const future = writable<StackSnapshot[]>([]);

function syncFlags() {
	canUndo.set(get(past).length > 0);
	canRedo.set(get(future).length > 0);
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
	const { list, activeIndex } = fromSnapshot(snap);
	appliedEffects.set(list);
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
	const { list, activeIndex } = fromSnapshot(snap);
	appliedEffects.set(list);
	activeLayerIndex.set(activeIndex);
	syncFlags();
}
