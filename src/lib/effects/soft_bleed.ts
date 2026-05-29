import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

/** Ink spread between halftone dots (effect.app SOFT BLEED CRACKS — simplified). */
export const SOFT_BLEED_FRAGMENT = HEADER + `
uniform float u_amount;
uniform float u_radius;

void main() {
  vec2 t = max(u_radius, 0.5) / u_resolution;
  vec3 c = texture(u_texture, v_texCoord).rgb;
  vec3 blur = c;
  blur += texture(u_texture, v_texCoord + vec2(t.x, 0.0)).rgb;
  blur += texture(u_texture, v_texCoord - vec2(t.x, 0.0)).rgb;
  blur += texture(u_texture, v_texCoord + vec2(0.0, t.y)).rgb;
  blur += texture(u_texture, v_texCoord - vec2(0.0, t.y)).rgb;
  blur /= 5.0;
  vec3 rgb = mix(c, blur, u_amount);
  outColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
}`;

export const SOFT_BLEED_EFFECT: Effect = {
	id: 'soft_bleed',
	name: 'Soft Bleed',
	category: 'Film',
	enabled: true,
	params: [
		{
			name: 'amount',
			label: 'Bleed',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.02,
			default: 0.35,
			value: 0.35
		},
		{
			name: 'radius',
			label: 'Radius',
			type: 'float',
			min: 0.5,
			max: 4,
			step: 0.25,
			default: 1.5,
			value: 1.5
		}
	],
	fragmentShader: SOFT_BLEED_FRAGMENT
};
