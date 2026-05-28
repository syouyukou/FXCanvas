/** Curated 128×128 sample image for effect thumbnails (shown before user uploads). */
export function createDefaultPreviewImage(): Promise<HTMLImageElement> {
	const S = 128;
	const canvas = document.createElement('canvas');
	canvas.width = S;
	canvas.height = S;
	const ctx = canvas.getContext('2d')!;

	// Deep ambient background (Effect.app-style)
	const bg = ctx.createRadialGradient(S * 0.5, S * 0.55, S * 0.1, S * 0.5, S * 0.5, S * 0.75);
	bg.addColorStop(0, '#1a2240');
	bg.addColorStop(0.55, '#0d1224');
	bg.addColorStop(1, '#060810');
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, S, S);

	// Large warm orb (left)
	const warm = ctx.createRadialGradient(S * 0.34, S * 0.52, 0, S * 0.34, S * 0.52, S * 0.34);
	warm.addColorStop(0, '#ffb86a');
	warm.addColorStop(0.35, '#e86a38');
	warm.addColorStop(0.7, '#8a3018');
	warm.addColorStop(1, 'transparent');
	ctx.fillStyle = warm;
	ctx.fillRect(0, 0, S, S);

	// Small cool orb (right)
	const cool = ctx.createRadialGradient(S * 0.72, S * 0.38, 0, S * 0.72, S * 0.38, S * 0.22);
	cool.addColorStop(0, '#f0a8ff');
	cool.addColorStop(0.4, '#b060e0');
	cool.addColorStop(1, 'transparent');
	ctx.fillStyle = cool;
	ctx.fillRect(0, 0, S, S);

	// Soft ground glow
	const floor = ctx.createLinearGradient(0, S * 0.65, 0, S);
	floor.addColorStop(0, 'transparent');
	floor.addColorStop(1, 'rgba(40, 50, 90, 0.55)');
	ctx.fillStyle = floor;
	ctx.fillRect(0, 0, S, S);

	// Specular highlights
	ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
	for (const [x, y, r] of [
		[0.28, 0.4, 1.4],
		[0.68, 0.3, 0.9],
		[0.76, 0.42, 0.6]
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
