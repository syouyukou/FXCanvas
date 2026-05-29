import type { AppliedEffect, Renderer } from './renderer';

export type VideoExportFormat = 'webm';

export interface AnimationExportOptions {
	duration: number;
	fps: 24 | 30 | 60;
	width: number;
	height: number;
	mimeType?: string;
	onProgress?: (frame: number, total: number) => void;
	resolveAtTime?: (time: number) => AppliedEffect[];
}

const WEBM_CANDIDATES = [
	'video/webm;codecs=vp9',
	'video/webm;codecs=vp8',
	'video/webm'
];

export function getSupportedWebmMimeType(): string | null {
	if (typeof MediaRecorder === 'undefined') return null;
	for (const type of WEBM_CANDIDATES) {
		if (MediaRecorder.isTypeSupported(type)) return type;
	}
	return null;
}

function waitForRecorderStop(recorder: MediaRecorder): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const chunks: BlobPart[] = [];
		recorder.ondataavailable = (e) => {
			if (e.data.size > 0) chunks.push(e.data);
		};
		recorder.onerror = () => reject(new Error('MediaRecorder failed'));
		recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
	});
}

/** Render frames into a WebM via canvas.captureStream + MediaRecorder. */
export async function exportAnimationWebm(
	renderer: Renderer,
	canvas: HTMLCanvasElement,
	effects: AppliedEffect[],
	options: AnimationExportOptions,
	video: HTMLVideoElement | null = null
): Promise<Blob> {
	const mimeType = options.mimeType ?? getSupportedWebmMimeType();
	if (!mimeType) {
		throw new Error('WebM export is not supported in this browser');
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

	recorder.start();
	const stopped = waitForRecorderStop(recorder);

	const seekVideo = (time: number) =>
		new Promise<void>((resolve) => {
			if (!video) {
				resolve();
				return;
			}
			const onSeeked = () => {
				video.removeEventListener('seeked', onSeeked);
				resolve();
			};
			video.addEventListener('seeked', onSeeked);
			video.currentTime = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.001));
		});

	for (let frame = 0; frame < totalFrames; frame++) {
		const time = frame / options.fps;
		if (video) {
			await seekVideo(time);
			renderer.updateVideoFrame(video);
		}
		const stack = options.resolveAtTime?.(time) ?? effects;
		renderer.render(stack, {
			width: options.width,
			height: options.height,
			time,
			frame,
			duration: options.duration
		});
		track.requestFrame?.();
		options.onProgress?.(frame + 1, totalFrames);
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	}

	recorder.stop();
	return stopped;
}

export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function getAnimationExportFilename(format: VideoExportFormat = 'webm'): string {
	return `effect-animation.${format}`;
}
