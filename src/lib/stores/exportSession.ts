import { writable } from 'svelte/store';

/** True while video export is rendering — pauses canvas preview loop. */
export const exportSessionActive = writable(false);
