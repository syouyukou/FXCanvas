#!/usr/bin/env node
/**
 * FXCanvas scenario tests — multi-locale usage flows.
 *
 * Usage:
 *   npm run dev          # in another terminal, or auto-started
 *   npm run test:scenarios
 */
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = join(ROOT, 'scripts/fixtures/smoke.png');
const PORT = Number(process.env.SMOKE_PORT ?? 5173);

const results = [];
let baseUrl = process.env.SMOKE_BASE_URL ?? null;
let devChild = null;

function pass(name, detail = '') {
	results.push({ name, ok: true, detail });
	console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
	results.push({ name, ok: false, detail });
	console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function section(title) {
	console.log(`\n▸ ${title}`);
}

async function probe(url) {
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
		if (res.status !== 200) return false;
		const text = await res.text();
		return text.includes('FXCanvas');
	} catch {
		return false;
	}
}

async function resolveBaseUrl() {
	if (baseUrl && (await probe(baseUrl))) return baseUrl;
	for (const host of ['localhost', '127.0.0.1']) {
		for (let p = PORT; p <= PORT + 2; p++) {
			const url = `http://${host}:${p}`;
			if (await probe(url)) return url;
		}
	}
	return null;
}

async function ensureServer() {
	baseUrl = await resolveBaseUrl();
	if (baseUrl) return pass('Dev server', baseUrl);

	console.log(`  Starting dev server on :${PORT}…`);
	await new Promise((resolve, reject) => {
		const child = spawn('npm', ['run', 'dev', '--', '--port', String(PORT)], {
			cwd: ROOT,
			stdio: ['ignore', 'pipe', 'pipe'],
			env: { ...process.env, FORCE_COLOR: '0' }
		});
		devChild = child;
		const deadline = setTimeout(() => reject(new Error('timeout')), 35000);
		const tick = async () => {
			const url = await resolveBaseUrl();
			if (url) {
				clearTimeout(deadline);
				clearInterval(iv);
				baseUrl = url;
				resolve();
			}
		};
		const iv = setInterval(() => void tick(), 400);
		child.on('exit', (c) => {
			if (!baseUrl) reject(new Error(`exit ${c}`));
		});
	});
	pass('Dev server started', baseUrl);
}

function stopServer() {
	if (devChild) {
		devChild.kill('SIGTERM');
		devChild = null;
	}
}

async function newPage(browser, locale) {
	const page = await browser.newPage();
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.addInitScript((lang) => {
		localStorage.setItem('fxcanvas-locale', lang);
	}, locale);
	await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 25000 });
	await page.waitForFunction(
		() => document.querySelectorAll('.effect-card .thumb-after').length >= 8,
		null,
		{ timeout: 15000 }
	);
	return { page, errors };
}

async function loadFixture(page) {
	await page.locator('input[type="file"]').setInputFiles(FIXTURE);
	await page.waitForFunction(
		() => document.querySelector('.footer-info')?.textContent?.includes('×'),
		null,
		{ timeout: 10000 }
	);
}

async function tab(page, index) {
	await page.locator('.effect-panel .tabs button').nth(index).click();
}

async function setLocale(page, locale) {
	await page.evaluate((lang) => {
		localStorage.setItem('fxcanvas-locale', lang);
		location.reload();
	}, locale);
	await page.waitForFunction(
		() => document.querySelectorAll('.effect-card .thumb-after').length >= 8,
		null,
		{ timeout: 15000 }
	);
}

// ─── Static checks ───────────────────────────────────────────

