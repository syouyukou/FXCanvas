export type LocaleId = 'en' | 'zh-TW' | 'zh-CN' | 'ja' | 'en-zh';

export type MessageTree = {
	[key: string]: string | MessageTree | string[];
};

export const CATEGORY_SLUG: Record<string, string> = {
	Adjust: 'adjust',
	Blur: 'blur',
	Color: 'color',
	Film: 'film',
	Distort: 'distort',
	Effects: 'effects',
	Generate: 'generate'
};

export const LOCALE_OPTIONS: { id: LocaleId; labelKey: string }[] = [
	{ id: 'zh-TW', labelKey: 'lang.zhTW' },
	{ id: 'zh-CN', labelKey: 'lang.zhCN' },
	{ id: 'ja', labelKey: 'lang.ja' },
	{ id: 'en', labelKey: 'lang.en' },
	{ id: 'en-zh', labelKey: 'lang.enZh' }
];
