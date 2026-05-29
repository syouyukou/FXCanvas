/**
 * Writes procedural SVG fallback heroes under static/previews/sources/.
 * Prefer curated photos: run `npm run previews:fetch` (webp). Loader tries webp → svg.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../static/previews/sources');

const HEROES = [
	{ id: 'hero-portrait', build: portraitHero },
	{ id: 'hero-neon', build: neonHero },
	{ id: 'hero-night', build: nightHero }
];

function svg(body) {
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
${body}
</svg>`;
}

function portraitHero() {
	return svg(`<rect width="640" height="480" fill="#121010"/>
<defs><radialGradient id="skin" cx="50%" cy="38%"><stop offset="0%" stop-color="#d4b8a0"/><stop offset="55%" stop-color="#8a7060"/><stop offset="100%" stop-color="#2a2420"/></radialGradient></defs>
<rect width="640" height="480" fill="#1a1614"/>
<ellipse cx="320" cy="420" rx="180" ry="40" fill="#0e0c0a" opacity="0.6"/>
<ellipse cx="320" cy="210" rx="95" ry="120" fill="url(#skin)"/>
<path d="M260 210 Q320 130 380 210" fill="none" stroke="#6a5a50" stroke-width="2" opacity="0.35"/>`);
}

function neonHero() {
	return svg(`<rect width="640" height="480" fill="#080810"/>
<defs><linearGradient id="neon" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff006e"/><stop offset="50%" stop-color="#3a86ff"/><stop offset="100%" stop-color="#8338ec"/></linearGradient></defs>
<path d="M0 320 Q160 180 320 280 T640 240 L640 480 L0 480 Z" fill="url(#neon)" opacity="0.55"/>
<path d="M80 120 Q200 60 360 100 T580 80" fill="none" stroke="#00f5d4" stroke-width="3" opacity="0.7"/>
<circle cx="480" cy="160" r="60" fill="#ff006e" opacity="0.25"/>`);
}

function nightHero() {
	return svg(`<rect width="640" height="480" fill="#0a0c14"/>
<defs><radialGradient id="sun" cx="70%" cy="75%"><stop offset="0%" stop-color="#ffd166"/><stop offset="40%" stop-color="#f77f00"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>
<rect width="640" height="240" fill="#121820"/>
<ellipse cx="460" cy="360" rx="120" ry="80" fill="url(#sun)" opacity="0.85"/>
<rect y="300" width="640" height="180" fill="#0a1018"/>
<circle cx="120" cy="80" r="1.5" fill="#fff" opacity="0.8"/>
<circle cx="200" cy="50" r="1" fill="#fff" opacity="0.6"/>
<circle cx="380" cy="70" r="1.2" fill="#fff" opacity="0.7"/>`);
}

await mkdir(OUT_DIR, { recursive: true });

for (const { id, build } of HEROES) {
	const path = join(OUT_DIR, `${id}.svg`);
	await writeFile(path, build());
	console.log(`✓ ${id}.svg`);
}

console.log(`\n${HEROES.length} hero SVG fallbacks → ${OUT_DIR}`);
