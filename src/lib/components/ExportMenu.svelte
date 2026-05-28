<script lang="ts">
	import { appliedEffects, sourceImage, imageSize } from '$lib/stores/editor';
	import {
		getExportFilename,
		getExportSizeOptions,
		MAX_EXPORT_DIM,
		type ExportFormat,
		type ExportSizePreset
	} from '$lib/engine/export';
	import type { Renderer } from '$lib/engine/renderer';

	let { renderer = null }: { renderer: Renderer | null } = $props();

	let showMenu = $state(false);
	let format = $state<ExportFormat>('png');
	let sizePreset = $state<ExportSizePreset>('1x');

	let sizeOptions = $derived(getExportSizeOptions($imageSize.width, $imageSize.height));
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
		const a = document.createElement('a');
		a.href = url;
		a.download = getExportFilename(format);
		a.click();
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
		Export
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
			<polyline points="6 9 12 15 18 9"/>
		</svg>
	</button>

	{#if showMenu}
		<div class="export-menu">
			<div class="export-field">
				<label class="export-label" for="export-format">Format</label>
				<select id="export-format" class="export-select" bind:value={format}>
					<option value="png">PNG</option>
					<option value="jpeg">JPEG</option>
				</select>
			</div>

			<div class="export-field">
				<label class="export-label" for="export-size">Size</label>
				<select id="export-size" class="export-select" bind:value={sizePreset}>
					{#each sizeOptions as option (option.id)}
						<option value={option.id}>
							{option.label} — {option.width} × {option.height}
						</option>
					{/each}
				</select>
			</div>

			{#if currentSize}
				<p class="export-dim">{currentSize.width} × {currentSize.height} px</p>
				{#if currentSize.tooLarge}
					<p class="export-warn">Exceeds {MAX_EXPORT_DIM}px limit — choose a smaller size</p>
				{/if}
			{/if}

			<button class="btn-download" onclick={download} disabled={!currentSize || currentSize.tooLarge}>
				Download
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
		background: #fff;
		color: #000;
		border: none;
		border-radius: 6px;
		padding: 6px 14px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.btn-export:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.btn-export:not(:disabled):hover {
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

	.export-select:focus {
		outline: none;
		border-color: #555;
	}

	.export-dim {
		font-size: 11px;
		color: #666;
		font-variant-numeric: tabular-nums;
		margin: -4px 0 0;
	}

	.export-warn {
		font-size: 10px;
		color: #c66;
		line-height: 1.4;
		margin: -4px 0 0;
	}

	.btn-download {
		background: #fff;
		color: #000;
		border: none;
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.btn-download:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.btn-download:not(:disabled):hover {
		opacity: 0.9;
	}
</style>
