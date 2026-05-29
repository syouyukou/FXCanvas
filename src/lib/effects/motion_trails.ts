import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform sampler2D u_original;
uniform sampler2D u_feedback;
uniform vec2 u_resolution;
uniform float u_time;
`;

const ACCUM = HEADER + `
uniform float u_threshold;
uniform float u_knee;
uniform float u_dimming;
uniform vec2 u_direction_shift;
uniform float u_shake_amount;
uniform float u_shake_speed;

vec3 sRGBToLinear(vec3 col) {
  bvec3 cutoff = lessThanEqual(col, vec3(0.04045));
  return mix(pow((col + 0.055) / 1.055, vec3(2.4)), col / 12.92, cutoff);
}
vec3 linearToSRGB(vec3 col) {
  col = max(col, vec3(0.0));
  bvec3 cutoff = lessThanEqual(col, vec3(0.0031308));
  return mix(1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055, col * 12.92, cutoff);
}
float luminance(vec3 col) {
  return dot(col, vec3(0.2126729, 0.7151522, 0.0721750));
}
vec2 mirrorWrap(vec2 uv) {
  uv = abs(uv);
  uv = uv - 2.0 * floor(uv * 0.5);
  return vec2(uv.x > 1.0 ? 2.0 - uv.x : uv.x, uv.y > 1.0 ? 2.0 - uv.y : uv.y);
}
vec3 extractHighlights(vec3 colLin) {
  float safeKnee = max(u_knee, 1e-5);
  float y = luminance(colLin);
  float x = max(y - (u_threshold - safeKnee), 0.0);
  float soft = (x * x) / (4.0 * safeKnee + x + 1e-6);
  float hard = max(y - u_threshold, 0.0);
  float mask = clamp(max(soft, hard), 0.0, 1.0);
  return colLin * mask;
}
vec2 animatedShakePx() {
  float t = u_time * u_shake_speed;
  return vec2(
    sin(t * 1.37) + 0.5 * sin(t * 2.41 + 1.7),
    cos(t * 1.91 + 0.8) + 0.5 * cos(t * 2.73 + 2.4)
  ) * u_shake_amount;
}
vec3 screenBlend(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}
void main() {
  vec2 uv = v_texCoord;
  vec2 px = 1.0 / u_resolution;
  vec3 sourceLin = sRGBToLinear(texture(u_texture, uv).rgb);
  vec3 extracted = clamp(extractHighlights(sourceLin), 0.0, 1.0);
  vec2 driftPx = u_direction_shift + animatedShakePx();
  vec2 sampleUV = mirrorWrap(uv - driftPx * px);
  vec3 previous = sRGBToLinear(texture(u_feedback, sampleUV).rgb);
  previous *= max(0.0, 1.0 - u_dimming);
  vec3 motionTrails = screenBlend(previous, extracted);
  outColor = vec4(linearToSRGB(clamp(motionTrails, 0.0, 1.0)), 1.0);
}`;

const COMPOSITE = HEADER + `
uniform float u_trace_intensity;
uniform float u_source_dim;
uniform float u_blend_mode;

vec3 sRGBToLinear(vec3 col) {
  bvec3 cutoff = lessThanEqual(col, vec3(0.04045));
  return mix(pow((col + 0.055) / 1.055, vec3(2.4)), col / 12.92, cutoff);
}
vec3 linearToSRGB(vec3 col) {
  col = max(col, vec3(0.0));
  bvec3 cutoff = lessThanEqual(col, vec3(0.0031308));
  return mix(1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055, col * 12.92, cutoff);
}
vec3 screenBlend(vec3 base, vec3 blend) { return 1.0 - (1.0 - base) * (1.0 - blend); }
vec3 multiplyBlend(vec3 base, vec3 blend) { return base * blend; }
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
vec3 applyBlendMode(vec3 base, vec3 motionTrails, int mode) {
  if (mode == 0) return base + motionTrails;
  if (mode == 1) return multiplyBlend(base, motionTrails);
  if (mode == 2) return screenBlend(base, motionTrails);
  if (mode == 3) return overlayBlend(base, motionTrails);
  if (mode == 4) return softLightBlend(base, motionTrails);
  if (mode == 5) return hardLightBlend(base, motionTrails);
  if (mode == 6) return colorDodgeBlend(base, motionTrails);
  if (mode == 7) return max(base, motionTrails);
  return screenBlend(base, motionTrails);
}
void main() {
  vec3 motionLin = sRGBToLinear(texture(u_texture, v_texCoord).rgb);
  vec4 base = texture(u_original, v_texCoord);
  vec3 baseLin = sRGBToLinear(base.rgb);
  vec3 resultLin = applyBlendMode(baseLin * u_source_dim, motionLin * u_trace_intensity, int(u_blend_mode));
  outColor = vec4(linearToSRGB(resultLin), base.a);
}`;

export const MOTION_TRAILS_EFFECT: Effect = {
	id: 'motion_trails',
	name: 'Motion Trails',
	category: 'Effects',
	enabled: true,
	params: [
		{ name: 'threshold', label: 'Threshold', type: 'float', min: 0, max: 4, step: 0.01, default: 0.75, value: 0.75 },
		{ name: 'knee', label: 'Knee', type: 'float', min: 0, max: 2, step: 0.01, default: 0.12, value: 0.12 },
		{ name: 'dimming', label: 'Dimming', type: 'float', min: 0, max: 0.5, step: 0.001, default: 0.06, value: 0.06 },
		{
			name: 'direction_shift',
			label: 'Direction',
			type: 'vec2',
			min: -4,
			max: 4,
			default: [0, -2],
			value: [0, -2]
		},
		{ name: 'shake_amount', label: 'Shake', type: 'float', min: 0, max: 5, step: 0.01, default: 0.15, value: 0.15 },
		{ name: 'shake_speed', label: 'Shake speed', type: 'float', min: 0, max: 10, step: 0.01, default: 5, value: 5 },
		{ name: 'trace_intensity', label: 'Intensity', type: 'float', min: 0, max: 3, step: 0.01, default: 1, value: 1 },
		{ name: 'source_dim', label: 'Source dim', type: 'float', min: 0, max: 1, step: 0.01, default: 0.75, value: 0.75 },
		{
			name: 'blend_mode',
			label: 'Blend mode',
			type: 'enum',
			default: 2,
			value: 2,
			options: [
				{ value: 0, label: 'Add' },
				{ value: 1, label: 'Multiply' },
				{ value: 2, label: 'Screen' },
				{ value: 3, label: 'Overlay' },
				{ value: 4, label: 'Soft light' },
				{ value: 5, label: 'Hard light' },
				{ value: 6, label: 'Color dodge' },
				{ value: 7, label: 'Lighten' }
			]
		}
	],
	passes: [
		{ id: 'accumulate', fragmentShader: ACCUM, needsFeedback: true, writesFeedback: true },
		{ id: 'composite', fragmentShader: COMPOSITE, useOriginal: true }
	]
};
