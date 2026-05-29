/**
 * Writes curated SVG preview sources under static/previews/sources/.
 * Replace any file with a real photo (same basename) — GPU thumbnails pick it up on reload.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../static/previews/sources');

const EFFECT_IDS = [
	'gaussian_blur',
	'exposure',
	'levels',
	'brightness_contrast',
	'hue_saturation',
	'noise',
	'crt',
	'duotone',
	'vignette',
	'glitch_digital',
	'glitch_vhs',
	'pixelate',
	'monochrome',
	'star_glow',
	'rgb_halftone',
	'soft_bleed',
	'paper_grain',
	'print_stamp',
	'dither',
	'bloom'
];

/** @type {Record<string, () => string>} */
const builders = {
	gaussian_blur: sculpture,
	noise: faceBw,
	dither: landscapeGradient,
	levels: nightStreet,
	crt: blueSilhouette,
	exposure: windowLightPortrait,
	bloom: nightLights,
	glitch_digital: neonBlocks,
	glitch_vhs: retroPortrait,
	brightness_contrast: flatWall,
	hue_saturation: flowers,
	duotone: silhouette,
	vignette: centerSubject,
	pixelate: simpleFace,
	monochrome: colorStreet,
	star_glow: starPoints,
	rgb_halftone: halftoneFace,
	soft_bleed: inkBleed,
	paper_grain: plainSky,
	print_stamp: typePoster
};

function svg(body) {
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
${body}
</svg>`;
}

function bgDark() {
	return `<rect width="256" height="256" fill="#0a0a0c"/>`;
}

function sculpture() {
	return svg(`${bgDark()}
<defs><radialGradient id="g" cx="40%" cy="45%"><stop offset="0%" stop-color="#c8b8a8"/><stop offset="55%" stop-color="#4a4038"/><stop offset="100%" stop-color="#121010"/></radialGradient></defs>
<ellipse cx="128" cy="200" rx="90" ry="30" fill="#1a1816"/>
<path d="M88 200 Q128 60 168 200 Q128 180 88 200" fill="url(#g)"/>
<path d="M100 120 Q128 80 156 120" fill="none" stroke="#8a7a6a" stroke-width="2" opacity="0.5"/>`);
}

function faceBw() {
	return svg(`${bgDark()}
<ellipse cx="128" cy="140" rx="70" ry="85" fill="#2a2a2e"/>
<ellipse cx="100" cy="125" rx="18" ry="10" fill="#0e0e10"/>
<ellipse cx="156" cy="125" rx="18" ry="10" fill="#0e0e10"/>
<path d="M95 175 Q128 195 161 175" fill="none" stroke="#555" stroke-width="3"/>
<rect width="256" height="256" fill="url(#n)" opacity="0.35"/>
<defs><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4"/></filter></defs>`);
}

function landscapeGradient() {
	return svg(`${bgDark()}
<rect y="120" width="256" height="136" fill="#1a2838"/>
<path d="M0 140 L60 90 L120 130 L200 70 L256 110 L256 256 L0 256 Z" fill="#243040"/>
<path d="M0 160 L80 110 L160 150 L256 100 L256 256 L0 256 Z" fill="#1a2228"/>
<rect y="0" width="256" height="100" fill="url(#sky)"/>
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a6888"/><stop offset="100%" stop-color="#8ab0d0"/></linearGradient></defs>`);
}

function nightStreet() {
	return svg(`${bgDark()}
<rect y="150" width="256" height="106" fill="#151210"/>
<rect x="40" y="80" width="80" height="100" fill="#1e1a18"/>
<rect x="140" y="60" width="90" height="120" fill="#181614"/>
<rect x="50" y="95" width="60" height="25" rx="2" fill="#e86a20" opacity="0.95"/>
<text x="55" y="112" fill="#0a0a0a" font-size="11" font-family="sans-serif" font-weight="700">LEVELS</text>
<ellipse cx="200" cy="200" rx="8" ry="25" fill="#0a0a0c"/>
<ellipse cx="170" cy="195" rx="8" ry="28" fill="#0a0a0c"/>`);
}

function blueSilhouette() {
	return svg(`${bgDark()}
<rect width="256" height="256" fill="#0c1428"/>
<ellipse cx="128" cy="90" rx="45" ry="50" fill="#2a5088"/>
<path d="M70 140 L128 130 L186 140 L186 230 L70 230 Z" fill="#1a3868"/>`);
}

function windowLightPortrait() {
	return svg(`${bgDark()}
<rect width="256" height="256" fill="#121018"/>
<rect x="160" y="20" width="70" height="200" fill="#e8d8b0" opacity="0.85"/>
<ellipse cx="100" cy="130" rx="55" ry="70" fill="#2a2420"/>`);
}

function nightLights() {
	return svg(`${bgDark()}
<rect width="256" height="256" fill="#060810"/>
<circle cx="80" cy="100" r="3" fill="#fff8e0"/><circle cx="80" cy="100" r="12" fill="#ffd080" opacity="0.25"/>
<circle cx="180" cy="70" r="2" fill="#fff"/><circle cx="180" cy="70" r="10" fill="#a0c0ff" opacity="0.3"/>
<path d="M40 200 Q128 160 216 200" fill="none" stroke="#2a3040" stroke-width="40" opacity="0.5"/>`);
}

