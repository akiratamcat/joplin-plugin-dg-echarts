// SPDX-License-Identifier: MIT
// The built viewer script in headless Chrome (design 11): the toolbar appears,
// and its buttons send the main script an SVG with a fixed size, a real PNG
// and the source. A fake webviewApi records the messages, as Joplin's would
// pass them to the main script.
import * as fs from 'fs';
import * as path from 'path';
import { Browser, Page } from 'playwright-core';
import { DIST, JOPLIN_CSP, launchBrowser, renderMarkdown } from './renderPage';

const ORIGIN = 'http://render.test';
const CHART = '```echarts\n{"xAxis": {"type": "category", "data": ["a", "b"]}, "yAxis": {}, "series": [{"type": "bar", "data": [1, 2]}]}\n```\n';

let browser: Browser;

beforeAll(async () => {
	browser = await launchBrowser();
});

afterAll(async () => {
	if (browser) await browser.close();
});

async function open(body: string, withApi: boolean): Promise<{ page: Page; blocked: string[]; close: () => Promise<void> }> {
	const blocked: string[] = [];
	const html = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${JOPLIN_CSP}">
<link rel="stylesheet" href="/echarts.css"></head><body>${body}<script src="/viewer.js"></script></body></html>`;
	const context = await browser.newContext({ viewport: { width: 1000, height: 700 } });
	await context.route('**/*', (route) => {
		const url = new URL(route.request().url());
		if (url.origin === ORIGIN) {
			if (url.pathname === '/') return route.fulfill({ status: 200, body: html, contentType: 'text/html; charset=utf-8' });
			const file = { '/viewer.js': 'viewer.js', '/echarts.css': 'echarts.css' }[url.pathname];
			if (file) return route.fulfill({ status: 200, body: fs.readFileSync(path.join(DIST, file)), contentType: file.endsWith('.js') ? 'text/javascript' : 'text/css' });
		}
		blocked.push(url.href);
		return route.abort();
	});
	if (withApi) {
		await context.addInitScript(() => {
			const w = window as unknown as { __messages: unknown[]; webviewApi: unknown };
			w.__messages = [];
			// No async functions in code that runs in the page: TypeScript would turn
			// them into calls to a helper (__awaiter) that the page does not have.
			w.webviewApi = { postMessage: (id: string, message: unknown) => { w.__messages.push({ id, message }); return Promise.resolve({ ok: true }); } };
		});
	}
	const page = await context.newPage();
	await page.goto(`${ORIGIN}/`);
	return { page, blocked, close: () => context.close() };
}

describe('toolbar in the note viewer (design 11)', () => {
	test('buttons send an SVG, a PNG and the source to the main script', async () => {
		const { page, blocked, close } = await open(renderMarkdown(CHART, { settings: { 'echarts.locale': 'ja_JP' } }), true);
		try {
			await page.waitForSelector('.joplin-echarts-toolbar');
			expect(await page.getAttribute('.joplin-echarts-tool-copy-svg', 'aria-label')).toBe('SVG をコピー');
			await page.hover('.joplin-echarts-output svg');
			for (const id of ['copy-svg', 'copy-png', 'save-svg', 'copy-source']) await page.click(`.joplin-echarts-tool-${id}`);
			await page.waitForFunction(() => (window as unknown as { __messages: unknown[] }).__messages.length >= 4);
			const messages = await page.evaluate(() => (window as unknown as { __messages: { id: string; message: Record<string, unknown> }[] }).__messages);
			expect(messages.every((m) => m.id === 'dgEchartsMarkdownIt')).toBe(true);
			const byType = (type: string, what?: string) => messages.find((m) => m.message.type === type && (!what || m.message.what === what))!.message;
			const svg = byType('copyText', 'svg').text as string;
			expect(svg).toMatch(/^<svg height="400" width="800" xmlns="http:\/\/www.w3.org\/2000\/svg"/);
			expect(svg).not.toContain('max-width');
			expect(byType('copyImage').dataUrl).toMatch(/^data:image\/png;base64,/);
			expect(byType('saveFile')).toMatchObject({ kind: 'svg', index: 1 });
			expect(byType('copyText', 'source').text).toContain('"type": "bar"');
			// The PNG is 2x the chart's size.
			const size = await page.evaluate((url) => {
				const img = new Image();
				img.src = url as string;
				return img.decode().then(() => [img.naturalWidth, img.naturalHeight]);
			}, byType('copyImage').dataUrl);
			expect(size).toEqual([1600, 800]);
			expect(blocked).toEqual([]);
		} finally {
			await close();
		}
	});

	test('no toolbar in an exported page (no main script), or when the setting is off', async () => {
		const exported = await open(renderMarkdown(CHART), false);
		try {
			await exported.page.waitForTimeout(300);
			expect(await exported.page.$('.joplin-echarts-toolbar')).toBeNull();
		} finally {
			await exported.close();
		}
		const off = await open(renderMarkdown(CHART, { settings: { 'echarts.showToolbar': false } }), true);
		try {
			await off.page.waitForTimeout(300);
			expect(await off.page.$('.joplin-echarts-toolbar')).toBeNull();
		} finally {
			await off.close();
		}
	});
});
