<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Renderer } from '../engine/renderer';
	import { appliedEffects, sourceImage, imageSize, isVideoSource, loadVideoFile } from '../stores/editor';
	import { showOriginal } from '../stores/view';
	import { i18n } from '$lib/i18n';

	const MIN_ZOOM = 0.25;
	const MAX_ZOOM = 8;

	let resizeObserver: ResizeObserver | null = null;
	let lastImage = $state<HTMLImageElement | ImageBitmap | HTMLVideoElement | null>(null);
	let rafId = 0;
	let videoPlaying = $state(false);
	let fitScale = $state(1);
	let userZoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isPanning = $state(false);
	let panStartX = 0;
	let panStartY = 0;
	let panOriginX = 0;
	let panOriginY = 0;

	let { renderer = $bindable<Renderer | null>(null), viewZoom = $bindable(100) } = $props();

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;

	function clampZoom(z: number) {
		return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
	}

	function computeFitScale(img: { width: number; height: number }) {
		if (!container) return 1;
		return Math.min(
			container.clientWidth / img.width,
			container.clientHeight / img.height,
			1
		);
	}

	function applyLayout(img: { width: number; height: number }) {
		if (!canvas) return;
		fitScale = computeFitScale(img);
		const scale = fitScale * userZoom;
		canvas.style.width = img.width * scale + 'px';
		canvas.style.height = img.height * scale + 'px';
		viewZoom = Math.round(userZoom * 100);
	}

	function resetView() {
		userZoom = 1;
		panX = 0;
		panY = 0;
	}

	function onWheel(e: WheelEvent) {
		if (!renderer || !$sourceImage) return;
		e.preventDefault();

		const rect = container.getBoundingClientRect();
		const mx = e.clientX - rect.left - rect.width / 2;
		const my = e.clientY - rect.top - rect.height / 2;
		const img = renderer.imageSize;
		const oldScale = fitScale * userZoom;
		const factor = Math.exp(-e.deltaY * 0.001);
		const nextZoom = clampZoom(userZoom * factor);
		const newScale = fitScale * nextZoom;

		const imgX = (mx - panX) / oldScale;
		const imgY = (my - panY) / oldScale;
		panX = mx - imgX * newScale;
		panY = my - imgY * newScale;
		userZoom = nextZoom;
		applyLayout(img);
	}

	function onDoubleClick() {
		if (!renderer || !$sourceImage) return;
		resetView();
		applyLayout(renderer.imageSize);
	}

	function onPointerDown(e: PointerEvent) {
		if (!$sourceImage || e.button !== 0) return;
		isPanning = true;
		panStartX = e.clientX;
		panStartY = e.clientY;
		panOriginX = panX;
		panOriginY = panY;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isPanning) return;
		panX = panOriginX + (e.clientX - panStartX);
		panY = panOriginY + (e.clientY - panStartY);
	}

	function onPointerUp(e: PointerEvent) {
		isPanning = false;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
	}

	onMount(() => {
		renderer = new Renderer(canvas);

		resizeObserver = new ResizeObserver(() => {
			if ($sourceImage && renderer) applyLayout(renderer.imageSize);
		});
		resizeObserver.observe(container);
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		renderer?.destroy();
	});

	function stopVideoLoop() {
		if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
	}

	function startVideoLoop(vid: HTMLVideoElement) {
		stopVideoLoop();
		const loop = () => {
			if (!renderer) return;
			renderer.updateVideoFrame(vid);
			renderer.render($showOriginal ? [] : $appliedEffects);
			rafId = requestAnimationFrame(loop);
		};
		rafId = requestAnimationFrame(loop);
	}

	$effect(() => {
		if (!renderer || !$sourceImage) {
			lastImage = null;
			viewZoom = 100;
			stopVideoLoop();
			return;
		}

		if ($sourceImage !== lastImage) {
			renderer.loadImage($sourceImage);
			lastImage = $sourceImage;
			imageSize.set(renderer.imageSize);
			resetView();
			applyLayout(renderer.imageSize);

			if ($sourceImage instanceof HTMLVideoElement) {
				videoPlaying = !$sourceImage.paused;
				startVideoLoop($sourceImage);
				return; // RAF handles rendering
			} else {
				stopVideoLoop();
			}
		}

		if (!$isVideoSource) {
			renderer.render($showOriginal ? [] : $appliedEffects);
		}
	});

	function onDrop(e: DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer?.files[0];
		if (!file) return;
		if (file.type.startsWith('video/')) void loadVideoFile(file);
		else if (file.type.startsWith('image/')) loadFile(file);
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function loadFile(file: File) {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			sourceImage.set(img);
			URL.revokeObjectURL(url);
		};
		img.src = url;
	}
