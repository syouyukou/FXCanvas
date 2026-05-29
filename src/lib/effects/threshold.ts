import type { Effect } from '../engine/renderer';

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform sampler2D u_original;
uniform vec2 u_resolution;
uniform float u_threshold;
uniform float u_edge_mode;
uniform float u_offset_amount;
uniform float u_distance;
uniform float u_outline;
uniform float u_outline_strength;
uniform float u_outline_type;
uniform float u_blend_strength;
uniform float u_blend_mode;
uniform vec3 u_color;

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

float sampleMetric(vec2 uv) {
  vec3 c = texture(u_texture, uv).rgb;
  float lum = luma(c);
  if (u_distance > 0.001) {
    float cd = length(c - u_color) * 1.732;
    return mix(lum, cd, clamp(u_distance, 0.0, 1.0));
  }
  return lum;
}

float sobelEdge(vec2 uv, vec2 texel) {
  float tl = sampleMetric(uv + texel * vec2(-1.0, -1.0));
  float t  = sampleMetric(uv + texel * vec2( 0.0, -1.0));
  float tr = sampleMetric(uv + texel * vec2( 1.0, -1.0));
  float l  = sampleMetric(uv + texel * vec2(-1.0,  0.0));
  float r  = sampleMetric(uv + texel * vec2( 1.0,  0.0));
  float bl = sampleMetric(uv + texel * vec2(-1.0,  1.0));
  float b  = sampleMetric(uv + texel * vec2( 0.0,  1.0));
  float br = sampleMetric(uv + texel * vec2( 1.0,  1.0));
  float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
  float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
  return length(vec2(gx, gy));
}

float binaryAt(vec2 uv, vec2 texel, float t) {
  float m = u_edge_mode > 0.5 ? sobelEdge(uv, texel) : sampleMetric(uv);
  if (u_edge_mode > 0.5) {
    return step(t * 0.35, m);
  }
  return step(t, m);
}

vec3 blendMultiply(vec3 base, vec3 blend) { return base * blend; }
vec3 blendScreen(vec3 base, vec3 blend) { return 1.0 - (1.0 - base) * (1.0 - blend); }
vec3 blendOverlay(vec3 base, vec3 blend) {
  return mix(2.0 * base * blend, 1.0 - 2.0 * (1.0 - base) * (1.0 - blend), step(0.5, base));
}
vec3 blendSoftLight(vec3 base, vec3 blend) {
  vec3 low = base - (1.0 - 2.0 * blend) * base * (1.0 - base);
  vec3 high = base + (2.0 * blend - 1.0) * (sqrt(max(base, 0.0)) - base);
  return mix(low, high, step(0.5, blend));
}
vec3 blendDifference(vec3 base, vec3 blend) { return abs(base - blend); }

vec3 applyBlend(vec3 base, vec3 effect, int mode) {
  if (mode == 1) return blendMultiply(base, effect);
  if (mode == 2) return blendScreen(base, effect);
  if (mode == 3) return blendOverlay(base, effect);
  if (mode == 4) return blendSoftLight(base, effect);
  if (mode == 5) return blendDifference(base, effect);
  return effect;
}

void main() {
  vec2 texel = 1.0 / u_resolution;
  float t = clamp((u_threshold + u_offset_amount) / 255.0, 0.0, 1.0);

  float bin = binaryAt(v_texCoord, texel, t);
  vec3 lo = u_color;
  vec3 hi = vec3(1.0);
  vec3 effect = mix(lo, hi, bin);

  if (u_outline > 0.01) {
    float radius = u_outline;
    float edge = 0.0;
    edge = max(edge, abs(binaryAt(v_texCoord + vec2(texel.x * radius, 0.0), texel, t) - bin));
    edge = max(edge, abs(binaryAt(v_texCoord + vec2(-texel.x * radius, 0.0), texel, t) - bin));
    edge = max(edge, abs(binaryAt(v_texCoord + vec2(0.0, texel.y * radius), texel, t) - bin));
    edge = max(edge, abs(binaryAt(v_texCoord + vec2(0.0, -texel.y * radius), texel, t) - bin));

    vec3 outlineCol = vec3(0.0);
    if (u_outline_type > 1.5) {
      outlineCol = u_color;
    } else if (u_outline_type > 0.5) {
      outlineCol = vec3(1.0);
    }
    effect = mix(effect, outlineCol, edge * u_outline_strength);
  }

  vec3 base = texture(u_original, v_texCoord).rgb;
  int mode = int(u_blend_mode + 0.5);
  vec3 blended = applyBlend(base, effect, mode);
  vec3 rgb = mix(base, blended, clamp(u_blend_strength, 0.0, 1.0));

  outColor = vec4(clamp(rgb, 0.0, 1.0), texture(u_texture, v_texCoord).a);
}`;

/** High-contrast threshold with outline + blend (effect.app THRESHOLD). */
export const THRESHOLD_EFFECT: Effect = {
	id: 'threshold',
	name: 'Threshold',
	category: 'Effects',
	enabled: true,
	params: [
		{
			name: 'threshold',
			label: 'Threshold',
			hint: 'Brightness cutoff (0–255).',
			type: 'float',
			min: 0,
			max: 255,
			step: 1,
			default: 128,
			value: 128
		},
		{
			name: 'edge_mode',
			label: 'Edge mode',
			hint: 'Threshold Sobel edges instead of flat tones.',
			type: 'bool',
			default: false,
			value: false
		},
		{
			name: 'offset_amount',
			label: 'Offset amount',
			hint: 'Shift the threshold level.',
			type: 'float',
			min: -128,
			max: 128,
			step: 1,
			default: 0,
			value: 0
		},
		{
			name: 'distance',
			label: 'Distance',
			hint: 'Mix luminance vs color-distance metric.',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'outline',
			label: 'Outline',
			hint: 'Outline width at binary edges (pixels).',
			type: 'float',
			min: 0,
			max: 12,
			step: 0.5,
			default: 0,
			value: 0
		},
		{
			name: 'outline_strength',
			label: 'Outline strength',
			type: 'float',
			min: 0,
			max: 2,
			step: 0.01,
			default: 1,
			value: 1
		},
		{
			name: 'outline_type',
			label: 'Outline type',
			type: 'enum',
			default: 0,
			options: [
				{ value: 0, label: 'Black' },
				{ value: 1, label: 'White' },
				{ value: 2, label: 'Color' }
			]
		},
		{
			name: 'blend_strength',
			label: 'Blend strength',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 1,
			value: 1
		},
		{
			name: 'blend_mode',
			label: 'Blend mode',
			type: 'enum',
			default: 0,
			options: [
				{ value: 0, label: 'Normal' },
				{ value: 1, label: 'Multiply' },
				{ value: 2, label: 'Screen' },
				{ value: 3, label: 'Overlay' },
				{ value: 4, label: 'Soft light' },
				{ value: 5, label: 'Difference' }
			]
		},
		{
			name: 'color',
			label: 'Color',
			hint: 'Shadow / low tone color.',
			type: 'color',
			default: '#000000',
			value: '#000000'
		}
	],
	passes: [{ id: 'main', fragmentShader: FRAGMENT, useOriginal: true }]
};
