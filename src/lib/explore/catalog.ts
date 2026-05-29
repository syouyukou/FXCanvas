import { EFFECTS, CATEGORY_ORDER } from '../effects/index';
import {
	isEffectVisibleInPanel,
	isAnimatedPanelEffect
} from '../effects/visibleEffects';
import type { Effect } from '../engine/renderer';

export function getVisibleExploreEffects(): Effect[] {
	return EFFECTS.filter((effect) => isEffectVisibleInPanel(effect.id));
}

export function filterExploreEffects(
	effects: Effect[],
	query: string,
	nameFor: (effect: Effect) => string
): Effect[] {
	const q = query.trim().toLowerCase();
	if (!q) return effects;

	return effects.filter((effect) => {
		const name = nameFor(effect).toLowerCase();
		return (
			effect.id.includes(q) ||
			effect.name.toLowerCase().includes(q) ||
			name.includes(q) ||
			effect.category.toLowerCase().includes(q)
		);
	});
}

export function groupExploreEffects(effects: Effect[]): {
	animated: Effect[];
	grouped: Record<string, Effect[]>;
} {
	const animated = effects.filter((e) => isAnimatedPanelEffect(e.id));
	const staticEffects = effects.filter((e) => !isAnimatedPanelEffect(e.id));

	const grouped: Record<string, Effect[]> = {};
	for (const cat of CATEGORY_ORDER) {
		const items = staticEffects.filter((e) => e.category === cat);
		if (items.length > 0) grouped[cat] = items;
	}

	return { animated, grouped };
}
