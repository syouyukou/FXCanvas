<script lang="ts">
	import { BUILTIN_PRESETS, BUILTIN_PRESET_GROUPS } from '../presets/builtin';
	import { isPresetVisibleInPanel } from '../presets/visiblePresets';
	import { SHOW_FAVORITES_TAB, isAdjustPanelEffect, isAnimatedPanelEffect, isCreativePanelEffect } from '../effects/visibleEffects';
	import { loadBuiltinPreset } from '../stores/presets';
	import {
		addEffect,
		searchQuery,
		filteredEffects,
		favorites,
		leftTab,
		thumbnails,
		sourceThumbnails
	} from '../stores/editor';
	import {
		effectPanelCollapsed,
		effectPanelWidth,
		effectPanelSavedWidth,
		effectPanelGridColumns,
		effectPanelIsCompact
	} from '../stores/view';
	import type { Effect } from '../engine/renderer';
	import { i18n } from '$lib/i18n';
	import AdjustEffectIcon from './AdjustEffectIcon.svelte';

	const CREATIVE_CATEGORIES = ['Color', 'Film', 'Distort', 'Effects'] as const;

	let gridColumns = $derived(effectPanelGridColumns($effectPanelWidth, $effectPanelCollapsed));
	let compactMode = $derived(effectPanelIsCompact($effectPanelWidth, $effectPanelCollapsed));
	let railMode = $derived($effectPanelCollapsed || $effectPanelWidth <= 150);

	let railTooltip = $state<{ label: string; top: number; left: number } | null>(null);

	function showRailTooltip(label: string, el: HTMLElement) {
		if (!$effectPanelCollapsed && $effectPanelWidth > 150) return;
		const rect = el.getBoundingClientRect();
		railTooltip = {
			label,
			top: rect.top + rect.height / 2,
			left: rect.right + 8
		};
	}

	function hideRailTooltip() {
		railTooltip = null;
	}

	function railPointer(label: string) {
		return {
			onmouseenter: (e: MouseEvent) => showRailTooltip(label, e.currentTarget as HTMLElement),
			onmouseleave: hideRailTooltip,
			onfocus: (e: FocusEvent) => showRailTooltip(label, e.currentTarget as HTMLElement),
			onblur: hideRailTooltip
		};
	}

	function toggleCollapse() {
		hideRailTooltip();
		if ($effectPanelCollapsed) {
			effectPanelWidth.set($effectPanelSavedWidth);
			effectPanelCollapsed.set(false);
		} else {
			effectPanelSavedWidth.set($effectPanelWidth);
			effectPanelCollapsed.set(true);
		}
	}

	const categoryIcons: Record<string, string> = {
		Adjust: '◧',
		Blur: '◎',
		Color: '◑',
		Film: '▤',
		Distort: '◈',
		Effects: '✦',
		Generate: '❋'
	};

	function handleEffectClick(effect: Effect, e: MouseEvent) {
		addEffect(effect, { randomize: !e.shiftKey });
	}

	function toggleFav(id: string) {
		favorites.update((f) => {
			const next = new Set(f);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	let displayedEffects = $derived(
		$leftTab === 'favorites'
			? $filteredEffects.filter((e) => $favorites.has(e.id))
			: $leftTab === 'adjust'
				? $filteredEffects.filter((e) => isAdjustPanelEffect(e.id))
				: $leftTab === 'effects'
					? $filteredEffects.filter((e) => isCreativePanelEffect(e.id))
					: $leftTab === 'animated'
						? $filteredEffects.filter((e) => isAnimatedPanelEffect(e.id))
						: []
	);

	let adjustEffects = $derived(
		$leftTab === 'adjust' || $leftTab === 'favorites'
			? displayedEffects.filter((e) => isAdjustPanelEffect(e.id))
			: []
	);

	let animatedEffects = $derived(
		displayedEffects.filter((e) => isAnimatedPanelEffect(e.id))
	);

	let staticEffects = $derived(
		displayedEffects.filter(
			(e) => !isAnimatedPanelEffect(e.id) && ($leftTab !== 'effects' || isCreativePanelEffect(e.id))
		)
	);

	let showAdjustInList = $derived(
		$leftTab === 'adjust' || ($leftTab === 'favorites' && adjustEffects.length > 0)
	);

	let showAnimatedInList = $derived($leftTab === 'animated' || $leftTab === 'favorites');

	let showStaticInList = $derived(
		$leftTab === 'effects' || ($leftTab === 'favorites' && staticEffects.length > 0)
	);

	let grouped = $derived(
		CREATIVE_CATEGORIES.reduce(
			(acc, cat) => {
				const items = staticEffects.filter((e) => e.category === cat);
				if (items.length) acc[cat] = items;
				return acc;
			},
			{} as Record<string, Effect[]>
		)
	);

	let panelPresets = $derived(BUILTIN_PRESETS.filter((p) => isPresetVisibleInPanel(p.id)));

	let filteredBuiltin = $derived(
		$leftTab === 'presets'
			? panelPresets.filter((p) => {
					if (!$searchQuery.trim()) return true;
					const q = $searchQuery.toLowerCase();
					return $i18n.presetSearchText(p.id, p.name, p.group, p.description).includes(q);
				})
			: []
	);

	$effect(() => {
		if (!SHOW_FAVORITES_TAB && $leftTab === 'favorites') {
			leftTab.set('effects');
		}
	});

	function displayEffectName(effect: Effect) {
		return $i18n.effectName(effect.id, effect.name);
	}

	function effectTooltip(effect: Effect) {
		const name = displayEffectName(effect);
		return $thumbnails.has(effect.id) && $sourceThumbnails.has(effect.id)
			? $i18n.t('effectsPanel.tooltipWithThumb', { name })
			: $i18n.t('effectsPanel.tooltipNoThumb', { name });
	}

	function searchPlaceholder() {
		if ($leftTab === 'presets') return $i18n.t('effectsPanel.searchPresets');
		if ($leftTab === 'animated') return $i18n.t('effectsPanel.searchAnimated');
		if ($leftTab === 'adjust') return $i18n.t('effectsPanel.searchAdjust');
		return $i18n.t('effectsPanel.searchEffects');
	}

	function adjustTooltip(effect: Effect) {
		return $i18n.t('effectsPanel.tooltipAdjust', {
			name: displayEffectName(effect)
		});
	}

	let groupedPresets = $derived(
		BUILTIN_PRESET_GROUPS.reduce(
			(acc, group) => {
				const items = filteredBuiltin.filter((p) => p.group === group);
				if (items.length) acc[group] = items;
				return acc;
			},
			{} as Record<string, typeof BUILTIN_PRESETS>
		)
	);
</script>

<aside
	class="effect-panel"
	class:collapsed={railMode}
	class:compact={compactMode}
	style:--grid-cols={gridColumns}
>
	<button
		class="collapse-btn"
		onclick={toggleCollapse}
		title={$effectPanelCollapsed ? $i18n.t('effectsPanel.expandPanel') : $i18n.t('effectsPanel.collapsePanel')}
		aria-label={$effectPanelCollapsed ? $i18n.t('effectsPanel.expandPanel') : $i18n.t('effectsPanel.collapsePanel')}
		aria-expanded={!$effectPanelCollapsed}
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<polyline points="14 10 19 5" />
			<line x1="19" y1="5" x2="14" y2="5" />
			<line x1="19" y1="5" x2="19" y2="10" />
			<polyline points="10 14 5 19" />
			<line x1="5" y1="19" x2="5" y2="14" />
			<line x1="5" y1="19" x2="10" y2="19" />
		</svg>
	</button>

	<div class="tabs">
		<button class:active={$leftTab === 'adjust'} onclick={() => leftTab.set('adjust')}>
			{$i18n.t('effectsPanel.tabs.adjust')}
		</button>
		<button class:active={$leftTab === 'effects'} onclick={() => leftTab.set('effects')}>
			{$i18n.t('effectsPanel.tabs.effects')}
		</button>
		<button
			class="tab-animated"
			class:active={$leftTab === 'animated'}
			onclick={() => leftTab.set('animated')}
		>
			{$i18n.t('effectsPanel.tabs.animated')}
		</button>
		{#if SHOW_FAVORITES_TAB}
			<button class:active={$leftTab === 'favorites'} onclick={() => leftTab.set('favorites')}>
				{$i18n.t('effectsPanel.tabs.favorites')}
			</button>
		{/if}
		<button class:active={$leftTab === 'presets'} onclick={() => leftTab.set('presets')}>
			{$i18n.t('effectsPanel.tabs.presets')}
		</button>
	</div>

	<div class="search-wrap">
		<svg
			class="search-icon"
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
		<input
			type="text"
			placeholder={searchPlaceholder()}
			bind:value={$searchQuery}
			class="search"
		/>
		{#if $searchQuery}
			<button class="clear-search" onclick={() => searchQuery.set('')}>✕</button>
		{/if}
	</div>

	<div class="effect-list" onscroll={hideRailTooltip}>
		{#if $leftTab === 'presets'}
			{#each Object.entries(groupedPresets) as [group, presets]}
				<div class="category-group">
					<h3 class="category-label category-label--major">
						{$i18n.builtinPresetGroup(presets[0]?.id ?? '', group)}
					</h3>
					<div class="grid grid--presets">
						{#each presets as preset (preset.id)}
							<div
								class="effect-card preset-card"
								{...railPointer($i18n.builtinPresetName(preset.id, preset.name))}
								onclick={() => loadBuiltinPreset(preset.id)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && loadBuiltinPreset(preset.id)}
								title="{$i18n.builtinPresetDescription(preset.id, preset.description)}\n\n{$i18n.t('effectsPanel.layersPrefix')} {preset.layerLabels.join(' → ')}"
							>
								<div class="thumb-wrap preset-thumb">
									<div class="preset-thumb-inner">
										<span class="preset-abbr">{$i18n.t('effectsPanel.presetAbbr')}</span>
									</div>
								</div>
								<div class="card-name">{$i18n.builtinPresetName(preset.id, preset.name)}</div>
								<div class="preset-meta">
									{$i18n.t('effectsPanel.layersCount', { n: preset.snapshot.layers.length })}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<p class="empty">{$i18n.t('effectsPanel.noPresets')}</p>
			{/each}
		{:else if $leftTab === 'animated'}
			{#if animatedEffects.length > 0}
				<div class="category-group category-group--animated category-group--animated-tab">
					<div class="grid">
						{#each animatedEffects as effect (effect.id)}
							<div
								class="effect-card effect-card--animated"
								{...railPointer(displayEffectName(effect))}
								onclick={(e) => handleEffectClick(effect, e)}
								role="button"
								tabindex="0"
								onkeydown={(e) =>
									e.key === 'Enter' && handleEffectClick(effect, e as unknown as MouseEvent)}
								title={effectTooltip(effect)}
							>
								<div class="thumb-wrap">
									{#if $thumbnails.has(effect.id) && $sourceThumbnails.has(effect.id)}
										<img
											class="thumb-img thumb-after"
											src={$thumbnails.get(effect.id)}
											alt=""
											aria-hidden="true"
										/>
										<img
											class="thumb-img thumb-before"
											src={$sourceThumbnails.get(effect.id)}
											alt=""
											aria-hidden="true"
										/>
									{:else if $thumbnails.has(effect.id)}
										<img
											class="thumb-img"
											src={$thumbnails.get(effect.id)}
											alt=""
											aria-hidden="true"
										/>
									{:else}
										<div class="thumb-placeholder"></div>
									{/if}
									<span class="anim-badge">{$i18n.t('effectsPanel.animBadge')}</span>
									<span class="card-name">{displayEffectName(effect)}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<p class="empty">{$i18n.t('effectsPanel.noAnimated')}</p>
			{/if}
		{:else if $leftTab === 'adjust'}
			<p class="zone-hint">{$i18n.t('effectsPanel.adjustHint')}</p>
			{#if adjustEffects.length > 0}
				<div class="category-group category-group--adjust">
					<div class="grid grid--adjust">
						{#each adjustEffects as effect (effect.id)}
							<button
								type="button"
								class="adjust-tile"
								{...railPointer(displayEffectName(effect))}
								onclick={(e) => handleEffectClick(effect, e)}
								title={adjustTooltip(effect)}
							>
								<span class="adjust-icon-wrap">
									<AdjustEffectIcon effectId={effect.id} />
								</span>
								<span class="adjust-label">{displayEffectName(effect)}</span>
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<p class="empty">{$i18n.t('effectsPanel.noAdjust')}</p>
			{/if}
		{:else}
			{#if showAdjustInList && adjustEffects.length > 0}
				<div class="category-group category-group--adjust">
					<h3 class="category-label category-label--major">
						{$i18n.t('effectsPanel.tabs.adjust')}
					</h3>
					<div class="grid grid--adjust">
						{#each adjustEffects as effect (effect.id)}
							<button
								type="button"
								class="adjust-tile"
								{...railPointer(displayEffectName(effect))}
								onclick={(e) => handleEffectClick(effect, e)}
								title={adjustTooltip(effect)}
							>
								<span class="adjust-icon-wrap">
									<AdjustEffectIcon effectId={effect.id} />
								</span>
								<span class="adjust-label">{displayEffectName(effect)}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
			{#if showAnimatedInList && animatedEffects.length > 0}
				<div class="category-group category-group--animated">
					<h3 class="category-label category-label--major category-label--animated">
						<span class="animated-section-mark" aria-hidden="true"></span>
						{$i18n.t('effectsPanel.animatedSection')}
					</h3>
					<div class="grid grid--animated">
						{#each animatedEffects as effect (effect.id)}
							<div
								class="effect-card effect-card--animated"
								{...railPointer(displayEffectName(effect))}
								onclick={(e) => handleEffectClick(effect, e)}
								role="button"
								tabindex="0"
								onkeydown={(e) =>
									e.key === 'Enter' && handleEffectClick(effect, e as unknown as MouseEvent)}
								title={effectTooltip(effect)}
							>
								<div class="thumb-wrap">
									{#if $thumbnails.has(effect.id) && $sourceThumbnails.has(effect.id)}
										<img
											class="thumb-img thumb-after"
											src={$thumbnails.get(effect.id)}
											alt=""
											aria-hidden="true"
										/>
										<img
											class="thumb-img thumb-before"
											src={$sourceThumbnails.get(effect.id)}
											alt=""
											aria-hidden="true"
										/>
									{:else if $thumbnails.has(effect.id)}
										<img
											class="thumb-img"
											src={$thumbnails.get(effect.id)}
											alt=""
											aria-hidden="true"
										/>
									{:else}
										<div class="thumb-placeholder"></div>
									{/if}
									<span class="anim-badge">{$i18n.t('effectsPanel.animBadge')}</span>
									<span class="card-name">{displayEffectName(effect)}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			{#if showStaticInList}
				{#if $leftTab === 'effects'}
					<p class="zone-hint">{$i18n.t('effectsPanel.effectsHint')}</p>
				{/if}
				{#if Object.keys(grouped).length > 0}
				{#each Object.entries(grouped) as [cat, effects]}
					<div class="category-group">
						<h3 class="category-label category-label--major">
							{$i18n.categoryName(cat).toUpperCase()}
						</h3>
						<div class="grid">
							{#each effects as effect (effect.id)}
								<div
									class="effect-card"
									{...railPointer(displayEffectName(effect))}
									onclick={(e) => handleEffectClick(effect, e)}
									role="button"
									tabindex="0"
									onkeydown={(e) =>
										e.key === 'Enter' && handleEffectClick(effect, e as unknown as MouseEvent)}
									title={effectTooltip(effect)}
								>
									<div class="thumb-wrap">
										{#if $thumbnails.has(effect.id) && $sourceThumbnails.has(effect.id)}
											<img
												class="thumb-img thumb-after"
												src={$thumbnails.get(effect.id)}
												alt=""
												aria-hidden="true"
											/>
											<img
												class="thumb-img thumb-before"
												src={$sourceThumbnails.get(effect.id)}
												alt=""
												aria-hidden="true"
											/>
										{:else if $thumbnails.has(effect.id)}
											<img
												class="thumb-img"
												src={$thumbnails.get(effect.id)}
												alt=""
												aria-hidden="true"
											/>
										{:else}
											<div class="thumb-placeholder"></div>
										{/if}
										<span class="card-name">{displayEffectName(effect)}</span>
										<button
											class="fav-star"
											class:active={$favorites.has(effect.id)}
											onclick={(e) => {
												e.stopPropagation();
												toggleFav(effect.id);
											}}
											title={$i18n.t('effectsPanel.favorite')}
										>
											{$favorites.has(effect.id) ? '★' : '☆'}
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
				{:else if $leftTab === 'effects'}
					<p class="empty">{$i18n.t('effectsPanel.noEffects')}</p>
				{/if}
			{/if}
			{#if $leftTab === 'favorites' && adjustEffects.length === 0 && animatedEffects.length === 0 && Object.keys(grouped).length === 0}
				<p class="empty">{$i18n.t('effectsPanel.noEffects')}</p>
			{/if}
		{/if}
	</div>
</aside>

{#if railTooltip && ($effectPanelCollapsed || $effectPanelWidth <= 150)}
	<div
		class="rail-tooltip"
		style="top: {railTooltip.top}px; left: {railTooltip.left}px"
		role="tooltip"
	>
		{railTooltip.label}
	</div>
{/if}

<style>
	.effect-panel {
		width: 100%;
		height: 100%;
		background: var(--bg-surface);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		font-family: var(--font-mono);
	}

	.collapse-btn {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 32px;
		background: none;
		border: none;
		border-bottom: 1px solid #222;
		color: #555;
		cursor: pointer;
		transition:
			color 0.15s,
			background 0.15s;
	}

	.collapse-btn:hover,
	.collapse-btn:focus-visible {
		color: var(--accent);
		background: var(--bg-raised);
	}

	.collapsed .collapse-btn svg {
		transform: rotate(180deg);
	}

	.compact .tabs,
	.compact .search-wrap,
	.collapsed .tabs,
	.collapsed .search-wrap,
	.collapsed .category-label,
	.collapsed .card-name,
	.collapsed .fav-star,
	.collapsed .preset-meta {
		display: none;
	}

	.compact .card-name {
		font-size: var(--text-panel-label);
	}

	.compact .effect-list {
		padding: 8px 6px 12px;
	}

	.compact .grid {
		gap: 6px;
	}

	.collapsed .effect-list {
		padding: 6px 4px 12px;
	}

	.collapsed .grid {
		grid-template-columns: 1fr;
		gap: 4px;
	}

	.collapsed .effect-card {
		border-radius: 8px;
		overflow: visible;
	}

	.rail-tooltip {
		position: fixed;
		transform: translateY(-50%);
		z-index: 1000;
		pointer-events: none;
		padding: 6px 10px;
		background: var(--bg-inset);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-size: var(--text-panel-body);
		font-weight: 500;
		letter-spacing: 0.04em;
		white-space: nowrap;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
		font-family: var(--font-mono);
	}

	.collapsed .thumb-wrap {
		border-radius: 6px;
	}

	.tabs {
		display: flex;
		border-bottom: 1px solid #222;
		flex-shrink: 0;
	}
	.tabs button {
		flex: 1;
		padding: 7px 4px;
		background: none;
		border: none;
		color: var(--text-faint);
		font-size: var(--text-panel-label);
		font-weight: 700;
		letter-spacing: 0.08em;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		font-family: inherit;
		transition: color var(--transition-fast);
	}
	.tabs button.active {
		color: var(--text-primary);
		border-bottom-color: var(--text-primary);
		background: var(--bg-raised);
	}
	.tabs button.tab-animated.active {
		color: #5dade2;
		border-bottom-color: #5dade2;
		background: rgba(93, 173, 226, 0.06);
	}
	.tabs button:focus-visible {
		color: var(--text-secondary);
	}

	.search-wrap {
		position: relative;
		padding: 6px 10px;
		border-bottom: 1px solid var(--border-panel);
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.search-icon {
		color: #333;
		flex-shrink: 0;
	}
	.search {
		flex: 1;
		background: none;
		border: none;
		color: var(--accent);
		font-size: var(--text-panel-body);
		font-family: inherit;
		letter-spacing: 0.05em;
	}
	.search:focus-visible {
		outline: 2px solid var(--border-strong);
		outline-offset: 0;
		border-radius: 2px;
	}
	.search::placeholder {
		color: #333;
	}
	.clear-search {
		background: none;
		border: none;
		color: var(--text-faint);
		cursor: pointer;
		font-size: var(--text-panel-label);
		padding: 0;
		flex-shrink: 0;
	}
	.clear-search:hover,
	.clear-search:focus-visible {
		color: var(--text-muted);
	}

	.effect-list {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-2) var(--space-2) var(--space-3);
	}

	.category-group {
		margin-bottom: 14px;
	}

	.category-label {
		font-size: var(--text-panel-label);
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--text-faint);
		margin: 0 0 var(--space-1) 2px;
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.category-label--major {
		font-size: var(--text-panel-body);
		font-weight: 800;
		letter-spacing: 0.12em;
		color: var(--text-primary);
		margin: 0 0 var(--space-2) 4px;
	}

	.category-group--animated {
		margin-bottom: 16px;
		padding: 10px 8px 12px;
		border-radius: var(--radius-md);
		background: linear-gradient(180deg, rgba(93, 173, 226, 0.06) 0%, rgba(93, 173, 226, 0.02) 100%);
		border: 1px solid rgba(93, 173, 226, 0.14);
	}

	.category-group--animated-tab {
		margin-bottom: 0;
		padding: 10px 8px 12px;
	}

	.category-label--animated {
		color: #5dade2;
		gap: 8px;
	}

	.animated-section-mark {
		width: 3px;
		height: 14px;
		border-radius: 2px;
		background: linear-gradient(180deg, #85c1e9 0%, #2e86c1 100%);
		flex-shrink: 0;
	}

	.grid--animated {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.effect-card--animated {
		flex: 0 0 auto;
		width: 76px;
	}

	.effect-card--animated .thumb-wrap {
		aspect-ratio: 3 / 4;
		border-color: rgba(93, 173, 226, 0.22);
		background: linear-gradient(180deg, #151922 0%, #0d1016 100%);
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
	}

	.effect-card--animated:hover .thumb-wrap,
	.effect-card--animated:focus-visible .thumb-wrap {
		border-color: #5dade2;
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.05),
			0 0 0 1px rgba(93, 173, 226, 0.25);
	}

	.effect-card--animated .card-name {
		font-size: var(--text-panel-label);
		padding: 20px 6px 5px;
		text-align: center;
	}

	.anim-badge {
		position: absolute;
		top: 5px;
		left: 5px;
		right: auto;
		font-size: 8px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #5dade2;
		background: rgba(0, 0, 0, 0.72);
		border: 1px solid #2e86c1;
		border-radius: 3px;
		padding: 1px 3px;
		pointer-events: none;
		font-family: var(--font-mono);
	}

	.collapsed .grid--animated {
		flex-direction: column;
		align-items: center;
	}

	.collapsed .effect-card--animated {
		width: 100%;
		max-width: 56px;
	}

	.compact .effect-card--animated {
		width: 68px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-cols, 2), 1fr);
		gap: 6px;
		transition: gap var(--transition-fast);
	}

	.grid--adjust {
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-1);
	}

	.compact .grid--adjust {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.collapsed .grid--adjust {
		grid-template-columns: 1fr;
		gap: 4px;
	}

	.category-group--adjust {
		margin-bottom: 16px;
		padding-bottom: 4px;
		border-bottom: 1px solid var(--border-panel);
	}

	.zone-hint {
		margin: 0 2px 10px;
		font-size: var(--text-panel-label);
		color: var(--text-faint);
		line-height: 1.45;
		letter-spacing: 0.02em;
	}

	.collapsed .zone-hint {
		display: none;
	}

	.adjust-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 6px 2px 8px;
		background: none;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--text-muted);
		font-family: inherit;
		transition:
			border-color var(--transition-fast),
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.adjust-tile:hover,
	.adjust-tile:focus-visible {
		border-color: var(--border-default);
		background: var(--bg-raised);
		color: var(--text-secondary);
	}

	.adjust-icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		background: var(--bg-inset);
		border: 1px solid var(--border-panel);
		color: var(--text-secondary);
		transition:
			border-color var(--transition-fast),
			color var(--transition-fast);
	}

	.adjust-tile:hover .adjust-icon-wrap,
	.adjust-tile:focus-visible .adjust-icon-wrap {
		border-color: var(--border-default);
		color: var(--text-primary);
	}

	.adjust-label {
		font-size: var(--text-panel-label);
		font-weight: 500;
		letter-spacing: 0.02em;
		line-height: 1.2;
		text-align: center;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		word-break: break-word;
	}

	.collapsed .adjust-label {
		display: none;
	}

	.collapsed .adjust-tile {
		padding: 4px;
	}

	.collapsed .adjust-icon-wrap {
		width: 32px;
		height: 32px;
	}

	.compact .adjust-label {
		font-size: var(--text-panel-label);
	}

	.effect-card {
		display: flex;
		flex-direction: column;
		cursor: pointer;
		border-radius: var(--radius-md);
		padding: 0;
		background: none;
		border: none;
		transition: border-color var(--transition-fast);
		overflow: hidden;
	}

	.thumb-wrap {
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 3;
		background: var(--bg-thumb);
		border-radius: var(--radius-md);
		overflow: hidden;
		border: 1px solid transparent;
		transition: border-color var(--transition-fast);
	}

	.effect-card:hover .thumb-wrap,
	.effect-card:focus-visible .thumb-wrap {
		border-color: var(--border-default);
	}

	.thumb-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.thumb-after,
	.thumb-before {
		position: absolute;
		inset: 0;
		transition: opacity 0.18s ease;
		pointer-events: none;
	}

	.thumb-after {
		opacity: 1;
		z-index: 1;
	}

	.thumb-before {
		opacity: 0;
		z-index: 2;
	}

	.thumb-wrap:hover .thumb-after {
		opacity: 0;
	}

	.thumb-wrap:hover .thumb-before {
		opacity: 1;
	}

	.thumb-placeholder {
		width: 100%;
		height: 100%;
		background: var(--bg-thumb);
		animation: pulse 1.2s ease-in-out infinite;
	}

	.preset-thumb {
		background: linear-gradient(145deg, #2a2218 0%, #1a1410 50%, #0f0f0f 100%);
	}

	.preset-thumb-inner {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preset-abbr {
		font-size: 14px;
		font-weight: 800;
		letter-spacing: 0.1em;
		color: #c4a882;
		opacity: 0.7;
	}

	.preset-card:hover .thumb-wrap,
	.preset-card:focus-visible .thumb-wrap {
		border-color: var(--border-strong);
	}

	.preset-card .card-name {
		position: static;
		background: none;
		padding: 4px 2px 0;
		color: var(--text-muted);
	}

	.preset-card:hover .card-name,
	.preset-card:focus-visible .card-name {
		color: var(--text-secondary);
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 0.85;
		}
	}

	.fav-star {
		position: absolute;
		top: 4px;
		right: 4px;
		z-index: 4;
		background: rgba(0, 0, 0, 0.5);
		border: none;
		color: #444;
		font-size: 11px;
		cursor: pointer;
		padding: 2px 3px;
		border-radius: 3px;
		line-height: 1;
		opacity: 0;
		transition:
			opacity 0.15s,
			color 0.15s;
	}
	.effect-card:hover .fav-star {
		opacity: 1;
	}
	.fav-star.active {
		opacity: 1;
		color: #f5c518;
	}

	.card-name {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 3;
		padding: 24px 8px 6px;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.35) 55%, transparent 100%);
		font-size: var(--text-panel-body);
		font-weight: 500;
		letter-spacing: 0.02em;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.25;
		pointer-events: none;
	}

	.effect-card:hover .card-name,
	.effect-card:focus-visible .card-name {
		color: var(--text-primary);
	}

	.preset-meta {
		font-size: var(--text-panel-label);
		color: var(--text-faint);
		padding: 0 2px 2px;
		letter-spacing: 0.04em;
	}

	.empty {
		color: var(--text-faint);
		font-size: var(--text-panel-label);
		letter-spacing: 0.08em;
		text-align: center;
		padding: var(--space-5);
	}

	.effect-list::-webkit-scrollbar {
		width: 3px;
	}
	.effect-list::-webkit-scrollbar-thumb {
		background: #2a2a2a;
		border-radius: 2px;
	}
</style>
