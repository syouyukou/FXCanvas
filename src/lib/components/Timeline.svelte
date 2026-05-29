<script lang="ts">
	import { sourceImage } from '$lib/stores/editor';
	import {
		animation,
		animationPreviewActive,
		setAnimationDuration,
		setAnimationFps,
		setAnimationMode,
		setAnimationTime,
		toggleAnimationPlayback,
		type AnimationDuration,
		type AnimationFps,
		type AnimationMode
	} from '$lib/stores/animation';
	import { keyframeTracks } from '$lib/stores/keyframes';
	import { i18n } from '$lib/i18n';

	let scrubbing = $state(false);
	let trackEl = $state<HTMLDivElement | null>(null);

	const MODES: AnimationMode[] = ['off', 5, 10];

	let showTrack = $derived(
		$animationPreviewActive ||
			$keyframeTracks.length > 0 ||
			($sourceImage instanceof HTMLVideoElement)
	);

	let markers = $derived.by(() => {
		void $keyframeTracks;
		const out: number[] = [];
		for (const track of $keyframeTracks) {
			for (const kf of track.keyframes) {
				if (kf.time <= $animation.duration && !out.some((t) => Math.abs(t - kf.time) < 0.02)) {
					out.push(kf.time);
				}
			}
		}
		return out.sort((a, b) => a - b);
	});

	function formatTime(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		if (m > 0) return `${m}:${s.toFixed(1).padStart(4, '0')}`;
		return `${s.toFixed(1)}s`;
	}

	function seekFromClientX(clientX: number) {
		if (!trackEl) return;
		const rect = trackEl.getBoundingClientRect();
		const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		setAnimationTime(ratio * $animation.duration);
	}

	function onTrackPointerDown(e: PointerEvent) {
		if ($animation.mode === 'off') return;
		scrubbing = true;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		seekFromClientX(e.clientX);
	}

	function onTrackPointerMove(e: PointerEvent) {
		if (!scrubbing) return;
		seekFromClientX(e.clientX);
	}

	function onTrackPointerUp(e: PointerEvent) {
		scrubbing = false;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
	}

	function onModeClick(mode: AnimationMode) {
		setAnimationMode(mode);
	}

	function onDurationChange(value: string) {
		setAnimationDuration(Number(value) as AnimationDuration);
	}

	function onFpsChange(value: string) {
		setAnimationFps(Number(value) as AnimationFps);
	}

	const playheadPct = $derived(
		$animation.duration > 0 ? ($animation.currentTime / $animation.duration) * 100 : 0
	);
</script>

