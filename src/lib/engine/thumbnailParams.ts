import type { ParamValue } from './renderer';

/** Showcase values for sidebar GPU thumbnails (stronger than param defaults). */
export const THUMBNAIL_PARAMS: Record<string, Record<string, ParamValue>> = {
	gaussian_blur: { radius: 12 },
	curves: { apply_mode: 0 },
	gradient_map: { grad_shift: 0.12, grad_repeat: 1 },
	motion_blur: { strength: 24, angle: 15, both_directions: true },
	sharpen: { amount: 1.6, radius: 1.5, threshold: 0.01 },
	exposure: { exposure: 0.45 },
	levels: { shadows: 0.15, midtones: 0.35, highlights: 0.82 },
	brightness_contrast: { brightness: 0.08, contrast: 0.35 },
	hue_saturation: { hue: 28, saturation: 0.45 },
	noise: { amount: 0.55, size: 1.2, chroma: 0.35, shadow: 1, midtone: 0.6, highlight: 0.5 },
	crt: { scan_intensity: 0.72, curvature: 0.48, rgb_shift: 0.009 },
	emboss: { scale: 5, color: 25, shadow_intensity: 0.65, shadow_dir: [2.5, -2.5] },
	threshold: { threshold: 128, blend_strength: 1, blend_mode: 0 },
	modulation_dither: {
		mod_tc: 8,
		mod_am: 0.22,
		dither_strength: 1.25,
		invert: 0.65,
		grid: 0.35,
		grain: 0.22
	},
	duotone: { shadow: '#1a0a3a', highlight: '#ffd166' },
	vignette: { strength: 1.1, softness: 0.65 },
	glitch_digital: {
		block_size: 0.55,
		displacement: 0.62,
		block_opacity: 0.9,
		color_split: 0.55,
		line_tear: 0.55,
		pixelate: 0.25,
		seed: 42
	},
	glitch_vhs: {
		grain: 0.6,
		glitch_blocks: 0.55,
		rgb_shift: 0.5,
		scanlines: 0.65,
		noise: 0.4,
		distortion: 0.45,
		seed: 17
	},
	pixelate: { size: 14 },
	monochrome: { mix: 1, tint: '#e8dcc8' },
	star_glow: {
		highlight_boost: 0.88,
		streaks: 4,
		samples: 36,
		length: 95,
		falloff: 0.38,
		colorize: 1,
		grad_shift: 0.22
	},
	rgb_halftone: {
		cellSize: 5,
		gamma: 1.1,
		contrast: 1.15,
		saturation: 1.05,
		misregister: 0.35,
		dotGain: 0.25,
		sharpness: 0.7,
		inkBleed: 0.4
	},
	soft_bleed: { amount: 0.68, radius: 2.75 },
	ink_bleed: { spread: 8, intensity: 0.85, grain: 0.45 },
	paper_grain: { amount: 0.55, scale: 1.2, contrast: 0.35 },
	print_stamp: { margin: 0.12, fade: 0.14, roughness: 1.2, paperColor: '#f0e6d8' },
	dither: { pattern: 1, palette: 7, colors: 18, strength: 2, gamma: 1.6, pixelstep: 1 },
	depth_of_field: {
		center: [0.5, 0.5],
		radius: 0.35,
		max_radius: 0.018,
		samples: 80,
		invert_mask: true
	},
	bloom: { threshold: 0.45, softness: 0.15, radius: 14, intensity: 1.15 }
};

export function getThumbnailParams(effectId: string): Record<string, ParamValue> | undefined {
	return THUMBNAIL_PARAMS[effectId];
}
