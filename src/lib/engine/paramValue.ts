import { cloneGradient, type GradientStop } from './gradient';
import { cloneCurvesData, defaultCurvesData, type CurvesData } from './curve';
import type { EffectParam, ParamValue } from './renderer';

export function isGradientStops(v: unknown): v is GradientStop[] {
	return Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null && 'pos' in v[0];
}

export function isCurvesData(v: unknown): v is CurvesData {
	return typeof v === 'object' && v !== null && 'rgb' in v;
}

export function isVec2(v: unknown): v is [number, number] {
	return Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number';
}

export function defaultParamValue(param: EffectParam): ParamValue {
	switch (param.type) {
		case 'gradient':
			return cloneGradient(param.default as GradientStop[]);
		case 'curve':
			return cloneCurvesData((param.default as CurvesData) ?? defaultCurvesData());
		case 'vec2':
			return [...(param.default as [number, number])] as [number, number];
		default:
			return param.default as ParamValue;
	}
}

export function cloneParamValue(val: ParamValue): ParamValue {
	if (isGradientStops(val)) return cloneGradient(val);
	if (isCurvesData(val)) return cloneCurvesData(val);
	if (isVec2(val)) return [val[0], val[1]];
	return val;
}

export function cloneParamsRecord(params: Record<string, ParamValue>): Record<string, ParamValue> {
	const out: Record<string, ParamValue> = {};
	for (const [k, v] of Object.entries(params)) {
		out[k] = cloneParamValue(v);
	}
	return out;
}
