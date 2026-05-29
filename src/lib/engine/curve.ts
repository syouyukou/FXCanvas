/** Curve control point in normalized 0–1 input/output space. */
export interface CurvePoint {
	x: number;
	y: number;
}

/** Four-channel curves (Effect.app CURVES parity). */
export interface CurvesData {
	rgb: CurvePoint[];
	r: CurvePoint[];
	g: CurvePoint[];
	b: CurvePoint[];
}

export const DEFAULT_CURVE_POINTS: CurvePoint[] = [
	{ x: 0, y: 0 },
	{ x: 1, y: 1 }
];

export function defaultCurvesData(): CurvesData {
	const copy = (): CurvePoint[] => DEFAULT_CURVE_POINTS.map((p) => ({ ...p }));
	return { rgb: copy(), r: copy(), g: copy(), b: copy() };
}

export function cloneCurvesData(data: CurvesData): CurvesData {
	const copyChannel = (pts: CurvePoint[]) => pts.map((p) => ({ ...p }));
	return {
		rgb: copyChannel(data.rgb),
		r: copyChannel(data.r),
		g: copyChannel(data.g),
		b: copyChannel(data.b)
	};
}

function clamp01(v: number): number {
	return Math.min(1, Math.max(0, v));
}

function sortPoints(points: CurvePoint[]): CurvePoint[] {
	return [...points].sort((a, b) => a.x - b.x);
}

/** Monotone cubic Hermite interpolation (Fritsch–Carlson). */
export function interpolateCurve(points: CurvePoint[], x: number): number {
	const sorted = sortPoints(points);
	if (sorted.length === 0) return x;
	if (sorted.length === 1) return sorted[0].y;
	if (x <= sorted[0].x) return sorted[0].y;
	if (x >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y;

	let i = 0;
	while (i < sorted.length - 1 && sorted[i + 1].x < x) i++;

	const p0 = sorted[Math.max(0, i - 1)];
	const p1 = sorted[i];
	const p2 = sorted[i + 1];
	const p3 = sorted[Math.min(sorted.length - 1, i + 2)];

	const t = (x - p1.x) / Math.max(p2.x - p1.x, 1e-6);
	const t2 = t * t;
	const t3 = t2 * t;

	const m1 = (p2.y - p0.y) / Math.max(p2.x - p0.x, 1e-6);
	const m2 = (p3.y - p1.y) / Math.max(p3.x - p1.x, 1e-6);

	const h00 = 2 * t3 - 3 * t2 + 1;
	const h10 = t3 - 2 * t2 + t;
	const h01 = -2 * t3 + 3 * t2;
	const h11 = t3 - t2;

	return clamp01(h00 * p1.y + h10 * (p2.x - p1.x) * m1 + h01 * p2.y + h11 * (p2.x - p1.x) * m2);
}

/** Build a 256-entry LUT for one curve channel. */
export function buildCurveLut(points: CurvePoint[], size = 256): Float32Array {
	const lut = new Float32Array(size);
	for (let i = 0; i < size; i++) {
		const x = i / (size - 1);
		lut[i] = interpolateCurve(points, x);
	}
	return lut;
}

/** Pack four curve LUTs into a 256×4 RGBA texture (row = channel). */
export function buildCurvesTextureData(data: CurvesData, size = 256): Uint8Array {
	const channels = [data.rgb, data.r, data.g, data.b] as const;
	const out = new Uint8Array(size * 4 * 4);
	for (let row = 0; row < 4; row++) {
		const lut = buildCurveLut(channels[row], size);
		for (let i = 0; i < size; i++) {
			const idx = (row * size + i) * 4;
			const v = Math.round(clamp01(lut[i]) * 255);
			out[idx] = v;
			out[idx + 1] = v;
			out[idx + 2] = v;
			out[idx + 3] = 255;
		}
	}
	return out;
}

export type CurveChannelId = 'rgb' | 'r' | 'g' | 'b';

export const CURVE_CHANNEL_COLORS: Record<CurveChannelId, string> = {
	rgb: '#ffffff',
	r: '#e74c3c',
	g: '#2ecc71',
	b: '#3498db'
};