</script>

<div
	class="canvas-container"
	class:panning={isPanning}
	bind:this={container}
	ondrop={onDrop}
	ondragover={onDragOver}
	onwheel={onWheel}
	ondblclick={onDoubleClick}
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
	role="region"
	aria-label={$i18n.t('canvas.ariaCanvas')}
>
	{#if !$sourceImage}
		<div class="empty-state">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<rect x="3" y="3" width="18" height="18" rx="2"/>
				<circle cx="8.5" cy="8.5" r="1.5"/>
				<polyline points="21 15 16 10 5 21"/>
			</svg>
			<p>{$i18n.t('canvas.dropImage')}</p>
			<span>{$i18n.t('canvas.orClickLoad')}</span>
			<span class="paste-hint">{$i18n.t('canvas.pasteHint')}</span>
		</div>
	{/if}
	<div
		class="canvas-stage"
		class:hidden={!$sourceImage}
		style="transform: translate({panX}px, {panY}px)"
		role="img"
		aria-label={$i18n.t('canvas.ariaPreview')}
	>
		<canvas bind:this={canvas}></canvas>
	</div>
	{#if $showOriginal && $sourceImage}
		<div class="compare-badge">{$i18n.t('canvas.original')}</div>
	{/if}

	{#if $isVideoSource && $sourceImage instanceof HTMLVideoElement}
		{@const vid = $sourceImage}
		<div class="video-controls">
			<button
				class="vc-btn"
				onclick={() => {
					if (vid.paused) { void vid.play(); videoPlaying = true; }
					else { vid.pause(); videoPlaying = false; }
				}}
				title={videoPlaying ? 'Pause' : 'Play'}
			>
				{#if videoPlaying}
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
						<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
					</svg>
				{:else}
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="5,3 19,12 5,21"/>
					</svg>
				{/if}
			</button>
			<button
				class="vc-btn"
				onclick={() => { vid.currentTime = 0; }}
				title="Restart"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
					<polyline points="3 3 3 8 8 8"/>
				</svg>
			</button>
			<span class="vc-label">VIDEO</span>
		</div>
	{/if}
</div>

<style>
	.canvas-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #111;
		overflow: hidden;
		position: relative;
		cursor: grab;
	}

	.canvas-container.panning {
		cursor: grabbing;
	}

	.canvas-stage {
		flex-shrink: 0;
	}

	.canvas-stage.hidden {
		display: none;
	}

	canvas {
		display: block;
		image-rendering: pixelated;
		box-shadow: 0 4px 32px rgba(0, 0, 0, 0.6);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		color: #555;
		user-select: none;
	}

	.empty-state p {
		font-size: 16px;
		color: #666;
		margin: 0;
	}

	.empty-state span {
		font-size: 13px;
		color: #444;
	}

	.paste-hint {
		font-size: 12px;
		color: #3a3a3a;
	}

	.video-controls {
		position: absolute;
		bottom: 14px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 4px;
		background: rgba(0, 0, 0, 0.7);
		border: 1px solid #333;
		border-radius: 6px;
		padding: 5px 10px;
		backdrop-filter: blur(4px);
	}

	.vc-btn {
		background: none;
		border: none;
		color: #ccc;
		cursor: pointer;
		padding: 3px 5px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		transition: color 0.15s, background 0.15s;
	}
	.vc-btn:hover { background: #2a2a2a; color: #fff; }

	.vc-label {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #e74c3c;
		margin-left: 4px;
		font-family: 'SF Mono', monospace;
	}

	.compare-badge {
		position: absolute;
		top: 12px;
		left: 12px;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #fff;
		background: rgba(0, 0, 0, 0.65);
		border: 1px solid #444;
		border-radius: 4px;
		padding: 4px 8px;
		pointer-events: none;
		user-select: none;
	}
</style>