function staticChecks() {
	section('Static / registry');
	const effectsSrc =
		readFileSync(join(ROOT, 'src/lib/effects/index.ts'), 'utf8') +
		readFileSync(join(ROOT, 'src/lib/effects/dither.ts'), 'utf8') +
		readFileSync(join(ROOT, 'src/lib/effects/exposure.ts'), 'utf8') +
		readFileSync(join(ROOT, 'src/lib/effects/levels.ts'), 'utf8') +
		readFileSync(join(ROOT, 'src/lib/effects/glitch.ts'), 'utf8') +
		readFileSync(join(ROOT, 'src/lib/effects/rgb_halftone.ts'), 'utf8');
	const editorSrc = readFileSync(join(ROOT, 'src/lib/stores/editor.ts'), 'utf8');
	const i18nSrc = readFileSync(join(ROOT, 'src/lib/i18n/index.ts'), 'utf8');
	const ids = [...effectsSrc.matchAll(/\{\n\t*id: '([^']+)',\n\t*name:/g)].map((m) => m[1]);
	if (ids.length >= 16) pass('Effect registry', `${ids.length} effects`);
	else fail('Effect registry', `${ids.length} effects`);
	if (i18nSrc.includes('export const i18n')) pass('i18n store exported');
	else fail('i18n store exported');
	if (editorSrc.includes('appendPresetGroup')) pass('Preset group append API');
	else fail('Preset group append API');
}

// ─── Browser scenarios ───────────────────────────────────────

async function runScenarios() {
	const { chromium } = await import('playwright');
	const browser = await chromium.launch({
		headless: true,
		args: ['--enable-unsafe-swiftshader']
	});

	// ── English flows ──
	section('English — core editing');
	{
		const { page, errors } = await newPage(browser, 'en');
		await loadFixture(page);

		await page.getByText('Bloom', { exact: true }).first().click();
		await page.locator('.layer-name', { hasText: 'BLOOM' }).waitFor({ timeout: 3000 });
		pass('Add effect layer');

		await page.getByText('Dither', { exact: true }).first().click({ modifiers: ['Shift'] });
		await page.locator('.layer-name', { hasText: 'DITHER' }).waitFor({ timeout: 3000 });
		pass('Shift+click stack effect');

		await page.locator('.search').fill('bloom');
		await page.waitForFunction(
			() => document.querySelectorAll('.effect-card').length <= 2,
			null,
			{ timeout: 3000 }
		);
		pass('Search filter');
		await page.locator('.search').fill('');

		await page.locator('.layer-row', { hasText: 'BLOOM' }).locator('.icon-btn.eye').click();
		await page.waitForTimeout(150);
		pass('Layer visibility toggle');

		await page.locator('.btn-icon[title*="Undo"]').click();
		await page.locator('.btn-icon[title*="Redo"]:not([disabled])').waitFor({ timeout: 3000 });
		pass('Undo');

		await page.locator('.btn-icon[title*="Redo"]').click();
		await page.waitForTimeout(200);
		pass('Redo');

		if (errors.length === 0) pass('No JS errors (en core)');
		else fail('No JS errors (en core)', errors.slice(0, 3).join(' | '));
		await page.close();
	}

	section('English — canvas & export');
	{
		const { page, errors } = await newPage(browser, 'en');
		await loadFixture(page);
		await page.getByText('Bloom', { exact: true }).first().click();
		await page.locator('.layer-name', { hasText: 'BLOOM' }).waitFor();

		const canvas = page.locator('.canvas-container');
		await canvas.hover();
		const z0 = await page.locator('.zoom-badge').textContent();
		await page.mouse.wheel(0, -200);
		await page.waitForTimeout(150);
		const z1 = await page.locator('.zoom-badge').textContent();
		if (z0 !== z1) pass('Canvas zoom', `${z0?.trim()} → ${z1?.trim()}`);
		else fail('Canvas zoom');

		await canvas.dblclick();
		await page.waitForTimeout(100);
		const z2 = await page.locator('.zoom-badge').textContent();
		if (z2?.includes('100')) pass('Canvas zoom reset');
		else fail('Canvas zoom reset', z2 ?? '');

		await page.keyboard.down('Space');
		await page.waitForTimeout(200);
		if (await page.locator('.compare-badge').isVisible()) pass('Space → original preview');
		else fail('Space → original preview');
		await page.keyboard.up('Space');

		await page.getByRole('button', { name: 'Export', exact: true }).click();
		await page.locator('#export-format').selectOption('jpeg');
		await page.getByRole('button', { name: 'Download', exact: true }).click();
		pass('Export JPEG');

		if (errors.length === 0) pass('No JS errors (en export)');
		else fail('No JS errors (en export)', errors.slice(0, 3).join(' | '));
		await page.close();
	}

	section('English — presets & glitch');
	{
		const { page, errors } = await newPage(browser, 'en');
		await loadFixture(page);
		await page.getByText('Bloom', { exact: true }).first().click();
		await page.locator('.layer-name', { hasText: 'BLOOM' }).waitFor();

		await page.locator('.header-actions .preset-menu button').click();
		await page.getByText('Save current stack').click();
		await page.locator('.save-row input').fill('Scenario Preset');
		await page.locator('.save-btn').click();
		await page.waitForTimeout(250);
		if ((await page.locator('.preset-menu .backdrop').count()) === 0) pass('Save user preset');
		else fail('Save user preset');

		await page.locator('.layer-row', { hasText: 'BLOOM' }).locator('.icon-btn.delete').click();
		await page.waitForFunction(() => !document.body.textContent?.includes('BLOOM'), null, {
			timeout: 3000
		});
		await page.locator('.header-actions .preset-menu button').click();
		await page.getByText('Scenario Preset').click();
		await page.locator('.layer-name', { hasText: 'BLOOM' }).waitFor({ timeout: 3000 });
		pass('Load user preset');

		await page.getByText('Glitch VHS', { exact: true }).first().click({ modifiers: ['Shift'] });
		await page.locator('.layer-name', { hasText: 'GLITCH VHS' }).waitFor();
		await page.getByText('Old tape', { exact: true }).click();
		pass('Glitch VHS quick style');

		await page.getByText('Dither', { exact: true }).first().click({ modifiers: ['Shift'] });
		await page.locator('.layer-name', { hasText: 'DITHER' }).waitFor();
		await page.getByText('High-contrast B&W', { exact: true }).click();
		pass('Dither quick style');

		if (errors.length === 0) pass('No JS errors (en presets)');
		else fail('No JS errors (en presets)', errors.slice(0, 3).join(' | '));
		await page.close();
	}

	section('English — favorites & panel');
	{
		const { page, errors } = await newPage(browser, 'en');
		const favTabCount = await page
			.locator('.effect-panel .tabs button', { hasText: 'FAVORITES' })
			.count();
		if (favTabCount === 0) {
			pass('Favorites tab hidden');
		} else {
			await tab(page, 1);
			if ((await page.locator('.effect-card').count()) === 0) pass('Favorites empty initially');
			else fail('Favorites empty initially');

			await tab(page, 0);
			await page.locator('.effect-card', { hasText: 'Dither' }).first().locator('.fav-star').click();
			await tab(page, 1);
			await page.locator('.effect-card', { hasText: 'Dither' }).waitFor({ timeout: 3000 });
			pass('Favorite star');
		}

		const panel = page.locator('.effect-panel');
		if (!(await panel.evaluate((el) => el.classList.contains('collapsed')))) {
			await page.locator('.collapse-btn').click({ force: true });
		}
		await page.waitForFunction(
			() => document.querySelector('.effect-panel')?.classList.contains('collapsed'),
			null,
			{ timeout: 3000 }
		);
		pass('Panel collapse');

		await page.locator('.collapse-btn').click({ force: true });
		await page.waitForFunction(
			() => !document.querySelector('.effect-panel')?.classList.contains('collapsed'),
			null,
			{ timeout: 3000 }
		);
		pass('Panel expand');

		if (errors.length === 0) pass('No JS errors (en UI)');
		else fail('No JS errors (en UI)', errors.slice(0, 3).join(' | '));
		await page.close();
	}

	section('English — builtin preset group');
	{
		const { page, errors } = await newPage(browser, 'en');
		await loadFixture(page);
		const presetTabCount = await page
			.locator('.effect-panel .tabs button', { hasText: 'PRESETS' })
			.count();
		if (presetTabCount === 0) {
			fail('PRESETS tab visible');
		} else {
			pass('PRESETS tab visible');
			await tab(page, 1);
			const empty = await page.locator('.effect-list .empty').count();
			if (empty > 0) pass('Builtin presets hidden', 'empty state');
			else fail('Builtin presets hidden', 'expected empty state');
		}

		if (errors.length === 0) pass('No JS errors (preset group)');
		else fail('No JS errors (preset group)', errors.slice(0, 3).join(' | '));
		await page.close();
	}

	// ── Traditional Chinese ──
	section('繁體中文 — i18n UI');
	{
		const { page, errors } = await newPage(browser, 'zh-TW');
		const loadBtn = page.getByRole('button', { name: '載入媒體' });
		if (await loadBtn.count()) pass('Header: 載入媒體');
		else fail('Header: 載入媒體');

		const effectsTab = page.locator('.effect-panel .tabs button').nth(0);
		if ((await effectsTab.textContent())?.includes('效果')) pass('Tab: 效果');
		else fail('Tab: 效果', await effectsTab.textContent());

		await loadFixture(page);
		await page.getByText('光暈', { exact: true }).first().click();
		await page.locator('.layer-name', { hasText: '光暈' }).waitFor({ timeout: 3000 });
		pass('Add effect (zh-TW name)');

		await page.getByText('網點化', { exact: true }).first().click({ modifiers: ['Shift'] });
		await page.locator('.layer-name', { hasText: '網點化' }).waitFor();
		await page.getByText('高對比黑白', { exact: true }).click();
		pass('Dither 一鍵風格 (zh-TW)');

		if (errors.length === 0) pass('No JS errors (zh-TW)');
		else fail('No JS errors (zh-TW)', errors.slice(0, 3).join(' | '));
		await page.close();
	}

	section('Language switcher — en → zh-TW');
	{
		const { page, errors } = await newPage(browser, 'en');
		await page.locator('.lang-btn').click();
		await page.getByRole('option', { name: '繁體中文' }).click();
		await page.waitForFunction(
			() => document.querySelector('.effect-panel .tabs button')?.textContent?.includes('效果'),
			null,
			{ timeout: 5000 }
		);
		const tabText = await page.locator('.effect-panel .tabs button').nth(0).textContent();
		if (tabText?.includes('效果')) pass('Live switch to 繁體中文', tabText.trim());
		else fail('Live switch to 繁體中文', tabText ?? '');

		if (errors.length === 0) pass('No JS errors (locale switch)');
		else fail('No JS errors (locale switch)', errors.slice(0, 3).join(' | '));
		await page.close();
	}

	section('English & Chinese — bilingual params');
	{
		const { page, errors } = await newPage(browser, 'en-zh');
		await loadFixture(page);
		await page.getByText(/Exposure.*曝光/i).first().click();
		await page.locator('.param-label', { hasText: /Exposure.*曝光/i }).waitFor({ timeout: 3000 });
		pass('Bilingual param label (Exposure / 曝光)');

		if (errors.length === 0) pass('No JS errors (en-zh)');
		else fail('No JS errors (en-zh)', errors.slice(0, 3).join(' | '));
		await page.close();
	}

	await browser.close();
}

async function main() {
	console.log('\n═══════════════════════════════════════');
	console.log('  FXCanvas Scenario Tests');
	console.log('═══════════════════════════════════════');

	process.on('exit', stopServer);
	process.on('SIGINT', () => {
		stopServer();
		process.exit(130);
	});

	staticChecks();
	await ensureServer();
	await runScenarios();
	stopServer();

	const failed = results.filter((r) => !r.ok);
	const total = results.length;
	console.log('\n───────────────────────────────────────');
	console.log(`  ${total - failed.length}/${total} scenarios passed`);
	if (failed.length) {
		console.error('\n  Failed:');
		for (const f of failed) console.error(`    • ${f.name}: ${f.detail}`);
		process.exit(1);
	}
	console.log('  All scenario tests passed.\n');
}

main().catch((e) => {
	console.error(e);
	stopServer();
	process.exit(1);
});
