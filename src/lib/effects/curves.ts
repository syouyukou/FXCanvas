import type { Effect } from '../engine/renderer';
import { defaultCurvesData, type CurvesData } from '../engine/curve';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform sampler2D u_curve_lut;
uniform vec2 u_resolution;
uniform int u_apply_mode;

float sampleLut(int row, float v) {
  float u = (clamp(v, 0.0, 1.0) * 255.0 + 0.5) / 256.0;
  float vc = (float(row) + 0.5) / 4.0;
  return texture(u_curve_lut, vec2(u, vc)).r;
}

vec3 applyCurvesNormal(vec3 c) {
  float r = sampleLut(1, sampleLut(0, c.r));
  float g = sampleLut(2, sampleLut(0, c.g));
  float b = sampleLut(3, sampleLut(0, c.b));
  return vec3(r, g, b);
}

vec3 applyCurvesLuminance(vec3 c) {
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float newLum = sampleLut(0, lum);
  float scale = lum > 0.0001 ? newLum / lum : 1.0;
  vec3 adjusted = c * scale;
  adjusted.r = sampleLut(1, adjusted.r);
  adjusted.g = sampleLut(2, adjusted.g);
  adjusted.b = sampleLut(3, adjusted.b);
  return adjusted;
}

vec3 applyCurvesColor(vec3 c) {
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 chroma = c - lum;
  float newLum = sampleLut(0, lum);
  vec3 base = vec3(newLum) + chroma;
  base.r = sampleLut(1, base.r);
  base.g = sampleLut(2, base.g);
  base.b = sampleLut(3, base.b);
  return base;
}

void main() {
  vec4 col = texture(u_texture, v_texCoord);
  vec3 c = col.rgb;
  if (u_apply_mode == 2) {
    c = applyCurvesLuminance(c);
  } else if (u_apply_mode == 1) {
    c = applyCurvesColor(c);
  } else {
    c = applyCurvesNormal(c);
  }
  outColor = vec4(clamp(c, 0.0, 1.0), col.a);
}`;

const DEFAULT_CURVES: CurvesData = defaultCurvesData();

export const CURVES_EFFECT: Effect = {
	id: 'curves',
	name: 'Curves',
	category: 'Adjust',
	enabled: true,
	params: [
		{
			name: 'curves',
			label: 'Curves',
			type: 'curve',
			default: DEFAULT_CURVES
		},
		{
			name: 'apply_mode',
			label: 'Apply mode',
			hint: 'N = normal, C = color, L = luminance.',
			type: 'segment',
			default: 0,
			options: [
				{ value: 0, label: 'N' },
				{ value: 1, label: 'C' },
				{ value: 2, label: 'L' }
			]
		}
	],
	fragmentShader: HEADER
};
