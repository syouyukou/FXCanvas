import { writable } from 'svelte/store';

/** Hold to show original image on canvas (Effect.app media preview compare). */
export const showOriginal = writable(false);
