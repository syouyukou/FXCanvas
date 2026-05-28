/** Curated 128×128 sample image for effect thumbnails (shown before user uploads). */
export function createDefaultPreviewImage(): Promise<HTMLImageElement> {
	const S = 128;
	const canvas = document.createElement('canvas');
	canvas.width = S;
	canvas.height = S;
	const ctx = canvas.getContext('2d')!;

	// Dark ambient background
	const bg = ctx.createLinearGradient(0, 0, S, S);
	bg.addColorStop(0, '#0c0e18');
	bg.addColorStop(0.55, '#151322');
	bg.addColorStop(1, '#1a1424');
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, S, S);

	// Neon accent (top-right) — good for Levels / Bloom previews
	const neon = ctx.createRadialGradient(S * 0.82, S * 0.18, 0, S * 0.82, S * 0.18, S * 0.42);
	neon.addColorStop(0, '#ff5c8a');
	neon.addColorStop(0.35, '#a855f7');
	neon.addColorStop(1, 'transparent');
	ctx.fillStyle = neon;
	ctx.fillRect(0, 0, S, S);

	// Portrait tone (center)
	const face = ctx.createRadialGradient(S * 0.44, S * 0.5, S * 0.04, S * 0.44, S * 0.5, S * 0.4);
	face.addColorStop(0, '#f2cdb0');
	face.addColorStop(0.55, '#b87862');
	face.addColorStop(1, 'transparent');
	ctx.fillStyle = face;
	ctx.fillRect(0, 0, S, S);

	// Cheek highlight — Star Glow / Bloom
	const highlight = ctx.createRadialGradient(S * 0.56, S * 0.4, 0, S * 0.56, S * 0.4, S * 0.14);
	highlight.addColorStop(0, 'rgba(255, 240, 220, 0.85)');
	highlight.addColorStop(1, 'transparent');
	ctx.fillStyle = highlight;
	ctx.fillRect(0, 0, S, S);

	// Left shadow for contrast
	const shade = ctx.createLinearGradient(0, 0, S * 0.55, 0);
	shade.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
	shade.addColorStop(1, 'transparent');
	ctx.fillStyle = shade;
	ctx.fillRect(0, 0, S, S);

	// Ground / horizon band
	ctx.fillStyle = 'rgba(30, 35, 55, 0.6)';
	ctx.fillRect(0, S * 0.72, S, S * 0.28);

	// Small bright specular dots
	ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
	for (const [x, y, r] of [
		[0.78, 0.22, 1.2],
		[0.84, 0.28, 0.8],
		[0.62, 0.35, 1.0]
	] as const) {
		ctx.beginPath();
		ctx.arc(S * x, S * y, r, 0, Math.PI * 2);
		ctx.fill();
	}

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('Failed to create default preview image'));
		img.src = canvas.toDataURL('image/jpeg', 0.9);
	});
}
