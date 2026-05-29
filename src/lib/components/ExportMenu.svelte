<script lang="ts">
	import { appliedEffects, sourceImage, imageSize } from '$lib/stores/editor';
	import {
		downloadDataUrl,
		downloadLayerSequence,
		exportLayerSequence,
		getExportFilename,
		getExportSizeOptions,
		MAX_EXPORT_DIM,
		type ExportFormat,
		type ExportSizePreset
	} from '$lib/engine/export';
	import type { Renderer } from '$lib/engine/renderer';
	import { i18n, locale } from '$lib/i18n';

	let { renderer = null }: { renderer: Renderer | null } = $props();

	let showMenu = $state(false);
	let format = $state<ExportFormat>('png');
	let sizePreset = $state<ExportSizePreset>('1x');

	let sizeOptions = $derived.by(() => {
		void $locale;
		return getExportSizeOptions($imageSize.width, $imageSize.height);
	});
	let currentSize = $derived(
		sizeOptions.find((o) => o.id === sizePreset) ?? sizeOptions[0] ?? null
	);

	$effect(() => {
		if (sizeOptions.length === 0) return;
		if (!sizeOptions.some((o) => o.id === sizePreset)) {
			sizePreset = sizeOptions[0].id;
		}
	});

	function toggleMenu() {
		showMenu = !showMenu;
	}

	function closeMenu() {
		showMenu = false;
	}

	function download() {
		if (!renderer?.hasImage() || !currentSize) return;
		const url = renderer.exportImage($appliedEffects, {
			format,
			width: currentSize.width,
			height: currentSize.height
		});
		downloadDataUrl(url, getExportFilename(format));
		closeMenu();
	}

	function downloadLayers() {
		if (!renderer?.hasImage() || !currentSize || $appliedEffects.length === 0) return;
		const frames = exportLayerSequence(renderer, $appliedEffects, {
			format,
			width: currentSize.width,
			height: currentSize.height
		});
		downloadLayerSequence(frames);
		closeMenu();
	}

	function clickOutside(node: HTMLElement) {
		const onDocClick = (e: MouseEvent) => {
			if (!node.contains(e.target as Node)) closeMenu();
		};
		document.addEventListener('click', onDocClick, true);
		return {
			destroy() {
				document.removeEventListener('click', onDocClick, true);
			}
		};
	}
</script>

<div class="export-wrap" use:clickOutside>
	<button
		class="btn-export"
		onclick={(e) => {
			e.stopPropagation();
			toggleMenu();
		}}
		disabled={!$sourceImage}
		aria-expanded={showMenu}
		aria-haspopup="true"
	>
		{$i18n.t('export.title')}
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
			<polyline points="6 9 12 15 18 9"/>
		</svg>
	</button>

	{#if showMenu}
		<div class="export-menu">
			<div class="export-field">
				<label class="export-label" for="export-format">{$i18n.t('export.format')}</label>
				<select id="export-format" class="export-select" bind:value={format}>
					<option value="png">{$i18n.t('export.png')}</option>
					<option value="jpeg">{$i18n.t('export.jpeg')}</option>
					<option value="webp">{$i18n.t('export.webp')}</option>
				</select>
			</div>

			<div class="export-field">
				<label class="export-label" for="export-size">{$i18n.t('export.size')}</label>
				<select id="export-size" class="export-select" bind:value={sizePreset}>
					{#each sizeOptions as option (option.id)}
						<option value={option.id}>
							{option.label} — {option.width} × {option.height}
						</option>
					{/each}
				</select>
			</div>

			{#if currentSize}
				<p class="export-dim">
					{$i18n.t('export.px', { w: currentSize.width, h: currentSize.height })}
				</p>
				{#if currentSize.tooLarge}
					<p class="export-warn">{$i18n.t('export.exceedsLimit', { max: MAX_EXPORT_DIM })}</p>
				{/if}
			{/if}

			<button class="btn-download" onclick={download} disabled={!currentSize || currentSize.tooLarge}>
				{$i18n.t('export.download')}
			</button>
			<button
				class="btn-download btn-download--secondary"
				onclick={downloadLayers}
				disabled={!currentSize || currentSize.tooLarge || $appliedEffects.length === 0}
			>
				{$i18n.t('export.downloadLayers')}
			</button>
		</div>
	{/if}
</div>

<style>
	.export-wrap {
		position: relative;
	}

	.btn-export {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--bg-light);
		color: var(--text-on-light);
		border: none;
		border-radius: var(--radius-sm);
		padding: 6px 14px;
		font-size: var(--text-base);
		font-weight: 600;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.btn-export:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.btn-export:not(:disabled):hover,
	.btn-export:not(:disabled):focus-visible {
		opacity: 0.9;
	}

	.export-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		width: 240px;
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 8px;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
		z-index: 100;
	}

	.export-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.export-label {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #666;
	}

	.export-select {
		width: 100%;
		background: #111;
		border: 1px solid #333;
		border-radius: 4px;
		color: #ddd;
		font-size: 12px;
		font-family: inherit;
		padding: 7px 8px;
		cursor: pointer;
	}

	.export-select:focus-visible {
		border-color: var(--border-strong);
	}

	.export-dim {
		font-size: var(--text-xs);
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		margin: -4px 0 0;
	}

	.export-warn {
		font-size: var(--text-2xs);
		color: var(--text-danger);
		line-height: 1.4;
		margin: -4px 0 0;
	}

	.btn-download {
		background: var(--bg-light);
		color: var(--text-on-light);
		border: none;
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-base);
		font-weight: 600;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.btn-download--secondary {
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid var(--border-default);
	}

	.btn-download:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.btn-download:not(:disabled):hover,
	.btn-download:not(:disabled):focus-visible {
		opacity: 0.9;
	}
</style>
