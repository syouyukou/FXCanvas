<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Renderer } from '../engine/renderer';
	import { appliedEffects, sourceImage, imageSize } from '../stores/editor';
	import { showOriginal } from '../stores/view';
	import { i18n } from '$lib/i18n';

	const MIN_ZOOM = 0.25;
	const MAX_ZOOM = 8;

	let resizeObserver: ResizeObserver | null = null;
	let lastImage = $state<HTMLImageElement | ImageBitmap | null>(null);
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

	$effect(() => {
		if (!renderer || !$sourceImage) {
			lastImage = null;
			viewZoom = 100;
			return;
		}

		const stack = $showOriginal ? [] : $appliedEffects;

		if ($sourceImage !== lastImage) {
			renderer.loadImage($sourceImage);
			lastImage = $sourceImage;
			imageSize.set(renderer.imageSize);
			resetView();
			applyLayout(renderer.imageSize);
		}

		renderer.render(stack);
	});

	function onDrop(e: DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer?.files[0];
		if (file && file.type.startsWith('image/')) loadFile(file);
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
