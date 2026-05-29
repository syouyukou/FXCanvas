import type { Effect } from '../engine/renderer';

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_aspect;
uniform float u_strength;
uniform float u_hard;
uniform float u_angle;
uniform vec2 u_phase;
uniform vec2 u_animate_speed;
uniform float u_dispersion;
uniform float u_time;
uniform float u_animate;

const float baseIOR = 1.2;

vec2 toRelCoord(vec2 coords) {
  float asp = u_resolution.x / u_resolution.y;
  vec2 inc = asp > 1.0 ? vec2(asp, 1.0) : vec2(1.0, 1.0 / asp);
  return ((coords / u_resolution) * 2.0 - 1.0) * inc;
}

vec2 fromRelCoord(vec2 coords) {
  float asp = u_resolution.x / u_resolution.y;
  vec2 inc = asp > 1.0 ? vec2(asp, 1.0) : vec2(1.0, 1.0 / asp);
  return (coords / inc + 1.0) * 0.5;
}

vec4 pixelAt(vec2 pos) {
  vec2 uv = clamp(fromRelCoord(pos), 0.001, 0.999);
  return texture(u_texture, uv);
}

vec2 distort(vec2 pos, float strengthVal) {
  float s = sin(radians(u_angle));
  float c = cos(radians(u_angle));
  pos *= mat2(c, s, -s, c);
  vec2 scxy = vec2(exp(u_scale + u_aspect), exp(u_scale - u_aspect));
  vec2 deltaPhase = u_animate_speed * u_time * clamp(u_animate, 0.0, 1.0);
  vec2 pShift = u_phase + deltaPhase;
  pos = pos * scxy + pShift;
  vec2 base = floor(pos);
  pos -= base;

  if (u_hard > 0.5) {
    pos = step(0.5, pos);
  } else {
    float m = strengthVal;
    while (m > 1.0) {
      pos = smoothstep(0.0, 1.0, pos);
      m -= 1.0;
    }
    pos = mix(pos, smoothstep(0.0, 1.0, pos), m);
  }

  pos = (pos + base - pShift) / scxy;
  pos *= mat2(c, -s, s, c);
  return pos;
}

vec4 runChannel(vec2 pos, float iorScale) {
  float denom = abs(baseIOR) > 1e-6 ? baseIOR : 1e-6;
  float s = u_strength * (iorScale / denom);
  vec2 d = distort(pos, s);
  return pixelAt(d);
}

void main() {
  vec2 uv = toRelCoord(v_texCoord * u_resolution);
  float iorG = baseIOR;
  float iorR = baseIOR - u_dispersion;
  float iorB = baseIOR + u_dispersion;

  vec4 colR = runChannel(uv, iorR);
  vec4 colG = runChannel(uv, iorG);
  vec4 colB = runChannel(uv, iorB);

  outColor = vec4(colR.r, colG.g, colB.b, colG.a);
}`;

/** Cubic pixel refraction grid (effect.app CUBIFY). */
export const CUBIFY_EFFECT: Effect = {
	id: 'cubify',
	name: 'Cubify',
	category: 'Distort',
	enabled: true,
	params: [
		{
			name: 'scale',
			label: 'Cube size',
			type: 'float',
			min: 0,
			max: 8,
			step: 0.05,
			default: 1.1,
			value: 1.1
		},
		{
			name: 'aspect',
			label: 'Cube stretch',
			type: 'float',
			min: -1,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'strength',
			label: 'Depth distortion',
			type: 'float',
			min: 0,
			max: 5,
			step: 0.05,
			default: 1.8,
			value: 1.8
		},
		{
			name: 'hard',
			label: 'Hard edges',
			type: 'bool',
			default: true,
			value: true
		},
		{
			name: 'angle',
			label: 'Rotation',
			type: 'float',
			min: 0,
			max: 90,
			step: 1,
			default: 0,
			value: 0
		},
		{
			name: 'phase',
			label: 'Position offset',
			type: 'vec2',
			default: [0, 0],
			value: [0, 0]
		},
		{
			name: 'animate_speed',
			label: 'Animation speed',
			type: 'vec2',
			default: [0.1, 0],
			value: [0.1, 0]
		},
		{
			name: 'dispersion',
			label: 'Dispersion',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.001,
			default: 0,
			value: 0
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
