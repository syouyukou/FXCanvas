import type { MessageTree } from './types';

export function deepGet(tree: MessageTree, path: string): string | string[] | undefined {
	const parts = path.split('.');
	let cur: string | MessageTree | string[] | undefined = tree;
	for (const p of parts) {
		if (cur == null || typeof cur === 'string' || Array.isArray(cur)) return undefined;
		cur = cur[p];
	}
	if (typeof cur === 'string' || Array.isArray(cur)) return cur;
	return undefined;
}

export function deepGetString(tree: MessageTree, path: string): string | undefined {
	const v = deepGet(tree, path);
	return typeof v === 'string' ? v : undefined;
}

export function deepGetArray(tree: MessageTree, path: string): string[] | undefined {
	const v = deepGet(tree, path);
	return Array.isArray(v) ? v : undefined;
}
