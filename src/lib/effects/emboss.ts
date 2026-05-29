import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_color;
uniform float u_shadow_intensity;
uniform vec2 u_light_dir;
uniform vec2 u_light_ani;
uniform vec2 u_shadow_dir;
uniform float u_lock_shadow;

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

float heightAt(vec2 uv, vec2 texel, float radius) {
  return luma(texture(u_texture, uv).rgb);
}

void main() {
  vec2 texel = 1.0 / u_resolution;
  float radius = max(u_scale * 0.35, 0.5);

  float l = heightAt(v_texCoord + vec2(-texel.x, 0.0) * radius, texel, radius);
  float r = heightAt(v_texCoord + vec2(texel.x, 0.0) * radius, texel, radius);
  float u = heightAt(v_texCoord + vec2(0.0, texel.y) * radius, texel, radius);
  float d = heightAt(v_texCoord + vec2(0.0, -texel.y) * radius, texel, radius);

  float dx = (r - l) * u_scale;
  float dy = (u - d) * u_scale;
  vec3 normal = normalize(vec3(-dx, -dy, 1.0));

  vec2 lightXY = u_light_dir + u_light_ani;
  vec3 lightDir = normalize(vec3(lightXY, 1.15));

  vec3 shadowVec;
  if (u_lock_shadow > 0.5) {
    shadowVec = vec3(-lightXY, 1.15);
  } else {
    shadowVec = vec3(u_shadow_dir, 1.15);
  }
  vec3 shadowDir = normalize(shadowVec);

  float highlight = max(dot(normal, lightDir), 0.0);
  float shadow = max(dot(normal, -shadowDir), 0.0) * u_shadow_intensity;

  vec4 src = texture(u_texture, v_texCoord);
  float gray = luma(src.rgb);

  vec3 monoRelief = vec3(gray + (highlight - shadow) * 0.62);
  vec3 colorRelief = src.rgb + (highlight - shadow) * 0.38;

  float colorMix = clamp(u_color / 100.0, 0.0, 1.0);
  vec3 rgb = mix(monoRelief, colorRelief, colorMix);
  rgb = clamp(rgb, 0.0, 1.0);

  outColor = vec4(rgb, src.a);
}`;

/** Directional relief emboss (effect.app EMBOSS). */
export const EMBOSS_EFFECT: Effect = {
	id: 'emboss',
	name: 'Emboss',
	category: 'Effects',
	enabled: true,
	params: [
		{
			name: 'scale',
			label: 'Scale',
			hint: 'Relief height — how deep the emboss reads.',
			type: 'float',
			min: 0,
			max: 12,
			step: 0.1,
			default: 4,
			value: 4
		},
		{
			name: 'color',
			label: 'Color',
			hint: 'Blend original color into the relief (0 = mono, 100 = full color).',
			type: 'float',
			min: 0,
			max: 100,
			step: 1,
			default: 30,
			value: 30
		},
		{
			name: 'shadow_intensity',
			label: 'Shadow intensity',
			hint: 'Strength of the shadow side.',
			type: 'float',
			min: 0,
			max: 2,
			step: 0.01,
			default: 0.5,
			value: 0.5
		},
		{
			name: 'light_dir',
			label: 'Light direction',
			type: 'vec2',
			min: -5,
			max: 5,
			default: [0, 0]
		},
		{
			name: 'light_ani',
			label: 'Light angle offset',
			hint: 'Extra light vector offset (pairs with direction).',
			type: 'vec2',
			min: -5,
			max: 5,
			default: [0, 0]
		},
		{
			name: 'shadow_dir',
			label: 'Shadow direction',
			type: 'vec2',
			min: -5,
			max: 5,
			default: [3, -3]
		},
		{
			name: 'lock_shadow',
			label: 'Lock shadow',
			hint: 'Mirror shadow opposite to light direction.',
			type: 'bool',
			default: false,
			value: false
		}
	],
	fragmentShader: HEADER
};
