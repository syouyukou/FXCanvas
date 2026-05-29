import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

const BLUR_H = HEADER + `
uniform float u_radius;
void main() {
  vec2 texel = vec2(1.0 / u_resolution.x, 0.0);
  vec4 color = vec4(0.0);
  float total = 0.0;
  float r = min(u_radius, 12.0);
  for (float x = -r; x <= r; x += 1.0) {
    float w = exp(-(x * x) / (2.0 * r * r + 0.001));
    color += texture(u_texture, v_texCoord + texel * x) * w;
    total += w;
  }
  outColor = color / total;
}`;

const BLUR_V = HEADER + `
uniform float u_radius;
void main() {
  vec2 texel = vec2(0.0, 1.0 / u_resolution.y);
  vec4 color = vec4(0.0);
  float total = 0.0;
  float r = min(u_radius, 12.0);
  for (float y = -r; y <= r; y += 1.0) {
    float w = exp(-(y * y) / (2.0 * r * r + 0.001));
    color += texture(u_texture, v_texCoord + texel * y) * w;
    total += w;
  }
  outColor = color / total;
}`;

const UNSHARP = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform sampler2D u_original;
uniform float u_amount;
uniform float u_threshold;
void main() {
  vec3 orig = texture(u_original, v_texCoord).rgb;
  vec3 blur = texture(u_texture, v_texCoord).rgb;
  vec3 diff = orig - blur;
  float lum = dot(diff, vec3(0.299, 0.587, 0.114));
  float mask = step(u_threshold, abs(lum));
  vec3 sharp = orig + diff * u_amount * mask;
  outColor = vec4(clamp(sharp, 0.0, 1.0), 1.0);
}`;

/** Unsharp mask — Effect.app BLUR/SHARP family. */
export const SHARPEN_EFFECT: Effect = {
	id: 'sharpen',
	name: 'Sharpen',
	category: 'Blur',
	enabled: true,
	params: [
		{
			name: 'amount',
			label: 'Amount',
			hint: 'Sharpening strength. Higher values accentuate edges.',
			type: 'float',
			min: 0,
			max: 3,
			step: 0.05,
			default: 1,
			value: 1
		},
		{
			name: 'radius',
			label: 'Radius',
			hint: 'Blur radius for the unsharp mask.',
			type: 'float',
			min: 0.5,
			max: 8,
			step: 0.25,
			default: 1.5,
			value: 1.5
		},
		{
			name: 'threshold',
			label: 'Threshold',
			hint: 'Ignore subtle differences below this level.',
			type: 'float',
			min: 0,
			max: 0.2,
			step: 0.005,
			default: 0,
			value: 0
		}
	],
	passes: [
		{ id: 'blur_h', fragmentShader: BLUR_H },
		{ id: 'blur_v', fragmentShader: BLUR_V },
		{ id: 'unsharp', useOriginal: true, fragmentShader: UNSHARP }
	]
};
