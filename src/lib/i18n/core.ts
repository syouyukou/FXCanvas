import { deepGetArray, deepGetString } from './deepGet';
import { catalogs } from './messages';
import type { LocaleId, MessageTree } from './types';

function uiCatalog(lang: LocaleId): MessageTree {
	if (lang === 'en-zh') return catalogs.en;
	return catalogs[lang] ?? catalogs.en;
}

function zhCatalog(): MessageTree {
	return catalogs['zh-TW'];
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
	if (!vars) return template;
	let out = template;
	for (const [k, v] of Object.entries(vars)) {
		out = out.replaceAll(`{${k}}`, String(v));
	}
	return out;
}

function bilingual(en: string, zh: string): string {
	if (!zh || en === zh) return en;
	return `${en} / ${zh}`;
}

function categorySlug(category: string): string {
	if (category === 'Blur') return 'blur';
	if (category === 'Color') return 'color';
	if (category === 'Film') return 'film';
	if (category === 'Distort') return 'distort';
	if (category === 'Effects') return 'effects';
	if (category === 'Generate') return 'generate';
	return category.toLowerCase().replace(/\s+/g, '_');
}

export interface I18nApi {
	lang: LocaleId;
	t: (path: string, vars?: Record<string, string | number>) => string;
	effectName: (effectId: string, fallback: string) => string;
	categoryName: (category: string) => string;
	paramLabel: (effectId: string, paramName: string, fallback: string) => string;
	paramHint: (effectId: string, paramName: string) => string | undefined;
	ditherPatternLabel: (index: number, fallback?: string) => string;
	ditherPaletteLabel: (index: number, fallback?: string) => string;
	ditherDistanceLabel: (mode: number) => string;
	ditherPresetLabel: (presetId: string, fallback: string) => string;
	glitchDigitalPresetLabel: (presetId: string, fallback: string) => string;
	glitchVhsPresetLabel: (presetId: string, fallback: string) => string;
	builtinPresetName: (presetId: string, fallback: string) => string;
	builtinPresetGroup: (presetId: string, fallback: string) => string;
	builtinPresetDescription: (presetId: string, fallback: string) => string;
	exportSizeLabel: (presetId: string, fallback: string) => string;
	effectSearchText: (effectId: string, englishName: string, englishCategory: string) => string;
	presetSearchText: (
		presetId: string,
		englishName: string,
		englishGroup: string,
		englishDescription: string
	) => string;
}

