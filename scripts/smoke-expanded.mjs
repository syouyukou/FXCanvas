#!/usr/bin/env node
/** Expanded smoke — probes flows not covered by smoke-test.mjs */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = join(ROOT, 'scripts/fixtures/smoke.png');
const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:5173';

const results = [];
function pass(n, d = '') { results.push({ ok: true, n, d }); console.log(`✓ ${n}${d ? ` — ${d}` : ''}`); }
function fail(n, d = '') { results.push({ ok: false, n, d }); console.error(`✗ ${n}${d ? ` — ${d}` : ''}`); }

async function main() {
	const { chromium } = await import('playwright');
	const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
	const page = await browser.newPage();
	const pageErrors = [];
	page.on('pageerror', (e) => pageErrors.push(e.message));
	page.on('console', (msg) => {
		if (msg.type() === 'error') pageErrors.push(`console: ${msg.text()}`);
	});

	await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
	await page.waitForFunction(() => document.querySelectorAll('.effect-card .thumb-after').length >= 10, null, { timeout: 15000 });

	await page.locator('input[type="file"]').setInputFiles(FIXTURE);
	await page.waitForFunction(() => document.querySelector('.footer-info')?.textContent?.includes('×'), null, { timeout: 10000 });

	// Undo / Redo
	await page.getByText('Bloom', { exact: true }).first().click();
	await page.locator('.layer-name', { hasText: 'BLOOM' }).waitFor();
	await page.locator('.btn-icon[title*="Undo"]').click();
	await page.waitForFunction(() => !document.body.textContent?.includes('BLOOM'), null, { timeout: 3000 });
	pass('Undo removes layer');
	await page.locator('.btn-icon[title*="Redo"]').click();
	await page.locator('.layer-name', { hasText: 'BLOOM' }).waitFor({ timeout: 3000 });
	pass('Redo restores layer');

	// Canvas zoom
	const canvas = page.locator('.canvas-container');
	await canvas.hover();
	const zoomBefore = await page.locator('.zoom-badge').textContent();
	await page.mouse.wheel(0, -200);
	await page.waitForTimeout(150);
	const zoomAfter = await page.locator('.zoom-badge').textContent();
	if (zoomBefore !== zoomAfter) pass('Canvas wheel zoom', `${zoomBefore?.trim()} → ${zoomAfter?.trim()}`);
	else fail('Canvas wheel zoom', `stuck at ${zoomBefore?.trim()}`);

	await canvas.dblclick();
	await page.waitForTimeout(100);
	const zoomReset = await page.locator('.zoom-badge').textContent();
	if (zoomReset?.includes('100')) pass('Double-click reset zoom');
	else fail('Double-click reset zoom', zoomReset ?? 'missing badge');

	// Export size options
	await page.getByRole('button', { name: 'Export', exact: true }).click();
	await page.locator('#export-size').waitFor({ timeout: 3000 });
	const sizeOptions = await page.locator('#export-size option').allTextContents();
	for (const label of ['2×', '3×']) {
		if (sizeOptions.some((o) => o.includes(label.replace('×', '')) || sizeOptions.join(' ').includes(label))) {
			pass(`Export size option: ${label}`);
		} else {
			fail(`Export size option: ${label}`, sizeOptions.join(', '));
		}
	}
	const footer = await page.locator('.footer-info').textContent();
	const dims = footer?.match(/(\d+)\s×\s(\d+)/);
	const longEdge = dims ? Math.max(Number(dims[1]), Number(dims[2])) : 0;
	if (longEdge >= 480) {
		if (sizeOptions.some((o) => o.includes('1080'))) pass('Export size option: 1080p');
		else fail('Export size option: 1080p', sizeOptions.join(', '));
	} else {
		pass('Export size option: 1080p', 'skipped (fixture too small)');
	}
	await page.keyboard.press('Escape');

	// Presets save/load
	await page.getByRole('button', { name: 'Presets' }).click();
	await page.getByText('Save current stack').click();
	await page.locator('.save-row input').fill('Smoke Preset');
	await page.locator('.save-btn').click();
	await page.waitForTimeout(200);
	const presetBackdrop = await page.locator('.preset-menu .backdrop').count();
	if (presetBackdrop === 0) pass('Preset menu closes after save');
	else fail('Preset menu closes after save', 'backdrop still visible');
	await page.locator('.layer-row', { hasText: 'BLOOM' }).locator('.icon-btn.delete').click();
	await page.waitForFunction(() => !document.body.textContent?.includes('BLOOM'), null, { timeout: 3000 });
	await page.getByRole('button', { name: 'Presets' }).click();
	await page.getByText('Smoke Preset').click();
	await page.locator('.layer-name', { hasText: 'BLOOM' }).waitFor({ timeout: 3000 });
	pass('Preset save and load');

	// Dither 高對比黑白 preset
	await page.getByText('Dither', { exact: true }).first().click({ modifiers: ['Shift'] });
	await page.locator('.layer-name', { hasText: 'DITHER' }).waitFor();
	const ditherPreset = page.getByText('高對比黑白', { exact: true });
	if (await ditherPreset.count()) {
		await ditherPreset.click();
		pass('Dither 高對比黑白 preset');
	} else {
		fail('Dither 高對比黑白 preset', 'button not found');
	}

	// Favorites
	await page.getByRole('button', { name: 'FAVORITES' }).click();
	const favCount = await page.locator('.effect-card').count();
	if (favCount === 0) pass('Favorites tab empty initially');
	else fail('Favorites tab empty initially', `${favCount} cards`);

	await page.getByRole('button', { name: 'EXPLORE' }).click();
	await page.locator('.effect-card', { hasText: 'Bloom' }).first().locator('.fav-star').click();
	await page.getByRole('button', { name: 'FAVORITES' }).click();
	await page.locator('.effect-card', { hasText: 'Bloom' }).waitFor({ timeout: 3000 });
	pass('Favorite star adds to Favorites tab');

	// Space compare
	await page.getByRole('button', { name: 'EXPLORE' }).click();
	await page.keyboard.down('Space');
	await page.waitForTimeout(200);
	const compareVisible = await page.locator('.compare-badge').isVisible();
	await page.keyboard.up('Space');
	if (compareVisible) pass('Space compare shows ORIGINAL badge');
	else fail('Space compare shows ORIGINAL badge');

	// Render all effects without crash
	const effectCards = await page.locator('.effect-card .card-name').allTextContents();
	let renderFails = [];
	for (const name of effectCards.slice(0, 8)) {
		const before = pageErrors.length;
		await page.getByRole('button', { name: 'EXPLORE' }).click().catch(() => {});
		await page.locator('.search').fill('');
		await page.getByText(name.trim(), { exact: true }).first().click({ modifiers: ['Shift'] });
		await page.waitForTimeout(250);
		if (pageErrors.length > before) renderFails.push(name);
	}
	if (renderFails.length === 0) pass('Shift+click render sample effects', `${Math.min(8, effectCards.length)} tested`);
	else fail('Shift+click render sample effects', renderFails.join(', '));

	if (pageErrors.length === 0) pass('No page JS errors');
	else fail('No page JS errors', [...new Set(pageErrors)].slice(0, 5).join(' | '));

	await browser.close();

	const failed = results.filter((r) => !r.ok);
	console.log(`\n${results.length - failed.length}/${results.length} expanded passed`);
	if (failed.length) process.exit(1);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
