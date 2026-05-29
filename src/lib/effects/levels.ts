import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

/** Effect.app-style tonal levels (shadows / midtones / highlights). */
export const LEVELS_FRAGMENT = HEADER + `
uniform float u_shadows;
uniform float u_midtones;
uniform float u_highlights;

void main() {
  vec4 c = texture(u_texture, v_texCoord);
  vec3 rgb = c.rgb;

  // Input levels
  float lo = u_shadows * 0.4;
  float hi = 1.0 - (1.0 - u_highlights) * 0.4;
  rgb = (rgb - lo) / max(hi - lo, 0.001);

  // Midtone pivot
  float m = u_midtones * 0.5;
  rgb = rgb + m * (0.5 - rgb);

  rgb = clamp(rgb, 0.0, 1.0);
  outColor = vec4(rgb, c.a);
}`;

export const LEVELS_EFFECT: Effect = {
	id: 'levels',
	name: 'Levels',
	category: 'Adjust',
	enabled: true,
	params: [
		{
			name: 'shadows',
			label: 'shadows',
			hint: '暗部。調高提亮陰影，調低壓暗暗部。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'midtones',
			label: 'midtones',
			hint: '中間調。調整整體明暗平衡。',
			type: 'float',
			min: -1,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'highlights',
			label: 'highlights',
			hint: '亮部。調低可壓縮高光。',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 1,
			value: 1
		}
	],
	fragmentShader: LEVELS_FRAGMENT
};
