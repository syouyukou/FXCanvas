import type { Effect } from '../engine/renderer';

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_spread;
uniform float u_decay;
uniform float u_intensity;
uniform float u_direction;
uniform float u_noise_size;
uniform float u_grain;
uniform float u_grain_size;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float inkAmount(vec3 c) {
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  return 1.0 - smoothstep(0.04, 0.9, lum);
}

void main() {
  vec3 base = texture(u_texture, v_texCoord).rgb;
  vec2 texel = 1.0 / u_resolution;
  float rad = radians(u_direction);

  float paper = hash(floor(v_texCoord * u_resolution / max(u_grain_size, 0.5)));
  paper = mix(1.0, 0.55 + paper * 0.9, u_grain);

  float localSpread = u_spread * paper;
  float noise =
    (hash(v_texCoord * u_resolution / max(u_noise_size * 28.0 + 1.0, 1.0)) - 0.5) * u_noise_size;

  vec3 accumColor = vec3(0.0);
  float accumInk = 0.0;
  float wSum = 0.0;

  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float t = (fi + 1.0) / 12.0;
    float fall = pow(1.0 - t, mix(0.35, 2.8, u_decay));

    float ang = rad + noise * 3.14159 + fi * 0.523599;
    vec2 dir = vec2(cos(ang), sin(ang));
    vec2 off = dir * localSpread * t * texel * 8.0;

    vec3 s = texture(u_texture, v_texCoord + off).rgb;
    float ink = inkAmount(s);
    float w = fall * ink;
    accumColor += s * w;
    accumInk = max(accumInk, ink * fall);
    wSum += w;
  }

  vec3 avgInk = wSum > 0.001 ? accumColor / wSum : base;
  float selfInk = inkAmount(base);
  float bleedAmt = accumInk * (1.0 - selfInk * 0.45) * u_intensity;
  vec3 rgb = mix(base, avgInk, clamp(bleedAmt, 0.0, 1.0));
  rgb = mix(rgb, rgb * 0.9, bleedAmt * u_grain * 0.3);

  outColor = vec4(clamp(rgb, 0.0, 1.0), texture(u_texture, v_texCoord).a);
}`;

/** Ink spread into paper fibers (effect.app INK BLEED). */
export const INK_BLEED_EFFECT: Effect = {
	id: 'ink_bleed',
	name: 'Ink Bleed',
	category: 'Film',
	enabled: true,
	params: [
		{
			name: 'spread',
			label: 'Spread',
			hint: 'How far ink spreads from dark areas.',
			type: 'float',
			min: 0,
			max: 24,
			step: 0.5,
			default: 6,
			value: 6
		},
		{
			name: 'decay',
			label: 'Decay',
			hint: 'Falloff of the spread (higher = sharper edge).',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.45,
			value: 0.45
		},
		{
			name: 'intensity',
			label: 'Intensity',
			type: 'float',
			min: 0,
			max: 2,
			step: 0.01,
			default: 0.75,
			value: 0.75
		},
		{
			name: 'direction',
			label: 'Direction',
			hint: 'Primary bleed angle (degrees).',
			type: 'float',
			min: 0,
			max: 360,
			step: 1,
			default: 45,
			value: 45
		},
		{
			name: 'noise_size',
			label: 'Noise size',
			hint: 'Micro variation in spread direction.',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.35,
			value: 0.35
		},
		{
			name: 'grain',
			label: 'Grain',
			hint: 'Paper fiber unevenness.',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.4,
			value: 0.4
		},
		{
			name: 'grain_size',
			label: 'Grain size',
			type: 'float',
			min: 0.5,
			max: 12,
			step: 0.25,
			default: 2.5,
			value: 2.5
		}
	],
	fragmentShader: FRAGMENT
};
