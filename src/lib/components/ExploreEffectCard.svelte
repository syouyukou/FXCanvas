<script lang="ts">
	import type { Effect } from '../engine/renderer';
	import { thumbnails, sourceThumbnails } from '../stores/editor';
	import { isAnimatedPanelEffect } from '../effects/visibleEffects';

	interface Props {
		effect: Effect;
		name: string;
		href: string;
		animLabel?: string;
	}

	let { effect, name, href, animLabel = 'ANIM' }: Props = $props();

	let animated = $derived(isAnimatedPanelEffect(effect.id));
</script>

<a class="card" class:animated {href} title={name}>
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
			<img class="thumb-img" src={$thumbnails.get(effect.id)} alt="" aria-hidden="true" />
		{:else}
			<div class="thumb-placeholder" aria-hidden="true"></div>
		{/if}
		{#if animated}
			<span class="anim-badge">{animLabel}</span>
		{/if}
	</div>
	<span class="card-name">{name}</span>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		text-decoration: none;
		color: inherit;
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.thumb-wrap {
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 3;
		background: var(--bg-thumb);
		border-radius: var(--radius-md);
		overflow: hidden;
		border: 1px solid var(--border-subtle);
		transition: border-color var(--transition-fast);
	}

	.card:hover .thumb-wrap,
	.card:focus-visible .thumb-wrap {
		border-color: var(--border-strong);
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
		transition: opacity var(--transition-normal);
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

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.45;
		}
		50% {
			opacity: 0.85;
		}
	}

	.card-name {
		font-family: var(--font-mono);
		font-size: var(--text-panel-body);
		color: var(--text-secondary);
		line-height: 1.3;
		padding: 0 2px;
	}

	.card:hover .card-name,
	.card:focus-visible .card-name {
		color: var(--text-primary);
	}

	.card.animated .thumb-wrap {
		border-color: rgba(93, 173, 226, 0.22);
		background: linear-gradient(180deg, #151922 0%, #0d1016 100%);
	}

	.card.animated:hover .thumb-wrap,
	.card.animated:focus-visible .thumb-wrap {
		border-color: #5dade2;
	}

	.anim-badge {
		position: absolute;
		top: 6px;
		left: 6px;
		z-index: 3;
		font-size: var(--text-2xs);
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #5dade2;
		background: rgba(0, 0, 0, 0.72);
		border: 1px solid #2e86c1;
		border-radius: var(--radius-xs);
		padding: 2px 4px;
		pointer-events: none;
		font-family: var(--font-mono);
	}
</style>
