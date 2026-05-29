<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import EffectPanel from '$lib/components/EffectPanel.svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import LayerPanel from '$lib/components/LayerPanel.svelte';
	import ExportMenu from '$lib/components/ExportMenu.svelte';
	import PresetMenu from '$lib/components/PresetMenu.svelte';
	import LanguageMenu from '$lib/components/LanguageMenu.svelte';
	import { i18n } from '$lib/i18n';
	import { sourceImage, imageSize, activeLayerIndex, removeEffect, loadImageFile, loadVideoFile } from '$lib/stores/editor';
	import { canUndo, canRedo, undo, redo } from '$lib/stores/history';
	import { initSessionAutosave, restoreSession } from '$lib/stores/session';
	import {
		showOriginal,
		effectPanelWidth,
		effectPanelCollapsed,
		effectPanelSavedWidth,
		EFFECT_PANEL_MIN_WIDTH,
		EFFECT_PANEL_MAX_WIDTH,
		EFFECT_PANEL_COLLAPSED_WIDTH,
		EFFECT_PANEL_SNAP_RAIL_BELOW,
		EFFECT_PANEL_DEFAULT_WIDTH
	} from '$lib/stores/view';
	import type { Renderer } from '$lib/engine/renderer';

	let renderer: Renderer | null = $state(null);
	let viewZoom = $state(100);
	let fileInput = $state<HTMLInputElement | null>(null);
	let resizingPanel = $state(false);
	let resizeStartX = 0;
	let resizeStartWidth = EFFECT_PANEL_MIN_WIDTH;
	let resizeFromCollapsed = $state(false);
	let panelShellWidth = $state(EFFECT_PANEL_DEFAULT_WIDTH);

	$effect(() => {
		if (!resizingPanel) {
			panelShellWidth = $effectPanelCollapsed
				? EFFECT_PANEL_COLLAPSED_WIDTH
				: $effectPanelWidth;
		}
	});

	function clampDragWidth(width: number) {
		return Math.min(
			EFFECT_PANEL_MAX_WIDTH,
			Math.max(EFFECT_PANEL_COLLAPSED_WIDTH, width)
		);
	}

	function onPanelResizeStart(e: PointerEvent) {
		resizingPanel = true;
		resizeStartX = e.clientX;
		resizeFromCollapsed = $effectPanelCollapsed;
		resizeStartWidth = resizeFromCollapsed
			? EFFECT_PANEL_COLLAPSED_WIDTH
			: $effectPanelWidth;
		panelShellWidth = resizeStartWidth;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPanelResizeMove(e: PointerEvent) {
		if (!resizingPanel) return;
		const next = clampDragWidth(resizeStartWidth + (e.clientX - resizeStartX));
		panelShellWidth = next;
		effectPanelWidth.set(next);

		if (next <= EFFECT_PANEL_COLLAPSED_WIDTH + 2) {
			effectPanelCollapsed.set(true);
			return;
		}

		effectPanelCollapsed.set(false);
	}

	function onPanelResizeEnd(e: PointerEvent) {
		if (!resizingPanel) return;
		resizingPanel = false;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

		if (panelShellWidth <= EFFECT_PANEL_SNAP_RAIL_BELOW) {
			effectPanelSavedWidth.set(
				Math.max(EFFECT_PANEL_MIN_WIDTH, resizeStartWidth, $effectPanelSavedWidth)
			);
			effectPanelCollapsed.set(true);
			panelShellWidth = EFFECT_PANEL_COLLAPSED_WIDTH;
			return;
		}

		effectPanelCollapsed.set(false);
		const snapped =
			panelShellWidth < EFFECT_PANEL_MIN_WIDTH ? EFFECT_PANEL_MIN_WIDTH : panelShellWidth;
		effectPanelWidth.set(snapped);
		panelShellWidth = snapped;
	}

	function loadFile(file: File) {
		if (file.type.startsWith('video/')) void loadVideoFile(file);
		else void loadImageFile(file);
	}

	function onPaste(e: ClipboardEvent) {
		if (isEditableTarget(e.target)) return;
		const items = e.clipboardData?.items;
		if (!items) return;
		for (const item of items) {
			if (item.type.startsWith('image/')) {
				e.preventDefault();
				const file = item.getAsFile();
				if (file) void loadImageFile(file);
				return;
			}
		}
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
		void restoreSession();
		initSessionAutosave();

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
				return;
			}
			if (e.key === 'Delete') {
				const idx = get(activeLayerIndex);
				if (idx >= 0) {
					e.preventDefault();
					removeEffect(idx);
				}
			}
		};

		const onKeyUp = (e: KeyboardEvent) => {
			if (e.code === 'Space') showOriginal.set(false);
		};

		const onBlur = () => showOriginal.set(false);

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		window.addEventListener('blur', onBlur);
		window.addEventListener('paste', onPaste);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
			window.removeEventListener('blur', onBlur);
			window.removeEventListener('paste', onPaste);
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
				<button class="btn-icon" disabled={!$canUndo} onclick={undo} title={$i18n.t('app.undo')}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
					</svg>
				</button>
				<button class="btn-icon" disabled={!$canRedo} onclick={redo} title={$i18n.t('app.redo')}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>
					</svg>
				</button>
			</div>
		</div>

		<div class="header-actions">
			<LanguageMenu />
			<PresetMenu />

			<button class="btn-ghost" onclick={() => fileInput?.click()}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
					<polyline points="17 8 12 3 7 8"/>
					<line x1="12" y1="3" x2="12" y2="15"/>
				</svg>
				{$i18n.t('app.loadMedia')}
			</button>
			<input
				bind:this={fileInput}
				use:fileInputAction
				type="file"
				accept="image/*,video/*"
				class="hidden-input"
			/>

			<ExportMenu {renderer} />
		</div>
	</header>

	<!-- Main -->
	<main class="main" class:resizing-panel={resizingPanel}>
		<div class="effect-shell" style:width="{panelShellWidth}px">
			<EffectPanel />
			<div
				class="panel-resize-handle"
				class:active={resizingPanel}
				role="separator"
				aria-orientation="vertical"
				aria-label={$i18n.t('app.resizePanel')}
				onpointerdown={onPanelResizeStart}
				onpointermove={onPanelResizeMove}
				onpointerup={onPanelResizeEnd}
				onpointercancel={onPanelResizeEnd}
			></div>
		</div>
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
					<span class="preview-badge">{$i18n.t('app.preview')}</span>
				{/if}
			{:else}
				{$i18n.t('app.noMedia')}
			{/if}
		</span>
		<span class="footer-tip">{$i18n.t('app.footerTip')}</span>
	</footer>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		background: var(--bg-app);
		color: var(--text-body);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		overflow: hidden;
	}

	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
	}

	.header {
		height: var(--header-height);
		background: var(--bg-surface);
		border-bottom: 1px solid var(--border-subtle);
		display: flex;
		align-items: center;
		padding: 0 var(--space-4);
		gap: var(--space-4);
		flex-shrink: 0;
		z-index: 10;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.01em;
		user-select: none;
	}

	.logo-icon {
		font-size: 18px;
		color: var(--accent);
	}

	.logo-text {
		color: var(--text-primary);
	}

	.logo-dot {
		color: var(--accent);
	}

	.header-center {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	.history-btns {
		display: flex;
		gap: var(--space-1);
	}

	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: none;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast),
			color var(--transition-fast);
	}

	.btn-icon:hover:not(:disabled),
	.btn-icon:focus-visible:not(:disabled) {
		background: var(--bg-hover);
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.btn-icon:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.btn-ghost {
		display: flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		padding: 6px var(--space-3);
		color: var(--text-secondary);
		font-size: var(--text-base);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast),
			color var(--transition-fast);
	}

	.btn-ghost:hover,
	.btn-ghost:focus-visible {
		background: var(--bg-hover);
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.hidden-input {
		display: none;
	}

	.main {
		flex: 1;
		display: flex;
		overflow: hidden;
	}

	.main.resizing-panel {
		cursor: col-resize;
		user-select: none;
	}

	.main.resizing-panel * {
		cursor: col-resize !important;
	}

	.effect-shell {
		position: relative;
		flex-shrink: 0;
		display: flex;
		border-right: 1px solid var(--border-panel);
	}

	.panel-resize-handle {
		position: absolute;
		top: 0;
		right: -3px;
		width: 6px;
		height: 100%;
		cursor: col-resize;
		z-index: 20;
		touch-action: none;
	}

	.panel-resize-handle::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 2px;
		height: 32px;
		border-radius: 2px;
		background: var(--border-default);
		opacity: 0;
		transition:
			opacity var(--transition-fast),
			background var(--transition-fast);
	}

	.panel-resize-handle:hover::after,
	.panel-resize-handle.active::after,
	.panel-resize-handle:focus-visible::after {
		opacity: 1;
		background: var(--text-muted);
	}

	.footer {
		height: var(--footer-height);
		background: var(--bg-surface);
		border-top: 1px solid var(--border-subtle);
		display: flex;
		align-items: center;
		padding: 0 var(--space-4);
		gap: var(--space-4);
		flex-shrink: 0;
	}

	.footer-info {
		font-size: var(--text-xs);
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.preview-badge {
		font-size: var(--text-2xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-xs);
		padding: 1px 5px;
	}

	.zoom-badge {
		font-size: var(--text-2xs);
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		min-width: 3ch;
	}

	.footer-tip {
		font-size: var(--text-xs);
		color: var(--text-faint);
	}
</style>
