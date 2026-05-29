import { derived, get, writable } from 'svelte/store';
import { createI18n, type I18nApi } from './core';
import type { LocaleId } from './types';

export type { I18nApi } from './core';
export { createI18n } from './core';

const STORAGE_KEY = 'fxcanvas-locale';

function loadLocale(): LocaleId {
	if (typeof localStorage === 'undefined') return 'en';
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw === 'en' || raw === 'zh-TW' || raw === 'zh-CN' || raw === 'ja' || raw === 'en-zh') {
		return raw;
	}
	return 'en';
}

function localeToHtml(lang: LocaleId): string {
	if (lang === 'en-zh') return 'en';
	if (lang === 'zh-CN') return 'zh-Hans';
	if (lang === 'zh-TW') return 'zh-Hant';
	return lang;
}

const initialLocale = loadLocale();
export const locale = writable<LocaleId>(initialLocale);

if (typeof document !== 'undefined') {
	document.documentElement.lang = localeToHtml(initialLocale);
}

locale.subscribe((lang) => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, lang);
	}
	if (typeof document !== 'undefined') {
		document.documentElement.lang = localeToHtml(lang);
	}
});

/** Reactive i18n API — subscribe via `$i18n` in Svelte components. */
export const i18n: import('svelte/store').Readable<I18nApi> = derived(locale, ($lang) =>
	createI18n($lang)
);

/** Non-reactive translate (stores, export helpers). Components should use `$i18n`. */
export function t(path: string, vars?: Record<string, string | number>): string {
	return createI18n(get(locale)).t(path, vars);
}

export function effectName(effectId: string, fallback: string): string {
	return createI18n(get(locale)).effectName(effectId, fallback);
}

export function categoryName(category: string): string {
	return createI18n(get(locale)).categoryName(category);
}

export function paramLabel(effectId: string, paramName: string, fallback: string): string {
	return createI18n(get(locale)).paramLabel(effectId, paramName, fallback);
}

export function paramHint(effectId: string, paramName: string): string | undefined {
	return createI18n(get(locale)).paramHint(effectId, paramName);
}

export function ditherPatternLabel(index: number, fallback?: string): string {
	return createI18n(get(locale)).ditherPatternLabel(index, fallback);
}

export function ditherPaletteLabel(index: number, fallback?: string): string {
	return createI18n(get(locale)).ditherPaletteLabel(index, fallback);
}

export function ditherDistanceLabel(mode: number): string {
	return createI18n(get(locale)).ditherDistanceLabel(mode);
}

export function ditherPresetLabel(presetId: string, fallback: string): string {
	return createI18n(get(locale)).ditherPresetLabel(presetId, fallback);
}

export function glitchDigitalPresetLabel(presetId: string, fallback: string): string {
	return createI18n(get(locale)).glitchDigitalPresetLabel(presetId, fallback);
}

export function glitchVhsPresetLabel(presetId: string, fallback: string): string {
	return createI18n(get(locale)).glitchVhsPresetLabel(presetId, fallback);
}

export function builtinPresetName(presetId: string, fallback: string): string {
	return createI18n(get(locale)).builtinPresetName(presetId, fallback);
}

export function builtinPresetGroup(presetId: string, fallback: string): string {
	return createI18n(get(locale)).builtinPresetGroup(presetId, fallback);
}

export function builtinPresetDescription(presetId: string, fallback: string): string {
	return createI18n(get(locale)).builtinPresetDescription(presetId, fallback);
}

export function exportSizeLabel(presetId: string, fallback: string): string {
	return createI18n(get(locale)).exportSizeLabel(presetId, fallback);
}

export function effectSearchText(
	effectId: string,
	englishName: string,
	englishCategory: string
): string {
	return createI18n(get(locale)).effectSearchText(effectId, englishName, englishCategory);
}

export function presetSearchText(
	presetId: string,
	englishName: string,
	englishGroup: string,
	englishDescription: string
): string {
	return createI18n(get(locale)).presetSearchText(
		presetId,
		englishName,
		englishGroup,
		englishDescription
	);
}
