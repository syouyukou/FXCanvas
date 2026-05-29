<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ExploreEffectCard from '$lib/components/ExploreEffectCard.svelte';
	import LanguageMenu from '$lib/components/LanguageMenu.svelte';
	import {
		filterExploreEffects,
		getVisibleExploreEffects,
		groupExploreEffects
	} from '$lib/explore/catalog';
	import { i18n } from '$lib/i18n';

	type ExploreTab = 'effects' | 'animated';

	let search = $state('');

	let activeTab = $derived(
		page.url.searchParams.get('tab') === 'animated' ? 'animated' : 'effects'
	);

	let visibleEffects = $derived(getVisibleExploreEffects());

	let filtered = $derived(
		filterExploreEffects(visibleEffects, search, (effect) =>
			$i18n.effectName(effect.id, effect.name)
		)
	);

	let { animated, grouped } = $derived(groupExploreEffects(filtered));

	function setTab(tab: ExploreTab) {
		search = '';
		const href = tab === 'animated' ? '/explore?tab=animated' : '/explore';
		void goto(href, { replaceState: true, keepFocus: true, noScroll: true });
	}
</script>

<svelte:head>
	<title>{$i18n.t('explore.pageTitle')} · FXCanvas</title>
	<meta
		name="description"
		content={activeTab === 'animated'
			? $i18n.t('explore.subtitleAnimated')
			: $i18n.t('explore.subtitle')}
	/>
</svelte:head>

