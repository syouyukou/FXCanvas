import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

/** Effect.app-style dither: ordered + diffusion-look patterns, retro palettes, distance modes. */
export const DITHER_FRAGMENT = HEADER + `
uniform float u_pattern;
uniform float u_palette;
uniform float u_colors;
uniform float u_distance;
uniform float u_strength;
uniform float u_gamma;
uniform float u_pixelstep;

// ── Ordered matrices ──────────────────────────────────────
float bayer2(vec2 p) {
  p = mod(p, 2.0);
  float m[4] = float[](0.0, 2.0, 3.0, 1.0);
  return m[int(p.x) + int(p.y) * 2] / 4.0;
}

float bayer4(vec2 p) {
  p = mod(p, 4.0);
  float m[16] = float[](
     0.,  8.,  2., 10.,
    12.,  4., 14.,  6.,
     3., 11.,  1.,  9.,
    15.,  7., 13.,  5.);
  return m[int(p.x) + int(p.y) * 4] / 16.0;
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
  return m[int(p.x) + int(p.y) * 8] / 64.0;
}

float clustered4(vec2 p) {
  p = mod(p, 4.0);
  float m[16] = float[](
     0.,  8.,  2., 10.,
     4., 12.,  6., 14.,
     3., 11.,  1.,  9.,
     7., 15.,  5., 13.);
  return m[int(p.x) + int(p.y) * 4] / 16.0;
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float blueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float diagonalLines(vec2 p) {
  return fract((p.x + p.y) * 0.125);
}

float crossHatch(vec2 p) {
  float a = step(0.5, fract(p.x * 0.25));
  float b = step(0.5, fract(p.y * 0.25));
  return mod(a + b, 2.0) * 0.5 + 0.25;
}

// Serpentine ordered threshold — mimics error-diffusion scan direction
float floydSteinbergLook(vec2 p) {
  float t = bayer8(p);
  return mod(p.y, 2.0) < 1.0 ? t : 1.0 - t;
}

float atkinsonLook(vec2 p) {
  float t = clustered4(p);
  return mix(t, sqrt(t), 0.45);
}

float sierraLook(vec2 p) {
  return mix(bayer8(p), floydSteinbergLook(p), 0.55);
}

float stuckiLook(vec2 p) {
  return mix(atkinsonLook(p), bayer4(p), 0.4) * 0.88 + 0.06;
}

float halftoneDot(vec2 p) {
  vec2 cell = mod(p, 6.0);
  float d = distance(cell, vec2(3.0));
  return clamp(d / 3.0, 0.0, 1.0);
}

float fineGrain(vec2 p) {
  return mix(bayer2(p * 2.0), blueNoise(p * 0.45), 0.3);
}

float patternThreshold(vec2 px, float pattern) {
  int p = int(floor(pattern + 0.5));
  if (p == 0) return bayer2(px);
  if (p == 1) return bayer4(px);
  if (p == 2) return bayer8(px);
  if (p == 3) return clustered4(px);
  if (p == 4) return diagonalLines(px);
  if (p == 5) return blueNoise(px * 0.35);
  if (p == 6) return floydSteinbergLook(px);
  if (p == 7) return atkinsonLook(px);
  if (p == 8) return crossHatch(px);
  if (p == 9) return hash21(floor(px));
  if (p == 10) return sierraLook(px);
  if (p == 11) return stuckiLook(px);
  if (p == 12) return halftoneDot(px);
  return fineGrain(px); // 13
}

// ── Palette + distance ────────────────────────────────────
float distRGB(vec3 a, vec3 b) {
  vec3 d = a - b;
  return dot(d, d);
}

float distPerceptual(vec3 a, vec3 b) {
  float la = dot(a, vec3(0.2126, 0.7152, 0.0722));
  float lb = dot(b, vec3(0.2126, 0.7152, 0.0722));
  float dl = (la - lb) * 2.2;
  vec3 ca = a - la;
  vec3 cb = b - lb;
  return dl * dl + dot(ca - cb, ca - cb) * 0.35;
}

float colorDist(vec3 a, vec3 b, float mode) {
  return mode < 0.5 ? distRGB(a, b) : distPerceptual(a, b);
}

vec3 gbPalette[4] = vec3[](
  vec3(0.059, 0.220, 0.059),
  vec3(0.188, 0.384, 0.188),
  vec3(0.545, 0.675, 0.059),
  vec3(0.608, 0.737, 0.059)
);

vec3 cgaPalette[4] = vec3[](
  vec3(0.0, 0.0, 0.0),
  vec3(0.0, 0.667, 1.0),
  vec3(1.0, 0.333, 0.333),
  vec3(1.0, 1.0, 0.333)
);

vec3 egaPalette[16] = vec3[](
  vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.667), vec3(0.0, 0.667, 0.0), vec3(0.0, 0.667, 0.667),
  vec3(0.667, 0.0, 0.0), vec3(0.667, 0.0, 0.667), vec3(0.667, 0.333, 0.0), vec3(0.667, 0.667, 0.667),
  vec3(0.333, 0.333, 0.333), vec3(0.333, 0.333, 1.0), vec3(0.333, 1.0, 0.333), vec3(0.333, 1.0, 1.0),
  vec3(1.0, 0.333, 0.333), vec3(1.0, 0.333, 1.0), vec3(1.0, 1.0, 0.333), vec3(1.0, 1.0, 1.0)
);

vec3 risoPalette[6] = vec3[](
  vec3(0.08, 0.16, 0.22),
  vec3(0.12, 0.38, 0.48),
  vec3(0.85, 0.42, 0.18),
  vec3(0.95, 0.72, 0.38),
  vec3(0.92, 0.28, 0.22),
  vec3(0.98, 0.95, 0.88)
);

vec3 nearestGB(vec3 col, int count, float distMode) {
  vec3 best = gbPalette[0];
  float bestD = colorDist(col, best, distMode);
  for (int i = 1; i < 4; i++) {
    if (i >= count) break;
    float d = colorDist(col, gbPalette[i], distMode);
    if (d < bestD) { bestD = d; best = gbPalette[i]; }
  }
  return best;
}

vec3 nearestCGA(vec3 col, float distMode) {
  vec3 best = cgaPalette[0];
  float bestD = colorDist(col, best, distMode);
  for (int i = 1; i < 4; i++) {
    float d = colorDist(col, cgaPalette[i], distMode);
    if (d < bestD) { bestD = d; best = cgaPalette[i]; }
  }
  return best;
}

vec3 nearestEGA(vec3 col, int count, float distMode) {
  vec3 best = egaPalette[0];
  float bestD = colorDist(col, best, distMode);
  for (int i = 1; i < 16; i++) {
    if (i >= count) break;
    float d = colorDist(col, egaPalette[i], distMode);
    if (d < bestD) { bestD = d; best = egaPalette[i]; }
  }
  return best;
}

vec3 nearestRiso(vec3 col, int count, float distMode) {
  vec3 best = risoPalette[0];
  float bestD = colorDist(col, best, distMode);
  for (int i = 1; i < 6; i++) {
    if (i >= count) break;
    float d = colorDist(col, risoPalette[i], distMode);
    if (d < bestD) { bestD = d; best = risoPalette[i]; }
  }
  return best;
}

vec3 applyPalette(vec3 lin, float palette, float colors, float distMode) {
  int pal = int(floor(palette + 0.5));
  float n = max(colors, 2.0);

  if (pal == 0) {
    float lum = dot(lin, vec3(0.299, 0.587, 0.114));
    float q = floor(lum * (n - 1.0) + 0.5) / max(n - 1.0, 1.0);
    return vec3(q);
  }
  if (pal == 1) {
    float lum = dot(lin, vec3(0.299, 0.587, 0.114));
    float q = floor(lum * (n - 1.0) + 0.5) / max(n - 1.0, 1.0);
    return vec3(q);
  }
  if (pal == 2) {
    float steps = max(n - 1.0, 1.0);
    return vec3(
      floor(lin.r * steps + 0.5) / steps,
      floor(lin.g * steps + 0.5) / steps,
      floor(lin.b * steps + 0.5) / steps
    );
  }
  if (pal == 3) return nearestGB(lin, int(clamp(n, 2.0, 4.0)), distMode);
  if (pal == 4) return nearestCGA(lin, distMode);
  if (pal == 5) return nearestEGA(lin, int(clamp(n, 2.0, 16.0)), distMode);
  if (pal == 6) return nearestRiso(lin, int(clamp(n, 2.0, 6.0)), distMode);
  // 7 — ink / high-contrast monochrome (Effect.app palette type 7)
  float lum = dot(lin, vec3(0.299, 0.587, 0.114));
  float steps = max(n - 1.0, 1.0);
  float q = floor(lum * steps + 0.5) / steps;
  q = mix(q, smoothstep(0.0, 1.0, q), 0.35);
  return vec3(q);
}

void main() {
  float pxStep = max(u_pixelstep, 1.0);
  vec2 blockUv = floor(v_texCoord * u_resolution / pxStep) * pxStep / u_resolution;
  vec4 src = texture(u_texture, blockUv);

  vec3 lin = pow(max(src.rgb, 0.0), vec3(u_gamma));

  vec2 px = floor(blockUv * u_resolution);
  float threshold = patternThreshold(px, u_pattern);
  float spread = u_strength / max(u_colors, 1.0);
  vec3 dithered = lin + (threshold - 0.5) * spread;

  vec3 result = applyPalette(clamp(dithered, 0.0, 1.0), u_palette, u_colors, u_distance);
  result = pow(clamp(result, 0.0, 1.0), vec3(1.0 / max(u_gamma, 0.001)));
  outColor = vec4(result, src.a);
}`;

