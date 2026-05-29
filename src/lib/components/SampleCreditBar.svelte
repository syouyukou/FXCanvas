<script lang="ts">
	import type { SampleAuthor } from '../samples/catalog';
	import { authorProfileUrl } from '../samples/catalog';
	import { i18n } from '$lib/i18n';

	interface Props {
		authors: SampleAuthor[];
	}

	let { authors }: Props = $props();
</script>

<div class="credit-bar" aria-label={$i18n.t('canvas.creditAria')}>
	<span class="credit-prefix">{$i18n.t('canvas.creditBy')}</span>
	{#each authors as author, i (author.handle)}
		{#if i > 0}
			<span class="credit-sep">&</span>
		{/if}
		<a
			class="credit-link"
			href={authorProfileUrl(author)}
			target="_blank"
			rel="noopener noreferrer"
		>
			@{author.handle}
		</a>
	{/each}
</div>

<style>
	.credit-bar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
		width: 100%;
		box-sizing: border-box;
		padding: 6px 12px;
		background: rgba(0, 0, 0, 0.88);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		font-size: var(--text-xs);
		line-height: 1.3;
		color: rgba(255, 255, 255, 0.72);
	}

	.credit-prefix {
		color: rgba(255, 255, 255, 0.52);
	}

	.credit-sep {
		color: rgba(255, 255, 255, 0.4);
		margin: 0 1px;
	}

	.credit-link {
		color: rgba(255, 255, 255, 0.92);
		text-decoration: none;
		transition: color var(--transition-fast);
		cursor: pointer;
	}

	.credit-link:hover,
	.credit-link:focus-visible {
		color: #fff;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