<div class="explore">
	<header class="header">
		<a class="logo" href="/">
			<span class="logo-icon" aria-hidden="true">◈</span>
			<span class="logo-text">FX<span class="logo-dot">Canvas</span></span>
		</a>

		<nav class="nav" aria-label={$i18n.t('explore.navLabel')}>
			<span class="nav-link nav-link--active">{$i18n.t('explore.navExplore')}</span>
			<a class="nav-link" href="/">{$i18n.t('explore.navEditor')}</a>
		</nav>

		<div class="header-actions">
			<a class="btn-editor" href="/">{$i18n.t('explore.openEditor')}</a>
			<LanguageMenu />
		</div>
	</header>

	<main class="main">
		<div class="hero">
			<h1>{$i18n.t('explore.title')}</h1>
			<p class="subtitle">
				{activeTab === 'animated'
					? $i18n.t('explore.subtitleAnimated')
					: $i18n.t('explore.subtitle')}
			</p>
		</div>

		<div class="tabs" role="tablist" aria-label={$i18n.t('explore.navLabel')}>
			<button
				role="tab"
				class:active={activeTab === 'effects'}
				aria-selected={activeTab === 'effects'}
				onclick={() => setTab('effects')}
			>
				{$i18n.t('explore.tabs.effects')}
			</button>
			<button
				role="tab"
				class:active={activeTab === 'animated'}
				class:tab-animated={activeTab === 'animated'}
				aria-selected={activeTab === 'animated'}
				onclick={() => setTab('animated')}
			>
				{$i18n.t('explore.tabs.animated')}
			</button>
		</div>

		<div class="search-wrap">
			<svg
				class="search-icon"
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
			</svg>
			<input
				type="search"
				class="search"
				placeholder={activeTab === 'animated'
					? $i18n.t('explore.searchAnimated')
					: $i18n.t('explore.search')}
				bind:value={search}
				autocomplete="off"
				spellcheck="false"
			/>
			{#if search}
				<button type="button" class="clear-search" onclick={() => (search = '')} aria-label="Clear">
					✕
				</button>
			{/if}
		</div>

		<div class="catalog" class:catalog--animated={activeTab === 'animated'}>
			{#if activeTab === 'effects'}
				{#each Object.entries(grouped) as [category, effects] (category)}
					<section class="category-group">
						<h2 class="category-label">{$i18n.categoryName(category).toUpperCase()}</h2>
						<div class="grid">
							{#each effects as effect (effect.id)}
								<ExploreEffectCard
									{effect}
									name={$i18n.effectName(effect.id, effect.name)}
									href="/?effect={effect.id}"
								/>
							{/each}
						</div>
					</section>
				{:else}
					<p class="empty">{$i18n.t('explore.noResults')}</p>
				{/each}
			{:else if animated.length > 0}
				<section class="category-group category-group--animated">
					<div class="grid">
						{#each animated as effect (effect.id)}
							<ExploreEffectCard
								{effect}
								name={$i18n.effectName(effect.id, effect.name)}
								href="/?effect={effect.id}"
								animLabel={$i18n.t('effectsPanel.animBadge')}
							/>
						{/each}
					</div>
				</section>
			{:else}
				<p class="empty">{$i18n.t('explore.noResultsAnimated')}</p>
			{/if}
		</div>
	</main>

	<footer class="footer">
		<p>{$i18n.t('explore.footerTagline')}</p>
		<a href="/">{$i18n.t('explore.openEditor')}</a>
	</footer>
</div>

<style>
	.explore {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background: var(--bg-app);
		color: var(--text-primary);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	}

	.header {
		height: var(--header-height);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: 0 var(--space-5);
		background: var(--bg-surface);
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		text-decoration: none;
		color: var(--text-primary);
		flex-shrink: 0;
	}

	.logo-icon {
		color: var(--accent);
		font-size: var(--text-lg);
		line-height: 1;
	}

	.logo-text {
		font-size: var(--text-lg);
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.logo-dot {
		color: var(--text-muted);
		font-weight: 500;
	}

	.nav {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.nav-link {
		font-size: var(--text-base);
		color: var(--text-muted);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.nav-link:hover,
	.nav-link:focus-visible {
		color: var(--text-secondary);
	}

	.nav-link--active {
		color: var(--text-primary);
		font-weight: 500;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.btn-editor {
		display: none;
		align-items: center;
		height: 30px;
		padding: 0 var(--space-3);
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-default);
		background: var(--bg-raised);
		color: var(--text-secondary);
		font-size: var(--text-base);
		text-decoration: none;
		transition:
			border-color var(--transition-fast),
			color var(--transition-fast);
	}

	.btn-editor:hover,
	.btn-editor:focus-visible {
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.main {
		flex: 1;
		width: 100%;
		max-width: 1120px;
		margin: 0 auto;
		padding: var(--space-6) var(--space-5) var(--space-5);
	}

	.hero {
		margin-bottom: var(--space-5);
	}

	.hero h1 {
		margin: 0 0 var(--space-2);
		font-size: 22px;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text-primary);
	}

	.subtitle {
		margin: 0;
		max-width: 52ch;
		font-size: var(--text-base);
		line-height: 1.55;
		color: var(--text-muted);
	}

	.tabs {
		display: flex;
		gap: 0;
		max-width: 360px;
		margin-bottom: var(--space-4);
		border-bottom: 1px solid var(--border-subtle);
	}

	.tabs button {
		flex: 1;
		padding: var(--space-2) var(--space-3);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--text-panel-label);
		font-weight: 700;
		letter-spacing: 0.08em;
		cursor: pointer;
		transition:
			color var(--transition-fast),
			border-color var(--transition-fast),
			background var(--transition-fast);
	}

	.tabs button:hover,
	.tabs button:focus-visible {
		color: var(--text-secondary);
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

	.search-wrap {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		max-width: 360px;
		margin-bottom: var(--space-5);
		padding: var(--space-2) var(--space-3);
		background: var(--bg-surface);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
	}

	.search-icon {
		color: var(--text-faint);
		flex-shrink: 0;
	}

	.search {
		flex: 1;
		min-width: 0;
		background: none;
		border: none;
		color: var(--text-primary);
		font-size: var(--text-base);
		font-family: var(--font-mono);
	}

	.search::placeholder {
		color: var(--text-faint);
	}

	.search:focus-visible {
		outline: none;
	}

	.clear-search {
		background: none;
		border: none;
		color: var(--text-faint);
		cursor: pointer;
		font-size: var(--text-xs);
		padding: 0;
		line-height: 1;
	}

	.clear-search:hover,
	.clear-search:focus-visible {
		color: var(--text-muted);
	}

	.catalog {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.catalog--animated {
		gap: 0;
	}

	.category-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.category-group--animated {
		padding: var(--space-4);
		border-radius: var(--radius-md);
		background: linear-gradient(180deg, rgba(93, 173, 226, 0.06) 0%, rgba(93, 173, 226, 0.02) 100%);
		border: 1px solid rgba(93, 173, 226, 0.14);
	}

	.category-label {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-panel-body);
		font-weight: 800;
		letter-spacing: 0.12em;
		color: var(--text-primary);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: var(--space-4);
	}

	.empty {
		margin: var(--space-6) 0 0;
		font-size: var(--text-base);
		color: var(--text-muted);
		font-family: var(--font-mono);
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		flex-wrap: wrap;
		padding: var(--space-3) var(--space-5);
		border-top: 1px solid var(--border-subtle);
		background: var(--bg-surface);
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.footer p {
		margin: 0;
	}

	.footer a {
		color: var(--text-secondary);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.footer a:hover,
	.footer a:focus-visible {
		color: var(--text-primary);
	}

	@media (min-width: 640px) {
		.btn-editor {
			display: inline-flex;
		}
	}

	@media (max-width: 639px) {
		.nav {
			display: none;
		}

		.header {
			padding: 0 var(--space-3);
		}

		.main {
			padding: var(--space-5) var(--space-3) var(--space-4);
		}

		.grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: var(--space-3);
		}
	}
</style>
