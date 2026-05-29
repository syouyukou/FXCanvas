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
uniform float u_invert;
uniform float u_shadows;
uniform float u_midtones;
uniform float u_highlights;
uniform float u_gradient_type;
uniform float u_gradient_shift;
uniform float u_gradient_repeat;
uniform float u_show_edges;
uniform float u_edge_range;

#define sat(x) clamp(x, 0.0, 1.0)

float tcCatmullRom(float x, float v0, float v1, float v2, float v3) {
  float c2 = -0.5 * v0 + 0.5 * v2;
  float c3 = v0 - 2.5 * v1 + 2.0 * v2 - 0.5 * v3;
  float c4 = -0.5 * v0 + 1.5 * v1 - 1.5 * v2 + 0.5 * v3;
  return (((c4 * x + c3) * x + c2) * x + v1);
}

float threePointToneCurve(float col, float shadows, float midtones, float highlights) {
  float V0 = -0.5 + shadows;
  float V1 = 0.0 + shadows;
  float V2 = 0.5 + midtones;
  float V3 = 1.0 + highlights;
  float V4 = 1.5 + highlights;
  if (col < 0.5) return tcCatmullRom(col * 2.0, V0, V1, V2, V3);
  return tcCatmullRom((col - 0.5) * 2.0, V1, V2, V3, V4);
}

vec3 getGradientColor(float t, int type) {
  t = sat(t);
  if (type == 0) {
    if (t < 0.16) return mix(vec3(0.0), vec3(0.0, 0.0, 0.5), t / 0.16);
    if (t < 0.33) return mix(vec3(0.0, 0.0, 0.5), vec3(0.5, 0.0, 0.5), (t - 0.16) / 0.17);
    if (t < 0.50) return mix(vec3(0.5, 0.0, 0.5), vec3(1.0, 0.0, 0.0), (t - 0.33) / 0.17);
    if (t < 0.66) return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 0.5, 0.0), (t - 0.50) / 0.16);
    if (t < 0.83) return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.66) / 0.17);
    return mix(vec3(1.0, 1.0, 0.0), vec3(1.0), (t - 0.83) / 0.17);
  }
  if (type == 1) {
    if (t < 0.25) return mix(vec3(0.0), vec3(0.5, 0.0, 0.0), t / 0.25);
    if (t < 0.50) return mix(vec3(0.5, 0.0, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.25) / 0.25);
    if (t < 0.75) return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 0.5, 0.0), (t - 0.50) / 0.25);
    return mix(vec3(1.0, 0.5, 0.0), vec3(1.0), (t - 0.75) / 0.25);
  }
  if (type == 2) {
    if (t < 0.16) return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 0.5, 0.0), t / 0.16);
    if (t < 0.33) return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.16) / 0.17);
    if (t < 0.50) return mix(vec3(1.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0), (t - 0.33) / 0.17);
    if (t < 0.66) return mix(vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 1.0), (t - 0.50) / 0.16);
    if (t < 0.83) return mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 0.0, 1.0), (t - 0.66) / 0.17);
    return mix(vec3(0.0, 0.0, 1.0), vec3(0.5, 0.0, 0.5), (t - 0.83) / 0.17);
  }
  if (type == 3) {
    if (t < 0.33) return mix(vec3(0.0, 0.0, 0.5), vec3(0.0, 0.5, 1.0), t / 0.33);
    if (t < 0.66) return mix(vec3(0.0, 0.5, 1.0), vec3(0.0, 1.0, 0.5), (t - 0.33) / 0.33);
    return mix(vec3(0.0, 1.0, 0.5), vec3(1.0, 1.0, 0.0), (t - 0.66) / 0.34);
  }
  if (type == 4) {
    if (t < 0.33) return mix(vec3(0.0), vec3(1.0, 0.0, 0.0), t / 0.33);
    if (t < 0.66) return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.33) / 0.33);
    return mix(vec3(1.0, 1.0, 0.0), vec3(1.0), (t - 0.66) / 0.34);
  }
  return mix(vec3(0.0), vec3(1.0), t);
}

vec3 applyThermal(vec3 rgb) {
  float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
  if (u_invert > 0.5) luma = 1.0 - luma;
  luma = sat(threePointToneCurve(luma, u_shadows, u_midtones, u_highlights));
  float t = luma * u_gradient_repeat + u_gradient_shift;
  t = (u_gradient_repeat <= 1.01) ? sat(t) : fract(t);
  return getGradientColor(t, int(u_gradient_type));
}

void main() {
  vec2 uv = v_texCoord;
  vec4 tex = texture(u_texture, uv);
  vec3 rgb = tex.a < 0.01 ? tex.rgb : applyThermal(tex.rgb);
  if (u_show_edges > 0.5 && tex.a >= 0.01) {
    vec2 texel = 0.5 / u_resolution;
    float o = 0.5;
    vec3 p00 = texture(u_original, uv + vec2(-o, -o) * texel).rgb;
    vec3 p20 = texture(u_original, uv + vec2( o, -o) * texel).rgb;
    vec3 p02 = texture(u_original, uv + vec2(-o,  o) * texel).rgb;
    vec3 p22 = texture(u_original, uv + vec2( o,  o) * texel).rgb;
    vec3 p10 = texture(u_original, uv + vec2(0.0, -o) * texel).rgb;
    vec3 p12 = texture(u_original, uv + vec2(0.0,  o) * texel).rgb;
    vec3 p01 = texture(u_original, uv + vec2(-o, 0.0) * texel).rgb;
    vec3 p21 = texture(u_original, uv + vec2( o, 0.0) * texel).rgb;
    vec3 Gv = p00 - p02 + 2.0 * (p10 - p12) + p20 - p22;
    vec3 Gh = p00 - p20 + 2.0 * (p01 - p21) + p02 - p22;
    vec3 G = sqrt(Gv * Gv + Gh * Gh);
    float edge = sat(max(G.r, max(G.g, G.b)) / u_edge_range);
    rgb = mix(rgb, vec3(1.0), edge * 0.2);
  }
  outColor = vec4(rgb, tex.a);
}`;

export const THERMAL_EFFECT: Effect = {
	id: 'thermal',
	name: 'Thermal',
	category: 'Effects',
	enabled: true,
	params: [
		{ name: 'invert', label: 'Invert', type: 'bool', default: true, value: true },
		{ name: 'shadows', label: 'Shadows', type: 'float', min: -0.5, max: 0.5, step: 0.01, default: -0.5, value: -0.5 },
		{ name: 'midtones', label: 'Midtones', type: 'float', min: -0.5, max: 0.5, step: 0.01, default: -0.22, value: -0.22 },
		{ name: 'highlights', label: 'Highlights', type: 'float', min: -0.5, max: 0.5, step: 0.01, default: -0.05, value: -0.05 },
		{
			name: 'gradient_type',
			label: 'Gradient',
			type: 'int',
			min: 0,
			max: 9,
			step: 1,
			default: 3,
			value: 3
		},
		{ name: 'gradient_shift', label: 'Gradient shift', type: 'float', min: 0, max: 1, step: 0.01, default: 0, value: 0 },
		{ name: 'gradient_repeat', label: 'Gradient repeat', type: 'float', min: 0.1, max: 10, step: 0.1, default: 0.7, value: 0.7 },
		{ name: 'show_edges', label: 'Show edges', type: 'bool', default: true, value: true },
		{ name: 'edge_range', label: 'Edge range', type: 'float', min: 0.15, max: 2, step: 0.01, default: 0.5, value: 0.5 }
	],
	passes: [{ id: 'main', fragmentShader: FRAGMENT, useOriginal: true }]
};
