import type { Effect } from '../engine/renderer';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform sampler2D u_original;
uniform sampler2D u_feedback;
uniform vec2 u_resolution;
`;

const MASK_PASS = HEADER + `
uniform vec3 u_key_color;
uniform float u_threshold;
uniform float u_persistence;

float colorMatch(vec3 color) {
  float dist = length(color - u_key_color) / 1.7320508;
  return 1.0 - clamp(dist, 0.0, 1.0);
}

void main() {
  float matchScore = colorMatch(texture(u_texture, v_texCoord).rgb);
  float t = clamp(u_threshold, 0.0, 1.0);
  float instantHit = step(t, matchScore);
  float ePrev = texture(u_feedback, v_texCoord).g;
  float eNext = clamp(max(instantHit, ePrev * u_persistence), 0.0, 1.0);
  float mask = step(0.5, eNext);
  outColor = vec4(mask, instantHit, eNext, matchScore);
}`;

const DRAW_PASS = HEADER + `
uniform vec3 u_box_color;
uniform float u_box_thickness;
uniform float u_box_opacity;
uniform float u_box_fill_opacity;
uniform float u_debug_mask;

float maskAt(vec2 uv) {
  return texture(u_feedback, uv).r;
}

float maskEdge(vec2 uv) {
  vec2 px = u_box_thickness / u_resolution;
  float m = maskAt(uv);
  float mx = max(
    max(abs(maskAt(uv + vec2(px.x, 0.0)) - m), abs(maskAt(uv - vec2(px.x, 0.0)) - m)),
    max(abs(maskAt(uv + vec2(0.0, px.y)) - m), abs(maskAt(uv - vec2(0.0, px.y)) - m))
  );
  return smoothstep(0.02, 0.35, mx);
}

void main() {
  vec2 uv = v_texCoord;
  float mask = maskAt(uv);
  if (u_debug_mask > 0.5) {
    outColor = vec4(vec3(mask), 1.0);
    return;
  }
  vec4 src = texture(u_original, uv);
  float edge = maskEdge(uv);
  float fill = mask * u_box_fill_opacity;
  vec3 col = src.rgb;
  col = mix(col, u_box_color, fill);
  col = mix(col, u_box_color, edge * u_box_opacity);
  outColor = vec4(col, src.a);
}`;

export const BLOB_TRACKER_EFFECT: Effect = {
	id: 'blob_tracker',
	name: 'Blob Tracker',
	category: 'Effects',
	enabled: true,
	params: [
		{ name: 'key_color', label: 'Key color', type: 'color', default: '#ffffff', value: '#ffffff' },
		{ name: 'threshold', label: 'Threshold', type: 'float', min: 0, max: 1, step: 0.001, default: 0.55, value: 0.55 },
		{ name: 'persistence', label: 'Persistence', type: 'float', min: 0.5, max: 0.99, step: 0.01, default: 0.82, value: 0.82 },
		{ name: 'box_color', label: 'Box color', type: 'color', default: '#00f2ff', value: '#00f2ff' },
		{ name: 'box_thickness', label: 'Box thickness', type: 'float', min: 0.5, max: 8, step: 0.5, default: 1.5, value: 1.5 },
		{ name: 'box_opacity', label: 'Outline opacity', type: 'float', min: 0, max: 1, step: 0.05, default: 1, value: 1 },
		{ name: 'box_fill_opacity', label: 'Fill opacity', type: 'float', min: 0, max: 1, step: 0.02, default: 0.12, value: 0.12 },
		{ name: 'debug_mask', label: 'Debug mask', type: 'bool', default: false, value: false }
	],
	passes: [
		{ id: 'mask', fragmentShader: MASK_PASS, needsFeedback: true, writesFeedback: true },
		{ id: 'draw', fragmentShader: DRAW_PASS, useOriginal: true }
	]
};
