import type { Effect } from '../engine/renderer';
import { DEFAULT_GRADIENT_MAP } from '../engine/gradient';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform sampler2D u_grad_lut;
uniform vec2 u_resolution;
uniform float u_grad_shift;
uniform float u_grad_repeat;

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
  float t = fract(lum * u_grad_repeat + u_grad_shift);
  vec3 mapped = texture(u_grad_lut, vec2(t, 0.5)).rgb;
  outColor = vec4(mapped, col.a);
}`;

export const GRADIENT_MAP_EFFECT: Effect = {
	id: 'gradient_map',
	name: 'Gradient Map',
	category: 'Adjust',
	enabled: true,
	params: [
		{
			name: 'gradient',
			label: 'Gradient map',
			type: 'gradient',
			default: DEFAULT_GRADIENT_MAP
		},
		{
			name: 'grad_shift',
			label: 'Gradient shift',
			hint: 'Slide the tonal mapping along the gradient.',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'grad_repeat',
			label: 'Gradient repeat',
			hint: 'Repeat the gradient across the tonal range.',
			type: 'float',
			min: 1,
			max: 8,
			step: 0.1,
			default: 1,
			value: 1
		}
	],
	fragmentShader: HEADER
};
