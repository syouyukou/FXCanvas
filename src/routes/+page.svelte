<script lang="ts">
	import { onMount } from 'svelte';
	import EffectPanel from '$lib/components/EffectPanel.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import LayerPanel from '$lib/components/LayerPanel.svelte';
	import ExportMenu from '$lib/components/ExportMenu.svelte';
	import PresetMenu from '$lib/components/PresetMenu.svelte';
	import { sourceImage, imageSize } from '$lib/stores/editor';
	import { canUndo, canRedo, undo, redo } from '$lib/stores/history';
	import { showOriginal } from '$lib/stores/view';
	import type { Renderer } from '$lib/engine/renderer';

	let renderer: Renderer | null = $state(null);
	let viewZoom = $state(100);
	let fileInput = $state<HTMLInputElement | null>(null);

	function loadFile(file: File) {
		if (!file.type.startsWith('image/')) return;
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			sourceImage.set(img);
			URL.revokeObjectURL(url);
		};
		img.src = url;
	}

	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) loadFile(file);
		input.value = '';
	}

	function fileInputAction(node: HTMLInputElement) {
		node.addEventListener('change', onFileChange);
		return {
			destroy() {
				node.removeEventListener('change', onFileChange);
			}
		};
	}

	function isEditableTarget(el: EventTarget | null) {
		if (!(el instanceof HTMLElement)) return false;
		const tag = el.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
	}

	onMount(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (isEditableTarget(e.target)) return;

			const mod = e.metaKey || e.ctrlKey;
			if (mod && e.key === 'z' && !e.shiftKey) {
				e.preventDefault();
				undo();
				return;
			}
			if (mod && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
				e.preventDefault();
				redo();
				return;
			}
			if (e.code === 'Space' && !e.repeat) {
				e.preventDefault();
				showOriginal.set(true);
			}
		};

		const onKeyUp = (e: KeyboardEvent) => {
			if (e.code === 'Space') showOriginal.set(false);
		};

		const onBlur = () => showOriginal.set(false);

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		window.addEventListener('blur', onBlur);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
			window.removeEventListener('blur', onBlur);
		};
	});
</script>

<div class="app">
	<!-- Header -->
	<header class="header">
		<div class="logo">
			<span class="logo-icon">◈</span>
			<span class="logo-text">FX<span class="logo-dot">Canvas</span></span>
		</div>

		<div class="header-center">
			<div class="history-btns">
				<button class="btn-icon" disabled={!$canUndo} onclick={undo} title="Undo (⌘Z)">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
					</svg>
				</button>
				<button class="btn-icon" disabled={!$canRedo} onclick={redo} title="Redo (⌘⇧Z)">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>
					</svg>
				</button>
			</div>
		</div>

		<div class="header-actions">
			<PresetMenu />

			<button class="btn-ghost" onclick={() => fileInput?.click()}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
					<polyline points="17 8 12 3 7 8"/>
					<line x1="12" y1="3" x2="12" y2="15"/>
				</svg>
				Load Media
			</button>
			<input
				bind:this={fileInput}
				use:fileInputAction
				type="file"
				accept="image/*"
				class="hidden-input"
			/>

			<ExportMenu {renderer} />
		</div>
	</header>

	<!-- Main -->
	<main class="main">
		<EffectPanel />
		<Canvas bind:renderer bind:viewZoom />
		<LayerPanel />
	</main>

	<!-- Status bar -->
	<footer class="footer">
		<span class="footer-info">
			{#if $sourceImage}
				{$imageSize.width} × {$imageSize.height} px
				<span class="zoom-badge">{viewZoom}%</span>
				{#if Math.max($imageSize.width, $imageSize.height) > 1920}
					<span class="preview-badge">PREVIEW</span>
				{/if}
			{:else}
				No media loaded
			{/if}
		</span>
		<span class="footer-tip">Scroll zoom · Drag pan · Double-click reset · Space compare · ⌘Z undo · Click effect (random) · Shift+click defaults</span>
	</footer>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		background: #111;
		color: #ccc;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		overflow: hidden;
	}

	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
	}

	/* ── Header ─────────────────────────── */
	.header {
		height: 48px;
		background: #161616;
		border-bottom: 1px solid #2a2a2a;
		display: flex;
		align-items: center;
		padding: 0 16px;
		gap: 16px;
		flex-shrink: 0;
		z-index: 10;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 16px;
		font-weight: 700;
		color: #fff;
		letter-spacing: -0.01em;
		user-select: none;
	}

	.logo-icon {
		font-size: 18px;
		color: #aaa;
	}

	.logo-text {
		color: #eee;
	}

	.logo-dot {
		color: #888;
	}

	.header-center {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	.history-btns {
		display: flex;
		gap: 4px;
	}

	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: none;
		border: 1px solid #333;
		border-radius: 6px;
		color: #bbb;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-icon:hover:not(:disabled) {
		background: #252525;
		border-color: #555;
		color: #fff;
	}

	.btn-icon:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn-ghost {
		display: flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: 1px solid #333;
		border-radius: 6px;
		padding: 6px 12px;
		color: #bbb;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-ghost:hover {
		background: #252525;
		border-color: #555;
		color: #fff;
	}

	.hidden-input {
		display: none;
	}

	/* ── Main ───────────────────────────── */
	.main {
		flex: 1;
		display: flex;
		overflow: hidden;
	}

	/* ── Footer ─────────────────────────── */
	.footer {
		height: 30px;
		background: #161616;
		border-top: 1px solid #2a2a2a;
		display: flex;
		align-items: center;
		padding: 0 16px;
		gap: 16px;
		flex-shrink: 0;
	}

	.footer-info {
		font-size: 11px;
		color: #555;
		font-variant-numeric: tabular-nums;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.preview-badge {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #666;
		border: 1px solid #333;
		border-radius: 3px;
		padding: 1px 5px;
	}

	.zoom-badge {
		font-size: 10px;
		color: #666;
		font-variant-numeric: tabular-nums;
		min-width: 3ch;
	}

	.footer-tip {
		font-size: 11px;
		color: #3a3a3a;
	}
</style>
