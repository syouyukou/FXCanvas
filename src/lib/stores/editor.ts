import { writable, derived } from 'svelte/store';
import { EFFECTS } from '../effects/index';
import type { Effect, AppliedEffect } from '../engine/renderer';

// Deep clone an effect with fresh param values
function cloneEffect(effect: Effect): Effect {
	return {
		...effect,
		params: effect.params.map((p) => ({ ...p })),
		enabled: true
	};
}

// Applied effects stack (layers)
export const appliedEffects = writable<AppliedEffect[]>([]);

// Active layer index (for configure panel)
export const activeLayerIndex = writable<number>(-1);

// Source image
export const sourceImage = writable<HTMLImageElement | ImageBitmap | null>(null);

// Image dimensions (updated when image loads)
export const imageSize = writable<{ width: number; height: number }>({ width: 0, height: 0 });

// Search query
export const searchQuery = writable('');

// Active tab in left panel
export const leftTab = writable<'explore' | 'favorites'>('explore');

// Favorites set
export const favorites = writable<Set<string>>(new Set());

// Filtered effects
export const filteredEffects = derived(
	[searchQuery],
	([$search]) => {
		if (!$search.trim()) return EFFECTS;
		const q = $search.toLowerCase();
		return EFFECTS.filter(
			(e) =>
				e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
		);
	}
);

export function addEffect(effectTemplate: Effect) {
	const cloned = cloneEffect(effectTemplate);
	const params: Record<string, number | boolean | string> = {};
	for (const p of cloned.params) {
		params[p.name] = p.default;
	}
	appliedEffects.update((list) => {
		const newList = [...list, { effect: cloned, params }];
		activeLayerIndex.set(newList.length - 1);
		return newList;
	});
}

export function removeEffect(index: number) {
	appliedEffects.update((list) => {
		const newList = list.filter((_, i) => i !== index);
		activeLayerIndex.update((idx) => (idx >= newList.length ? newList.length - 1 : idx));
		return newList;
	});
}

export function toggleEffect(index: number) {
	appliedEffects.update((list) =>
		list.map((item, i) =>
			i === index ? { ...item, effect: { ...item.effect, enabled: !item.effect.enabled } } : item
		)
	);
}

export function updateParam(index: number, paramName: string, value: number | boolean | string) {
	appliedEffects.update((list) =>
		list.map((item, i) =>
			i === index ? { ...item, params: { ...item.params, [paramName]: value } } : item
		)
	);
}

export function moveEffect(from: number, to: number) {
	appliedEffects.update((list) => {
		const arr = [...list];
		const [moved] = arr.splice(from, 1);
		arr.splice(to, 0, moved);
		return arr;
	});
}

export function clearEffects() {
	appliedEffects.set([]);
	activeLayerIndex.set(-1);
}
