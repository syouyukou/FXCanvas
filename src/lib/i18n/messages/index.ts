import type { LocaleId, MessageTree } from '../types';
import { en } from './en';
import { ja } from './ja';
import { zhCN } from './zh-CN';
import { zhTW } from './zh-TW';

export const catalogs: Record<Exclude<LocaleId, 'en-zh'>, MessageTree> = {
	en,
	'zh-TW': zhTW,
	'zh-CN': zhCN,
	ja
};
