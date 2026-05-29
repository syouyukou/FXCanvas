import type { Effect } from '../engine/renderer';

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_radius;
uniform float u_samples;
uniform float u_passes;
uniform float u_decay;

vec4 circularSample(vec2 xy, float r) {
  float n = clamp(u_samples, 3.0, 23.0);
  vec3 accum = vec3(0.0);
  float alpha = texture(u_texture, xy / u_resolution).a;
  r *= max(1.0, alpha);
  for (float i = 0.0; i < 23.0; i++) {
    if (i >= n) break;
    float a = i * (6.28318530717959 / n);
    vec2 off = r * vec2(cos(a), sin(a));
    vec2 uv = clamp((xy + off) / u_resolution, 0.001, 0.999);
    accum += texture(u_texture, uv).rgb;
  }
  return vec4(accum / n, alpha);
}

void main() {
  vec2 xy = v_texCoord * u_resolution;
  vec4 col = circularSample(xy, u_radius);
  float passCount = clamp(u_passes, 1.0, 4.0);
  for (float p = 1.0; p < 4.0; p++) {
    if (p >= passCount) break;
    vec4 next = circularSample(xy, u_radius * pow(u_decay, p));
    col.rgb = mix(col.rgb, next.rgb, 0.55);
  }
  outColor = col;
}`;

/** Radial multi-sample blur (effect.app CIRCULAR BLUR). */
export const CIRCULAR_BLUR_EFFECT: Effect = {
	id: 'circular_blur',
	name: 'Circular Blur',
	category: 'Blur',
	enabled: true,
	params: [
		{
			name: 'radius',
			label: 'Radius',
			type: 'float',
			min: 1,
			max: 100,
			step: 1,
			default: 54,
			value: 54
		},
		{
			name: 'samples',
			label: 'Repetitions',
			hint: 'Sample count around the circle.',
			type: 'float',
			min: 3,
			max: 23,
			step: 1,
			default: 8,
			value: 8
		},
		{
			name: 'passes',
			label: 'Passes',
			type: 'float',
			min: 1,
			max: 4,
			step: 1,
			default: 1,
			value: 1
		},
		{
			name: 'decay',
			label: 'Pass decay',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.4,
			value: 0.4
		}
	],
	fragmentShader: FRAGMENT
};
