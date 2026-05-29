import type { AppliedEffect, Renderer } from './renderer';

export type VideoExportFormat = 'webm' | 'mp4';

/** Pro-tier cap aligned with effect.app reference (120s). */
export const MAX_VIDEO_EXPORT_DURATION_SEC = 120;

export type VideoExportDurationMode = 'source' | 5 | 10;

export interface AnimationExportOptions {
	duration: number;
	fps: 24 | 30 | 60;
	width: number;
	height: number;
	mimeType?: string;
	/**
	 * Shader loop period for still images (matches preview `animation.duration`).
	 * When set, u_time uses linearTime % loopPeriod like the preview clock.
	 */
	loopPeriod?: number;
	onProgress?: (frame: number, total: number) => void;
	resolveAtTime?: (time: number) => AppliedEffect[];
}

function waitUntil(targetMs: number): Promise<void> {
	const delay = targetMs - performance.now();
	if (delay <= 0) return Promise.resolve();
	return new Promise((resolve) => setTimeout(resolve, delay));
}

/** Map export frame index to shader clock (preview-aligned). */
export function shaderClockAtFrame(
	linearTime: number,
	frame: number,
	exportDuration: number,
	loopPeriod?: number
): { time: number; duration: number; frame: number } {
	if (loopPeriod != null && loopPeriod > 0) {
		return {
			time: linearTime % loopPeriod,
			duration: loopPeriod,
			frame
		};
	}
	return {
		time: linearTime,
		duration: exportDuration,
		frame
	};
}

const WEBM_CANDIDATES = [
	'video/webm;codecs=vp9',
	'video/webm;codecs=vp8',
	'video/webm'
];

const MP4_CANDIDATES = ['video/mp4;codecs=avc1', 'video/mp4'];

export function getSupportedWebmMimeType(): string | null {
	return pickMimeType(WEBM_CANDIDATES);
}

export function getSupportedMp4MimeType(): string | null {
	return pickMimeType(MP4_CANDIDATES);
}

function pickMimeType(candidates: string[]): string | null {
	if (typeof MediaRecorder === 'undefined') return null;
	for (const type of candidates) {
		if (MediaRecorder.isTypeSupported(type)) return type;
	}
	return null;
}

export function isVideoExportFormatSupported(format: VideoExportFormat): boolean {
	return format === 'mp4' ? getSupportedMp4MimeType() !== null : getSupportedWebmMimeType() !== null;
}

export function getPreferredVideoExportFormat(): VideoExportFormat | null {
	if (getSupportedMp4MimeType()) return 'mp4';
	if (getSupportedWebmMimeType()) return 'webm';
	return null;
}

export function getMimeTypeForVideoExport(format: VideoExportFormat): string | null {
	return format === 'mp4' ? getSupportedMp4MimeType() : getSupportedWebmMimeType();
}

/** Seconds to render for video/animation export. */
export function resolveVideoExportDuration(
	video: HTMLVideoElement | null,
	mode: VideoExportDurationMode,
	fallbackSeconds: number = 5
): number {
	if (mode === 'source' && video && Number.isFinite(video.duration) && video.duration > 0) {
		return Math.min(video.duration, MAX_VIDEO_EXPORT_DURATION_SEC);
	}
	if (mode === 5 || mode === 10) return mode;
	return Math.min(Math.max(0.1, fallbackSeconds), MAX_VIDEO_EXPORT_DURATION_SEC);
}

