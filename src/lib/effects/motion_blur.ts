import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform sampler2D u_original;
uniform vec2 u_resolution;
uniform float u_strength;
uniform float u_angle;
uniform float u_box;
uniform float u_both_directions;
uniform float u_enable_mask;
uniform vec2 u_mask_center;
uniform float u_mask_radius;
uniform float u_mask_falloff;

void main() {
  vec2 texel = 1.0 / u_resolution;
  float rad = u_angle * 3.14159265 / 180.0;
  vec2 dir = vec2(cos(rad), sin(rad)) * u_strength * texel;

  float sampleCount = clamp(u_strength * 0.5 + 8.0, 8.0, 64.0);
  vec4 acc = vec4(0.0);
  float total = 0.0;

  for (float i = -32.0; i <= 32.0; i++) {
    if (abs(i) > sampleCount * 0.5) continue;
    if (i > 0.0 && u_both_directions < 0.5) continue;

    float t = i / max(sampleCount * 0.5, 1.0);
    float w = u_box > 0.5 ? 1.0 : exp(-t * t * 2.0);
    vec2 offset = dir * t;
    vec2 uv = v_texCoord + offset;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) continue;
    acc += texture(u_texture, uv) * w;
    total += w;
  }

  vec4 blurred = total > 0.0 ? acc / total : texture(u_texture, v_texCoord);
  vec4 original = texture(u_original, v_texCoord);

  float mask = 1.0;
  if (u_enable_mask > 0.5) {
    vec2 center = u_mask_center * 0.5 + 0.5;
    vec2 centered = (v_texCoord - center) * vec2(u_resolution.x / u_resolution.y, 1.0);
    float dist = length(centered);
    mask = 1.0 - smoothstep(u_mask_radius, u_mask_radius + u_mask_falloff * 0.25, dist);
  }

  outColor = mix(original, blurred, mask);
}`;

export const MOTION_BLUR_EFFECT: Effect = {
	id: 'motion_blur',
	name: 'Motion Blur',
	category: 'Adjust',
	enabled: true,
	params: [
		{
			name: 'strength',
			label: 'Strength',
			hint: 'Blur distance in pixels.',
			type: 'float',
			min: 0,
			max: 80,
			step: 0.5,
			default: 20,
			value: 20
		},
		{
			name: 'angle',
			label: 'Angle',
			hint: 'Direction in degrees.',
			type: 'float',
			min: 0,
			max: 360,
			step: 1,
			default: 0,
			value: 0
		},
		{
			name: 'box',
			label: 'Box',
			hint: 'Use box blur instead of Gaussian weighting.',
			type: 'bool',
			default: false,
			value: false
		},
		{
			name: 'both_directions',
			label: 'Both Directions',
			hint: 'Blur symmetrically around each pixel.',
			type: 'bool',
			default: true,
			value: true
		},
		{
			name: 'enable_mask',
			label: 'Enable Mask',
			hint: 'Limit blur to a radial region.',
			type: 'bool',
			default: false,
			value: false
		},
		{
			name: 'mask_center',
			label: 'Mask Center',
			type: 'vec2',
			min: -1,
			max: 1,
			default: [0, 0]
		},
		{
			name: 'mask_radius',
			label: 'Mask Radius',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.35,
			value: 0.35
		},
		{
			name: 'mask_falloff',
			label: 'Mask Falloff',
			type: 'float',
			min: 0.1,
			max: 4,
			step: 0.1,
			default: 2,
			value: 2
		}
	],
	passes: [{ id: 'main', fragmentShader: HEADER, useOriginal: true }]
};
