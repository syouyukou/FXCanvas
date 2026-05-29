<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { Renderer } from '../engine/renderer';
	import { resolveEffectsAtTime } from '../engine/keyframeEngine';
	import { appliedEffects, sourceImage, sourceCredit, imageSize, isVideoSource, loadVideoFile, loadSampleImage, clearSourceCredit } from '../stores/editor';
	import { SAMPLE_IMAGES } from '../samples/catalog';
	import SampleCreditBar from './SampleCreditBar.svelte';
	import {
		animation,
		advanceAnimationClock,
		getRenderClockFromStores,
		needsPreviewLoop,
		resetAnimationClock,
		toggleAnimationPlayback
	} from '../stores/animation';
	import { keyframeTracks } from '../stores/keyframes';
	import { showOriginal } from '../stores/view';
	import { exportSessionActive } from '../stores/exportSession';
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

	function stopPreviewLoop() {
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
	}

	function renderFrame(vid: HTMLVideoElement | null) {
		if (!renderer) return;
		if (vid) renderer.updateVideoFrame(vid);
		const clock = getRenderClockFromStores(vid);
		const effects = resolveEffectsAtTime(
			get(appliedEffects),
			get(keyframeTracks),
			clock.time
		);
		renderer.render($showOriginal ? [] : effects, clock);
	}

	function startPreviewLoop(vid: HTMLVideoElement | null) {
		stopPreviewLoop();
		let lastTs = performance.now();
		const loop = (ts: number) => {
			if (!renderer) return;
			const delta = Math.min(0.1, (ts - lastTs) / 1000);
			lastTs = ts;

			if (vid) {
				videoPlaying = !vid.paused;
			} else {
				advanceAnimationClock(delta);
			}

			renderFrame(vid);
			rafId = requestAnimationFrame(loop);
		};
		rafId = requestAnimationFrame(loop);
	}

	function formatTime(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}:${s.toFixed(1).padStart(4, '0')}`;
	}

	$effect(() => {
		if (!renderer || !$sourceImage) {
			lastImage = null;
			viewZoom = 100;
			stopPreviewLoop();
			return;
		}

		const vid = $sourceImage instanceof HTMLVideoElement ? $sourceImage : null;

		if ($sourceImage !== lastImage) {
			renderer.loadImage($sourceImage);
			lastImage = $sourceImage;
			imageSize.set(renderer.imageSize);
			resetView();
			applyLayout(renderer.imageSize);
			resetAnimationClock();
		}

		void $appliedEffects;
		void $showOriginal;
		void $needsPreviewLoop;
		void $animation;
		void $exportSessionActive;

		if ($exportSessionActive) {
			stopPreviewLoop();
			return;
		}

		if ($needsPreviewLoop) {
			startPreviewLoop(vid);
		} else {
			stopPreviewLoop();
			renderFrame(vid);
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
			clearSourceCredit();
			sourceImage.set(img);
			URL.revokeObjectURL(url);
		};
		img.src = url;
	}

	function onSampleClick(sample: (typeof SAMPLE_IMAGES)[number]) {
		void loadSampleImage(sample);
	}

	onDestroy(() => {
		resizeObserver?.disconnect();
		stopPreviewLoop();
		renderer?.destroy();
	});
</script>

<div
	class="canvas-container"
	class:panning={isPanning}
	class:has-credit={!!$sourceCredit?.length}
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

			<div class="samples">
				<p class="samples-label">{$i18n.t('canvas.trySamples')}</p>
				<div class="samples-row">
					{#each SAMPLE_IMAGES as sample (sample.id)}
						<button
							type="button"
							class="sample-btn"
							onclick={() => onSampleClick(sample)}
							title={$i18n.t(sample.labelKey)}
						>
							<img class="sample-thumb" src={sample.thumbUrl} alt="" />
							<span class="sample-name">{$i18n.t(sample.labelKey)}</span>
						</button>
					{/each}
				</div>
			</div>
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

	{#if $sourceCredit && $sourceCredit.length > 0}
		<SampleCreditBar authors={$sourceCredit} />
	{/if}

	{#if $sourceImage && ($isVideoSource || $needsPreviewLoop)}
		{@const vid = $sourceImage instanceof HTMLVideoElement ? $sourceImage : null}
		<div class="media-controls">
			<button
				class="vc-btn"
				onclick={() => {
					if (vid) {
						if (vid.paused) {
							void vid.play();
							videoPlaying = true;
						} else {
							vid.pause();
							videoPlaying = false;
						}
					} else {
						toggleAnimationPlayback();
					}
				}}
				title={vid ? (videoPlaying ? 'Pause' : 'Play') : $animation.playing ? 'Pause' : 'Play'}
			>
				{#if (vid && videoPlaying) || (!vid && $animation.playing)}
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
				onclick={() => {
					if (vid) vid.currentTime = 0;
					else resetAnimationClock();
				}}
				title="Restart"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
					<polyline points="3 3 3 8 8 8"/>
				</svg>
			</button>
			<span class="vc-time">
				{#if vid}
					{formatTime(vid.currentTime)} / {formatTime(vid.duration || $animation.duration)}
				{:else}
					{formatTime($animation.currentTime)} / {formatTime($animation.duration)}s
				{/if}
			</span>
			{#if vid}
				<span class="vc-label">VIDEO</span>
			{:else}
				<span class="vc-label vc-label--anim">ANIM</span>
			{/if}
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
		gap: var(--space-2);
		color: var(--text-muted);
		user-select: none;
		padding: var(--space-4);
	}

	.empty-state p {
		font-size: var(--text-lg);
		color: var(--text-secondary);
		margin: 0;
	}

	.empty-state span {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.paste-hint {
		font-size: var(--text-sm);
		color: var(--text-faint);
	}

	.samples {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px solid var(--border-subtle);
		max-width: 100%;
	}

	.samples-label {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--text-muted);
		letter-spacing: 0.04em;
	}

	.samples-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-3);
	}

	.sample-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		color: inherit;
	}

	.sample-thumb {
		width: 96px;
		height: 72px;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-subtle);
		display: block;
		transition: border-color var(--transition-fast);
	}

	.sample-btn:hover .sample-thumb,
	.sample-btn:focus-visible .sample-thumb {
		border-color: var(--border-strong);
	}

	.sample-name {
		font-size: var(--text-xs);
		color: var(--text-muted);
		max-width: 96px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color var(--transition-fast);
	}

	.sample-btn:hover .sample-name,
	.sample-btn:focus-visible .sample-name {
		color: var(--text-secondary);
	}

	.media-controls {
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

	.has-credit .media-controls {
		bottom: 40px;
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

	.vc-time {
		font-size: 10px;
		font-variant-numeric: tabular-nums;
		color: #888;
		margin: 0 4px;
		font-family: 'SF Mono', monospace;
	}

	.vc-label {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #e74c3c;
		margin-left: 4px;
		font-family: 'SF Mono', monospace;
	}

	.vc-label--anim {
		color: #5dade2;
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
