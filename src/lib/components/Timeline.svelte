<script lang="ts">
	import { sourceImage } from '$lib/stores/editor';
	import {
		animation,
		needsAnimationUi,
		setAnimationDuration,
		setAnimationFps,
		setAnimationTime,
		toggleAnimationPlayback,
		type AnimationDuration,
		type AnimationFps
	} from '$lib/stores/animation';
	import { keyframeTracks } from '$lib/stores/keyframes';
	import { i18n } from '$lib/i18n';

	let scrubbing = $state(false);
	let trackEl = $state<HTMLDivElement | null>(null);

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
		return `${sec.toFixed(1)}s`;
	}

	function seekFromClientX(clientX: number) {
		if (!trackEl) return;
		const rect = trackEl.getBoundingClientRect();
		const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		setAnimationTime(ratio * $animation.duration);
	}

	function onTrackPointerDown(e: PointerEvent) {
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

{#if $sourceImage && $needsAnimationUi}
	<div class="timeline" aria-label={$i18n.t('timeline.aria')}>
		<div class="timeline-toolbar">
			<button
				class="tl-btn"
				type="button"
				onclick={toggleAnimationPlayback}
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

			<span class="tl-hint">{$i18n.t('timeline.hint')}</span>
		</div>

		<div
			class="timeline-track"
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

	.tl-btn:hover {
		color: var(--text-primary);
		border-color: var(--border-strong);
	}

	.tl-time {
		font-size: 11px;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
		min-width: 72px;
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
