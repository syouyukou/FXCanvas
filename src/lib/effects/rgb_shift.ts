import type { Effect } from '../engine/renderer';

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_amount;
uniform float u_angle;
uniform float u_time;
uniform float u_animate;

void main() {
  float split = u_amount * 0.035;
  float wave = sin(u_time * 2.1) * clamp(u_animate, 0.0, 1.0) * u_amount * 0.018;
  float rad = radians(u_angle);
  vec2 dir = vec2(cos(rad), sin(rad));
  vec2 off = dir * (split + wave);
  vec3 col = vec3(
    texture(u_texture, clamp(v_texCoord + off, 0.001, 0.999)).r,
    texture(u_texture, v_texCoord).g,
    texture(u_texture, clamp(v_texCoord - off, 0.001, 0.999)).b
  );
  outColor = vec4(col, texture(u_texture, v_texCoord).a);
}`;

/** RGB channel offset (effect.app RGB SHIFT). */
export const RGB_SHIFT_EFFECT: Effect = {
	id: 'rgb_shift',
	name: 'RGB Shift',
	category: 'Distort',
	enabled: true,
	params: [
		{
			name: 'amount',
			label: 'Amount',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.45,
			value: 0.45
		},
		{
			name: 'angle',
			label: 'Angle',
			type: 'float',
			min: 0,
			max: 360,
			step: 1,
			default: 0,
			value: 0
		},
		{
			name: 'animate',
			label: 'Animate',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 1,
			value: 1
		}
	],
	fragmentShader: FRAGMENT
};
