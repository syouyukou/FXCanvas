import { get, writable, derived } from 'svelte/store';
import { EFFECTS } from '../effects/index';
import type { Effect, AppliedEffect, EffectParam } from '../engine/renderer';
import { cloneGradient, type GradientStop } from '../engine/gradient';
import { createI18n } from '$lib/i18n';
import { locale } from '$lib/i18n';
import { fromSnapshot, pushHistory, type StackSnapshot } from './history';

const FAVORITES_KEY = 'fxcanvas-favorites';

function loadFavorites(): Set<string> {
	if (typeof localStorage === 'undefined') return new Set();
	try {
		const raw = localStorage.getItem(FAVORITES_KEY);
		if (!raw) return new Set();
		return new Set(JSON.parse(raw) as string[]);
	} catch {
		return new Set();
	}
}

function persistFavorites(favs: Set<string>) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
}

function cloneEffect(effect: Effect): Effect {
	return {
		...effect,
		params: effect.params.map((p) => ({
			...p,
			...(p.type === 'gradient'
				? { default: cloneGradient(p.default as GradientStop[]) }
				: {})
		})),
		enabled: true
	};
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

function randomParamValue(param: EffectParam): number | boolean | string | GradientStop[] {
	switch (param.type) {
		case 'bool':
			return Math.random() > 0.5;
		case 'enum':
			if (param.options?.length) {
				return param.options[Math.floor(Math.random() * param.options.length)].value;
			}
			return param.default as number;
		case 'color':
			return (
				'#' +
				Math.floor(Math.random() * 0xffffff)
					.toString(16)
					.padStart(6, '0')
			);
		case 'gradient':
			return cloneGradient(param.default as GradientStop[]).map((s) => ({
				pos: Math.max(0, Math.min(1, s.pos + (Math.random() - 0.5) * 0.2)),
				color:
					'#' +
					Math.floor(Math.random() * 0xffffff)
						.toString(16)
						.padStart(6, '0')
			}));
		case 'int':
			return Math.round(param.min! + Math.random() * (param.max! - param.min!));
		default:
			return parseFloat((param.min! + Math.random() * (param.max! - param.min!)).toFixed(3));
	}
}

export interface LayerGroup {
	id: string;
	name: string;
	presetId?: string;
	expanded: boolean;
	enabled: boolean;
}

export const appliedEffects = writable<AppliedEffect[]>([]);
export const layerGroups = writable<LayerGroup[]>([]);
export const activeLayerIndex = writable<number>(-1);
export const sourceImage = writable<HTMLImageElement | ImageBitmap | null>(null);
export const imageSize = writable<{ width: number; height: number }>({ width: 0, height: 0 });
export const thumbnails = writable<Map<string, string>>(new Map());
/** Per-effect curated "before" image for sidebar hover preview. */
export const sourceThumbnails = writable<Map<string, string>>(new Map());
export const searchQuery = writable('');
export const leftTab = writable<'effects' | 'favorites' | 'presets'>('effects');
export const favorites = writable<Set<string>>(loadFavorites());

favorites.subscribe((favs) => persistFavorites(favs));

export const filteredEffects = derived([searchQuery, locale], ([$search, $lang]) => {
	if (!$search.trim()) return EFFECTS;
	const q = $search.toLowerCase();
	const i18n = createI18n($lang);
	return EFFECTS.filter((e) => i18n.effectSearchText(e.id, e.name, e.category).includes(q));
});

export function addEffect(effectTemplate: Effect, options?: { randomize?: boolean; skipHistory?: boolean }) {
	if (!options?.skipHistory) pushHistory();
	const cloned = cloneEffect(effectTemplate);
	const params: Record<string, number | boolean | string | GradientStop[]> = {};
	for (const p of cloned.params) {
		params[p.name] =
			options?.randomize
				? randomParamValue(p)
				: p.type === 'gradient'
					? cloneGradient(p.default as GradientStop[])
					: (p.default as number | boolean | string);
	}
	appliedEffects.update((list) => {
		const newList = [...list, { effect: cloned, params, opacity: 1 }];
		activeLayerIndex.set(newList.length - 1);
		return newList;
	});
}

export function addEffectWithParams(
	effectTemplate: Effect,
	params: Record<string, number | boolean | string | GradientStop[]>,
	options?: { skipHistory?: boolean }
) {
	if (!options?.skipHistory) pushHistory();
	const cloned = cloneEffect(effectTemplate);
	const merged: Record<string, number | boolean | string | GradientStop[]> = {};
	for (const p of cloned.params) {
		merged[p.name] =
			params[p.name] !== undefined
				? params[p.name]
				: p.type === 'gradient'
					? cloneGradient(p.default as GradientStop[])
					: (p.default as number | boolean | string);
	}
	appliedEffects.update((list) => {
		const newList = [...list, { effect: cloned, params: merged, opacity: 1 }];
		activeLayerIndex.set(newList.length - 1);
		return newList;
	});
}

function pruneOrphanGroups(list: AppliedEffect[]) {
	const used = new Set(list.map((item) => item.groupId).filter(Boolean) as string[]);
	layerGroups.update((groups) => groups.filter((g) => used.has(g.id)));
}

export function removeEffect(index: number) {
	pushHistory();
	appliedEffects.update((list) => {
		const newList = list.filter((_, i) => i !== index);
		pruneOrphanGroups(newList);
		activeLayerIndex.update((idx) => {
			if (newList.length === 0) return -1;
			if (idx > index) return idx - 1;
			if (idx === index) return Math.min(index, newList.length - 1);
			return idx >= newList.length ? newList.length - 1 : idx;
		});
		return newList;
	});
}

export function removeGroup(groupId: string) {
	pushHistory();
	appliedEffects.update((list) => {
		const newList = list.filter((item) => item.groupId !== groupId);
		layerGroups.update((groups) => groups.filter((g) => g.id !== groupId));
		activeLayerIndex.update((idx) => {
			if (newList.length === 0) return -1;
			if (idx < 0) return -1;
			return Math.min(idx, newList.length - 1);
		});
		return newList;
	});
}

export function toggleGroupExpanded(groupId: string) {
	layerGroups.update((groups) =>
		groups.map((g) => (g.id === groupId ? { ...g, expanded: !g.expanded } : g))
	);
}

export function toggleGroupEnabled(groupId: string) {
	pushHistory();
	const group = get(layerGroups).find((g) => g.id === groupId);
	if (!group) return;
	const next = !group.enabled;
	layerGroups.update((groups) =>
		groups.map((g) => (g.id === groupId ? { ...g, enabled: next } : g))
	);
	appliedEffects.update((list) =>
		list.map((item) =>
			item.groupId === groupId
				? { ...item, effect: { ...item.effect, enabled: next } }
				: item
		)
	);
}

/** Append a preset snapshot as a collapsible group (keeps existing stack). */
export function appendPresetGroup(
	snapshot: StackSnapshot,
	meta: { name: string; presetId?: string }
) {
	let layers = snapshot.layers;
	let groups = snapshot.groups ?? [];

	if (groups.length === 0 && layers.length > 0) {
		const gid = crypto.randomUUID();
		groups = [
			{
				id: gid,
				name: meta.name,
				presetId: meta.presetId,
				expanded: true,
				enabled: true
			}
		];
		layers = layers.map((l) => ({ ...l, groupId: gid }));
	} else {
		const idMap = new Map<string, string>();
		groups = groups.map((g) => {
			const newId = crypto.randomUUID();
			idMap.set(g.id, newId);
			return {
				...g,
				id: newId,
				name: g.name || meta.name,
				presetId: g.presetId ?? meta.presetId
			};
		});
		layers = layers.map((l) => ({
			...l,
			groupId: l.groupId ? (idMap.get(l.groupId) ?? l.groupId) : undefined
		}));
	}

	const { list } = fromSnapshot({ layers, groups, activeIndex: 0 });
	const newGroups: LayerGroup[] = groups.map((g) => ({
		id: g.id,
		name: g.name,
		presetId: g.presetId,
		expanded: g.expanded ?? true,
		enabled: g.enabled ?? true
	}));

	appliedEffects.update((stack) => [...stack, ...list]);
	layerGroups.update((stack) => [...stack, ...newGroups]);
	activeLayerIndex.set(get(appliedEffects).length - 1);
}

export function duplicateEffect(index: number) {
	pushHistory();
	appliedEffects.update((list) => {
		const item = list[index];
		if (!item) return list;
		const copy: AppliedEffect = {
			effect: cloneEffect(item.effect),
			params: cloneParams(item.params),
			opacity: item.opacity ?? 1,
			...(item.groupId ? { groupId: item.groupId } : {})
		};
		copy.effect.enabled = item.effect.enabled;
		const newList = [...list];
		newList.splice(index + 1, 0, copy);
		activeLayerIndex.set(index + 1);
		return newList;
	});
}

export function toggleEffect(index: number) {
	pushHistory();
	appliedEffects.update((list) =>
		list.map((item, i) =>
			i === index ? { ...item, effect: { ...item.effect, enabled: !item.effect.enabled } } : item
		)
	);
}

export function beginParamEdit() {
	pushHistory();
}

export function updateParam(
	index: number,
	paramName: string,
	value: number | boolean | string | GradientStop[]
) {
	appliedEffects.update((list) =>
		list.map((item, i) =>
			i === index ? { ...item, params: { ...item.params, [paramName]: value } } : item
		)
	);
}

export function updateLayerOpacity(index: number, opacity: number) {
	appliedEffects.update((list) =>
		list.map((item, i) =>
			i === index ? { ...item, opacity: Math.min(1, Math.max(0, opacity)) } : item
		)
	);
}

export function applyParams(
	index: number,
	params: Record<string, number | boolean | string | GradientStop[]>
) {
	pushHistory();
	appliedEffects.update((list) =>
		list.map((item, i) =>
			i === index ? { ...item, params: { ...item.params, ...params } } : item
		)
	);
}

export function moveEffect(from: number, to: number) {
	if (from === to) return;
	pushHistory();
	appliedEffects.update((list) => {
		const arr = [...list];
		const [moved] = arr.splice(from, 1);
		arr.splice(to, 0, moved);
		return arr;
	});
}

export function clearEffects() {
	pushHistory();
	appliedEffects.set([]);
	layerGroups.set([]);
	activeLayerIndex.set(-1);
}

export function randomizeParams(index: number) {
	pushHistory();
	appliedEffects.update((list) =>
		list.map((item, i) => {
			if (i !== index) return item;
			const newParams: Record<string, number | boolean | string | GradientStop[]> = {};
			for (const p of item.effect.params) {
				newParams[p.name] = randomParamValue(p);
			}
			return { ...item, params: newParams };
		})
	);
}

export function resetParams(index: number) {
	pushHistory();
	appliedEffects.update((list) =>
		list.map((item, i) => {
			if (i !== index) return item;
			const newParams: Record<string, number | boolean | string | GradientStop[]> = {};
			for (const p of item.effect.params) {
				newParams[p.name] =
					p.type === 'gradient'
						? cloneGradient(p.default as GradientStop[])
						: (p.default as number | boolean | string);
			}
			return { ...item, params: newParams };
		})
	);
}

export function replaceStack(
	list: AppliedEffect[],
	activeIndex: number,
	options?: { skipHistory?: boolean; groups?: LayerGroup[] }
) {
	if (!options?.skipHistory) pushHistory();
	appliedEffects.set(list);
	layerGroups.set(options?.groups ?? []);
	activeLayerIndex.set(activeIndex);
}
