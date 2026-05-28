<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Renderer } from '../engine/renderer';
	import { appliedEffects, sourceImage, imageSize, thumbnails } from '../stores/editor';
	import { ThumbnailRenderer } from '../engine/thumbnail';
	import { EFFECTS } from '../effects/index';

	let thumbRenderer: ThumbnailRenderer | null = null;

	let { renderer = $bindable<Renderer | null>(null) } = $props();

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;

	function fitCanvas(img: { width: number; height: number }) {
		if (!container) return;
		const cw = container.clientWidth;
		const ch = container.clientHeight;
		const scale = Math.min(cw / img.width, ch / img.height, 1);
		canvas.style.width = img.width * scale + 'px';
		canvas.style.height = img.height * scale + 'px';
	}

	onMount(() => {
		renderer = new Renderer(canvas);
		thumbRenderer = new ThumbnailRenderer();
	});

	onDestroy(() => {
		renderer?.destroy();
		thumbRenderer?.destroy();
	});

	$effect(() => {
		if (renderer && $sourceImage) {
			renderer.loadImage($sourceImage);
			const sz = renderer.imageSize;
			canvas.width = sz.width;
			canvas.height = sz.height;
			imageSize.set(sz);
			fitCanvas(sz);
			// Generate thumbnails async so rendering doesn't block
			if (thumbRenderer) {
				thumbRenderer.loadImage($sourceImage);
				setTimeout(() => {
					const map = new Map<string, string>();
					for (const effect of EFFECTS) {
						map.set(effect.id, thumbRenderer!.renderEffect(effect));
					}
					thumbnails.set(map);
				}, 0);
			}
		}
	});

	$effect(() => {
		if (renderer && $sourceImage) {
			renderer.render($appliedEffects);
		}
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
	bind:this={container}
	ondrop={onDrop}
	ondragover={onDragOver}
	role="region"
	aria-label="Canvas"
>
	{#if !$sourceImage}
		<div class="empty-state">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<rect x="3" y="3" width="18" height="18" rx="2"/>
				<circle cx="8.5" cy="8.5" r="1.5"/>
				<polyline points="21 15 16 10 5 21"/>
			</svg>
			<p>Drop an image here</p>
			<span>or click Load Media</span>
		</div>
	{/if}
	<canvas bind:this={canvas} class:hidden={!$sourceImage}></canvas>
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
	}

	canvas {
		display: block;
		image-rendering: pixelated;
		box-shadow: 0 4px 32px rgba(0, 0, 0, 0.6);
	}

	canvas.hidden {
		display: none;
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
</style>
