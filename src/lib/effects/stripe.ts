import type { Effect } from '../engine/renderer';

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_freq;
uniform float u_w_min;
uniform float u_w_max;
uniform float u_angle;
uniform float u_edge;
uniform float u_pattern;
uniform float u_scroll_speed;
uniform float u_led_mode;
uniform float u_phase_r;
uniform float u_phase_g;
uniform float u_phase_b;
uniform float u_benday_mode;
uniform float u_shift_freq;
uniform float u_time;
uniform float u_animate;

const float SQRT_HALF = 0.70710678118;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec2 toRelCoord(vec2 p) {
  float asp = u_resolution.x / u_resolution.y;
  vec2 scl = asp > 1.0 ? vec2(asp, 1.0) : vec2(1.0, 1.0 / asp);
  return ((p / u_resolution) * 2.0 - 1.0) * scl;
}

void main() {
  vec2 fragCoord = v_texCoord * u_resolution;
  vec2 ndc = toRelCoord(fragCoord);
  vec3 src = texture(u_texture, v_texCoord).rgb;
  float lum = pow(max(dot(src, LUMA), 0.0), 1.0 / 2.2);

  float rad = radians(u_angle);
  mat2 rot = mat2(cos(rad), -sin(rad), sin(rad), cos(rad));
  vec2 rotN = rot * ndc;

  float aaR = mix(0.5, 5.0, pow(clamp(u_edge, 0.0, 1.0), 2.0));
  float baseCoord;
  float rowCoord;

  if (u_pattern < 0.5) {
    baseCoord = rotN.y;
    rowCoord = rotN.x;
  } else {
    float r = length(ndc);
    float ang = atan(ndc.y, ndc.x) / (2.0 * 3.141592);
    baseCoord = r;
    rowCoord = ang + 0.5;
  }

  float scroll = u_time * u_scroll_speed * clamp(u_animate, 0.0, 1.0);
  float rowId = floor(rowCoord * u_shift_freq);
  float rowShift = u_benday_mode > 0.5 ? mod(rowId, 2.0) * 0.5 : 0.0;

  vec3 outRGB = vec3(1.0);

  if (u_led_mode > 0.5) {
    float basePhaseR = baseCoord * u_freq + u_phase_r + scroll;
    float dAAR = fwidth(basePhaseR) * aaR;
    float stripeR = abs(fract(basePhaseR + rowShift) * 2.0 - 1.0);
    float thickR = mix(u_w_max, u_w_min, src.r);
    outRGB.r = 1.0 - (1.0 - smoothstep(thickR - dAAR, thickR + dAAR, stripeR));

    float basePhaseG = baseCoord * u_freq + u_phase_g + scroll;
    float dAAG = fwidth(basePhaseG) * aaR;
    float stripeG = abs(fract(basePhaseG + rowShift) * 2.0 - 1.0);
    float thickG = mix(u_w_max, u_w_min, src.g);
    outRGB.g = 1.0 - (1.0 - smoothstep(thickG - dAAG, thickG + dAAG, stripeG));

    float basePhaseB = baseCoord * u_freq + u_phase_b + scroll;
    float dAAB = fwidth(basePhaseB) * aaR;
    float stripeB = abs(fract(basePhaseB + rowShift) * 2.0 - 1.0);
    float thickB = mix(u_w_max, u_w_min, src.b);
    outRGB.b = 1.0 - (1.0 - smoothstep(thickB - dAAB, thickB + dAAB, stripeB));
  } else {
    float basePhase = baseCoord * u_freq + scroll;
    float dAA = fwidth(basePhase) * aaR;
    float phase = basePhase + rowShift;
    float stripe = abs(fract(phase) * 2.0 - 1.0);
    float thick = mix(u_w_max, u_w_min, lum);
    float mask = 1.0 - smoothstep(thick - dAA, thick + dAA, stripe);
    outRGB = vec3(1.0 - mask);
  }

  outColor = vec4(clamp(outRGB, 0.0, 1.0), texture(u_texture, v_texCoord).a);
}`;

/** Vertical / radial scan stripes (effect.app STRIPE). */
export const STRIPE_EFFECT: Effect = {
	id: 'stripe',
	name: 'Stripe',
	category: 'Effects',
	enabled: true,
	params: [
		{
			name: 'freq',
			label: 'Repetitions',
			type: 'float',
			min: 5,
			max: 60,
			step: 1,
			default: 33,
			value: 33
		},
		{
			name: 'w_min',
			label: 'Min thickness',
			type: 'float',
			min: 0.001,
			max: 0.1,
			step: 0.001,
			default: 0.02,
			value: 0.02
		},
		{
			name: 'w_max',
			label: 'Max thickness',
			type: 'float',
			min: 0.1,
			max: 1,
			step: 0.01,
			default: 1,
			value: 1
		},
		{
			name: 'angle',
			label: 'Angle',
			type: 'float',
			min: 0,
			max: 360,
			step: 1,
			default: 90,
			value: 90
		},
		{
			name: 'edge',
			label: 'Edge softness',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.5,
			value: 0.5
		},
		{
			name: 'pattern',
			label: 'Pattern type',
			type: 'enum',
			default: 1,
			options: [
				{ value: 0, label: 'Linear' },
				{ value: 1, label: 'Radial' }
			]
		},
		{
			name: 'scroll_speed',
			label: 'Scroll speed',
			type: 'float',
			min: -5,
			max: 5,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'led_mode',
			label: 'Color mode',
			type: 'bool',
			default: true,
			value: true
		},
		{
			name: 'phase_r',
			label: 'Red phase',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.1,
			value: 0.1
		},
		{
			name: 'phase_g',
			label: 'Green phase',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'phase_b',
			label: 'Blue phase',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'benday_mode',
			label: 'Row shift',
			type: 'bool',
			default: false,
			value: false
		},
		{
			name: 'shift_freq',
			label: 'Row shift freq',
			type: 'float',
			min: 1,
			max: 50,
			step: 1,
			default: 8,
			value: 8
		},
		{
			name: 'animate',
			label: 'Animate',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 1,
			value: 1
		}
	],
	fragmentShader: FRAGMENT
};
