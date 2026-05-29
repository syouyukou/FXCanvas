const S = 256;

function hashId(id: string): number {
	let h = 0;
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
	return Math.abs(h);
}

/** Procedural placeholder when static preview source is missing. */
export function createFallbackPreviewImage(effectId: string): Promise<HTMLImageElement> {
	const h = hashId(effectId);
	const canvas = document.createElement('canvas');
	canvas.width = S;
	canvas.height = S;
	const ctx = canvas.getContext('2d')!;

	const hue = h % 360;
	const cx = 0.35 + (h % 30) / 100;
	const cy = 0.4 + ((h >> 4) % 25) / 100;

	const bg = ctx.createLinearGradient(0, 0, S, S);
	bg.addColorStop(0, `hsl(${hue}, 25%, 8%)`);
	bg.addColorStop(1, `hsl(${(hue + 40) % 360}, 18%, 4%)`);
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, S, S);

	const orb = ctx.createRadialGradient(S * cx, S * cy, 0, S * cx, S * cy, S * 0.42);
	orb.addColorStop(0, `hsl(${(hue + 20) % 360}, 70%, 72%)`);
	orb.addColorStop(0.45, `hsl(${hue}, 55%, 42%)`);
	orb.addColorStop(1, 'transparent');
	ctx.fillStyle = orb;
	ctx.fillRect(0, 0, S, S);

	if (h % 3 === 0) {
		ctx.fillStyle = 'rgba(255,255,255,0.12)';
		for (let i = 0; i < 5; i++) {
			ctx.fillRect(0, (S / 5) * i, S, 1);
		}
	}

	return canvasToImage(canvas);
}

function canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('Failed to create fallback preview image'));
		img.src = canvas.toDataURL('image/jpeg', 0.88);
	});
}
