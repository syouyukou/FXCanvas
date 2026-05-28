import { writable, derived } from 'svelte/store';
import { EFFECTS } from '../effects/index';
import type { Effect, AppliedEffect, EffectParam } from '../engine/renderer';
import { cloneGradient, type GradientStop } from '../engine/gradient';

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

export const appliedEffects = writable<AppliedEffect[]>([]);
export const activeLayerIndex = writable<number>(-1);
export const sourceImage = writable<HTMLImageElement | ImageBitmap | null>(null);
export const imageSize = writable<{ width: number; height: number }>({ width: 0, height: 0 });
export const thumbnails = writable<Map<string, string>>(new Map());
/** Square crop of the current preview source (shown on effect thumb hover). */
export const sourceThumbnail = writable<string | null>(null);
export const searchQuery = writable('');
export const leftTab = writable<'explore' | 'favorites'>('explore');
export const favorites = writable<Set<string>>(new Set());

export const filteredEffects = derived([searchQuery], ([$search]) => {
	if (!$search.trim()) return EFFECTS;
	const q = $search.toLowerCase();
	return EFFECTS.filter(
		(e) => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
	);
});

export function addEffect(effectTemplate: Effect, options?: { randomize?: boolean }) {
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

export function randomizeParams(index: number) {
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
