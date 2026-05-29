import { derived, get, writable } from 'svelte/store';
import type { AppliedEffect } from '../engine/renderer';
import { appliedEffects } from './editor';
import { isVideoSource } from './editor';
import { hasKeyframes } from './keyframes';

export type AnimationDuration = 5 | 10;
export type AnimationFps = 24 | 30 | 60;
/** effect.app-style preview: Off = static, 5/10 = looped clip length. */
export type AnimationMode = 'off' | 5 | 10;

export interface AnimationState {
	mode: AnimationMode;
	duration: AnimationDuration;
	fps: AnimationFps;
	playing: boolean;
	currentTime: number;
}

/** Effects whose shaders read u_time when animation preview is active. */
export const TIME_DRIVEN_EFFECT_IDS = new Set([
	'msx_ascii',
	'glitch_digital',
	'glitch_vhs',
	'modulation_dither',
	'crt'
]);

export const animation = writable<AnimationState>({
	mode: 'off',
	duration: 5,
	fps: 30,
	playing: true,
	currentTime: 0
});

export const animationPreviewActive = derived(animation, ($a) => $a.mode !== 'off');

/** Shader motion: animmode, animate param, or time-driven effect catalog. */
export function stackNeedsTimeLoop(effects: AppliedEffect[]): boolean {
	for (const item of effects) {
		if (!item.effect.enabled) continue;
		const mode = item.params.animmode;
		if (typeof mode === 'number' && mode > 0) return true;
		const animate = item.params.animate;
		if (typeof animate === 'number' && animate > 0.01) return true;
		if (TIME_DRIVEN_EFFECT_IDS.has(item.effect.id)) return true;
	}
	return false;
}

/** Show timeline + run preview clock (effect.app Animate). */
export const needsAnimationUi = derived(
	[appliedEffects, isVideoSource, hasKeyframes, animationPreviewActive],
	([$effects, $video, $keyframes, $preview]) =>
		Boolean($video) || $keyframes || $preview || stackNeedsTimeLoop($effects)
);

/** @deprecated alias — use needsAnimationUi */
export const needsPreviewLoop = needsAnimationUi;

export function setAnimationMode(mode: AnimationMode) {
	animation.update((s) => {
		const duration = mode === 10 ? 10 : 5;
		return {
			...s,
			mode,
			duration: mode === 'off' ? s.duration : duration,
			currentTime: mode === 'off' ? 0 : Math.min(s.currentTime, duration),
			playing: mode === 'off' ? false : s.playing
		};
	});
}

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
		mode: duration,
		duration,
		currentTime: Math.min(s.currentTime, duration)
	}));
}

export function setAnimationFps(fps: AnimationFps) {
	animation.update((s) => ({ ...s, fps }));
}

export function advanceAnimationClock(deltaSec: number) {
	animation.update((s) => {
		if (!s.playing || s.mode === 'off') return s;
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

	if (anim.mode === 'off') {
		return { time: 0, frame: 0, duration: anim.duration };
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