{#if $sourceImage}
	<div class="timeline" aria-label={$i18n.t('timeline.aria')}>
		<div class="timeline-toolbar">
			<span class="tl-label">{$i18n.t('timeline.animation')}</span>
			<div class="tl-mode" role="group" aria-label={$i18n.t('timeline.animation')}>
				{#each MODES as mode (mode)}
					<button
						type="button"
						class="tl-mode-btn"
						class:active={$animation.mode === mode}
						onclick={() => onModeClick(mode)}
					>
						{mode === 'off' ? $i18n.t('timeline.off') : `${mode}s`}
					</button>
				{/each}
			</div>

			{#if showTrack}
				<button
					class="tl-btn"
					type="button"
					onclick={toggleAnimationPlayback}
					disabled={$animation.mode === 'off' && $keyframeTracks.length === 0}
					title={$animation.playing ? $i18n.t('timeline.pause') : $i18n.t('timeline.play')}
				>
					{#if $animation.playing}
						<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
							<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
						</svg>
					{:else}
						<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="5,3 19,12 5,21"/>
						</svg>
					{/if}
				</button>

				<span class="tl-time">
					{formatTime($animation.currentTime)} / {formatTime($animation.duration)}
				</span>

				<select
					class="tl-select"
					value={String($animation.duration)}
					onchange={(e) => onDurationChange(e.currentTarget.value)}
					aria-label={$i18n.t('timeline.duration')}
				>
					<option value="5">5s</option>
					<option value="10">10s</option>
				</select>

				<select
					class="tl-select"
					value={String($animation.fps)}
					onchange={(e) => onFpsChange(e.currentTarget.value)}
					aria-label={$i18n.t('timeline.fps')}
				>
					<option value="24">24</option>
					<option value="30">30</option>
					<option value="60">60</option>
				</select>
			{/if}

			<span class="tl-hint">{$i18n.t('timeline.hint')}</span>
		</div>

		{#if showTrack}
			<div
				class="timeline-track"
				class:disabled={$animation.mode === 'off' && $keyframeTracks.length === 0}
				bind:this={trackEl}
				role="slider"
				tabindex="0"
				aria-valuemin={0}
				aria-valuemax={$animation.duration}
				aria-valuenow={$animation.currentTime}
				aria-label={$i18n.t('timeline.scrub')}
				onpointerdown={onTrackPointerDown}
				onpointermove={onTrackPointerMove}
				onpointerup={onTrackPointerUp}
				onpointercancel={onTrackPointerUp}
			>
				<div class="timeline-rail"></div>
				{#each markers as time (time)}
					<span class="timeline-marker" style:left="{(time / $animation.duration) * 100}%"></span>
				{/each}
				<div class="timeline-playhead" style:left="{playheadPct}%"></div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.timeline {
		flex-shrink: 0;
		background: var(--bg-surface);
		border-top: 1px solid var(--border-subtle);
		padding: 8px 12px 10px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.timeline-toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 24px;
		flex-wrap: wrap;
	}

	.tl-label {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-faint);
	}

	.tl-mode {
		display: flex;
		border: 1px solid var(--border-default);
		border-radius: 4px;
		overflow: hidden;
	}

	.tl-mode-btn {
		background: var(--bg-app);
		border: none;
		border-right: 1px solid var(--border-default);
		color: var(--text-muted);
		font-size: 11px;
		font-family: var(--font-mono);
		padding: 3px 10px;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.tl-mode-btn:last-child {
		border-right: none;
	}

	.tl-mode-btn:hover {
		color: var(--text-secondary);
		background: var(--bg-hover);
	}

	.tl-mode-btn.active {
		background: var(--bg-light);
		color: var(--text-on-light);
	}

	.tl-btn {
		background: none;
		border: 1px solid var(--border-default);
		border-radius: 4px;
		color: var(--text-secondary);
		width: 28px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: color var(--transition-fast), border-color var(--transition-fast);
	}

	.tl-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.tl-btn:hover:not(:disabled) {
		color: var(--text-primary);
		border-color: var(--border-strong);
	}

	.tl-time {
		font-size: 11px;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
		min-width: 88px;
	}

	.tl-select {
		background: var(--bg-app);
		border: 1px solid var(--border-default);
		border-radius: 4px;
		color: var(--text-secondary);
		font-size: 11px;
		padding: 2px 6px;
		cursor: pointer;
	}

	.tl-hint {
		font-size: 11px;
		color: var(--text-faint);
		margin-left: auto;
	}

	.timeline-track {
		position: relative;
		height: 20px;
		cursor: pointer;
		touch-action: none;
	}

	.timeline-track.disabled {
		opacity: 0.45;
		cursor: default;
	}

	.timeline-rail {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 4px;
		transform: translateY(-50%);
		background: var(--border-default);
		border-radius: 2px;
	}

	.timeline-marker {
		position: absolute;
		top: 50%;
		width: 6px;
		height: 6px;
		transform: translate(-50%, -50%) rotate(45deg);
		background: #5dade2;
		border: 1px solid #2e86c1;
		pointer-events: none;
	}

	.timeline-playhead {
		position: absolute;
		top: 2px;
		bottom: 2px;
		width: 2px;
		transform: translateX(-50%);
		background: var(--text-primary);
		pointer-events: none;
	}

	.timeline-playhead::before {
		content: '';
		position: absolute;
		top: -2px;
		left: 50%;
		transform: translateX(-50%);
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-top: 5px solid var(--text-primary);
	}
</style>
