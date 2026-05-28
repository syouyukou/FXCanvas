import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Default Vite host (localhost) — works with Cursor/browser opening http://localhost:5173
		port: 5173,
		strictPort: false
	},
	preview: {
		port: 4173
	}
});
