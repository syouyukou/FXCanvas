import type { Effect } from '../engine/renderer';
import { DEFAULT_STAR_GLOW_GRADIENT } from '../engine/gradient';
import { DITHER_EFFECT } from './dither';
import { EXPOSURE_EFFECT } from './exposure';
import { LEVELS_EFFECT } from './levels';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

const BLUR_H = HEADER + `
uniform float u_radius;
void main() {
  vec2 texel = vec2(1.0 / u_resolution.x, 0.0);
  vec4 color = vec4(0.0);
  float total = 0.0;
  float r = min(u_radius, 20.0);
  for (float x = -r; x <= r; x += 1.0) {
    float w = exp(-(x * x) / (2.0 * r * r + 0.001));
    color += texture(u_texture, v_texCoord + texel * x) * w;
    total += w;
  }
  outColor = color / total;
}`;

const BLUR_V = HEADER + `
uniform float u_radius;
void main() {
  vec2 texel = vec2(0.0, 1.0 / u_resolution.y);
  vec4 color = vec4(0.0);
  float total = 0.0;
  float r = min(u_radius, 20.0);
  for (float y = -r; y <= r; y += 1.0) {
    float w = exp(-(y * y) / (2.0 * r * r + 0.001));
    color += texture(u_texture, v_texCoord + texel * y) * w;
    total += w;
  }
  outColor = color / total;
}`;

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
		passes: [
			{ id: 'blur_h', fragmentShader: BLUR_H },
			{ id: 'blur_v', fragmentShader: BLUR_V }
		]
	},

	// ─── COLOR ──────────────────────────────────────────────
	EXPOSURE_EFFECT,
	LEVELS_EFFECT,

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
		category: 'Film',
		enabled: true,
		params: [
			{ name: 'amount',    label: 'Amount',    type: 'float', min: 0,    max: 1,   step: 0.01, default: 0.3,  value: 0.3  },
			{ name: 'size',      label: 'Size',      type: 'float', min: 0.5,  max: 4,   step: 0.1,  default: 1.0,  value: 1.0  },
			{ name: 'chroma',    label: 'Chroma',    type: 'float', min: 0,    max: 1,   step: 0.01, default: 0.5,  value: 0.5  },
			{ name: 'shadow',    label: 'Shadow',    type: 'float', min: 0,    max: 1,   step: 0.01, default: 1.0,  value: 1.0  },
			{ name: 'midtone',   label: 'Mid-tone',  type: 'float', min: 0,    max: 1,   step: 0.01, default: 0.5,  value: 0.5  },
			{ name: 'highlight', label: 'Highlight', type: 'float', min: 0,    max: 1,   step: 0.01, default: 0.3,  value: 0.3  }
		],
		fragmentShader:
			HEADER +
			`
uniform float u_amount;
uniform float u_size;
uniform float u_chroma;
uniform float u_shadow;
uniform float u_midtone;
uniform float u_highlight;

vec3 hash3(vec2 p) {
  vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
                dot(p, vec2(269.5, 183.3)),
                dot(p, vec2(419.2, 371.9)));
  return fract(sin(q) * 43758.5453);
}

float hash1(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));

  // zone weight: how much noise to apply based on luminance
  float shadowW    = u_shadow    * (1.0 - smoothstep(0.0, 0.5, lum));
  float highlightW = u_highlight * smoothstep(0.5, 1.0, lum);
  float midW       = u_midtone   * (1.0 - abs(lum - 0.5) * 2.0);
  float zoneWeight = clamp(shadowW + midW + highlightW, 0.0, 1.0);

  // grain sampling
  vec2 uv = floor(v_texCoord * u_resolution / u_size) * u_size / u_resolution;
  vec3 colorNoise = (hash3(uv + 0.5) * 2.0 - 1.0);
  float lumaNoiseVal = hash1(uv + 1.3) * 2.0 - 1.0;
  vec3 grain = mix(vec3(lumaNoiseVal), colorNoise, u_chroma);

  outColor = vec4(clamp(col.rgb + grain * u_amount * zoneWeight, 0.0, 1.0), col.a);
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
				name: 'shadow',
				label: 'Shadow',
				type: 'color',
				default: '#21125f',
				value: '#21125f'
			},
			{
				name: 'highlight',
				label: 'Highlight',
				type: 'color',
				default: '#fcde61',
				value: '#fcde61'
			}
		],
		fragmentShader:
			HEADER +
			`
uniform vec3 u_shadow;
uniform vec3 u_highlight;

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
  outColor = vec4(mix(u_shadow, u_highlight, lum), col.a);
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
				name: 'tint',
				label: 'Tint',
				type: 'color',
				default: '#ffffff',
				value: '#ffffff'
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_mix;
uniform vec3 u_tint;

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
  vec3 mono = lum * u_tint;
  outColor = vec4(mix(col.rgb, mono, u_mix), col.a);
}`
	},

	// ─── STAR GLOW (effect.app parity) ───────────────────────
	{
		id: 'star_glow',
		name: 'Star Glow',
		category: 'Effects',
		enabled: true,
		params: [
			{
				name: 'highlight_boost',
				label: 'highlight boost',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.93
			},
			{ name: 'streaks', label: 'streaks', type: 'int', min: 2, max: 8, step: 1, default: 3 },
			{
				name: 'samples',
				label: 'sample count',
				type: 'int',
				min: 8,
				max: 60,
				step: 1,
				default: 30
			},
			{ name: 'length', label: 'length', type: 'float', min: 10, max: 200, step: 1, default: 80 },
			{
				name: 'alternate',
				label: 'alternate',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 1
			},
			{
				name: 'falloff',
				label: 'falloff',
				type: 'float',
				min: 0.05,
				max: 1,
				step: 0.01,
				default: 0.45
			},
			{ name: 'angle', label: 'angle deg', type: 'float', min: 0, max: 180, step: 1, default: 0 },
			{
				name: 'colorize',
				label: 'Colorize',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 1
			},
			{
				name: 'gradient',
				label: 'Gradient map',
				type: 'gradient',
				default: DEFAULT_STAR_GLOW_GRADIENT
			},
			{
				name: 'grad_shift',
				label: 'Gradient shift',
				type: 'float',
				min: 0,
				max: 1,
				step: 0.01,
				default: 0.29
			}
		],
		fragmentShader:
			HEADER +
			`