function neonBlocks() {
	return svg(`${bgDark()}
<rect x="20" y="30" width="60" height="40" fill="#ff2060"/><rect x="90" y="50" width="80" height="30" fill="#20ff80"/>
<rect x="30" y="100" width="100" height="50" fill="#4080ff"/><rect x="140" y="80" width="90" height="70" fill="#ffcc00"/>
<rect x="50" y="170" width="160" height="40" fill="#ff40a0" opacity="0.8"/>`);
}

function retroPortrait() {
	return svg(`${bgDark()}
<rect width="256" height="256" fill="#1a1410"/>
<ellipse cx="128" cy="110" rx="50" ry="58" fill="#3a3028"/>
<rect y="0" width="256" height="4" fill="#444" opacity="0.4"/>
<rect y="12" width="256" height="3" fill="#333" opacity="0.3"/>
<rect y="240" width="256" height="6" fill="#555" opacity="0.35"/>`);
}

function flatWall() {
	return svg(`<rect width="256" height="256" fill="#6a6a6e"/>
<rect x="40" y="60" width="176" height="136" fill="#78787c" opacity="0.6"/>`);
}

function flowers() {
	return svg(`${bgDark()}
<rect y="180" width="256" height="76" fill="#1a2818"/>
<circle cx="90" cy="120" r="35" fill="#e04060"/><circle cx="90" cy="120" r="18" fill="#ffd040"/>
<circle cx="170" cy="100" r="30" fill="#4080e0"/><circle cx="170" cy="100" r="14" fill="#80e0ff"/>`);
}

function silhouette() {
	return svg(`<rect width="256" height="256" fill="#f0e8d8"/>
<path d="M128 40 L200 220 L56 220 Z" fill="#1a1814"/>`);
}

function centerSubject() {
	return svg(`${bgDark()}
<circle cx="128" cy="128" r="50" fill="#3a3835"/>
<rect width="256" height="256" fill="url(#v)"/>
<defs><radialGradient id="v" cx="50%" cy="50%" r="50%"><stop offset="55%" stop-color="transparent"/><stop offset="100%" stop-color="#000"/></radialGradient></defs>`);
}

function simpleFace() {
	return svg(`${bgDark()}
<rect x="78" y="70" width="100" height="120" rx="8" fill="#c8a890"/>
<circle cx="108" cy="120" r="8" fill="#222"/><circle cx="148" cy="120" r="8" fill="#222"/>
<rect x="108" y="150" width="40" height="6" rx="3" fill="#6a4030"/>`);
}

function colorStreet() {
	return svg(`${bgDark()}
<rect x="0" y="140" width="86" height="116" fill="#c04040"/><rect x="86" y="120" width="84" height="136" fill="#4080c0"/>
<rect x="170" y="150" width="86" height="106" fill="#40a060"/>`);
}

function starPoints() {
	return svg(`${bgDark()}
<circle cx="128" cy="128" r="2" fill="#fff"/>
<line x1="128" y1="128" x2="40" y2="60" stroke="#fff8c0" stroke-width="1" opacity="0.6"/>
<line x1="128" y1="128" x2="220" y2="80" stroke="#fff8c0" stroke-width="1" opacity="0.5"/>
<line x1="128" y1="128" x2="200" y2="200" stroke="#fff8c0" stroke-width="1" opacity="0.4"/>`);
}

function halftoneFace() {
	return svg(`${bgDark()}
<ellipse cx="128" cy="130" rx="65" ry="75" fill="#d0c8c0"/>
<defs><pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#333"/></pattern></defs>
<ellipse cx="128" cy="130" rx="65" ry="75" fill="url(#dots)" opacity="0.5"/>`);
}

function inkBleed() {
	return svg(`<rect width="256" height="256" fill="#e8e4dc"/>
<path d="M128 40 Q60 120 100 200 Q128 160 156 200 Q196 120 128 40" fill="#0a0a0a" opacity="0.85"/>
<path d="M128 50 Q90 130 120 190" fill="#1a1a1a" opacity="0.4"/>`);
}

function plainSky() {
	return svg(`<rect width="256" height="256" fill="url(#sky2)"/>
<defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5a8ab0"/><stop offset="100%" stop-color="#8ab8d8"/></linearGradient></defs>`);
}

function typePoster() {
	return svg(`${bgDark()}
<rect x="30" y="50" width="196" height="156" fill="#e8e0d0"/>
<text x="48" y="120" fill="#1a1a1a" font-size="42" font-family="Georgia, serif" font-weight="700">FX</text>
<text x="48" y="155" fill="#444" font-size="14" font-family="monospace">PRINT</text>`);
}

await mkdir(OUT_DIR, { recursive: true });

for (const id of EFFECT_IDS) {
	const content = (builders[id] ?? sculpture)();
	await writeFile(join(OUT_DIR, `${id}.svg`), content, 'utf8');
	console.log(`wrote ${id}.svg`);
}

console.log(`\n${EFFECT_IDS.length} preview sources → ${OUT_DIR}`);
