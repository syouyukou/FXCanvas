<script lang="ts">
	import { EFFECTS, CATEGORIES } from '../effects/index';
	import { addEffect, searchQuery, filteredEffects, favorites, leftTab, thumbnails } from '../stores/editor';
	import type { Effect } from '../engine/renderer';

	const categoryIcons: Record<string, string> = {
		Blur: '◎', Color: '◑', Distort: '◈', Effects: '✦', Generate: '❋', Film: '▤'
	};

	function toggleFav(id: string) {
		favorites.update((f) => {
			const next = new Set(f);
			if (next.has(id)) next.delete(id); else next.add(id);
			return next;
		});
	}

	let displayed = $derived(
		$leftTab === 'favorites'
			? $filteredEffects.filter((e) => $favorites.has(e.id))
			: $filteredEffects
	);

	let grouped = $derived(
		CATEGORIES.reduce((acc, cat) => {
			const items = displayed.filter((e) => e.category === cat);
			if (items.length) acc[cat] = items;
			return acc;
		}, {} as Record<string, Effect[]>)
	);
</script>

<aside class="effect-panel">
	<!-- Tabs -->
	<div class="tabs">
		<button class:active={$leftTab === 'explore'} onclick={() => leftTab.set('explore')}>EXPLORE</button>
		<button class:active={$leftTab === 'favorites'} onclick={() => leftTab.set('favorites')}>FAVORITES</button>
	</div>

	<!-- Search -->
	<div class="search-wrap">
		<svg class="search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
		</svg>
		<input type="text" placeholder="Search…" bind:value={$searchQuery} class="search" />
		{#if $searchQuery}
			<button class="clear-search" onclick={() => searchQuery.set('')}>✕</button>
		{/if}
	</div>

	<!-- Effect list -->
	<div class="effect-list">
		{#each Object.entries(grouped) as [cat, effects]}
			<div class="category-group">
				<h3 class="category-label">
					<span>{categoryIcons[cat] ?? '·'}</span> {cat.toUpperCase()}
				</h3>
				<div class="grid">
					{#each effects as effect}
						<div
							class="effect-card"
							onclick={() => addEffect(effect)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && addEffect(effect)}
							title={effect.name}
						>
							<!-- Thumbnail -->
							<div class="thumb-wrap">
								{#if $thumbnails.has(effect.id)}
									<img
										class="thumb-img"
										src={$thumbnails.get(effect.id)}
										alt={effect.name}
									/>
								{:else}
									<div class="thumb-placeholder">
										<span class="thumb-letter">{effect.name[0]}</span>
									</div>
								{/if}

								<!-- Favorite star -->
								<button
									class="fav-star"
									class:active={$favorites.has(effect.id)}
									onclick={(e) => { e.stopPropagation(); toggleFav(effect.id); }}
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
	</div>
</aside>

<style>
	.effect-panel {
		width: 220px;
		min-width: 180px;
		background: #161616;
		border-right: 1px solid #222;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	/* ── Tabs ── */
	.tabs {
		display: flex;
		border-bottom: 1px solid #222;
		flex-shrink: 0;
	}
	.tabs button {
		flex: 1;
		padding: 9px 6px;
		background: none;
		border: none;
		color: #3a3a3a;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		font-family: inherit;
		transition: color 0.15s;
	}
	.tabs button.active { color: #bbb; border-bottom-color: #bbb; }

	/* ── Search ── */
	.search-wrap {
		position: relative;
		padding: 8px 10px;
		border-bottom: 1px solid #222;
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.search-icon { color: #333; flex-shrink: 0; }
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
	.search::placeholder { color: #333; }
	.clear-search {
		background: none; border: none; color: #333; cursor: pointer;
		font-size: 10px; padding: 0; flex-shrink: 0;
	}
	.clear-search:hover { color: #777; }

	/* ── Effect list ── */
	.effect-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px 8px 16px;
	}

	.category-group { margin-bottom: 16px; }

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

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}

	/* ── Effect card ── */
	.effect-card {
		display: flex;
		flex-direction: column;
		gap: 5px;
		cursor: pointer;
		border-radius: 6px;
		padding: 0;
		background: none;
		border: 1px solid transparent;
		transition: border-color 0.15s;
		overflow: hidden;
	}
	.effect-card:hover { border-color: #333; }

	.thumb-wrap {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		background: #1c1c1c;
		border-radius: 5px;
		overflow: hidden;
	}

	.thumb-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.thumb-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #1c1c24, #241c1c);
	}

	.thumb-letter {
		font-size: 26px;
		color: #2e2e2e;
		font-weight: 800;
	}

	.fav-star {
		position: absolute;
		top: 4px;
		right: 4px;
		background: rgba(0,0,0,0.5);
		border: none;
		color: #444;
		font-size: 11px;
		cursor: pointer;
		padding: 2px 3px;
		border-radius: 3px;
		line-height: 1;
		opacity: 0;
		transition: opacity 0.15s, color 0.15s;
	}
	.effect-card:hover .fav-star { opacity: 1; }
	.fav-star.active { opacity: 1; color: #f5c518; }

	.card-name {
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: #555;
		padding: 0 3px 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.effect-card:hover .card-name { color: #888; }

	.empty {
		color: #333;
		font-size: 10px;
		letter-spacing: 0.08em;
		text-align: center;
		padding: 24px;
	}

	.effect-list::-webkit-scrollbar { width: 3px; }
	.effect-list::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
</style>
