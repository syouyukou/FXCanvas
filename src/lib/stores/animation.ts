import { derived, get, writable } from 'svelte/store';
import type { AppliedEffect } from '../engine/renderer';
import { appliedEffects } from './editor';
import { isVideoSource } from './editor';
import { hasKeyframes } from './keyframes';

export type AnimationDuration = 5 | 10;
export type AnimationFps = 24 | 30 | 60;

export interface AnimationState {
	/** Loop preview clock for static images and shader-driven motion. */
	previewEnabled: boolean;
	duration: AnimationDuration;
	fps: AnimationFps;
	playing: boolean;
	currentTime: number;
}

export const animation = writable<AnimationState>({
	previewEnabled: true,
	duration: 5,
	fps: 30,
	playing: true,
	currentTime: 0
});

/** Effects that read u_time when animmode > 0. */
export function stackNeedsTimeLoop(effects: AppliedEffect[]): boolean {
	for (const item of effects) {
		if (!item.effect.enabled) continue;
		const mode = item.params.animmode;
		if (typeof mode === 'number' && mode > 0) return true;
	}
	return false;
}

/** Stack has shader motion, keyframes, or video — show timeline + run preview clock. */
export const needsAnimationUi = derived(
	[appliedEffects, isVideoSource, hasKeyframes],
	([$effects, $video, $keyframes]) =>
		Boolean($video) || $keyframes || stackNeedsTimeLoop($effects)
);

/** @deprecated alias — use needsAnimationUi */
export const needsPreviewLoop = needsAnimationUi;

export function setAnimationTime(time: number) {
	animation.update((s) => ({
		...s,
		currentTime: Math.max(0, Math.min(time, s.duration))
	}));
}

export function resetAnimationClock() {
	animation.update((s) => ({ ...s, currentTime: 0 }));
}

export function toggleAnimationPlayback() {
	animation.update((s) => ({ ...s, playing: !s.playing }));
}

export function setAnimationDuration(duration: AnimationDuration) {
	animation.update((s) => ({
		...s,
		duration,
		currentTime: Math.min(s.currentTime, duration)
	}));
}

export function setAnimationFps(fps: AnimationFps) {
	animation.update((s) => ({ ...s, fps }));
}

export function advanceAnimationClock(deltaSec: number) {
	animation.update((s) => {
		if (!s.playing || !s.previewEnabled) return s;
		let next = s.currentTime + deltaSec;
		if (next >= s.duration) next = next % s.duration;
		return { ...s, currentTime: next };
	});
}

export function getRenderClock(
	anim: AnimationState,
	video: HTMLVideoElement | null
): { time: number; frame: number; duration: number } {
	const duration =
		video && Number.isFinite(video.duration) && video.duration > 0
			? video.duration
			: anim.duration;

	if (video) {
		const time = video.currentTime % duration;
		return {
			time,
			frame: Math.floor(time * anim.fps),
			duration
		};
	}

	return {
		time: anim.currentTime,
		frame: Math.floor(anim.currentTime * anim.fps),
		duration: anim.duration
	};
}

export function getRenderClockFromStores(video: HTMLVideoElement | null) {
	return getRenderClock(get(animation), video);
}
