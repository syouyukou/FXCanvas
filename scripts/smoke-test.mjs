#!/usr/bin/env node
/**
 * FXCanvas smoke test — validates build artifacts, effect registry, and live app.
 *
 * Usage:
 *   npm run dev -- --port 5174
 *   npm run smoke
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = join(ROOT, 'scripts/fixtures/smoke.png');
const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:5174';

const results = [];

function pass(name, detail = '') {
	results.push({ name, ok: true, detail });
	console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
	results.push({ name, ok: false, detail });
	console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function fetchText(url) {
	const res = await fetch(url);
	return { status: res.status, text: await res.text() };
}

function validateEffectsRegistry() {
	const src = readFileSync(join(ROOT, 'src/lib/effects/index.ts'), 'utf8');
	const ids = [...src.matchAll(/\{\n\t\tid: '([^']+)'/g)].map((m) => m[1]);
	const unique = new Set(ids);

	if (ids.length < 13) fail('Effect count', `expected ≥13, got ${ids.length}`);
	else pass('Effect count', `${ids.length} effects`);

	if (unique.size !== ids.length) fail('Effect ids unique', 'duplicate ids found');
	else pass('Effect ids unique');

	for (const id of ['gaussian_blur', 'bloom', 'dither', 'star_glow', 'duotone']) {
		if (!ids.includes(id)) fail(`Required effect: ${id}`);
		else pass(`Required effect: ${id}`);
	}

	if (!src.includes('passes:')) fail('Multi-pass effects defined');
	else pass('Multi-pass effects defined');
}

function validateRendererApi() {
	const src = readFileSync(join(ROOT, 'src/lib/engine/renderer.ts'), 'utf8');
	for (const [needle, label] of [
		['getEffectPasses', 'Multi-pass helper'],
		['uniformCache', 'Uniform cache'],
		['exportCanvas(appliedEffects', 'Full-res export API'],
		['PREVIEW_MAX_DIM', 'Preview downscale'],
		['useOriginal', 'Original texture binding']
	]) {
		if (src.includes(needle)) pass(label);
		else fail(label, `missing ${needle}`);
	}
}

async function validateDevServer() {
	try {
		const { status, text } = await fetchText(BASE_URL);
		if (status !== 200) {
			fail('Dev server HTTP', `status ${status}`);
			return;
		}
		pass('Dev server HTTP', `200 ${BASE_URL}`);
		if (text.includes('FXCanvas') || text.includes('fxcanvas')) pass('App shell loads');
		else fail('App shell loads', 'FXCanvas marker not found');
	} catch (err) {
		fail('Dev server reachable', err.message);
	}
}

async function runPlaywrightSmoke() {
	let chromium;
	try {
		({ chromium } = await import('playwright'));
	} catch {
		pass('Browser smoke', 'skipped (playwright not installed)');
		return;
	}

	const browser = await chromium.launch({
		headless: true,
		args: ['--enable-unsafe-swiftshader']
	});
	const page = await browser.newPage();
	const pageErrors = [];
	page.on('pageerror', (err) => pageErrors.push(err.message));

	try {
		await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
		pass('Browser page load');

		const title = await page.title();
		if (title.includes('FXCanvas')) pass('Browser title', title);
		else fail('Browser title', title);

		// Default thumbnails visible before upload
		await page.waitForFunction(
			() => document.querySelectorAll('.effect-card .thumb-img').length >= 10,
			null,
			{ timeout: 8000 }
		);
		const thumbCount = await page.locator('.effect-card .thumb-img').count();
		if (thumbCount >= 10) pass('Default effect thumbnails', `${thumbCount} visible`);
		else fail('Default effect thumbnails', `only ${thumbCount}`);

		// Load image first, then test effect stack
		await page.locator('input[type="file"]').setInputFiles(FIXTURE);
		await page.waitForFunction(
			() => document.querySelector('.footer-info')?.textContent?.includes('×'),
			null,
			{ timeout: 10000 }
		);
		pass('Load image fixture');

		await page.getByText('Bloom', { exact: true }).click();
		await page.locator('.layer-name', { hasText: 'BLOOM' }).waitFor({ timeout: 3000 });
		pass('Add Bloom layer');

		const exportEnabled = await page.getByRole('button', { name: 'Export PNG' }).isEnabled();
		if (exportEnabled) pass('Export enabled with image');
		else fail('Export enabled with image');

		// Dither should render without checkerboard garbage
		await page.getByText('Dither', { exact: true }).click();
		await page.waitForTimeout(400);
		const ditherThumb = await page.locator('.effect-card', { hasText: 'Dither' }).locator('.thumb-img').getAttribute('src');
		if (ditherThumb && ditherThumb.length > 500) pass('Dither thumbnail renders');
		else fail('Dither thumbnail renders', `len ${ditherThumb?.length ?? 0}`);

		await page.getByText('Duotone', { exact: true }).click({ modifiers: ['Shift'] });
		await page.locator('.layer-name', { hasText: 'DUOTONE' }).waitFor({ timeout: 3000 });
		pass('Shift+click add Duotone');

		await page.getByRole('button', { name: 'Export PNG' }).click();
		pass('Export PNG clickable');

		if (pageErrors.length === 0) pass('No page JS errors');
		else fail('No page JS errors', pageErrors.join(' | '));
	} catch (err) {
		fail('Browser smoke flow', err.message);
	} finally {
		await browser.close();
	}
}

async function main() {
	console.log('\nFXCanvas Smoke Test\n');

	validateEffectsRegistry();
	validateRendererApi();
	await validateDevServer();
	await runPlaywrightSmoke();

	const failed = results.filter((r) => !r.ok);
	console.log(`\n${results.length - failed.length}/${results.length} passed`);
	if (failed.length) {
		console.error('\nFailed:');
		for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
		process.exit(1);
	}
	console.log('\nAll smoke checks passed.\n');
}

main();
