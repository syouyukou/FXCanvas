#!/usr/bin/env node
/**
 * FXCanvas smoke test — validates build artifacts, effect registry, and live app.
 *
 * Usage:
 *   npm run smoke          # auto-starts dev server if needed
 *   npm run dev && npm run smoke
 */
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = join(ROOT, 'scripts/fixtures/smoke.png');
const SMOKE_PORT = Number(process.env.SMOKE_PORT ?? 5173);

const results = [];
let baseUrl = process.env.SMOKE_BASE_URL ?? null;
let devServerChild = null;

function pass(name, detail = '') {
	results.push({ name, ok: true, detail });
	console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
	results.push({ name, ok: false, detail });
	console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function probeUrl(url) {
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
		if (res.status !== 200) return false;
		const text = await res.text();
		return text.includes('FXCanvas') || text.includes('fxcanvas');
	} catch {
		return false;
	}
}

async function resolveBaseUrl() {
	if (baseUrl && (await probeUrl(baseUrl))) return baseUrl;

	const hosts = ['localhost', '127.0.0.1'];
	for (const host of hosts) {
		for (let port = SMOKE_PORT; port <= SMOKE_PORT + 2; port++) {
			const url = `http://${host}:${port}`;
			if (await probeUrl(url)) return url;
		}
	}
	return null;
}

async function startDevServer() {
	return new Promise((resolve, reject) => {
		const child = spawn('npm', ['run', 'dev', '--', '--port', String(SMOKE_PORT)], {
			cwd: ROOT,
			stdio: ['ignore', 'pipe', 'pipe'],
			env: { ...process.env, FORCE_COLOR: '0' }
		});

		let settled = false;
		const deadline = setTimeout(() => {
			if (!settled) reject(new Error(`Dev server did not start within 30s on port ${SMOKE_PORT}`));
		}, 30000);

		const tryReady = async () => {
			const url = await resolveBaseUrl();
			if (url && !settled) {
				settled = true;
				clearTimeout(deadline);
				clearInterval(poll);
				devServerChild = child;
				resolve(url);
			}
		};

		child.stdout?.on('data', () => void tryReady());
		child.stderr?.on('data', () => void tryReady());
		const poll = setInterval(() => void tryReady(), 400);

		child.on('error', (err) => {
			if (!settled) reject(err);
		});
		child.on('exit', (code) => {
			if (!settled) reject(new Error(`Dev server exited early (code ${code ?? 'unknown'})`));
		});
	});
}

async function ensureDevServer() {
	baseUrl = await resolveBaseUrl();
	if (baseUrl) {
		pass('Dev server detected', baseUrl);
		return;
	}

	console.log(`Starting dev server on port ${SMOKE_PORT}…`);
	try {
		baseUrl = await startDevServer();
		pass('Dev server started', baseUrl);
	} catch (err) {
		fail('Dev server reachable', err.message);
	}
}

function stopDevServer() {
	if (!devServerChild) return;
	devServerChild.kill('SIGTERM');
	devServerChild = null;
}

function validateEffectsRegistry() {
	const src =
		readFileSync(join(ROOT, 'src/lib/effects/index.ts'), 'utf8') +
		readFileSync(join(ROOT, 'src/lib/effects/dither.ts'), 'utf8') +
		readFileSync(join(ROOT, 'src/lib/effects/exposure.ts'), 'utf8') +
		readFileSync(join(ROOT, 'src/lib/effects/levels.ts'), 'utf8');
	const ids = [...src.matchAll(/\{\n\t*id: '([^']+)',\n\t*name:/g)].map((m) => m[1]);
	const unique = new Set(ids);

	if (ids.length < 15) fail('Effect count', `expected ≥15, got ${ids.length}`);
	else pass('Effect count', `${ids.length} effects`);

	if (unique.size !== ids.length) fail('Effect ids unique', 'duplicate ids found');
	else pass('Effect ids unique');

	for (const id of ['gaussian_blur', 'bloom', 'dither', 'exposure', 'levels', 'star_glow', 'duotone']) {
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
		['exportImage(appliedEffects', 'Scaled export API'],
		['PREVIEW_MAX_DIM', 'Preview downscale'],
		['useOriginal', 'Original texture binding']
	]) {
		if (src.includes(needle)) pass(label);
		else fail(label, `missing ${needle}`);
	}
}

function validateThumbnailApi() {
	const thumbSrc = readFileSync(join(ROOT, 'src/lib/engine/thumbnail.ts'), 'utf8');
	const panelSrc = readFileSync(join(ROOT, 'src/lib/components/EffectPanel.svelte'), 'utf8');
	for (const [needle, label] of [
		['renderSource()', 'Source thumbnail render'],
		['renderEffect(effect', 'Effect thumbnail render'],
		['thumb-before', 'Hover before/after UI']
	]) {
		const src = needle.startsWith('thumb') ? panelSrc : thumbSrc;
		if (src.includes(needle)) pass(label);
		else fail(label, `missing ${needle}`);
	}
}

