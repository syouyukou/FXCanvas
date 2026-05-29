<script lang="ts">
	import { EFFECTS, CATEGORIES } from '../effects/index';
	import { BUILTIN_PRESETS, BUILTIN_PRESET_GROUPS } from '../presets/builtin';
	import { loadBuiltinPreset } from '../stores/presets';
	import {
		addEffect,
		searchQuery,
		filteredEffects,
		favorites,
		leftTab,
		thumbnails,
		sourceThumbnail,
		sourceImage
	} from '../stores/editor';
	import {
		effectPanelCollapsed,
		effectPanelWidth,
		effectPanelSavedWidth,
		effectPanelGridColumns,
		effectPanelIsCompact
	} from '../stores/view';
	import type { Effect } from '../engine/renderer';

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

	const POPULAR_IDS = ['dither', 'glitch_digital', 'glitch_vhs', 'levels', 'noise', 'exposure', 'crt', 'bloom'] as const;

	const categoryIcons: Record<string, string> = {
		Blur: '◎',
		Color: '◑',
		Film: '▤',
		Distort: '◈',
		Effects: '✦',
		Generate: '❋'
	};

	let popularEffects = $derived(
		POPULAR_IDS.map((id) => EFFECTS.find((e) => e.id === id)).filter(Boolean) as Effect[]
	);

	let showPopular = $derived($leftTab === 'effects' && !$searchQuery.trim());

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
			: $leftTab === 'effects'
				? $filteredEffects
				: []
	);

	let grouped = $derived(
		CATEGORIES.reduce(
			(acc, cat) => {
				const items = displayedEffects.filter((e) => e.category === cat);
				if (items.length) acc[cat] = items;
				return acc;
			},
			{} as Record<string, Effect[]>
		)
	);

	let filteredBuiltin = $derived(
		$leftTab === 'presets'
			? BUILTIN_PRESETS.filter((p) => {
					if (!$searchQuery.trim()) return true;
					const q = $searchQuery.toLowerCase();
					return (
						p.name.toLowerCase().includes(q) ||
						p.group.toLowerCase().includes(q) ||
						p.description.toLowerCase().includes(q)
					);
				})
			: []
	);

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
		title={$effectPanelCollapsed ? 'Expand effects panel' : 'Collapse effects panel'}
		aria-label={$effectPanelCollapsed ? 'Expand effects panel' : 'Collapse effects panel'}
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
		<button class:active={$leftTab === 'effects'} onclick={() => leftTab.set('effects')}>EFFECTS</button>
		<button class:active={$leftTab === 'favorites'} onclick={() => leftTab.set('favorites')}>
			FAVORITES
		</button>
		<button class:active={$leftTab === 'presets'} onclick={() => leftTab.set('presets')}>PRESETS</button>
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
			placeholder={$leftTab === 'presets' ? 'Search presets…' : 'Search…'}
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
					<h3 class="category-label category-label--major">{group}</h3>
					<div class="grid grid--presets">
						{#each presets as preset (preset.id)}
							<div
								class="effect-card preset-card"
								{...railPointer(preset.name)}
								onclick={() => loadBuiltinPreset(preset.id)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && loadBuiltinPreset(preset.id)}
								title="{preset.description}\n\nLayers: {preset.layerLabels.join(' → ')}"
							>
								<div class="thumb-wrap preset-thumb">
									<div class="preset-thumb-inner">
										<span class="preset-abbr">VP</span>
									</div>
								</div>
								<div class="card-name">{preset.name}</div>
								<div class="preset-meta">{preset.snapshot.layers.length} layers</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<p class="empty">No presets found</p>
			{/each}
		{:else}
			{#if showPopular}
				<div class="category-group">
					<h3 class="category-label"><span>★</span> MOST POPULAR</h3>
					<div class="grid">
						{#each popularEffects as effect (effect.id)}
							<div
								class="effect-card"
								{...railPointer(effect.name)}
								onclick={(e) => handleEffectClick(effect, e)}
								role="button"
								tabindex="0"
								onkeydown={(e) =>
									e.key === 'Enter' && handleEffectClick(effect, e as unknown as MouseEvent)}
								title="{effect.name} — Click: random · Shift+Click: defaults"
							>
								<div class="thumb-wrap">
									{#if $thumbnails.has(effect.id) && $sourceThumbnail}
										<img
											class="thumb-img thumb-after"
											src={$thumbnails.get(effect.id)}
											alt=""
											aria-hidden="true"
										/>
										<img class="thumb-img thumb-before" src={$sourceThumbnail} alt={effect.name} />
									{:else if $thumbnails.has(effect.id)}
										<img class="thumb-img" src={$thumbnails.get(effect.id)} alt={effect.name} />
									{:else}
										<div class="thumb-placeholder"></div>
									{/if}
									<button
										class="fav-star"
										class:active={$favorites.has(effect.id)}
										onclick={(e) => {
											e.stopPropagation();
											toggleFav(effect.id);
										}}
										title="Favorite"
									>
										{$favorites.has(effect.id) ? '★' : '☆'}
									</button>
								</div>
								<div class="card-name">{effect.name}</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#each Object.entries(grouped) as [cat, effects]}
				<div class="category-group">
					<h3 class="category-label category-label--major">
						{cat.toUpperCase()}
					</h3>
					<div class="grid">
						{#each effects as effect (effect.id)}
							<div
								class="effect-card"
								{...railPointer(effect.name)}
								onclick={(e) => handleEffectClick(effect, e)}
								role="button"
								tabindex="0"
								onkeydown={(e) =>
									e.key === 'Enter' && handleEffectClick(effect, e as unknown as MouseEvent)}
								title={$sourceImage
									? `${effect.name} — Click: random · Shift+Click: defaults`
									: `${effect.name} — Click to add layer · Load media to preview`}
							>
								<div class="thumb-wrap">
									{#if $thumbnails.has(effect.id) && $sourceThumbnail}
										<img
											class="thumb-img thumb-after"
											src={$thumbnails.get(effect.id)}
											alt=""
											aria-hidden="true"
										/>
										<img
											class="thumb-img thumb-before"
											src={$sourceThumbnail}
											alt={effect.name}
										/>
									{:else if $thumbnails.has(effect.id)}
										<img class="thumb-img" src={$thumbnails.get(effect.id)} alt={effect.name} />
									{:else}
										<div class="thumb-placeholder"></div>
									{/if}
									<button
										class="fav-star"
										class:active={$favorites.has(effect.id)}
										onclick={(e) => {
											e.stopPropagation();
											toggleFav(effect.id);
										}}
										title="Favorite"
									>
										{$favorites.has(effect.id) ? '★' : '☆'}
									</button>
								</div>
								<div class="card-name">{effect.name}</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<p class="empty">No effects found</p>
			{/each}
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
		background: #161616;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		font-family: 'SF Mono', 'Fira Code', monospace;
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

	.collapse-btn:hover {
		color: #aaa;
		background: #1a1a1a;
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
		font-size: 8px;
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
		background: #111;
		border: 1px solid #3a3a3a;
		border-radius: 6px;
		color: #eee;
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.04em;
		white-space: nowrap;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
		font-family: 'SF Mono', 'Fira Code', monospace;
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
		padding: 9px 4px;
		background: none;
		border: none;
		color: #3a3a3a;
		font-size: 8px;
		font-weight: 700;
		letter-spacing: 0.08em;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		font-family: inherit;
		transition: color 0.15s;
	}
	.tabs button.active {
		color: #eee;
		border-bottom-color: #eee;
		background: #1a1a1a;
	}

	.search-wrap {
		position: relative;
		padding: 8px 10px;
		border-bottom: 1px solid #222;
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
		color: #aaa;
		font-size: 11px;
		font-family: inherit;
		outline: none;
		letter-spacing: 0.05em;
	}
	.search::placeholder {
		color: #333;
	}
	.clear-search {
		background: none;
		border: none;
		color: #333;
		cursor: pointer;
		font-size: 10px;
		padding: 0;
		flex-shrink: 0;
	}
	.clear-search:hover {
		color: #777;
	}

	.effect-list {
		flex: 1;
		overflow-y: auto;
		padding: 10px 10px 16px;
	}

	.category-group {
		margin-bottom: 20px;
	}

	.category-label {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #333;
		margin: 0 0 8px 2px;
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.category-label--major {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.14em;
		color: #e8e8e8;
		margin: 0 0 10px 4px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-cols, 2), 1fr);
		gap: 8px;
		transition: gap 0.15s ease;
	}

	.effect-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		cursor: pointer;
		border-radius: 6px;
		padding: 0;
		background: none;
		border: 1px solid transparent;
		transition: border-color 0.15s;
		overflow: hidden;
	}
	.effect-card:hover {
		border-color: #333;
	}

	.preset-card:hover {
		border-color: #555;
	}

	.thumb-wrap {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		background: #141414;
		border-radius: 8px;
		overflow: hidden;
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
		display: flex;
		align-items: center;
		justify-content: center;
		background: #141414;
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
		font-size: 9px;
		font-weight: 500;
		letter-spacing: 0.02em;
		color: #666;
		padding: 0 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.2;
	}
	.effect-card:hover .card-name {
		color: #999;
	}

	.preset-meta {
		font-size: 8px;
		color: #444;
		padding: 0 2px 2px;
		letter-spacing: 0.04em;
	}

	.empty {
		color: #333;
		font-size: 10px;
		letter-spacing: 0.08em;
		text-align: center;
		padding: 24px;
	}

	.effect-list::-webkit-scrollbar {
		width: 3px;
	}
	.effect-list::-webkit-scrollbar-thumb {
		background: #2a2a2a;
		border-radius: 2px;
	}
</style>
