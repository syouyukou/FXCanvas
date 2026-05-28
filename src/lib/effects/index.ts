import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

export const EFFECTS: Effect[] = [
	// ─── BLUR ───────────────────────────────────────────────
	{
		id: 'gaussian_blur',
		name: 'Gaussian Blur',
		category: 'Blur',
		enabled: true,
		params: [
			{
				name: 'radius',
				label: 'Radius',
				type: 'float',
				min: 0,
				max: 30,
				step: 0.5,
				default: 5,
				value: 5
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_radius;
void main() {
  vec2 texel = 1.0 / u_resolution;
  vec4 color = vec4(0.0);
  float total = 0.0;
  float r = u_radius;
  for (float x = -r; x <= r; x += 1.0) {
    for (float y = -r; y <= r; y += 1.0) {
      float w = exp(-(x*x + y*y) / (2.0 * r * r + 0.001));
      color += texture(u_texture, v_texCoord + vec2(x, y) * texel) * w;
      total += w;
    }
  }
  outColor = color / total;
}`
	},

	// ─── COLOR ──────────────────────────────────────────────
	{
		id: 'brightness_contrast',
		name: 'Brightness / Contrast',
		category: 'Color',
		enabled: true,
		params: [
			{
				name: 'brightness',
				label: 'Brightness',
				type: 'float',
				min: -1,
				max: 1,
				step: 0.01,
				default: 0,
				value: 0
			},
			{
				name: 'contrast',
				label: 'Contrast',
				type: 'float',
				min: -1,
				max: 1,
				step: 0.01,
				default: 0,
				value: 0
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_brightness;
uniform float u_contrast;
void main() {
  vec4 c = texture(u_texture, v_texCoord);
  c.rgb += u_brightness;
  c.rgb = (c.rgb - 0.5) * (1.0 + u_contrast) + 0.5;
  outColor = clamp(c, 0.0, 1.0);
}`
	},

	{
		id: 'hue_saturation',
		name: 'Hue / Saturation',
		category: 'Color',
		enabled: true,
		params: [
			{
				name: 'hue',
				label: 'Hue',
				type: 'float',
				min: -180,
				max: 180,
				step: 1,
				default: 0,
				value: 0
			},
			{
				name: 'saturation',
				label: 'Saturation',
				type: 'float',
				min: -1,
				max: 1,
				step: 0.01,
				default: 0,
				value: 0
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_hue;
uniform float u_saturation;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  vec3 hsv = rgb2hsv(col.rgb);
  hsv.x = fract(hsv.x + u_hue / 360.0);
  hsv.y = clamp(hsv.y + u_saturation, 0.0, 1.0);
  outColor = vec4(hsv2rgb(hsv), col.a);
}`
	},

	// ─── EFFECTS ────────────────────────────────────────────
	{
		id: 'noise',
		name: 'Noise',
		category: 'Generate',
		enabled: true,
		params: [
			{
				name: 'amount',
				label: 'Amount',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.2,
				value: 0.2
			},
			{
				name: 'monochrome',
				label: 'Monochrome',
				type: 'float',
				min: 0,
				max: 1,
				step: 1,
				default: 1,
				value: 1
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_amount;
uniform float u_monochrome;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  float n = rand(v_texCoord * 1000.0) * 2.0 - 1.0;
  vec3 noise = mix(vec3(n, rand(v_texCoord * 999.7) * 2.0 - 1.0, rand(v_texCoord * 998.3) * 2.0 - 1.0), vec3(n), u_monochrome);
  outColor = vec4(clamp(col.rgb + noise * u_amount, 0.0, 1.0), col.a);
}`
	},

	{
		id: 'crt',
		name: 'CRT Screen',
		category: 'Effects',
		enabled: true,
		params: [
			{
				name: 'scan_intensity',
				label: 'Scan Lines',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.5,
				value: 0.5
			},
			{
				name: 'curvature',
				label: 'Curvature',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.3,
				value: 0.3
			},
			{
				name: 'rgb_shift',
				label: 'RGB Shift',
				type: 'float',
				min: 0,
				max: 0.02,
				step: 0.001,
				default: 0.003,
				value: 0.003
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_scan_intensity;
uniform float u_curvature;
uniform float u_rgb_shift;

vec2 curveUV(vec2 uv, float curve) {
  uv = uv * 2.0 - 1.0;
  uv += uv.yx * uv.yx * uv * curve;
  return uv * 0.5 + 0.5;
}

void main() {
  vec2 uv = curveUV(v_texCoord, u_curvature * 0.3);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float r = texture(u_texture, uv + vec2(u_rgb_shift, 0.0)).r;
  float g = texture(u_texture, uv).g;
  float b = texture(u_texture, uv - vec2(u_rgb_shift, 0.0)).b;
  float scan = sin(uv.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
  scan = mix(1.0, scan, u_scan_intensity);
  outColor = vec4(vec3(r, g, b) * scan, 1.0);
}`
	},

	{
		id: 'duotone',
		name: 'Duotone',
		category: 'Color',
		enabled: true,
		params: [
			{
				name: 'shadow_r',
				label: 'Shadow R',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.13,
				value: 0.13
			},
			{
				name: 'shadow_g',
				label: 'Shadow G',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.07,
				value: 0.07
			},
			{
				name: 'shadow_b',
				label: 'Shadow B',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.37,
				value: 0.37
			},
			{
				name: 'highlight_r',
				label: 'Highlight R',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.99,
				value: 0.99
			},
			{
				name: 'highlight_g',
				label: 'Highlight G',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.87,
				value: 0.87
			},
			{
				name: 'highlight_b',
				label: 'Highlight B',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.38,
				value: 0.38
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_shadow_r;
uniform float u_shadow_g;
uniform float u_shadow_b;
uniform float u_highlight_r;
uniform float u_highlight_g;
uniform float u_highlight_b;

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
  vec3 shadow = vec3(u_shadow_r, u_shadow_g, u_shadow_b);
  vec3 highlight = vec3(u_highlight_r, u_highlight_g, u_highlight_b);
  outColor = vec4(mix(shadow, highlight, lum), col.a);
}`
	},

	{
		id: 'vignette',
		name: 'Vignette',
		category: 'Effects',
		enabled: true,
		params: [
			{
				name: 'strength',
				label: 'Strength',
				type: 'float',
				min: 0,
				max: 2,
				step: 0.01,
				default: 0.8,
				value: 0.8
			},
			{
				name: 'softness',
				label: 'Softness',
				type: 'float',
				min: 0.1,
				max: 2,
				step: 0.01,
				default: 0.8,
				value: 0.8
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_strength;
uniform float u_softness;

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  vec2 uv = v_texCoord - 0.5;
  float d = length(uv);
  float vig = smoothstep(0.5 * u_softness, 0.0, d - (0.5 - u_strength * 0.3));
  outColor = vec4(col.rgb * vig, col.a);
}`
	},

	{
		id: 'glitch',
		name: 'Glitch',
		category: 'Distort',
		enabled: true,
		params: [
			{
				name: 'intensity',
				label: 'Intensity',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.3,
				value: 0.3
			},
			{
				name: 'seed',
				label: 'Seed',
				type: 'float',
				min: 0,
				max: 100,
				step: 1,
				default: 42,
				value: 42
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_intensity;
uniform float u_seed;

float rand(float n) { return fract(sin(n) * 43758.5453); }

void main() {
  float row = floor(v_texCoord.y * 80.0);
  float r = rand(row + u_seed);
  float shift = 0.0;
  if (r > 1.0 - u_intensity * 0.3) {
    shift = (rand(row + u_seed + 1.0) - 0.5) * u_intensity * 0.1;
  }
  vec2 uv = vec2(fract(v_texCoord.x + shift), v_texCoord.y);
  vec4 col = texture(u_texture, uv);
  if (r > 1.0 - u_intensity * 0.1) {
    col.r = texture(u_texture, uv + vec2(0.01, 0.0)).r;
    col.b = texture(u_texture, uv - vec2(0.01, 0.0)).b;
  }
  outColor = col;
}`
	},

	{
		id: 'pixelate',
		name: 'Pixelate',
		category: 'Effects',
		enabled: true,
		params: [
			{
				name: 'size',
				label: 'Pixel Size',
				type: 'float',
				min: 1,
				max: 64,
				step: 1,
				default: 8,
				value: 8
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_size;
void main() {
  vec2 pixelSize = u_size / u_resolution;
  vec2 uv = floor(v_texCoord / pixelSize) * pixelSize + pixelSize * 0.5;
  outColor = texture(u_texture, uv);
}`
	},

	{
		id: 'monochrome',
		name: 'Monochrome',
		category: 'Color',
		enabled: true,
		params: [
			{
				name: 'mix',
				label: 'Mix',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 1,
				value: 1
			},
			{
				name: 'tint_r',
				label: 'Tint R',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 1,
				value: 1
			},
			{
				name: 'tint_g',
				label: 'Tint G',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 1,
				value: 1
			},
			{
				name: 'tint_b',
				label: 'Tint B',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 1,
				value: 1
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_mix;
uniform float u_tint_r;
uniform float u_tint_g;
uniform float u_tint_b;

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
  vec3 tint = vec3(u_tint_r, u_tint_g, u_tint_b);
  vec3 mono = lum * tint;
  outColor = vec4(mix(col.rgb, mono, u_mix), col.a);
}`
	}
];

export const CATEGORIES = [...new Set(EFFECTS.map((e) => e.category))];
