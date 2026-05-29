import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

/** Zone-based tone curve (Effect.app CURVES family). */
export const CURVES_FRAGMENT = HEADER + `
uniform float u_shadows;
uniform float u_darks;
uniform float u_lights;
uniform float u_highlights;

float zoneWeight(float v, float center, float width) {
  float d = abs(v - center) / max(width, 0.001);
  return exp(-d * d * 4.0);
}

float applyCurve(float v) {
  float wS = zoneWeight(v, 0.08, 0.22);
  float wD = zoneWeight(v, 0.32, 0.22);
  float wL = zoneWeight(v, 0.68, 0.22);
  float wH = zoneWeight(v, 0.92, 0.22);
  float wSum = wS + wD + wL + wH + 0.001;
  float adjust = (u_shadows * wS + u_darks * wD + u_lights * wL + u_highlights * wH) / wSum;
  return clamp(v + adjust * 0.42, 0.0, 1.0);
}

void main() {
  vec4 c = texture(u_texture, v_texCoord);
  outColor = vec4(applyCurve(c.r), applyCurve(c.g), applyCurve(c.b), c.a);
}`;

export const CURVES_EFFECT: Effect = {
	id: 'curves',
	name: 'Curves',
	category: 'Color',
	enabled: true,
	params: [
		{
			name: 'shadows',
			label: 'Shadows',
			hint: 'Lift or crush deep shadows.',
			type: 'float',
			min: -1,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'darks',
			label: 'Darks',
			hint: 'Adjust quarter-tone response.',
			type: 'float',
			min: -1,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'lights',
			label: 'Lights',
			hint: 'Adjust three-quarter tones.',
			type: 'float',
			min: -1,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'highlights',
			label: 'Highlights',
			hint: 'Compress or open highlight roll-off.',
			type: 'float',
			min: -1,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		}
	],
	fragmentShader: CURVES_FRAGMENT
};
