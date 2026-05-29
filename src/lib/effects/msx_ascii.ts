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
	thumbnailParams: { cellsize: 6 },
	params: [
		{ name: 'cellsize',   label: 'Cell Size',    type: 'float', min: 4,    max: 24,  step: 1,    default: 8,   value: 8   },
		{ name: 'palette',    label: 'Palette',      type: 'enum',  min: 0,    max: 3,   step: 1,    default: 0,   value: 0,
		  options: [{ value: 0, label: 'MSX' }, { value: 1, label: 'CGA' }, { value: 2, label: 'Gameboy' }, { value: 3, label: 'Mono' }] },
		{ name: 'charmode',   label: 'Char Set',     type: 'enum',  min: 0,    max: 2,   step: 1,    default: 0,   value: 0,
		  options: [{ value: 0, label: 'Blocks' }, { value: 1, label: 'Dots' }, { value: 2, label: 'Lines' }] },
		{ name: 'animmode',   label: 'Animation',    type: 'enum',  min: 0,    max: 3,   step: 1,    default: 1,   value: 1,
		  options: [{ value: 0, label: 'Off' }, { value: 1, label: 'Scanline' }, { value: 2, label: 'Palette' }, { value: 3, label: 'Jitter' }] },
		{ name: 'animspeed',  label: 'Anim Speed',   type: 'float', min: 0.25, max: 3,   step: 0.05, default: 1,   value: 1   },
		{ name: 'contrast',   label: 'Contrast',     type: 'float', min: 0.5,  max: 3,   step: 0.05, default: 1.2, value: 1.2 },
		{ name: 'brightness', label: 'Brightness',   type: 'float', min: -0.5, max: 0.5, step: 0.01, default: 0,   value: 0   },
		{ name: 'bgcolor',    label: 'BG Mode',      type: 'enum',  min: 0,    max: 1,   step: 1,    default: 0,   value: 0,
		  options: [{ value: 0, label: 'Black' }, { value: 1, label: 'Dark' }] }
	],
	fragmentShader: HEADER + `
uniform float u_cellsize;
uniform float u_palette;
uniform float u_charmode;
uniform float u_contrast;
uniform float u_brightness;
uniform float u_bgcolor;
uniform float u_animmode;
uniform float u_animspeed;
uniform float u_time;
uniform float u_duration;

vec3 msxColor(int i) {
  if (i ==  0) return vec3(0.000, 0.000, 0.000);
  if (i ==  1) return vec3(0.000, 0.000, 0.000);
  if (i ==  2) return vec3(0.141, 0.859, 0.376);
  if (i ==  3) return vec3(0.427, 0.922, 0.565);
  if (i ==  4) return vec3(0.314, 0.298, 0.894);
  if (i ==  5) return vec3(0.471, 0.420, 0.925);
  if (i ==  6) return vec3(0.765, 0.282, 0.251);
  if (i ==  7) return vec3(0.365, 0.894, 0.827);
  if (i ==  8) return vec3(0.863, 0.298, 0.251);
  if (i ==  9) return vec3(0.922, 0.565, 0.502);
  if (i == 10) return vec3(0.800, 0.765, 0.282);
  if (i == 11) return vec3(0.863, 0.863, 0.510);
  if (i == 12) return vec3(0.251, 0.729, 0.251);
  if (i == 13) return vec3(0.792, 0.357, 0.725);
  if (i == 14) return vec3(0.800, 0.800, 0.800);
  return vec3(1.000, 1.000, 1.000);
}

vec3 cgaColor(int i) {
  if (i ==  0) return vec3(0.000, 0.000, 0.000);
  if (i ==  1) return vec3(0.000, 0.000, 0.667);
  if (i ==  2) return vec3(0.000, 0.667, 0.000);
  if (i ==  3) return vec3(0.000, 0.667, 0.667);
  if (i ==  4) return vec3(0.667, 0.000, 0.000);
  if (i ==  5) return vec3(0.667, 0.000, 0.667);
  if (i ==  6) return vec3(0.667, 0.333, 0.000);
  if (i ==  7) return vec3(0.667, 0.667, 0.667);
  if (i ==  8) return vec3(0.333, 0.333, 0.333);
  if (i ==  9) return vec3(0.333, 0.333, 1.000);
  if (i == 10) return vec3(0.333, 1.000, 0.333);
  if (i == 11) return vec3(0.333, 1.000, 1.000);
  if (i == 12) return vec3(1.000, 0.333, 0.333);
  if (i == 13) return vec3(1.000, 0.333, 1.000);
  if (i == 14) return vec3(1.000, 1.000, 0.333);
  return vec3(1.000, 1.000, 1.000);
}

vec3 gbColor(int i) {
  if (i == 0) return vec3(0.608, 0.737, 0.059);
  if (i == 1) return vec3(0.455, 0.608, 0.059);
  if (i == 2) return vec3(0.188, 0.388, 0.188);
  return vec3(0.063, 0.118, 0.059);
}

vec3 nearestPal(vec3 col) {
  float best = 1e9;
  vec3 result = vec3(0.0);
  if (u_palette < 0.5) {
    for (int i = 1; i < 16; i++) {
      vec3 c = msxColor(i);
      float d = distance(col, c);
      if (d < best) { best = d; result = c; }
    }
  } else if (u_palette < 1.5) {
    for (int i = 0; i < 16; i++) {
      vec3 c = cgaColor(i);
      float d = distance(col, c);
      if (d < best) { best = d; result = c; }
    }
  } else if (u_palette < 2.5) {
    for (int i = 0; i < 4; i++) {
      vec3 c = gbColor(i);
      float d = distance(col, c);
      if (d < best) { best = d; result = c; }
    }
  } else {
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    result = vec3(step(0.5, lum));
  }
  return result;
}

bool inkPixel(int level, int x, int y) {
  if (level <= 0) return false;
  if (level >= 7) return true;
  if (u_charmode < 0.5) {
    if (level == 1) return x >= 4 && y >= 4;
    if (level == 2) return (x < 4 && y >= 4) || (x >= 4 && y < 4);
    if (level == 3) return x >= 4 || y >= 4;
    if (level == 4) return (x + y) % 2 == 0;
    if (level == 5) return x % 2 == 0 || y % 2 == 0;
    return (x % 4 != 3) || (y % 4 != 3);
  } else if (u_charmode < 1.5) {
    if (level == 1) return x == 4 && y == 4;
    if (level == 2) return x % 4 == 0 && y % 4 == 0;
    if (level == 3) return x % 2 == 0 && y % 2 == 0;
    if (level == 4) return (x + y) % 2 == 0;
    if (level == 5) return x % 2 == 0 || y % 2 == 0;
    return x % 3 != 2 && y % 3 != 2;
  } else {
    if (level == 1) return y == 7;
    if (level == 2) return y >= 6;
    if (level == 3) return y >= 4;
    if (level == 4) return y % 2 == 0;
    if (level == 5) return y % 2 == 0 || x == 0;
    return y % 2 == 0 || x % 4 == 0;
  }
}

void main() {
  float cell = max(4.0, u_cellsize);
  float speed = max(0.25, u_animspeed);

  vec2 cellIdx = floor(v_texCoord * u_resolution / cell);
  vec2 localPx  = mod(v_texCoord * u_resolution, cell);

  vec2 sampleIdx = cellIdx;
  if (u_animmode > 2.5) {
    vec2 jitter = vec2(
      sin(u_time * 3.0 * speed + cellIdx.x * 0.65),
      cos(u_time * 2.4 * speed + cellIdx.y * 0.55)
    ) * 0.35;
    sampleIdx += jitter;
  }

  vec2 cellCenter = (sampleIdx + 0.5) * cell / u_resolution;
  vec4 src = texture(u_texture, clamp(cellCenter, 0.001, 0.999));

  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5 + u_brightness, 0.0, 1.0);

  if (u_animmode > 1.5 && u_animmode < 2.5) {
    lum = fract(lum + fract(u_time * 0.22 * speed) * 0.85);
  }

  vec3 fg = nearestPal(src.rgb);
  vec3 bg = (u_bgcolor < 0.5) ? vec3(0.0) : nearestPal(src.rgb * 0.25);

  int level = int(lum * 7.999);
  int px = int(localPx.x / cell * 8.0) % 8;
  int py = int(localPx.y / cell * 8.0) % 8;

  bool ink = inkPixel(level, px, py);

  if (u_animmode > 0.5 && u_animmode < 1.5) {
    float wave = fract(u_time * 0.28 * speed);
    float rowNorm = cellIdx.y / max(1.0, floor(u_resolution.y / cell));
    if (rowNorm > wave) {
      ink = false;
      fg = bg;
    } else {
      float edge = smoothstep(wave - 0.06, wave, rowNorm);
      fg = mix(fg, vec3(0.9, 0.95, 1.0), (1.0 - edge) * 0.35);
    }
  }

  outColor = vec4(ink ? fg : bg, src.a);
}
`
};
