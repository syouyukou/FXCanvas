/** iPadOS 13+ may report as Mac; touch Macintoshes are iPads. */
function needsWebShareDownload(): boolean {
	if (typeof navigator === 'undefined') return false;
	const ua = navigator.userAgent;
	if (/iPad|iPhone|iPod/.test(ua)) return true;
	return navigator.maxTouchPoints > 1 && /Macintosh/.test(ua);
}

function dataUrlToBlob(dataUrl: string): Blob {
	const [header, body] = dataUrl.split(',');
	const mime = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream';
	const binary = atob(body);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return new Blob([bytes], { type: mime });
}

function fileFromBlob(blob: Blob, filename: string): File {
	return new File([blob], filename, { type: blob.type || 'application/octet-stream' });
}

function canShareFiles(files: File[]): boolean {
	if (typeof navigator === 'undefined' || !navigator.canShare) return false;
	try {
		return navigator.canShare({ files });
	} catch {
		return false;
	}
}

type ShareResult = 'shared' | 'aborted' | 'unsupported' | 'failed';

async function shareFiles(files: File[]): Promise<ShareResult> {
	if (!canShareFiles(files)) return 'unsupported';
	try {
		await navigator.share({ files });
		return 'shared';
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') return 'aborted';
		return 'failed';
	}
}

function triggerAnchorDownload(url: string, filename: string): void {
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.rel = 'noopener';
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function openInNewTab(url: string): void {
	const opened = window.open(url, '_blank', 'noopener,noreferrer');
	if (!opened) triggerAnchorDownload(url, '');
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
	const file = fileFromBlob(blob, filename);

	if (needsWebShareDownload()) {
		const result = await shareFiles([file]);
		if (result === 'shared' || result === 'aborted') return;

		const url = URL.createObjectURL(blob);
		try {
			openInNewTab(url);
		} finally {
			setTimeout(() => URL.revokeObjectURL(url), 60_000);
		}
		return;
	}

	const url = URL.createObjectURL(blob);
	try {
		triggerAnchorDownload(url, filename);
	} finally {
		setTimeout(() => URL.revokeObjectURL(url), 1_000);
	}
}

export async function downloadDataUrl(dataUrl: string, filename: string): Promise<void> {
	await downloadBlob(dataUrlToBlob(dataUrl), filename);
}

export async function downloadLayerSequence(
	frames: { filename: string; url: string }[]
): Promise<void> {
	if (frames.length === 0) return;

	const files = frames.map(({ filename, url }) =>
		fileFromBlob(dataUrlToBlob(url), filename)
	);

	if (needsWebShareDownload() && canShareFiles(files)) {
		const result = await shareFiles(files);
		if (result === 'shared' || result === 'aborted') return;
	}

	for (const frame of frames) {
		await downloadDataUrl(frame.url, frame.filename);
	}
}