export const DITHER_EFFECT: Effect = {
	id: 'dither',
	name: 'Dither',
	category: 'Effects',
	enabled: true,
	params: [
		{
			name: 'pattern',
			label: 'pattern type',
			hint: '點點花紋（0–13）。13=細緻印刷感，6–7=誤差擴散風格。',
			type: 'int',
			min: 0,
			max: 13,
			step: 1,
			default: 13,
			value: 13
		},
		{
			name: 'palette',
			label: 'palette type',
			hint: '配色（0–7）。7=高對比黑白墨水，3=Game Boy。',
			type: 'int',
			min: 0,
			max: 7,
			step: 1,
			default: 7,
			value: 7
		},
		{
			name: 'colors',
			label: 'color count',
			hint: '保留幾種顏色。13 接近 Effect.app 預設。',
			type: 'int',
			min: 2,
			max: 32,
			step: 1,
			default: 13,
			value: 13
		},
		{
			name: 'distance',
			label: 'distance mode',
			hint: '怎麼配相近顏色。1=較自然（建議）；0=純 RGB 數學。',
			type: 'int',
			min: 0,
			max: 1,
			step: 1,
			default: 1,
			value: 1
		},
		{
			name: 'strength',
			label: 'dither strength',
			hint: '顆粒強度。Effect.app 常用 1.0–1.5。',
			type: 'float',
			min: 0,
			max: 4,
			step: 0.05,
			default: 1.2,
			value: 1.2
		},
		{
			name: 'gamma',
			label: 'gamma',
			hint: '明暗曲線。2.7 可做出強烈黑白對比。',
			type: 'float',
			min: 0.5,
			max: 3.5,
			step: 0.05,
			default: 2.7,
			value: 2.7
		},
		{
			name: 'pixelstep',
			label: 'pixelStep',
			hint: '像素塊大小。1=最細緻（Effect.app 預設）。',
			type: 'int',
			min: 1,
			max: 8,
			step: 1,
			default: 1,
			value: 1
		}
	],
	fragmentShader: DITHER_FRAGMENT
};

