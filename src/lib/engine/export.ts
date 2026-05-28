export type ExportFormat = 'png' | 'jpeg';
export type ExportSizePreset = 'half' | '1x' | '2x' | '3x' | '4x' | '1080p' | '4k';

/** Conservative browser canvas limit (most GPUs allow 8192–16384). */
export const MAX_EXPORT_DIM = 8192;

export interface ExportSizeOption {
	id: ExportSizePreset;
	label: string;
	width: number;
	height: number;
	scale: number;
	tooLarge: boolean;
}

type ScalePreset = { id: ExportSizePreset; label: string; scale: number };
type CapPreset = { id: ExportSizePreset; label: string; maxLongEdge: number };

const SCALE_PRESETS: ScalePreset[] = [
	{ id: 'half', label: '0.5×', scale: 0.5 },
	{ id: '1x', label: '1× Original', scale: 1 },
	{ id: '2x', label: '2×', scale: 2 },
	{ id: '3x', label: '3×', scale: 3 },
	{ id: '4x', label: '4×', scale: 4 }
];

const CAP_PRESETS: CapPreset[] = [
	{ id: '1080p', label: '1080p (long edge)', maxLongEdge: 1920 },
	{ id: '4k', label: '4K (long edge)', maxLongEdge: 3840 }
];

function dimsForScale(srcW: number, srcH: number, scale: number) {
	return {
		width: Math.max(1, Math.round(srcW * scale)),
		height: Math.max(1, Math.round(srcH * scale)),
		scale
	};
}

function dimsForCap(srcW: number, srcH: number, maxLongEdge: number) {
	const long = Math.max(srcW, srcH);
	const scale = Math.min(maxLongEdge / long, 4);
	return dimsForScale(srcW, srcH, scale);
}

function isTooLarge(width: number, height: number) {
	return width > MAX_EXPORT_DIM || height > MAX_EXPORT_DIM;
}

export function getExportSizeOptions(srcW: number, srcH: number): ExportSizeOption[] {
	if (srcW <= 0 || srcH <= 0) return [];

	const seen = new Set<string>();
	const options: ExportSizeOption[] = [];

	const push = (id: ExportSizePreset, label: string, width: number, height: number, scale: number) => {
		const key = `${width}x${height}`;
		if (seen.has(key)) return;
		seen.add(key);
		options.push({
			id,
			label,
			width,
			height,
			scale,
			tooLarge: isTooLarge(width, height)
		});
	};

	for (const preset of SCALE_PRESETS) {
		const { width, height, scale } = dimsForScale(srcW, srcH, preset.scale);
		push(preset.id, preset.label, width, height, scale);
	}

	for (const preset of CAP_PRESETS) {
		const { width, height, scale } = dimsForCap(srcW, srcH, preset.maxLongEdge);
		push(preset.id, preset.label, width, height, scale);
	}

	return options;
}

export function getExportFilename(format: ExportFormat): string {
	return format === 'jpeg' ? 'effect-export.jpg' : 'effect-export.png';
}