export function formatDurationLabel(seconds: number): string {
	if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`;
	const m = Math.floor(seconds / 60);
	const s = Math.round(seconds % 60);
	return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function waitForRecorderStop(recorder: MediaRecorder): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const chunks: BlobPart[] = [];
		recorder.ondataavailable = (e) => {
			if (e.data.size > 0) chunks.push(e.data);
		};
		recorder.onerror = () => reject(new Error('MediaRecorder failed'));
		recorder.onstop = () =>
			resolve(
				new Blob(chunks, {
					type: recorder.mimeType || 'video/webm'
				})
			);
	});
}

const SEEK_TIMEOUT_MS = 8000;

function seekVideoTo(video: HTMLVideoElement, time: number): Promise<void> {
	return new Promise((resolve, reject) => {
		const clamped = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.001));
		const timeout = window.setTimeout(() => {
			video.removeEventListener('seeked', onSeeked);
			reject(new Error('Video seek timed out'));
		}, SEEK_TIMEOUT_MS);
		const onSeeked = () => {
			window.clearTimeout(timeout);
			video.removeEventListener('seeked', onSeeked);
			resolve();
		};
		video.addEventListener('seeked', onSeeked);
		if (Math.abs(video.currentTime - clamped) < 0.0005) {
			window.clearTimeout(timeout);
			video.removeEventListener('seeked', onSeeked);
			resolve();
			return;
		}
		video.currentTime = clamped;
	});
}

async function ensureVideoFrameReady(video: HTMLVideoElement): Promise<void> {
	if (video.readyState >= 2) return;
	await new Promise<void>((resolve, reject) => {
		const timeout = window.setTimeout(() => reject(new Error('Video frame not ready')), SEEK_TIMEOUT_MS);
		video.addEventListener(
			'loadeddata',
			() => {
				window.clearTimeout(timeout);
				resolve();
			},
			{ once: true }
		);
	});
}

/** Render frames into WebM or MP4 via canvas.captureStream + MediaRecorder. */
export async function exportAnimationVideo(
	renderer: Renderer,
	canvas: HTMLCanvasElement,
	effects: AppliedEffect[],
	options: AnimationExportOptions,
	format: VideoExportFormat,
	video: HTMLVideoElement | null = null
): Promise<Blob> {
	const mimeType = options.mimeType ?? getMimeTypeForVideoExport(format);
	if (!mimeType) {
		throw new Error(
			format === 'mp4'
				? 'MP4 export is not supported in this browser (try Chrome or Safari)'
				: 'WebM export is not supported in this browser (try Chrome or Firefox)'
		);
	}

	const totalFrames = Math.max(1, Math.round(options.duration * options.fps));
	const track = canvas.captureStream(0).getVideoTracks()[0] as MediaStreamTrack & {
		requestFrame?: () => void;
	};
	const stream = new MediaStream([track]);
	const recorder = new MediaRecorder(stream, {
		mimeType,
		videoBitsPerSecond: 8_000_000
	});

	const wasPlaying = video ? !video.paused : false;
	const resumeTime = video?.currentTime ?? 0;
	if (video) {
		video.pause();
		await seekVideoTo(video, 0);
		await ensureVideoFrameReady(video);
	}

	const renderFrame = async (frame: number) => {
		const linearTime = Math.min(frame / options.fps, options.duration - 1e-6);
		const clock = shaderClockAtFrame(
			linearTime,
			frame,
			options.duration,
			options.loopPeriod
		);
		if (video) {
			await seekVideoTo(video, linearTime);
			await ensureVideoFrameReady(video);
			renderer.updateVideoFrame(video);
		}
		const stack = options.resolveAtTime?.(linearTime) ?? effects;
		renderer.render(stack, {
			width: options.width,
			height: options.height,
			time: clock.time,
			frame: clock.frame,
			duration: clock.duration
		});
		renderer.flush();
	};

	// captureStream(0) timestamps follow wall clock — pace requestFrame at 1/fps so playback matches preview.
	const t0 = performance.now();
	const framePeriodMs = 1000 / options.fps;

	recorder.start();
	const stopped = waitForRecorderStop(recorder);

	try {
		for (let frame = 0; frame < totalFrames; frame++) {
			await waitUntil(t0 + frame * framePeriodMs);
			await renderFrame(frame);
			track.requestFrame?.();
			options.onProgress?.(frame + 1, totalFrames);
		}
		await waitUntil(t0 + totalFrames * framePeriodMs);
	} finally {
		if (video) {
			try {
				await seekVideoTo(video, resumeTime);
				renderer.updateVideoFrame(video);
			} catch {
				/* restore best-effort */
			}
			if (wasPlaying) void video.play();
		}
	}

	recorder.stop();
	return stopped;
}

/** @deprecated Use exportAnimationVideo */
export async function exportAnimationWebm(
	renderer: Renderer,
	canvas: HTMLCanvasElement,
	effects: AppliedEffect[],
	options: AnimationExportOptions,
	video: HTMLVideoElement | null = null
): Promise<Blob> {
	return exportAnimationVideo(renderer, canvas, effects, options, 'webm', video);
}

export { downloadBlob } from './downloadFile';

export function getAnimationExportFilename(format: VideoExportFormat): string {
	return `effect-export.${format}`;
}

export function getAnimationFramesExportPattern(): string {
	return 'frame-{frame}.png';
}

/** Render PNG sequence for animation export (effect.app Frames). */
export async function exportAnimationFrames(
	renderer: Renderer,
	effects: AppliedEffect[],
	options: AnimationExportOptions,
	video: HTMLVideoElement | null = null
): Promise<{ filename: string; url: string }[]> {
	const totalFrames = Math.max(1, Math.round(options.duration * options.fps));
	const frames: { filename: string; url: string }[] = [];
	const wasPlaying = video ? !video.paused : false;
	const resumeTime = video?.currentTime ?? 0;

	if (video) {
		video.pause();
		await seekVideoTo(video, 0);
		await ensureVideoFrameReady(video);
	}

	try {
		for (let frame = 0; frame < totalFrames; frame++) {
			const linearTime = Math.min(frame / options.fps, options.duration - 1e-6);
			const clock = shaderClockAtFrame(
				linearTime,
				frame,
				options.duration,
				options.loopPeriod
			);
			if (video) {
				await seekVideoTo(video, linearTime);
				await ensureVideoFrameReady(video);
				renderer.updateVideoFrame(video);
			}
			const stack = options.resolveAtTime?.(linearTime) ?? effects;
			renderer.render(stack, {
				width: options.width,
				height: options.height,
				time: clock.time,
				frame: clock.frame,
				duration: clock.duration
			});
			renderer.flush();
			const url = renderer.exportImage(stack, {
				format: 'png',
				width: options.width,
				height: options.height
			});
			const pad = String(frame + 1).padStart(4, '0');
			frames.push({ filename: `frame-${pad}.png`, url });
			options.onProgress?.(frame + 1, totalFrames);
		}
	} finally {
		if (video) {
			try {
				await seekVideoTo(video, resumeTime);
				renderer.updateVideoFrame(video);
			} catch {
				/* restore best-effort */
			}
			if (wasPlaying) void video.play();
		}
	}

	return frames;
}
