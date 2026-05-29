export interface GradientStop {
	pos: number;
	color: string;
}

export const DEFAULT_STAR_GLOW_GRADIENT: GradientStop[] = [
	{ pos: 0, color: '#ffffff' },
	{ pos: 0.48, color: '#b8d8ff' },
	{ pos: 1, color: '#2a4488' }
];

/** Effect.app / PS-style gradient map default (red → black → blue). */
export const DEFAULT_GRADIENT_MAP: GradientStop[] = [
	{ pos: 0, color: '#e74c3c' },
	{ pos: 0.5, color: '#000000' },
	{ pos: 1, color: '#3498db' }
];

export function cloneGradient(stops: GradientStop[]): GradientStop[] {
	return stops.map((s) => ({ ...s }));
}

export function normalizeGradientStops(stops: GradientStop[]): GradientStop[] {
	const sorted = [...stops].sort((a, b) => a.pos - b.pos);
	if (sorted.length < 2) return cloneGradient(DEFAULT_STAR_GLOW_GRADIENT);
	return sorted.slice(0, 3);
}

/** Pad to exactly 3 stops for the Star Glow shader uniforms. */
export function gradientToUniforms(stops: GradientStop[]): {
	colors: [number, number, number][];
	positions: [number, number, number];
} {
	const s = normalizeGradientStops(stops);
	while (s.length < 3) {
		s.push({ pos: 1, color: s[s.length - 1]?.color ?? '#ffffff' });
	}
	const colors = s.slice(0, 3).map((stop) => hexToRgb(stop.color));
	const positions: [number, number, number] = [
		s[0].pos,
		s[1].pos,
		s[2].pos
	];
	return { colors, positions };
}

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	if (h.length !== 6) return [1, 1, 1];
	return [
		parseInt(h.slice(0, 2), 16) / 255,
		parseInt(h.slice(2, 4), 16) / 255,
		parseInt(h.slice(4, 6), 16) / 255
	];
}

function lerpRgb(
	a: [number, number, number],
	b: [number, number, number],
	t: number
): [number, number, number] {
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Sample a multi-stop gradient at t ∈ [0, 1]. */
export function sampleGradient(stops: GradientStop[], t: number): [number, number, number] {
	const sorted = [...stops].sort((a, b) => a.pos - b.pos);
	if (sorted.length === 0) return [1, 1, 1];
	if (sorted.length === 1) return hexToRgb(sorted[0].color);
	const x = Math.max(0, Math.min(1, t));
	if (x <= sorted[0].pos) return hexToRgb(sorted[0].color);
	if (x >= sorted[sorted.length - 1].pos) return hexToRgb(sorted[sorted.length - 1].color);
	for (let i = 0; i < sorted.length - 1; i++) {
		const a = sorted[i];
		const b = sorted[i + 1];
		if (x >= a.pos && x <= b.pos) {
			const f = (x - a.pos) / Math.max(b.pos - a.pos, 1e-6);
			return lerpRgb(hexToRgb(a.color), hexToRgb(b.color), f);
		}
	}
	return hexToRgb(sorted[sorted.length - 1].color);
}

/** Pack gradient into a 256×1 RGBA LUT for GPU lookup. */
export function buildGradientLutTextureData(stops: GradientStop[], size = 256): Uint8Array {
	const out = new Uint8Array(size * 4);
	for (let i = 0; i < size; i++) {
		const t = i / (size - 1);
		const [r, g, b] = sampleGradient(stops, t);
		out[i * 4] = Math.round(Math.max(0, Math.min(1, r)) * 255);
		out[i * 4 + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
		out[i * 4 + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
		out[i * 4 + 3] = 255;
	}
	return out;
}
