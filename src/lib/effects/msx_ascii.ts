import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

export const MSX_ASCII: Effect = {
	id: 'msx_ascii',
	name: 'MSX ASCII',
	category: 'Effects',
	enabled: true,
	thumbnailParams: { u_cellsize: 6.0 },
	params: [
		{ name: 'cellsize',   label: 'Cell Size',    type: 'float', min: 4,  max: 24, step: 1,    default: 8,   value: 8   },
		{ name: 'palette',    label: 'Palette',      type: 'enum',  min: 0,  max: 3,  step: 1,    default: 0,   value: 0,
		  options: [{ value: 0, label: 'MSX' }, { value: 1, label: 'CGA' }, { value: 2, label: 'Gameboy' }, { value: 3, label: 'Mono' }] },
		{ name: 'charmode',   label: 'Char Set',     type: 'enum',  min: 0,  max: 2,  step: 1,    default: 0,   value: 0,
		  options: [{ value: 0, label: 'Blocks' }, { value: 1, label: 'Dots' }, { value: 2, label: 'Lines' }] },
		{ name: 'contrast',   label: 'Contrast',     type: 'float', min: 0.5, max: 3, step: 0.05, default: 1.2, value: 1.2 },
		{ name: 'brightness', label: 'Brightness',   type: 'float', min: -0.5, max: 0.5, step: 0.01, default: 0, value: 0 },
		{ name: 'bgcolor',    label: 'BG Mode',      type: 'enum',  min: 0,  max: 1,  step: 1,    default: 0,   value: 0,
		  options: [{ value: 0, label: 'Black' }, { value: 1, label: 'Dark' }] }
	],
	fragmentShader: HEADER + `
uniform float u_cellsize;
uniform float u_palette;
uniform float u_charmode;
uniform float u_contrast;
uniform float u_brightness;
uniform float u_bgcolor;

// ── MSX 15-colour palette ──────────────────────────────────
vec3 msxCol[16];
void initMSX() {
  msxCol[0]  = vec3(0.000, 0.000, 0.000);
  msxCol[1]  = vec3(0.000, 0.000, 0.000);
  msxCol[2]  = vec3(0.141, 0.859, 0.376);
  msxCol[3]  = vec3(0.427, 0.922, 0.565);
  msxCol[4]  = vec3(0.314, 0.298, 0.894);
  msxCol[5]  = vec3(0.471, 0.420, 0.925);
  msxCol[6]  = vec3(0.765, 0.282, 0.251);
  msxCol[7]  = vec3(0.365, 0.894, 0.827);
  msxCol[8]  = vec3(0.863, 0.298, 0.251);
  msxCol[9]  = vec3(0.922, 0.565, 0.502);
  msxCol[10] = vec3(0.800, 0.765, 0.282);
  msxCol[11] = vec3(0.863, 0.863, 0.510);
  msxCol[12] = vec3(0.251, 0.729, 0.251);
  msxCol[13] = vec3(0.792, 0.357, 0.725);
  msxCol[14] = vec3(0.800, 0.800, 0.800);
  msxCol[15] = vec3(1.000, 1.000, 1.000);
}

// ── CGA palette ───────────────────────────────────────────
vec3 cgaCol[16];
void initCGA() {
  cgaCol[0]  = vec3(0.000, 0.000, 0.000);
  cgaCol[1]  = vec3(0.000, 0.000, 0.667);
  cgaCol[2]  = vec3(0.000, 0.667, 0.000);
  cgaCol[3]  = vec3(0.000, 0.667, 0.667);
  cgaCol[4]  = vec3(0.667, 0.000, 0.000);
  cgaCol[5]  = vec3(0.667, 0.000, 0.667);
  cgaCol[6]  = vec3(0.667, 0.333, 0.000);
  cgaCol[7]  = vec3(0.667, 0.667, 0.667);
  cgaCol[8]  = vec3(0.333, 0.333, 0.333);
  cgaCol[9]  = vec3(0.333, 0.333, 1.000);
  cgaCol[10] = vec3(0.333, 1.000, 0.333);
  cgaCol[11] = vec3(0.333, 1.000, 1.000);
  cgaCol[12] = vec3(1.000, 0.333, 0.333);
  cgaCol[13] = vec3(1.000, 0.333, 1.000);
  cgaCol[14] = vec3(1.000, 1.000, 0.333);
  cgaCol[15] = vec3(1.000, 1.000, 1.000);
}

// ── Gameboy palette (4 colours) ────────────────────────────
vec3 gbCol[4];
void initGB() {
  gbCol[0] = vec3(0.608, 0.737, 0.059);
  gbCol[1] = vec3(0.455, 0.608, 0.059);
  gbCol[2] = vec3(0.188, 0.388, 0.188);
  gbCol[3] = vec3(0.063, 0.118, 0.059);
}

// ── Nearest colour helper ──────────────────────────────────
vec3 nearestPal(vec3 col) {
  float best = 1e9;
  vec3 result = vec3(0.0);
  if (u_palette < 0.5) {
    initMSX();
    for (int i = 1; i < 16; i++) {
      float d = distance(col, msxCol[i]);
      if (d < best) { best = d; result = msxCol[i]; }
    }
  } else if (u_palette < 1.5) {
    initCGA();
    for (int i = 0; i < 16; i++) {
      float d = distance(col, cgaCol[i]);
      if (d < best) { best = d; result = cgaCol[i]; }
    }
  } else if (u_palette < 2.5) {
    initGB();
    for (int i = 0; i < 4; i++) {
      float d = distance(col, gbCol[i]);
      if (d < best) { best = d; result = gbCol[i]; }
    }
  } else {
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    result = vec3(step(0.5, lum));
  }
  return result;
}

// ── Character pattern ──────────────────────────────────────
// level 0-7 maps to density; lp = local pos 0-8 within cell
bool inkPixel(int level, vec2 lp) {
  int x = int(lp.x) % 8;
  int y = int(lp.y) % 8;

  if (level <= 0) return false;
  if (level >= 7) return true;

  if (u_charmode < 0.5) {
    // Block mode: quarter-fills then full
    if (level == 1) return x >= 4 && y >= 4;
    if (level == 2) return (x < 4 && y >= 4) || (x >= 4 && y < 4);
    if (level == 3) return x >= 4 || y >= 4;
    if (level == 4) return (x + y) % 2 == 0;
    if (level == 5) return x % 2 == 0 || y % 2 == 0;
    if (level == 6) return !(x % 4 == 3 && y % 4 == 3);
  } else if (u_charmode < 1.5) {
    // Dot mode
    if (level == 1) return x == 4 && y == 4;
    if (level == 2) return (x % 4 == 0) && (y % 4 == 0);
    if (level == 3) return (x % 2 == 0) && (y % 2 == 0);
    if (level == 4) return (x + y) % 2 == 0;
    if (level == 5) return x % 2 == 0 || y % 2 == 0;
    if (level == 6) return (x % 3 != 2) && (y % 3 != 2);
  } else {
    // Line mode
    if (level == 1) return y == 7;
    if (level == 2) return y >= 6;
    if (level == 3) return y >= 4;
    if (level == 4) return y % 2 == 0;
    if (level == 5) return y % 2 == 0 || x == 0;
    if (level == 6) return y % 2 == 0 || x % 4 == 0;
  }
  return false;
}

void main() {
  float cell = max(4.0, u_cellsize);

  // Cell index and local position within cell
  vec2 cellIdx = floor(v_texCoord * u_resolution / cell);
  vec2 localPx  = mod(v_texCoord * u_resolution, cell);

  // Sample source at cell centre
  vec2 cellCenter = (cellIdx + 0.5) * cell / u_resolution;
  vec4 src = texture(u_texture, clamp(cellCenter, 0.001, 0.999));

  // Adjust brightness/contrast
  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5 + u_brightness, 0.0, 1.0);

  // Foreground colour: nearest palette entry
  vec3 fg = nearestPal(src.rgb);

  // Background colour: black or a dark version of fg
  vec3 bg;
  if (u_bgcolor < 0.5) {
    bg = vec3(0.0);
  } else {
    bg = nearestPal(src.rgb * 0.25);
  }

  // Map luminance to 0-7 pattern level
  int level = int(lum * 7.999);

  // Scale local position to 0-8 range for pattern lookup
  vec2 lp = localPx / cell * 8.0;

  bool ink = inkPixel(level, lp);
  outColor = vec4(ink ? fg : bg, src.a);
}
`
};
