export interface GradientStop {
	pos: number;
	color: string;
}

export const DEFAULT_STAR_GLOW_GRADIENT: GradientStop[] = [
	{ pos: 0, color: '#ffffff' },
	{ pos: 0.48, color: '#b8d8ff' },
	{ pos: 1, color: '#2a4488' }
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
