<script lang="ts">
	import { appliedEffects, sourceImage, imageSize, isVideoSource } from '$lib/stores/editor';
	import {
		animation,
		setAnimationDuration,
		setAnimationFps,
		type AnimationDuration,
		type AnimationFps
	} from '$lib/stores/animation';
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
	import {
		downloadBlob,
		exportAnimationVideo,
		formatDurationLabel,
		getAnimationExportFilename,
		getMimeTypeForVideoExport,
		getPreferredVideoExportFormat,
		getSupportedMp4MimeType,
		getSupportedWebmMimeType,
		isVideoExportFormatSupported,
		MAX_VIDEO_EXPORT_DURATION_SEC,
		resolveVideoExportDuration,
		type VideoExportDurationMode,
		type VideoExportFormat
	} from '$lib/engine/animationExport';
	import { resolveEffectsAtTime } from '$lib/engine/keyframeEngine';
	import { keyframeTracks } from '$lib/stores/keyframes';
	import { get } from 'svelte/store';
	import type { Renderer } from '$lib/engine/renderer';
	import { i18n, locale } from '$lib/i18n';
	import { exportSessionActive } from '$lib/stores/exportSession';

	type ExportKind = ExportFormat | VideoExportFormat;

	let { renderer = null }: { renderer: Renderer | null } = $props();

	let showMenu = $state(false);
	let format = $state<ExportKind>('png');
	let sizePreset = $state<ExportSizePreset>('1x');
	let exporting = $state(false);
	let exportProgress = $state('');
	let videoDurationMode = $state<VideoExportDurationMode>(5);

	const mp4Supported = typeof MediaRecorder !== 'undefined' && getSupportedMp4MimeType() !== null;
	const webmSupported = typeof MediaRecorder !== 'undefined' && getSupportedWebmMimeType() !== null;
	const videoExportSupported = mp4Supported || webmSupported;

	let sizeOptions = $derived.by(() => {
		void $locale;
		return getExportSizeOptions($imageSize.width, $imageSize.height);
	});
	let currentSize = $derived(
		sizeOptions.find((o) => o.id === sizePreset) ?? sizeOptions[0] ?? null
	);
	let isVideoExport = $derived(format === 'webm' || format === 'mp4');

	let sourceVideo = $derived(
		$isVideoSource && $sourceImage instanceof HTMLVideoElement ? $sourceImage : null
	);

	let sourceClipDuration = $derived.by(() => {
		const vid = sourceVideo;
		if (!vid || !Number.isFinite(vid.duration) || vid.duration <= 0) return null;
		return Math.min(vid.duration, MAX_VIDEO_EXPORT_DURATION_SEC);
	});

	let sourceClipCapped = $derived(
		sourceVideo != null &&
			Number.isFinite(sourceVideo.duration) &&
			sourceVideo.duration > MAX_VIDEO_EXPORT_DURATION_SEC
	);

	let exportDurationSec = $derived(
		resolveVideoExportDuration(sourceVideo, videoDurationMode, $animation.duration)
	);

	let exportFrameCount = $derived(Math.max(1, Math.round(exportDurationSec * $animation.fps)));

	$effect(() => {
		if (sizeOptions.length === 0) return;
		if (!sizeOptions.some((o) => o.id === sizePreset)) {
			sizePreset = sizeOptions[0].id;
		}
	});

	let hadVideoSource = $state(false);
	$effect(() => {
		const has = sourceVideo != null;
		if (has && !hadVideoSource) videoDurationMode = 'source';
		if (!has && videoDurationMode === 'source') videoDurationMode = 5;
		hadVideoSource = has;
	});

	$effect(() => {
		if (!isVideoExport) return;
		if (format === 'mp4' && !mp4Supported && webmSupported) format = 'webm';
		if (format === 'webm' && !webmSupported && mp4Supported) format = 'mp4';
	});

	function toggleMenu() {
		if (!showMenu && videoExportSupported) {
			const preferred = getPreferredVideoExportFormat();
			if (isVideoExport && preferred && !isVideoExportFormatSupported(format as VideoExportFormat)) {
				format = preferred;
			}
		}
		showMenu = !showMenu;
	}

	function closeMenu() {
		showMenu = false;
	}

	function onDurationChange(value: string) {
		if (value === 'source') {
			videoDurationMode = 'source';
			return;
		}
		const sec = Number(value) as AnimationDuration;
		videoDurationMode = sec;
		setAnimationDuration(sec);
	}

	function onFpsChange(value: string) {
		setAnimationFps(Number(value) as AnimationFps);
	}

	function download() {
		if (!renderer?.hasImage() || !currentSize) return;
		const url = renderer.exportImage($appliedEffects, {
			format: format as ExportFormat,
			width: currentSize.width,
			height: currentSize.height
		});
		downloadDataUrl(url, getExportFilename(format as ExportFormat));
		closeMenu();
	}

	async function downloadVideo() {
		if (!renderer?.hasImage() || !currentSize || exporting) return;
		const videoFormat = format as VideoExportFormat;
		if (!isVideoExportFormatSupported(videoFormat)) return;

		exporting = true;
		exportSessionActive.set(true);
		exportProgress = '';
		try {
			const blob = await exportAnimationVideo(
				renderer,
				renderer.canvasElement,
				$appliedEffects,
				{
					duration: exportDurationSec,
					fps: $animation.fps,
					width: currentSize.width,
					height: currentSize.height,
					loopPeriod: sourceVideo ? undefined : $animation.duration,
					mimeType: getMimeTypeForVideoExport(videoFormat) ?? undefined,
					onProgress: (frame, total) => {
						exportProgress = `${frame}/${total}`;
					},
					resolveAtTime: (time) =>
						resolveEffectsAtTime($appliedEffects, get(keyframeTracks), time)
				},
				videoFormat,
				sourceVideo
			);
			downloadBlob(blob, getAnimationExportFilename(videoFormat));
			closeMenu();
		} catch (err) {
			exportProgress = err instanceof Error ? err.message : 'Export failed';
		} finally {
			exporting = false;
			exportSessionActive.set(false);
		}
	}

	function downloadLayers() {
		if (!renderer?.hasImage() || !currentSize || $appliedEffects.length === 0) return;
		const frames = exportLayerSequence(renderer, $appliedEffects, {
			format: format as ExportFormat,
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
					{#if mp4Supported}
						<option value="mp4">{$i18n.t('export.mp4')}</option>
					{/if}
					{#if webmSupported}
						<option value="webm">{$i18n.t('export.webm')}</option>
					{/if}
				</select>
			</div>

			{#if isVideoExport}
				<div class="export-field">
					<label class="export-label" for="export-duration">{$i18n.t('export.animation')}</label>
					<select
						id="export-duration"
						class="export-select"
						value={videoDurationMode === 'source' ? 'source' : String(videoDurationMode)}
						onchange={(e) => onDurationChange(e.currentTarget.value)}
					>
						{#if sourceClipDuration != null}
							<option value="source">
								{$i18n.t('export.animationSource', {
									duration: formatDurationLabel(sourceClipDuration)
								})}
							</option>
						{/if}
						<option value="5">{$i18n.t('export.animation5s')}</option>
						<option value="10">{$i18n.t('export.animation10s')}</option>
					</select>
				</div>

				{#if sourceClipCapped}
					<p class="export-hint">{$i18n.t('export.durationCapped', { max: MAX_VIDEO_EXPORT_DURATION_SEC })}</p>
				{/if}

				<p class="export-hint">
					{$i18n.t('export.exportSummary', {
						duration: formatDurationLabel(exportDurationSec),
						frames: exportFrameCount,
						fps: $animation.fps
					})}
				</p>

				<div class="export-field">
					<label class="export-label" for="export-fps">{$i18n.t('export.frameRate')}</label>
					<select
						id="export-fps"
						class="export-select"
						value={String($animation.fps)}
						onchange={(e) => onFpsChange(e.currentTarget.value)}
					>
						<option value="24">24 FPS</option>
						<option value="30">30 FPS</option>
						<option value="60">60 FPS</option>
					</select>
				</div>
			{/if}

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

			{#if exportProgress}
				<p class="export-progress">{exportProgress}</p>
			{/if}

			{#if isVideoExport}
				<button
					class="btn-download"
					onclick={downloadVideo}
					disabled={!currentSize || currentSize.tooLarge || exporting}
				>
					{exporting
						? $i18n.t('export.exporting')
						: format === 'mp4'
							? $i18n.t('export.downloadMp4')
							: $i18n.t('export.downloadWebm')}
				</button>
			{:else}
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
			{/if}
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
		width: 260px;
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

	.export-hint {
		font-size: var(--text-2xs);
		color: var(--text-muted);
		line-height: 1.4;
		margin: -4px 0 0;
	}

	.export-warn {
		font-size: var(--text-2xs);
		color: var(--text-danger);
		line-height: 1.4;
		margin: -4px 0 0;
	}

	.export-progress {
		font-size: var(--text-xs);
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
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