/** Pattern index → human-readable name (for docs / tooltips). */
export const DITHER_PATTERNS = [
	'Bayer 2×2',
	'Bayer 4×4',
	'Bayer 8×8',
	'Clustered dot',
	'Diagonal lines',
	'Blue noise',
	'Floyd-Steinberg look',
	'Atkinson look',
	'Cross hatch',
	'Noise'
] as const;

export const DITHER_PALETTES = [
	'Monochrome',
	'Grayscale',
	'RGB quantize',
	'Game Boy',
	'CGA 4-color',
	'EGA 16-color',
	'Risograph'
] as const;

export const DITHER_PALETTE_ZH = [
	'黑白',
	'灰階',
	'RGB 量化',
	'Game Boy',
	'CGA 四色',
	'EGA 16 色',
	'復古印刷',
	'墨水黑白'
] as const;

export const DITHER_PATTERN_ZH = [
	'Bayer 小格',
	'Bayer 中格',
	'Bayer 大格',
	'網點',
	'斜線',
	'藍噪點',
	'Floyd 風',
	'Atkinson 風',
	'交叉線',
	'雜點',
	'Sierra 風',
	'Stucki 風',
	'半調網點',
	'細緻印刷'
] as const;

export type DitherParams = {
	pattern: number;
	palette: number;
	colors: number;
	distance: number;
	strength: number;
	gamma: number;
	pixelstep: number;
};

export const DITHER_PRESETS: { id: string; label: string; params: DitherParams }[] = [
	{
		id: 'effect-app',
		label: '高對比黑白',
		params: {
			pattern: 13,
			palette: 7,
			colors: 13,
			distance: 1,
			strength: 1.2,
			gamma: 2.7,
			pixelstep: 1
		}
	},
	{
		id: 'gameboy',
		label: 'Game Boy',
		params: { pattern: 2, palette: 3, colors: 4, distance: 1, strength: 1.6, gamma: 1.4, pixelstep: 2 }
	},
	{
		id: 'bw-print',
		label: '黑白印刷',
		params: { pattern: 1, palette: 0, colors: 4, distance: 1, strength: 2.0, gamma: 1.6, pixelstep: 2 }
	},
	{
		id: 'riso',
		label: '復古印刷',
		params: { pattern: 9, palette: 6, colors: 15, distance: 1, strength: 2.0, gamma: 1.6, pixelstep: 2 }
	},
	{
		id: 'ega',
		label: 'EGA 復古',
		params: { pattern: 6, palette: 5, colors: 16, distance: 1, strength: 1.8, gamma: 1.5, pixelstep: 2 }
	}
];
