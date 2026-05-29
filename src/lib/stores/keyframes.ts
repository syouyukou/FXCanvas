import { derived, get, writable } from 'svelte/store';
import { appliedEffects, activeLayerIndex } from './editor';
import {
	getNumericParamValue,
	OPACITY_PARAM,
	resolveLayerId,
	type ParamTrack
} from '../engine/keyframeEngine';

const TIME_EPS = 0.04;

export const keyframeTracks = writable<ParamTrack[]>([]);

export const hasKeyframes = derived(keyframeTracks, ($tracks) =>
	$tracks.some((t) => t.keyframes.length > 0)
);

export function pruneKeyframeTracks(layerId: string) {
	keyframeTracks.update((tracks) => tracks.filter((t) => t.layerId !== layerId));
}

export function clearAllKeyframeTracks() {
	keyframeTracks.set([]);
}

function upsertTrack(
	tracks: ParamTrack[],
	layerId: string,
	paramName: string,
	mutate: (track: ParamTrack) => ParamTrack | null
): ParamTrack[] {
	const idx = tracks.findIndex((t) => t.layerId === layerId && t.paramName === paramName);
	if (idx === -1) {
		const created = mutate({ layerId, paramName, keyframes: [] });
		return created ? [...tracks, created] : tracks;
	}
	const next = mutate(tracks[idx]);
	if (!next || next.keyframes.length === 0) {
		return tracks.filter((_, i) => i !== idx);
	}
	return tracks.map((t, i) => (i === idx ? next : t));
}

export function addKeyframe(
	layerId: string,
	paramName: string,
	time: number,
	value: number
) {
	const t = Math.max(0, time);
	keyframeTracks.update((tracks) =>
		upsertTrack(tracks, layerId, paramName, (track) => {
			const without = track.keyframes.filter((k) => Math.abs(k.time - t) > TIME_EPS);
			return {
				...track,
				keyframes: [...without, { time: t, value }].sort((a, b) => a.time - b.time)
			};
		})
	);
}

export function removeKeyframeNear(layerId: string, paramName: string, time: number) {
	keyframeTracks.update((tracks) =>
		upsertTrack(tracks, layerId, paramName, (track) => ({
			...track,
			keyframes: track.keyframes.filter((k) => Math.abs(k.time - time) > TIME_EPS)
		}))
	);
}

export function toggleKeyframeAtTime(layerId: string, paramName: string, time: number, value: number) {
	const tracks = get(keyframeTracks);
	const track = tracks.find((t) => t.layerId === layerId && t.paramName === paramName);
	const exists = track?.keyframes.some((k) => Math.abs(k.time - time) <= TIME_EPS);
	if (exists) removeKeyframeNear(layerId, paramName, time);
	else addKeyframe(layerId, paramName, time, value);
}

export function hasKeyframeAt(layerId: string, paramName: string, time: number): boolean {
	const track = get(keyframeTracks).find(
		(t) => t.layerId === layerId && t.paramName === paramName
	);
	return track?.keyframes.some((k) => Math.abs(k.time - time) <= TIME_EPS) ?? false;
}

export function toggleActiveParamKeyframe(time: number, paramName: string) {
	const index = get(activeLayerIndex);
	const list = get(appliedEffects);
	const item = list[index];
	if (!item || index < 0) return;
	const layerId = resolveLayerId(item, index);
	const value = getNumericParamValue(item, paramName);
	if (value === null) return;
	toggleKeyframeAtTime(layerId, paramName, time, value);
}

export function getTrackMarkers(duration: number): { time: number; layerId: string; paramName: string }[] {
	const markers: { time: number; layerId: string; paramName: string }[] = [];
	for (const track of get(keyframeTracks)) {
		for (const kf of track.keyframes) {
			if (kf.time <= duration + TIME_EPS) {
				markers.push({ time: kf.time, layerId: track.layerId, paramName: track.paramName });
			}
		}
	}
	return markers;
}

export { OPACITY_PARAM };
