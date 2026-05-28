<script lang="ts">
	import { EFFECTS, CATEGORIES } from '../effects/index';
	import { addEffect, searchQuery, filteredEffects, favorites, leftTab } from '../stores/editor';
	import type { Effect } from '../engine/renderer';

	const categoryIcons: Record<string, string> = {
		Blur: '◎',
		Color: '◑',
		Distort: '◈',
		Effects: '✦',
		Generate: '❋',
		Film: '▤'
	};

	function toggle(id: string) {
		favorites.update((f) => {
			const next = new Set(f);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	let displayed = $derived(
		$leftTab === 'favorites'
			? $filteredEffects.filter((e) => $favorites.has(e.id))
			: $filteredEffects
	);

	let grouped = $derived(
		CATEGORIES.reduce(
			(acc, cat) => {
				const items = displayed.filter((e) => e.category === cat);
				if (items.length) acc[cat] = items;
				return acc;
			},
			{} as Record<string, Effect[]>
		)
	);
</script>

<aside class="effect-panel">
	<!-- Tabs -->
	<div class="tabs">
		<button class:active={$leftTab === 'explore'} onclick={() => leftTab.set('explore')}>
			EXPLORE
		</button>
		<button class:active={$leftTab === 'favorites'} onclick={() => leftTab.set('favorites')}>
			FAVORITES
		</button>
	</div>

	<!-- Search -->
	<div class="search-wrap">
		<input
			type="text"
			placeholder="Search effects…"
			bind:value={$searchQuery}
			class="search"
		/>
		{#if $searchQuery}
			<button class="clear-search" onclick={() => searchQuery.set('')}>✕</button>
		{/if}
	</div>

	<!-- Effect list -->
	<div class="effect-list">
		{#each Object.entries(grouped) as [cat, effects]}
			<div class="category-group">
				<h3 class="category-label">
					<span class="cat-icon">{categoryIcons[cat] ?? '·'}</span>
					{cat}
				</h3>
				<div class="grid">
					{#each effects as effect}
						<div
							class="effect-item"
							onclick={() => addEffect(effect)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && addEffect(effect)}
							title={effect.name}
						>
							<div class="effect-thumb">
								<span class="effect-initial">{effect.name[0]}</span>
							</div>
							<div class="effect-name">{effect.name}</div>
							<button
								class="fav-btn"
								class:active={$favorites.has(effect.id)}
								onclick={(e) => { e.stopPropagation(); toggle(effect.id); }}
								title="Toggle favorite"
							>
								{$favorites.has(effect.id) ? '★' : '☆'}
							</button>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<p class="empty">No effects found</p>
		{/each}
	</div>
</aside>

<style>
	.effect-panel {
		width: 240px;
		min-width: 200px;
		background: #1a1a1a;
		border-right: 1px solid #2a2a2a;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.tabs {
		display: flex;
		border-bottom: 1px solid #2a2a2a;
	}

	.tabs button {
		flex: 1;
		padding: 10px 8px;
		background: none;
		border: none;
		color: #555;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: color 0.15s;
	}

	.tabs button.active {
		color: #fff;
		border-bottom-color: #fff;
	}

	.search-wrap {
		position: relative;
		padding: 10px;
		border-bottom: 1px solid #2a2a2a;
	}

	.search {
		width: 100%;
		background: #252525;
		border: 1px solid #333;
		border-radius: 6px;
		padding: 7px 32px 7px 10px;
		color: #ccc;
		font-size: 13px;
		outline: none;
		box-sizing: border-box;
	}

	.search:focus {
		border-color: #555;
	}

	.clear-search {
		position: absolute;
		right: 18px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #666;
		cursor: pointer;
		font-size: 12px;
		padding: 2px;
	}

	.effect-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}

	.category-group {
		margin-bottom: 14px;
	}

	.category-label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #555;
		text-transform: uppercase;
		margin: 0 0 6px 4px;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.cat-icon {
		color: #666;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}

	.effect-item {
		position: relative;
		background: #252525;
		border: 1px solid #2e2e2e;
		border-radius: 8px;
		padding: 8px;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s, border-color 0.15s;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.effect-item:hover {
		background: #2d2d2d;
		border-color: #444;
	}

	.effect-thumb {
		width: 100%;
		aspect-ratio: 1.6;
		background: linear-gradient(135deg, #2a2a3a, #3a3a2a);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.effect-initial {
		font-size: 22px;
		color: #555;
		font-weight: 700;
	}

	.effect-name {
		font-size: 11px;
		color: #aaa;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.fav-btn {
		position: absolute;
		top: 5px;
		right: 5px;
		background: none;
		border: none;
		color: #444;
		font-size: 12px;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.fav-btn.active {
		color: #f5c518;
	}

	.empty {
		color: #555;
		font-size: 13px;
		text-align: center;
		padding: 24px;
	}

	.effect-list::-webkit-scrollbar {
		width: 4px;
	}
	.effect-list::-webkit-scrollbar-track {
		background: transparent;
	}
	.effect-list::-webkit-scrollbar-thumb {
		background: #333;
		border-radius: 2px;
	}
</style>
