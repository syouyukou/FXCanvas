import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

/** Effect.app-style exposure — EV lift + offset in linear light. */
export const EXPOSURE_FRAGMENT = HEADER + `
uniform float u_exposure;
uniform float u_offset;
uniform float u_gamma;

void main() {
  vec4 c = texture(u_texture, v_texCoord);
  vec3 lin = pow(max(c.rgb, 0.0), vec3(1.0 / max(u_gamma, 0.001)));
  lin *= pow(2.0, u_exposure);
  lin += u_offset;
  lin = pow(clamp(lin, 0.0, 1.0), vec3(u_gamma));
  outColor = vec4(lin, c.a);
}`;

export const EXPOSURE_EFFECT: Effect = {
	id: 'exposure',
	name: 'Exposure',
	category: 'Color',
	enabled: true,
	params: [
		{
			name: 'exposure',
			label: 'exposure',
			hint: '曝光量（EV）。調高畫面變亮，適合搭配 Dither 做高對比黑白。',
			type: 'float',
			min: -2,
			max: 2,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'offset',
			label: 'offset',
			hint: '整體明暗偏移。微調中間調。',
			type: 'float',
			min: -0.5,
			max: 0.5,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'gamma',
			label: 'gamma',
			hint: '伽馬曲線。配合 Dither 時可拉開明暗。',
			type: 'float',
			min: 0.5,
			max: 3.5,
			step: 0.05,
			default: 1,
			value: 1
		}
	],
	fragmentShader: EXPOSURE_FRAGMENT
};

/** Matches Effect.app Dither + Exposure stack from reference screenshots. */
export const EFFECT_APP_BW_LOOK = {
	exposure: { exposure: 0.42, offset: -0.02, gamma: 1.0 },
	dither: {
		pattern: 13,
		palette: 7,
		colors: 13,
		distance: 1,
		strength: 1.2,
		gamma: 2.7,
		pixelstep: 1
	}
} as const;