export function createI18n(lang: LocaleId): I18nApi {
	const t = (path: string, vars?: Record<string, string | number>): string => {
		const cat = uiCatalog(lang);
		const value = deepGetString(cat, path) ?? deepGetString(catalogs.en, path) ?? path;
		return interpolate(value, vars);
	};

	const effectName = (effectId: string, fallback: string): string => {
		if (lang === 'en-zh') return fallback;
		return deepGetString(uiCatalog(lang), `effects.${effectId}.name`) ?? fallback;
	};

	const categoryName = (category: string): string => {
		if (lang === 'en-zh') return category;
		const key = categorySlug(category);
		return deepGetString(uiCatalog(lang), `categories.${key}`) ?? category;
	};

	const paramLabel = (effectId: string, paramName: string, fallback: string): string => {
		if (lang === 'en-zh') {
			const en =
				deepGetString(catalogs.en, `effects.${effectId}.params.${paramName}.label`) ?? fallback;
			const zh =
				deepGetString(zhCatalog(), `effects.${effectId}.params.${paramName}.label`) ?? fallback;
			return bilingual(en, zh);
		}
		return (
			deepGetString(uiCatalog(lang), `effects.${effectId}.params.${paramName}.label`) ?? fallback
		);
	};

	const paramHint = (effectId: string, paramName: string): string | undefined => {
		if (lang === 'en-zh') {
			const en = deepGetString(catalogs.en, `effects.${effectId}.params.${paramName}.hint`);
			const zh = deepGetString(zhCatalog(), `effects.${effectId}.params.${paramName}.hint`);
			if (!en && !zh) return undefined;
			return bilingual(en ?? '', zh ?? '');
		}
		return deepGetString(uiCatalog(lang), `effects.${effectId}.params.${paramName}.hint`);
	};

	const ditherPatternLabel = (index: number, fallback?: string): string => {
		const arr =
			deepGetArray(uiCatalog(lang), 'dither.patterns') ??
			deepGetArray(catalogs.en, 'dither.patterns');
		return arr?.[index] ?? fallback ?? String(index);
	};

	const ditherPaletteLabel = (index: number, fallback?: string): string => {
		const arr =
			deepGetArray(uiCatalog(lang), 'dither.palettes') ??
			deepGetArray(catalogs.en, 'dither.palettes');
		return arr?.[index] ?? fallback ?? String(index);
	};

	const ditherDistanceLabel = (mode: number): string => {
		const key = mode < 0.5 ? 'rgb' : 'natural';
		return t(`dither.distance.${key}`);
	};

	const ditherPresetLabel = (presetId: string, fallback: string): string =>
		deepGetString(uiCatalog(lang), `dither.presets.${presetId}`) ?? fallback;

	const glitchDigitalPresetLabel = (presetId: string, fallback: string): string =>
		deepGetString(uiCatalog(lang), `glitch.digital.${presetId}`) ?? fallback;

	const glitchVhsPresetLabel = (presetId: string, fallback: string): string =>
		deepGetString(uiCatalog(lang), `glitch.vhs.${presetId}`) ?? fallback;

	const builtinPresetName = (presetId: string, fallback: string): string => {
		if (lang === 'en-zh') return fallback;
		return deepGetString(uiCatalog(lang), `presets.${presetId}.name`) ?? fallback;
	};

	const builtinPresetGroup = (presetId: string, fallback: string): string => {
		if (lang === 'en-zh') return fallback;
		return deepGetString(uiCatalog(lang), `presets.${presetId}.group`) ?? fallback;
	};

	const builtinPresetDescription = (presetId: string, fallback: string): string => {
		if (lang === 'en-zh') {
			const en = deepGetString(catalogs.en, `presets.${presetId}.description`) ?? fallback;
			const zh = deepGetString(zhCatalog(), `presets.${presetId}.description`) ?? fallback;
			return bilingual(en, zh);
		}
		return deepGetString(uiCatalog(lang), `presets.${presetId}.description`) ?? fallback;
	};

	const exportSizeLabel = (presetId: string, fallback: string): string =>
		deepGetString(uiCatalog(lang), `export.sizes.${presetId}`) ?? fallback;

	const effectSearchText = (effectId: string, englishName: string, englishCategory: string): string => {
		const name = effectName(effectId, englishName);
		const cat = categoryName(englishCategory);
		return `${name} ${cat} ${englishName} ${englishCategory}`.toLowerCase();
	};

	const presetSearchText = (
		presetId: string,
		englishName: string,
		englishGroup: string,
		englishDescription: string
	): string => {
		const name = builtinPresetName(presetId, englishName);
		const group = builtinPresetGroup(presetId, englishGroup);
		const desc = builtinPresetDescription(presetId, englishDescription);
		return `${name} ${group} ${desc} ${englishName} ${englishGroup}`.toLowerCase();
	};

	return {
		lang,
		t,
		effectName,
		categoryName,
		paramLabel,
		paramHint,
		ditherPatternLabel,
		ditherPaletteLabel,
		ditherDistanceLabel,
		ditherPresetLabel,
		glitchDigitalPresetLabel,
		glitchVhsPresetLabel,
		builtinPresetName,
		builtinPresetGroup,
		builtinPresetDescription,
		exportSizeLabel,
		effectSearchText,
		presetSearchText
	};
}
