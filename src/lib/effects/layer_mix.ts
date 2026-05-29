import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform sampler2D u_original;
uniform vec2 u_resolution;
`;

const FRAGMENT = HEADER + `
uniform float u_fit;
uniform float u_texture_scale;
uniform float u_blend_channel;
uniform float u_current_low;
uniform float u_current_high;
uniform float u_underlying_low;
uniform float u_underlying_high;
uniform float u_opacity;
uniform float u_blend_mode;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 paperUV(vec2 uv, float scale) {
  float ar = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 tuv = uv;
  if (u_fit < 0.5) {
    if (ar > 1.0) tuv.y = (uv.y - 0.5) / (ar / scale) + 0.5;
    else tuv.x = (uv.x - 0.5) / (scale / ar) + 0.5;
    tuv = (tuv - 0.5) / scale + 0.5;
  } else if (u_fit > 1.5) {
    if (ar > 1.0) tuv.x *= ar / scale;
    else tuv.y *= scale / ar;
    tuv *= scale;
  }
  return tuv;
}

vec3 samplePaper(vec2 uv) {
  vec2 p = paperUV(uv, u_texture_scale);
  float n = hash(floor(p * 120.0));
  float grain = hash(p * 400.0 + n);
  return vec3(mix(0.88, 1.0, n * 0.5 + grain * 0.15));
}

float channelValue(vec3 c, int ch) {
  if (ch == 1) return c.r;
  if (ch == 2) return c.g;
  if (ch == 3) return c.b;
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 multiplyBlend(vec3 base, vec3 blend) { return base * blend; }
vec3 screenBlend(vec3 base, vec3 blend) { return 1.0 - (1.0 - base) * (1.0 - blend); }
vec3 overlayBlend(vec3 base, vec3 blend) {
  return vec3(
    base.r < 0.5 ? 2.0 * base.r * blend.r : 1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r),
    base.g < 0.5 ? 2.0 * base.g * blend.g : 1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g),
    base.b < 0.5 ? 2.0 * base.b * blend.b : 1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b)
  );
}
vec3 softLightBlend(vec3 base, vec3 blend) {
  return vec3(
    blend.r < 0.5 ? 2.0 * base.r * blend.r + base.r * base.r * (1.0 - 2.0 * blend.r) :
      sqrt(base.r) * (2.0 * blend.r - 1.0) + 2.0 * base.r * (1.0 - blend.r),
    blend.g < 0.5 ? 2.0 * base.g * blend.g + base.g * base.g * (1.0 - 2.0 * blend.g) :
      sqrt(base.g) * (2.0 * blend.g - 1.0) + 2.0 * base.g * (1.0 - blend.g),
    blend.b < 0.5 ? 2.0 * base.b * blend.b + base.b * base.b * (1.0 - 2.0 * blend.b) :
      sqrt(base.b) * (2.0 * blend.b - 1.0) + 2.0 * base.b * (1.0 - blend.b)
  );
}
vec3 hardLightBlend(vec3 base, vec3 blend) {
  return vec3(
    blend.r < 0.5 ? 2.0 * base.r * blend.r : 1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r),
    blend.g < 0.5 ? 2.0 * base.g * blend.g : 1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g),
    blend.b < 0.5 ? 2.0 * base.b * blend.b : 1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b)
  );
}
vec3 colorDodgeBlend(vec3 base, vec3 blend) {
  return vec3(
    blend.r >= 1.0 ? 1.0 : min(base.r / max(1.0 - blend.r, 1e-5), 1.0),
    blend.g >= 1.0 ? 1.0 : min(base.g / max(1.0 - blend.g, 1e-5), 1.0),
    blend.b >= 1.0 ? 1.0 : min(base.b / max(1.0 - blend.b, 1e-5), 1.0)
  );
}
vec3 hardMixBlend(vec3 base, vec3 blend) {
  vec3 vivid = colorDodgeBlend(base, max(blend, vec3(0.001)));
  return step(vec3(0.5), vivid);
}
vec3 applyBlendMode(vec3 base, vec3 blend, int mode) {
  if (mode == 1) return multiplyBlend(base, blend);
  if (mode == 2) return screenBlend(base, blend);
  if (mode == 3) return overlayBlend(base, blend);
  if (mode == 4) return softLightBlend(base, blend);
  if (mode == 5) return hardLightBlend(base, blend);
  if (mode == 6) return colorDodgeBlend(base, blend);
  if (mode == 7) return hardMixBlend(base, blend);
  return blend;
}

void main() {
  vec4 layer = texture(u_texture, v_texCoord);
  vec4 base = texture(u_original, v_texCoord);
  vec3 paper = samplePaper(v_texCoord);
  vec3 overlay = mix(layer.rgb, paper, 0.65);
  int ch = int(u_blend_channel);
  float curMask = smoothstep(u_current_low, u_current_high, channelValue(overlay, ch));
  float underMask = smoothstep(u_underlying_low, u_underlying_high, channelValue(base.rgb, ch));
  float blendMask = curMask * underMask;
  vec3 blended = applyBlendMode(base.rgb, overlay, int(u_blend_mode));
  float alpha = u_opacity * blendMask;
  outColor = vec4(mix(base.rgb, blended, alpha), base.a);
}`;

export const LAYER_MIX_EFFECT: Effect = {
	id: 'layer_mix',
	name: 'Layer Mix',
	category: 'Effects',
	enabled: true,
	params: [
		{
			name: 'fit',
			label: 'Fit',
			type: 'enum',
			default: 2,
			value: 2,
			options: [
				{ value: 0, label: 'Fill' },
				{ value: 1, label: 'Stretch' },
				{ value: 2, label: 'Tile' }
			]
		},
		{ name: 'texture_scale', label: 'Texture scale', type: 'float', min: 1, max: 5, step: 0.01, default: 1.4, value: 1.4 },
		{
			name: 'blend_channel',
			label: 'Blend channel',
			type: 'enum',
			default: 0,
			value: 0,
			options: [
				{ value: 0, label: 'Luma' },
				{ value: 1, label: 'Red' },
				{ value: 2, label: 'Green' },
				{ value: 3, label: 'Blue' }
			]
		},
		{ name: 'current_low', label: 'Layer ramp low', type: 'float', min: 0, max: 1, step: 0.01, default: 0.2, value: 0.2 },
		{ name: 'current_high', label: 'Layer ramp high', type: 'float', min: 0, max: 1, step: 0.01, default: 0.85, value: 0.85 },
		{ name: 'underlying_low', label: 'Base ramp low', type: 'float', min: 0, max: 1, step: 0.01, default: 0.15, value: 0.15 },
		{ name: 'underlying_high', label: 'Base ramp high', type: 'float', min: 0, max: 1, step: 0.01, default: 0.9, value: 0.9 },
		{ name: 'opacity', label: 'Opacity', type: 'float', min: 0, max: 1, step: 0.01, default: 1, value: 1 },
		{
			name: 'blend_mode',
			label: 'Blend mode',
			type: 'enum',
			default: 1,
			value: 1,
			options: [
				{ value: 0, label: 'Normal' },
				{ value: 1, label: 'Multiply' },
				{ value: 2, label: 'Screen' },
				{ value: 3, label: 'Overlay' },
				{ value: 4, label: 'Soft light' },
				{ value: 5, label: 'Hard light' },
				{ value: 6, label: 'Color dodge' },
				{ value: 7, label: 'Hard mix' }
			]
		}
	],
	passes: [{ id: 'main', fragmentShader: FRAGMENT, useOriginal: true }]
};
