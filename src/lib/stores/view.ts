import { writable } from 'svelte/store';

/** Hold to show original image on canvas (Effect.app media preview compare). */
export const showOriginal = writable(false);

export type ControlsPlacement = 'sidebar' | 'corner';

const CONTROLS_PLACEMENT_KEY = 'fx-controls-placement';
const MEDIA_PREVIEW_KEY = 'fx-media-preview-enabled';

function loadControlsPlacement(): ControlsPlacement {
	if (typeof localStorage === 'undefined') return 'sidebar';
	const v = localStorage.getItem(CONTROLS_PLACEMENT_KEY);
	return v === 'corner' ? 'corner' : 'sidebar';
}

function loadMediaPreviewEnabled(): boolean {
	if (typeof localStorage === 'undefined') return true;
	return localStorage.getItem(MEDIA_PREVIEW_KEY) !== '0';
}

/** Where the layer parameter panel is anchored (Effect.app: dock vs corner). */
export const controlsPlacement = writable<ControlsPlacement>('sidebar');

/** Space / hold-to-compare original image when enabled. */
export const mediaPreviewEnabled = writable(true);

export const EFFECT_PANEL_MIN_WIDTH = 200;
export const EFFECT_PANEL_MAX_WIDTH = 440;
export const EFFECT_PANEL_DEFAULT_WIDTH = 280;
export const EFFECT_PANEL_COLLAPSED_WIDTH = 72;
/** Release drag below this → snap to rail. */
export const EFFECT_PANEL_SNAP_RAIL_BELOW = 140;
/** Expanded layout uses 3 columns from this width. */
export const EFFECT_PANEL_THREE_COL_MIN = 300;
/** Expanded layout uses 2 columns from this width (hysteresis when widening). */
export const EFFECT_PANEL_TWO_COL_MIN = 230;
/** Expanded layout drops to 1 column below this (hysteresis when narrowing). */
export const EFFECT_PANEL_ONE_COL_MAX = 210;
/** Hide tabs/search in compact single-column mode. */
export const EFFECT_PANEL_COMPACT_BELOW = 200;

const WIDTH_KEY = 'fx-effect-panel-width';
const COLLAPSED_KEY = 'fx-effect-panel-collapsed';
const SAVED_WIDTH_KEY = 'fx-effect-panel-saved-width';

function loadWidth() {
	if (typeof localStorage === 'undefined') return EFFECT_PANEL_DEFAULT_WIDTH;
	const n = Number(localStorage.getItem(WIDTH_KEY));
	return Number.isFinite(n)
		? Math.min(EFFECT_PANEL_MAX_WIDTH, Math.max(EFFECT_PANEL_MIN_WIDTH, n))
		: EFFECT_PANEL_DEFAULT_WIDTH;
}

function loadSavedWidth() {
	if (typeof localStorage === 'undefined') return EFFECT_PANEL_DEFAULT_WIDTH;
	const n = Number(localStorage.getItem(SAVED_WIDTH_KEY));
	return Number.isFinite(n)
		? Math.min(EFFECT_PANEL_MAX_WIDTH, Math.max(EFFECT_PANEL_MIN_WIDTH, n))
		: loadWidth();
}

function loadCollapsed() {
	if (typeof localStorage === 'undefined') return false;
	return localStorage.getItem(COLLAPSED_KEY) === '1';
}

/** Expanded effect panel width in px (ignored while collapsed). */
export const effectPanelWidth = writable(EFFECT_PANEL_DEFAULT_WIDTH);

/** Width restored when expanding from collapsed rail. */
export const effectPanelSavedWidth = writable(EFFECT_PANEL_DEFAULT_WIDTH);

/** Icon-only narrow strip like Effect.app collapsed library. */
export const effectPanelCollapsed = writable(false);

/** Tracks last column count to avoid flicker at breakpoints while resizing. */
let lastGridColumns = 2;

export function effectPanelGridColumns(width: number, collapsed: boolean): number {
	if (collapsed || width <= EFFECT_PANEL_COLLAPSED_WIDTH + 4) {
		lastGridColumns = 1;
		return 1;
	}

	let cols: number;
	if (width >= EFFECT_PANEL_THREE_COL_MIN) cols = 3;
	else if (width >= EFFECT_PANEL_TWO_COL_MIN) cols = 2;
	else if (width <= EFFECT_PANEL_ONE_COL_MAX) cols = 1;
	else cols = lastGridColumns === 1 ? (width >= EFFECT_PANEL_TWO_COL_MIN - 10 ? 2 : 1) : 2;

	lastGridColumns = cols;
	return cols;
}

export function effectPanelIsCompact(width: number, collapsed: boolean): boolean {
	return !collapsed && width < EFFECT_PANEL_COMPACT_BELOW && width > EFFECT_PANEL_COLLAPSED_WIDTH + 4;
}

if (typeof window !== 'undefined') {
	effectPanelWidth.set(loadWidth());
	effectPanelSavedWidth.set(loadSavedWidth());
	effectPanelCollapsed.set(loadCollapsed());
	controlsPlacement.set(loadControlsPlacement());
	mediaPreviewEnabled.set(loadMediaPreviewEnabled());
	effectPanelWidth.subscribe((v) => localStorage.setItem(WIDTH_KEY, String(v)));
	effectPanelSavedWidth.subscribe((v) => localStorage.setItem(SAVED_WIDTH_KEY, String(v)));
	effectPanelCollapsed.subscribe((v) => localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0'));
	controlsPlacement.subscribe((v) => localStorage.setItem(CONTROLS_PLACEMENT_KEY, v));
	mediaPreviewEnabled.subscribe((v) =>
		localStorage.setItem(MEDIA_PREVIEW_KEY, v ? '1' : '0')
	);
}
