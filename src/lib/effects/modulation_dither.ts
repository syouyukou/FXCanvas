import type { Effect } from '../engine/renderer';

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_mod_tc;
uniform float u_mod_am;
uniform float u_wave_dir;
uniform float u_dither_strength;
uniform float u_pixel_step;
uniform float u_invert;
uniform float u_gamma;
uniform vec3 u_shadow;
uniform vec3 u_highlight;
uniform float u_grid;
uniform float u_grain;
uniform float u_time;
uniform float u_animate;

float bayer8(vec2 p) {
  p = mod(p, 8.0);
  float m[64] = float[](
     0.,32., 8.,40., 2.,34.,10.,42.,
    48.,16.,56.,24.,50.,18.,58.,26.,
    12.,44., 4.,36.,14.,46., 6.,38.,
    60.,28.,52.,20.,62.,30.,54.,22.,
     3.,35.,11.,43., 1.,33., 9.,41.,
    51.,19.,59.,27.,49.,17.,57.,25.,
    15.,47., 7.,39.,13.,45., 5.,37.,
    63.,31.,55.,23.,61.,29.,53.,21.);
  return m[int(p.x) + int(p.y) * 8] / 64.0;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 modulatedSample(vec2 uv) {
  float freq = u_mod_tc * 6.28318;
  float amp = u_mod_am * 0.04;
  float drift = sin(u_time * 1.6) * clamp(u_animate, 0.0, 1.0) * 0.35;
  freq *= 1.0 + drift;

  if (u_wave_dir < 0.5) {
    float wR = sin(uv.y * freq) * amp;
    float wG = sin(uv.y * freq + 1.047) * amp;
    float wB = sin(uv.y * freq + 2.094) * amp;
    return vec3(
      texture(u_texture, uv + vec2(wR, 0.0)).r,
      texture(u_texture, uv + vec2(wG, 0.0)).g,
      texture(u_texture, uv + vec2(wB, 0.0)).b
    );
  }

  float wR = sin(uv.x * freq) * amp;
  float wG = sin(uv.x * freq + 1.047) * amp;
  float wB = sin(uv.x * freq + 2.094) * amp;
  return vec3(
    texture(u_texture, uv + vec2(0.0, wR)).r,
    texture(u_texture, uv + vec2(0.0, wG)).g,
    texture(u_texture, uv + vec2(0.0, wB)).b
  );
}

void main() {
  float pxStep = max(u_pixel_step, 1.0);
  vec2 blockUv = floor(v_texCoord * u_resolution / pxStep) * pxStep / u_resolution;

  vec3 src = modulatedSample(blockUv);
  vec3 lin = pow(max(src, 0.0), vec3(max(u_gamma, 0.25)));
  lin = mix(lin, 1.0 - lin, clamp(u_invert, 0.0, 1.0));

  float lum = dot(lin, vec3(0.299, 0.587, 0.114));
  vec2 px = floor(blockUv * u_resolution);
  float threshold = bayer8(px);
  float spread = u_dither_strength * 0.55;
  float dithered = lum + (threshold - 0.5) * spread;
  float q = step(0.5, dithered);

  vec3 rgb = mix(u_shadow, u_highlight, q);

  if (u_grid > 0.001) {
    float stripe = mod(px.x, 3.0);
    vec3 mask = vec3(
      stripe < 1.0 ? 1.06 : 0.9,
      stripe >= 1.0 && stripe < 2.0 ? 1.06 : 0.9,
      stripe >= 2.0 ? 1.06 : 0.9
    );
    rgb *= mix(vec3(1.0), mask, u_grid);
    float scan = sin(blockUv.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
    rgb *= mix(1.0, 0.82 + scan * 0.18, u_grid * 0.55);
  }

  float gn = hash(floor(v_texCoord * u_resolution * 1.35)) - 0.5;
  rgb += gn * u_grain * 0.09;

  outColor = vec4(clamp(rgb, 0.0, 1.0), texture(u_texture, v_texCoord).a);
}`;

/** Wave-modulated signal + ordered dither + Y2K duotone (effect.app MODULATION DITHER). */
export const MODULATION_DITHER_EFFECT: Effect = {
	id: 'modulation_dither',
	name: 'Modulation Dither',
	category: 'Effects',
	enabled: true,
	params: [
		{
			name: 'mod_tc',
			label: 'Modulation TC',
			hint: 'Wave frequency (time constant).',
			type: 'float',
			min: 0.5,
			max: 24,
			step: 0.25,
			default: 6,
			value: 6
		},
		{
			name: 'mod_am',
			label: 'AM',
			hint: 'Amplitude modulation — wave distortion strength.',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.12,
			value: 0.12
		},
		{
			name: 'wave_dir',
			label: 'Wave direction',
			type: 'enum',
			default: 0,
			options: [
				{ value: 0, label: 'Horizontal' },
				{ value: 1, label: 'Vertical' }
			]
		},
		{
			name: 'dither_strength',
			label: 'Dither strength',
			type: 'float',
			min: 0,
			max: 2,
			step: 0.05,
			default: 1.1,
			value: 1.1
		},
		{
			name: 'pixel_step',
			label: 'Pixel step',
			hint: 'Dither cell size (1 = finest).',
			type: 'int',
			min: 1,
			max: 4,
			step: 1,
			default: 1,
			value: 1
		},
		{
			name: 'invert',
			label: 'Invert',
			hint: 'Negative-like tonal inversion.',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.55,
			value: 0.55
		},
		{
			name: 'gamma',
			label: 'Gamma',
			type: 'float',
			min: 0.5,
			max: 3.5,
			step: 0.05,
			default: 2.2,
			value: 2.2
		},
		{
			name: 'shadow',
			label: 'Shadow',
			type: 'color',
			default: '#141038',
			value: '#141038'
		},
		{
			name: 'highlight',
			label: 'Highlight',
			type: 'color',
			default: '#eaeaf2',
			value: '#eaeaf2'
		},
		{
			name: 'grid',
			label: 'CRT grid',
			hint: 'Phosphor aperture grille + scanlines.',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.28,
			value: 0.28
		},
		{
			name: 'grain',
			label: 'Grain',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0.18,
			value: 0.18
		},
		{
			name: 'animate',
			label: 'Animate',
			hint: 'Drift wave frequency over time.',
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
