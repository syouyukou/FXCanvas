import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

/**
 * RGB angled AM halftone with multiplicative overprint on paper (effect.app RGB HATCH).
 */
export const RGB_HALFTONE_FRAGMENT = HEADER + `
uniform float u_cellSize;
uniform float u_gamma;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_misregister;
uniform float u_dotGain;
uniform float u_sharpness;
uniform float u_angleR;
uniform float u_angleG;
uniform float u_angleB;
uniform float u_inkBleed;

vec2 rot(vec2 p, float a) {
  float c = cos(a), s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

float amDot(float ink, vec2 px, float angle, float cell) {
  vec2 p = rot(px / max(cell, 1.0), angle);
  vec2 c = fract(p) - 0.5;
  float r = length(c) * 2.0;
  float t = pow(clamp(ink, 0.0, 1.0), 0.72);
  t = clamp(t + u_dotGain * 0.1, 0.02, 0.98);
  float edge = mix(0.05, 0.12, u_sharpness);
  return 1.0 - smoothstep(t - edge, t + edge * 0.5, r);
}

vec3 sampleBleed(vec2 uv) {
  vec2 t = 1.5 / u_resolution;
  vec3 acc = texture(u_texture, uv).rgb * 2.0;
  acc += texture(u_texture, uv + vec2(t.x, 0.0)).rgb;
  acc += texture(u_texture, uv - vec2(t.x, 0.0)).rgb;
  acc += texture(u_texture, uv + vec2(0.0, t.y)).rgb;
  acc += texture(u_texture, uv - vec2(0.0, t.y)).rgb;
  acc += texture(u_texture, uv + t).rgb;
  acc += texture(u_texture, uv - t).rgb;
  return acc / 7.0;
}

vec3 saturate(vec3 c, float sat) {
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(lum), c, sat);
}

void main() {
  vec2 uv = v_texCoord;
  vec3 src = mix(texture(u_texture, uv).rgb, sampleBleed(uv), u_inkBleed * 0.55);
  vec3 lin = pow(max(src, 0.0), vec3(max(u_gamma, 0.25)));
  lin = saturate(lin, u_saturation);
  lin = clamp((lin - 0.5) * u_contrast + 0.5, 0.0, 1.0);

  vec2 px = uv * u_resolution;
  float reg = u_misregister;
  vec2 offR = vec2(reg * 1.1, reg * 0.45);
  vec2 offG = vec2(-reg * 0.55, reg * 0.35);
  vec2 offB = vec2(reg * 0.35, -reg * 0.65);

  float cell = max(u_cellSize, 1.5);

  float dr = amDot(lin.r, px + offR, u_angleR, cell);
  float dg = amDot(lin.g, px + offG, u_angleG, cell);
  float db = amDot(lin.b, px + offB, u_angleB, cell);

  vec3 paper = vec3(0.992, 0.988, 0.978);
  vec3 inkR = vec3(0.72, 0.08, 0.42);
  vec3 inkG = vec3(0.12, 0.68, 0.28);
  vec3 inkB = vec3(0.18, 0.32, 0.82);

  vec3 rgb = paper;
  rgb *= mix(vec3(1.0), inkR, dr);
  rgb *= mix(vec3(1.0), inkG, dg);
  rgb *= mix(vec3(1.0), inkB, db);

  float coverage = max(dr, max(dg, db));
  rgb = mix(rgb, lin, coverage * 0.04);

  outColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
}`;

export const RGB_HALFTONE_EFFECT: Effect = {
	id: 'rgb_halftone',
	name: 'RGB Halftone',
	category: 'Film',
	enabled: true,
	params: [
		{
			name: 'cellSize',
			label: 'Dot size',
			hint: '網點大小（像素）。3–5 最接近 effect.app。',
			type: 'float',
			min: 1.5,
			max: 16,
			step: 0.25,
			default: 3.5,
			value: 3.5
		},
		{
			name: 'gamma',
			label: 'Gamma',
			type: 'float',
			min: 0.5,
			max: 3,
			step: 0.05,
			default: 1.38,
			value: 1.38
		},
		{
			name: 'contrast',
			label: 'Contrast',
			type: 'float',
			min: 0.5,
			max: 2.5,
			step: 0.05,
			default: 1.48,
			value: 1.48
		},
		{
			name: 'saturation',
			label: 'Saturation',
			hint: '套色前飽和度，保留粉/青網點。',
			type: 'float',
			min: 0.5,
			max: 2,
			step: 0.05,
			default: 1.18,
			value: 1.18
		},
		{
			name: 'misregister',
			label: 'Misregister',
			type: 'float',
			min: 0,
			max: 8,
			step: 0.25,
			default: 1.8,
			value: 1.8
		},
		{
			name: 'dotGain',
			label: 'Dot gain',
			type: 'float',
			min: -1,
			max: 2,
			step: 0.05,
			default: 0.28,
			value: 0.28
		},
		{
			name: 'sharpness',
			label: 'Dot sharpness',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.05,
			default: 0.72,
			value: 0.72
		},
		{
			name: 'inkBleed',
			label: 'Ink bleed',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.02,
			default: 0.38,
			value: 0.38
		},
		{
			name: 'angleR',
			label: 'Angle R',
			type: 'float',
			min: 0,
			max: 6.28,
			step: 0.05,
			default: 0.26,
			value: 0.26
		},
		{
			name: 'angleG',
			label: 'Angle G',
			type: 'float',
			min: 0,
			max: 6.28,
			step: 0.05,
			default: 1.32,
			value: 1.32
		},
		{
			name: 'angleB',
			label: 'Angle B',
			type: 'float',
			min: 0,
			max: 6.28,
			step: 0.05,
			default: 2.44,
			value: 2.44
		}
	],
	fragmentShader: RGB_HALFTONE_FRAGMENT
};