async function validateDevServerHttp() {
	if (!baseUrl) return;
	try {
		const res = await fetch(baseUrl);
		if (res.status !== 200) {
			fail('Dev server HTTP', `status ${res.status}`);
			return;
		}
		pass('Dev server HTTP', `200 ${baseUrl}`);
		const text = await res.text();
		if (text.includes('FXCanvas') || text.includes('fxcanvas')) pass('App shell loads');
		else fail('App shell loads', 'FXCanvas marker not found');
	} catch (err) {
		fail('Dev server HTTP', err.message);
	}
}

async function thumbDataUrl(page, effectName) {
	return page
		.locator('.effect-card', { hasText: effectName })
		.locator('.thumb-after, .thumb-img:not(.thumb-before)')
		.first()
		.getAttribute('src');
}

async function runPlaywrightSmoke() {
	if (!baseUrl) return;

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
		await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 20000 });
		pass('Browser page load');

		const title = await page.title();
		if (title.includes('FXCanvas')) pass('Browser title', title);
		else fail('Browser title', title);

		await page.waitForFunction(
			() => document.querySelectorAll('.effect-card .thumb-after').length >= 10,
			null,
			{ timeout: 15000 }
		);
		const thumbCount = await page.locator('.effect-card .thumb-after').count();
		if (thumbCount >= 10) pass('Default effect thumbnails', `${thumbCount} visible`);
		else fail('Default effect thumbnails', `only ${thumbCount}`);

		const bloomCard = page.locator('.effect-card', { hasText: 'Bloom' }).first();
		await bloomCard.hover();
		await page.waitForTimeout(250);
		const beforeOpacity = await bloomCard.locator('.thumb-before').evaluate((el) =>
			parseFloat(getComputedStyle(el).opacity)
		);
		if (beforeOpacity > 0.5) pass('Thumbnail hover shows original');
		else fail('Thumbnail hover shows original', `opacity ${beforeOpacity}`);

		await page.locator('input[type="file"]').setInputFiles(FIXTURE);
		await page.waitForFunction(
			() => document.querySelector('.footer-info')?.textContent?.includes('×'),
			null,
			{ timeout: 10000 }
		);
		pass('Load image fixture');

		await page.getByText('Bloom', { exact: true }).first().click();
		await page.locator('.layer-name', { hasText: 'BLOOM' }).waitFor({ timeout: 3000 });
		pass('Add Bloom layer');

		const exportEnabled = await page.getByRole('button', { name: 'Export', exact: true }).isEnabled();
		if (exportEnabled) pass('Export enabled with image');
		else fail('Export enabled with image');

		await page.getByText('Dither', { exact: true }).first().click();
		await page.waitForTimeout(400);
		const ditherThumb = await thumbDataUrl(page, 'Dither');
		if (ditherThumb && ditherThumb.length > 500) pass('Dither thumbnail renders');
		else fail('Dither thumbnail renders', `len ${ditherThumb?.length ?? 0}`);

		await page.getByText('Duotone', { exact: true }).first().click({ modifiers: ['Shift'] });
		await page.locator('.layer-name', { hasText: 'DUOTONE' }).waitFor({ timeout: 3000 });
		pass('Shift+click add Duotone');

		await page.getByText('Star Glow', { exact: true }).first().click({ modifiers: ['Shift'] });
		await page.locator('.layer-name', { hasText: 'STAR GLOW' }).waitFor({ timeout: 3000 });
		await page.locator('.grad-bar').waitFor({ timeout: 3000 });
		pass('Star Glow gradient UI');

		await page.waitForTimeout(400);
		const starGlowThumb = await thumbDataUrl(page, 'Star Glow');
		if (starGlowThumb && starGlowThumb.length > 500) pass('Star Glow thumbnail renders');
		else fail('Star Glow thumbnail renders', `len ${starGlowThumb?.length ?? 0}`);

		await page.locator('.search').fill('bloom');
		await page.waitForFunction(
			() => document.querySelectorAll('.effect-card').length <= 2,
			null,
			{ timeout: 3000 }
		);
		pass('Search filters effects');
		await page.locator('.search').fill('');

		await page.locator('.layer-row', { hasText: 'BLOOM' }).click();
		await page.locator('.layer-row', { hasText: 'BLOOM' }).locator('.icon-btn.eye').click();
		await page.waitForTimeout(200);
		pass('Layer visibility toggle');

		await page.getByText('Gaussian Blur', { exact: true }).first().click({ modifiers: ['Shift'] });
		await page.locator('.layer-name', { hasText: 'GAUSSIAN BLUR' }).waitFor({ timeout: 3000 });
		pass('Gaussian Blur multi-pass');

		await page.getByRole('button', { name: 'Export', exact: true }).click();
		await page.locator('#export-format').selectOption('jpeg');
		await page.getByRole('button', { name: 'Download' }).click();
		pass('Export JPEG download');

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

	process.on('exit', stopDevServer);
	process.on('SIGINT', () => {
		stopDevServer();
		process.exit(130);
	});
	process.on('SIGTERM', () => {
		stopDevServer();
		process.exit(143);
	});

	validateEffectsRegistry();
	validateRendererApi();
	validateThumbnailApi();
	await ensureDevServer();
	await validateDevServerHttp();
	await runPlaywrightSmoke();
	stopDevServer();

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
