import type { AppliedEffect, EffectParam } from './renderer';

export type KeyframeEasing = 'linear' | 'easeInOut' | 'hold';

export interface Keyframe {
	time: number;
	value: number;
	easing?: KeyframeEasing;
}

export interface ParamTrack {
	layerId: string;
	paramName: string;
	keyframes: Keyframe[];
}

export const OPACITY_PARAM = '__opacity__';

export function isKeyframeableParam(param: EffectParam): boolean {
	return param.type === 'float' || param.type === 'int';
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

function easeInOut(t: number): number {
	return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function applyEasing(t: number, easing: KeyframeEasing = 'linear'): number {
	if (easing === 'hold') return 0;
	if (easing === 'easeInOut') return easeInOut(t);
	return t;
}

export function sampleTrack(track: ParamTrack, time: number): number | null {
	const kfs = [...track.keyframes].sort((a, b) => a.time - b.time);
	if (kfs.length === 0) return null;
	if (kfs.length === 1) return kfs[0].value;
	if (time <= kfs[0].time) return kfs[0].value;
	if (time >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value;

	for (let i = 0; i < kfs.length - 1; i++) {
		const a = kfs[i];
		const b = kfs[i + 1];
		if (time >= a.time && time <= b.time) {
			const span = b.time - a.time;
			if (span <= 0) return a.value;
			const local = (time - a.time) / span;
			const eased = applyEasing(local, b.easing ?? 'linear');
			return lerp(a.value, b.value, eased);
		}
	}

	return kfs[kfs.length - 1].value;
}

export function resolveLayerId(item: AppliedEffect, index: number): string {
	return item.layerId ?? `layer-${index}`;
}

/** Apply keyframe tracks at `time` without mutating the source stack. */
export function resolveEffectsAtTime(
	effects: AppliedEffect[],
	tracks: ParamTrack[],
	time: number
): AppliedEffect[] {
	if (tracks.length === 0) return effects;

	const trackMap = new Map<string, ParamTrack>();
	for (const track of tracks) {
		trackMap.set(`${track.layerId}:${track.paramName}`, track);
	}

	return effects.map((item, index) => {
		const layerId = resolveLayerId(item, index);
		let nextParams = item.params;
		let nextOpacity = item.opacity ?? 1;
		let paramsChanged = false;

		for (const param of item.effect.params) {
			if (!isKeyframeableParam(param)) continue;
			const track = trackMap.get(`${layerId}:${param.name}`);
			if (!track) continue;
			const sampled = sampleTrack(track, time);
			if (sampled === null) continue;
			if (!paramsChanged) {
				nextParams = { ...item.params };
				paramsChanged = true;
			}
			nextParams[param.name] =
				param.type === 'int' ? Math.round(sampled) : parseFloat(sampled.toFixed(4));
		}

		const opacityTrack = trackMap.get(`${layerId}:${OPACITY_PARAM}`);
		if (opacityTrack) {
			const sampled = sampleTrack(opacityTrack, time);
			if (sampled !== null) nextOpacity = Math.min(1, Math.max(0, sampled));
		}

		if (!paramsChanged && nextOpacity === (item.opacity ?? 1)) return item;
		return { ...item, params: nextParams, opacity: nextOpacity };
	});
}

export function getNumericParamValue(item: AppliedEffect, paramName: string): number | null {
	if (paramName === OPACITY_PARAM) return item.opacity ?? 1;
	const param = item.effect.params.find((p) => p.name === paramName);
	if (!param || !isKeyframeableParam(param)) return null;
	const raw = item.params[param.name] ?? param.default;
	return typeof raw === 'number' ? raw : Number(raw);
}
