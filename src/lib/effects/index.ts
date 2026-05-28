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
	},

	// ─── DITHER ─────────────────────────────────────────────
	{
		id: 'dither',
		name: 'Dither',
		category: 'Effects',
		enabled: true,
		params: [
			{ name: 'pattern',   label: 'Pattern Type',    type: 'float', min: 0, max: 2,  step: 1,    default: 0,   value: 0   },
			{ name: 'palette',   label: 'Palette Type',    type: 'float', min: 0, max: 3,  step: 1,    default: 2,   value: 2   },
			{ name: 'colors',    label: 'Color Count',     type: 'float', min: 2, max: 32, step: 1,    default: 8,   value: 8   },
			{ name: 'strength',  label: 'Dither Strength', type: 'float', min: 0, max: 4,  step: 0.1,  default: 1.0, value: 1.0 },
			{ name: 'gamma',     label: 'Gamma',           type: 'float', min: 0.5, max: 3, step: 0.1, default: 1.6, value: 1.6 },
			{ name: 'pixelstep', label: 'Pixel Step',      type: 'float', min: 1, max: 8,  step: 1,    default: 1,   value: 1   }
		],
		fragmentShader:
			HEADER +
			`
uniform float u_pattern;
uniform float u_palette;
uniform float u_colors;
uniform float u_strength;
uniform float u_gamma;
uniform float u_pixelstep;

// Bayer matrices (2x2, 4x4, 8x8)
float bayer2(vec2 p) {
  p = mod(p, 2.0);
  float m[4] = float[](0.0, 2.0, 3.0, 1.0);
  return m[int(p.x) + int(p.y)*2] / 4.0;
}

float bayer4(vec2 p) {
  p = mod(p, 4.0);
  float m[16] = float[]( 0., 8., 2.,10.,
                         12., 4.,14., 6.,
                          3.,11., 1., 9.,
                         15., 7.,13., 5.);
  return m[int(p.x) + int(p.y)*4] / 16.0;
}

float bayer8(vec2 p) {
  p = mod(p, 8.0);
  float m[64] = float[](
     0.,32., 8.,40., 2.,34.,10.,42.,
    48.,16.,56.,24.,50.,18.,58.,26.,
    12.,44., 4.,36.,14.,46., 6.,38.,
    60.,28.,52.,20.,62.,30.,54.,22.,
     3.,35.,11.,43., 1.,33., 9.,41.,
    51.,19.,59.,27.,49.,17.,57.,25.,
    15.,47., 7.,39.,13.,45., 5.,37.,
    63.,31.,55.,23.,61.,29.,53.,21.);
  return m[int(p.x) + int(p.y)*8] / 64.0;
}

float quantize(float v, float steps) {
  return floor(v * steps + 0.5) / steps;
}

void main() {
  // pixel step (block size)
  vec2 uv = floor(v_texCoord * u_resolution / u_pixelstep) * u_pixelstep / u_resolution;
  vec4 col = texture(u_texture, uv);

  // gamma correct
  vec3 lin = pow(col.rgb, vec3(u_gamma));

  // threshold pattern
  vec2 px = floor(uv * u_resolution);
  float threshold;
  if (u_pattern < 0.5)       threshold = bayer2(px);
  else if (u_pattern < 1.5)  threshold = bayer4(px);
  else                        threshold = bayer8(px);

  // add dithering bias
  vec3 dithered = lin + (threshold - 0.5) * u_strength / u_colors;

  // palette quantize
  vec3 result;
  float steps = max(u_colors - 1.0, 1.0);
  if (u_palette < 0.5) {
    // BW
    float lum = dot(dithered, vec3(0.299, 0.587, 0.114));
    float q = quantize(lum, 1.0);
    result = vec3(q);
  } else if (u_palette < 1.5) {
    // Grayscale
    float lum = dot(dithered, vec3(0.299, 0.587, 0.114));
    result = vec3(quantize(lum, steps));
  } else if (u_palette < 2.5) {
    // RGB quantized
    result = vec3(quantize(dithered.r, steps),
                  quantize(dithered.g, steps),
                  quantize(dithered.b, steps));
  } else {
    // Limited palette (R+G only, retro feel)
    float r = quantize(dithered.r, floor(steps * 0.5));
    float g = quantize(dithered.g, floor(steps * 0.5));
    float b = step(0.5, dithered.b);
    result = vec3(r, g, b);
  }

  // inverse gamma
  result = pow(clamp(result, 0.0, 1.0), vec3(1.0 / u_gamma));
  outColor = vec4(result, col.a);
}`
	}
];

export const CATEGORIES = [...new Set(EFFECTS.map((e) => e.category))];
