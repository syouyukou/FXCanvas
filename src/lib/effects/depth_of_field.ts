import type { Effect } from '../engine/renderer';
import { DEPTH_OF_FIELD_BODY } from './depthOfFieldShader';

const HEADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
`;

export const DEPTH_OF_FIELD_FRAGMENT = HEADER + DEPTH_OF_FIELD_BODY;

export const DEPTH_OF_FIELD_EFFECT: Effect = {
	id: 'depth_of_field',
	name: 'Depth of Field',
	category: 'Adjust',
	enabled: true,
	params: [
		{
			name: 'center',
			label: 'Focus center',
			hint: 'Radial focus point (0–1 UV).',
			type: 'vec2',
			min: 0,
			max: 1,
			default: [0.5, 0.5],
			value: [0.5, 0.5]
		},
		{
			name: 'radius',
			label: 'Radius',
			hint: 'Focus region size.',
			type: 'float',
			min: 0.01,
			max: 4,
			step: 0.01,
			default: 0.35,
			value: 0.35
		},
		{
			name: 'aspect',
			label: 'Aspect stretch',
			type: 'float',
			min: 0,
			max: 5,
			step: 0.05,
			default: 0,
			value: 0
		},
		{
			name: 'mask_rotation',
			label: 'Mask rotation',
			type: 'float',
			min: -180,
			max: 180,
			step: 1,
			default: 0,
			value: 0
		},
		{
			name: 'falloff',
			label: 'Falloff',
			hint: 'Focus falloff steepness.',
			type: 'float',
			min: 0.5,
			max: 6,
			step: 0.1,
			default: 2,
			value: 2
		},
		{
			name: 'max_radius',
			label: 'Blur strength',
			type: 'float',
			min: 0,
			max: 0.1,
			step: 0.001,
			default: 0.01,
			value: 0.01
		},
		{
			name: 'samples',
			label: 'Samples',
			hint: 'Bokeh quality (more = slower).',
			type: 'float',
			min: 10,
			max: 400,
			step: 10,
			default: 120,
			value: 120
		},
		{
			name: 'blades',
			label: 'Aperture blades',
			type: 'float',
			min: 3,
			max: 10,
			step: 1,
			default: 6,
			value: 6
		},
		{
			name: 'roundness',
			label: 'Blade roundness',
			type: 'float',
			min: 0,
			max: 1,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'aperture_rot',
			label: 'Aperture rotation',
			type: 'float',
			min: -180,
			max: 180,
			step: 1,
			default: 0,
			value: 0
		},
		{
			name: 'feather',
			label: 'Aperture feather',
			type: 'float',
			min: 0,
			max: 0.9,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'anamorphic',
			label: 'Anamorphic stretch',
			type: 'float',
			min: 1,
			max: 3,
			step: 0.01,
			default: 1,
			value: 1
		},
		{
			name: 'catadioptric',
			label: 'Catadioptric',
			hint: 'Mirror-lens center obstruction.',
			type: 'float',
			min: 0,
			max: 0.7,
			step: 0.01,
			default: 0,
			value: 0
		},
		{
			name: 'invert_mask',
			label: 'Invert mask',
			hint: 'Blur outside focus (soft-focus edges).',
			type: 'bool',
			default: false,
			value: false
		},
		{
			name: 'debug_mask',
			label: 'Debug mask',
			type: 'bool',
			default: false,
			value: false
		},
		{
			name: 'debug_aperture',
			label: 'Debug aperture',
			type: 'bool',
			default: false,
			value: false
		}
	],
	fragmentShader: DEPTH_OF_FIELD_FRAGMENT
};
