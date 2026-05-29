import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

/** Paper scan — overlay/multiply grain (effect.app PAPER SCAN). */
export const PAPER_GRAIN_FRAGMENT = HEADER + `
uniform float u_amount;
uniform float u_scale;
uniform float u_contrast;
uniform float u_warmth;
uniform float u_blend;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float grainAt(vec2 uv) {
  vec2 p = uv * u_resolution / max(u_scale, 0.5);
  float g = hash(floor(p));
  g += hash(floor(p * 2.7) + 17.0) * 0.5;
  g += hash(floor(p * 5.3) + 41.0) * 0.25;
  return g / 1.75;
}

float overlay(float base, float blend) {
  return base < 0.5 ? 2.0 * base * blend : 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
}

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  float g = grainAt(v_texCoord);
  g = mix(0.5, g, u_contrast);
  float grain = (g - 0.5) * u_amount;

  vec3 warm = vec3(1.03, 1.01, 0.97);
  vec3 rgb = col.rgb;

  float lum = dot(rgb, vec3(0.299, 0.587, 0.114));
  rgb = vec3(
    overlay(lum, lum + grain),
    overlay(lum, lum + grain * 0.95),
    overlay(lum, lum + grain * 0.9)
  );
  rgb = mix(col.rgb, rgb, u_blend);
  rgb = mix(rgb, rgb * warm, u_warmth * 0.2);
  rgb += grain * 0.03;

  outColor = vec4(clamp(rgb, 0.0, 1.0), col.a);
}`;

export const PAPER_GRAIN_EFFECT: Effect = {
	id: 'paper_grain',
	name: 'Paper Grain',
	category: 'Film',
	enabled: true,
	params: [
		{
			name: 'amount',
			label: 'Amount',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.32,
			value: 0.32
		},
		{
			name: 'scale',
			label: 'Grain size',
			type: 'float',
			min: 0.5,
			max: 8,
			step: 0.1,
			default: 1.4,
			value: 1.4
		},
		{
			name: 'contrast',
			label: 'Contrast',
			type: 'float',
			min: 0,
			max: 2,
			step: 0.05,
			default: 1.1,
			value: 1.1
		},
		{
			name: 'warmth',
			label: 'Paper warmth',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.02,
			default: 0.5,
			value: 0.5
		},
		{
			name: 'blend',
			label: 'Blend',
			hint: '0=原圖疊紋，1=全 overlay 紙紋。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.02,
			default: 0.55,
			value: 0.55
		}
	],
	fragmentShader: PAPER_GRAIN_FRAGMENT
};
