/**
 * Download three category hero photos into static/previews/sources/hero-*.webp
 * Manifest: scripts/preview-sources.manifest.json
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../static/previews/sources');
const MANIFEST = join(__dirname, 'preview-sources.manifest.json');

async function fetchOne(heroId, entry) {
	const res = await fetch(entry.url, {
		headers: { 'User-Agent': 'fxcanvas-preview-fetch/1.0' }
	});
	if (!res.ok) throw new Error(`${heroId}: HTTP ${res.status}`);
	const buf = Buffer.from(await res.arrayBuffer());
	const out = join(OUT_DIR, `${heroId}.webp`);
	await writeFile(out, buf);
	return out;
}

async function main() {
	const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
	await mkdir(OUT_DIR, { recursive: true });

	const heroes = manifest.heroes ?? manifest.sources;
	if (!heroes) {
		console.error('Manifest must contain "heroes" object');
		process.exit(1);
	}

	const ids = Object.keys(heroes);
	let ok = 0;
	let fail = 0;

	for (const id of ids) {
		try {
			const path = await fetchOne(id, heroes[id]);
			console.log(`✓ ${id} → ${path}`);
			ok++;
		} catch (err) {
			console.error(`✗ ${id}: ${err.message}`);
			fail++;
		}
	}

	console.log(`\nDone: ${ok} saved, ${fail} failed (${ids.length} heroes)`);
	if (fail > 0) process.exit(1);
}

main();