uniform float u_highlight_boost;
uniform float u_streaks;
uniform float u_samples;
uniform float u_length;
uniform float u_alternate;
uniform float u_falloff;
uniform float u_angle;
uniform float u_colorize;
uniform float u_grad_shift;
uniform vec3 u_grad_0;
uniform vec3 u_grad_1;
uniform vec3 u_grad_2;
uniform float u_grad_p0;
uniform float u_grad_p1;
uniform float u_grad_p2;

float extractHighlight(float lum) {
  float edge = 1.0 - u_highlight_boost;
  float knee = max(0.02, 0.12 * (1.0 - u_highlight_boost));
  return smoothstep(edge, edge + knee, lum);
}

vec3 sampleGradMap(float t) {
  float s = fract(t + u_grad_shift);
  if (s <= u_grad_p1) {
    float f = (s - u_grad_p0) / max(0.001, u_grad_p1 - u_grad_p0);
    return mix(u_grad_0, u_grad_1, clamp(f, 0.0, 1.0));
  }
  float f = (s - u_grad_p1) / max(0.001, u_grad_p2 - u_grad_p1);
  return mix(u_grad_1, u_grad_2, clamp(f, 0.0, 1.0));
}

void main() {
  vec4 base = texture(u_texture, v_texCoord);
  vec2 texel = 1.0 / u_resolution;
  vec3 glowAcc = vec3(0.0);

  float numStreaks = u_streaks;
  float baseAngle = u_angle * 3.14159265 / 180.0;
  float falloffStep = pow(1.0 - u_falloff * 0.92, 0.12);

  for (float s = 0.0; s < 8.0; s++) {
    if (s >= numStreaks) break;
    float ang = baseAngle + s * 3.14159265 / numStreaks;
    vec2 dir = vec2(cos(ang), sin(ang));
    float altLen = mix(1.0, mod(s, 2.0) < 0.5 ? 1.0 : 0.62, u_alternate);
    float streakLen = u_length * altLen;

    for (float sign = -1.0; sign <= 1.0; sign += 2.0) {
      vec3 streakColor = vec3(0.0);
      float weight = 1.0;
      for (float j = 1.0; j <= 60.0; j++) {
        if (j > u_samples) break;
        vec2 offset = dir * sign * j * streakLen / u_samples * texel;
        vec2 uv = v_texCoord + offset;
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break;
        vec4 sampleCol = texture(u_texture, uv);
        float lum = dot(sampleCol.rgb, vec3(0.299, 0.587, 0.114));
        float h = extractHighlight(lum);
        float t = j / u_samples;
        vec3 gc = mix(vec3(1.0), sampleGradMap(t), u_colorize);
        streakColor += sampleCol.rgb * h * weight * gc;
        weight *= falloffStep;
      }
      glowAcc += streakColor;
    }
  }

  vec3 glow = glowAcc * u_highlight_boost * 0.11;
  outColor = vec4(clamp(base.rgb + glow, 0.0, 1.0), base.a);
}`
	},

	// ─── DITHER ─────────────────────────────────────────────
	DITHER_EFFECT,

	// ─── BLOOM ──────────────────────────────────────────────
	{
		id: 'bloom',
		name: 'Bloom',
		category: 'Effects',
		enabled: true,
		params: [
			{ name: 'threshold', label: 'Threshold', type: 'float', min: 0, max: 1, step: 0.01, default: 0.6, value: 0.6 },
			{ name: 'softness', label: 'Softness', type: 'float', min: 0, max: 0.5, step: 0.01, default: 0.1, value: 0.1 },
			{ name: 'radius', label: 'Radius', type: 'float', min: 1, max: 30, step: 0.5, default: 8, value: 8 },
			{ name: 'intensity', label: 'Intensity', type: 'float', min: 0, max: 2, step: 0.01, default: 0.8, value: 0.8 }
		],
		passes: [
			{
				id: 'extract',
				fragmentShader:
					HEADER +
					`
uniform float u_threshold;
uniform float u_softness;
void main() {
  vec4 col = texture(u_texture, v_texCoord);
  float lum = max(col.r, max(col.g, col.b));
  float knee = max(u_softness, 0.001);
  float contrib = smoothstep(u_threshold - knee, u_threshold + knee, lum);
  outColor = vec4(col.rgb * contrib, 1.0);
}`
			},
			{ id: 'blur_h', fragmentShader: BLUR_H },
			{ id: 'blur_v', fragmentShader: BLUR_V },
			{
				id: 'composite',
				useOriginal: true,
				fragmentShader:
					`#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform sampler2D u_original;
uniform float u_intensity;
void main() {
  vec3 base = texture(u_original, v_texCoord).rgb;
  vec3 glow = texture(u_texture, v_texCoord).rgb;
  outColor = vec4(base + glow * u_intensity, 1.0);
}`
			}
		]
	}
];

export const CATEGORIES = [...new Set(EFFECTS.map((e) => e.category))];
