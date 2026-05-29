import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

/** Edge fade + paper margin (effect.app PRINT STAMP). */
export const PRINT_STAMP_FRAGMENT = HEADER + `
uniform float u_margin;
uniform float u_fade;
uniform float u_roughness;
uniform vec3 u_paperColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  vec2 uv = v_texCoord;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 d = abs(uv - 0.5);
  d.x *= aspect;
  float edge = max(d.x, d.y) * 2.0;
  float m = u_margin;
  float rough = (hash(floor(uv * u_resolution * 0.35)) - 0.5) * u_roughness * 0.015;
  float mask = 1.0 - smoothstep(m + rough, m + u_fade + rough, edge);
  vec3 rgb = mix(u_paperColor, col.rgb, mask);
  outColor = vec4(rgb, col.a);
}`;

export const PRINT_STAMP_EFFECT: Effect = {
	id: 'print_stamp',
	name: 'Print Stamp',
	category: 'Film',
	enabled: true,
	params: [
		{
			name: 'margin',
			label: 'Margin',
			type: 'float',
			min: 0,
			max: 0.4,
			step: 0.01,
			default: 0.04,
			value: 0.04
		},
		{
			name: 'fade',
			label: 'Edge fade',
			type: 'float',
			min: 0.01,
			max: 0.25,
			step: 0.01,
			default: 0.08,
			value: 0.08
		},
		{
			name: 'roughness',
			label: 'Edge roughness',
			type: 'float',
			min: 0,
			max: 2,
			step: 0.05,
			default: 0.9,
			value: 0.9
		},
		{
			name: 'paperColor',
			label: 'Paper color',
			type: 'color',
			default: '#f6f1e8',
			value: '#f6f1e8'
		}
	],
	fragmentShader: PRINT_STAMP_FRAGMENT
};
