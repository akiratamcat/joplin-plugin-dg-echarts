// SPDX-License-Identifier: MIT
// node scripts/icons.mjs: makes icons/icon-16.png, -32, -48 and -128 from
// icons/icon.svg (an original pie chart motif, not the ECharts logo), by
// drawing the SVG in the installed Google Chrome (playwright-core, as the
// rendering tests). Run it after changing icons/icon.svg.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SIZES = [16, 32, 48, 128];

const svg = fs.readFileSync(path.join(ROOT, 'icons', 'icon.svg'), 'utf8');
const executablePath = process.env.DG_CHROME_PATH;
const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });
try {
	for (const size of SIZES) {
		const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
		const sized = svg.replace('width="128" height="128"', `width="${size}" height="${size}"`);
		await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${sized}</body></html>`);
		const file = path.join(ROOT, 'icons', `icon-${size}.png`);
		await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
		await page.close();
		console.log(`${path.relative(ROOT, file)} written`);
	}
} finally {
	await browser.close();
}
