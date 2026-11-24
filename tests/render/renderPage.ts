// SPDX-License-Identifier: MIT
// Rendering tests (design 16): the built content script
// (dist/contentScript/markdownItPlugin.js) turns Markdown into HTML in Node,
// loading the engine with require from dist/contentScript/engine/ as in
// Joplin. A window for DOMPurify comes from jsdom (Joplin's renderer process
// has a real one). The HTML is then shown in headless Chrome under the CSP of
// the Joplin 3.7.24 note viewer (design 4.1), with every request outside the
// test's own files blocked and recorded.
import * as fs from 'fs';
import * as path from 'path';
import MarkdownIt from 'markdown-it';
import { Browser, chromium } from 'playwright-core';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports -- built bundle and jsdom are untyped */

export const ROOT = path.join(__dirname, '..', '..');
export const DIST = path.join(ROOT, 'dist', 'contentScript');
const ORIGIN = 'http://render.test';

/** CSP of the Joplin 3.7.24 note viewer (design 4.1). */
export const JOPLIN_CSP = "default-src 'self' ; img-src 'self' blob: data: * ; media-src 'self' blob: data: * ; "
	+ "child-src https://*.youtube.com https://*.youtube-nocookie.com ; object-src 'none' ; form-action 'none' ; style-src 'self' 'unsafe-inline' * data:";

let plugin: any = null;

/** Loads the built content script once, with a jsdom window for DOMPurify. */
function builtPlugin(): any {
	if (plugin) return plugin;
	const { JSDOM } = require('jsdom');
	const dom = new JSDOM('<!doctype html><html><body></body></html>');
	const g = globalThis as any;
	g.window = dom.window;
	g.document = dom.window.document;
	// No canvas in jsdom: zrender estimates text widths (Joplin measures them).
	dom.window.HTMLCanvasElement.prototype.getContext = () => null;
	plugin = require(path.join(DIST, 'markdownItPlugin.js')).default;
	return plugin;
}

export interface MarkdownOptions {
	appearance?: 'light' | 'dark';
	/** Options Joplin passes when it exports a note (PDF, HTML). */
	exporting?: boolean;
	settings?: Record<string, unknown>;
}

/** Markdown -> HTML with the built content script, as Joplin does. */
export function renderMarkdown(markdown: string, opts: MarkdownOptions = {}): string {
	const md = new MarkdownIt();
	const options: Record<string, unknown> = {
		theme: { appearance: opts.appearance || 'light' },
		settingValue: (key: string) => (opts.settings || {})[key],
	};
	if (opts.exporting) options.plainResourceRendering = true;
	builtPlugin()(null).plugin(md, options);
	return md.render(markdown);
}

export function launchBrowser(): Promise<Browser> {
	// The installed Chrome is used (no browser download). DG_CHROME_PATH can
	// point to another Chromium build.
	const executablePath = process.env.DG_CHROME_PATH;
	return chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });
}

export interface ShownBlock {
	svg: boolean;
	/** Displayed width of the SVG in px (0 without one). */
	svgWidth: number;
	error: string;
	notes: string;
	label: string | null;
}

export interface PageRun {
	blocks: ShownBlock[];
	/** Requests to anything but the test's own files. */
	blocked: string[];
	cspViolations: string[];
	pageErrors: string[];
	dialogs: string[];
}

/** Shows `bodyHtml` in Chrome under the Joplin CSP, with the plugin's CSS. */
export async function showInBrowser(browser: Browser, bodyHtml: string, width = 900): Promise<PageRun> {
	const run: PageRun = { blocks: [], blocked: [], cspViolations: [], pageErrors: [], dialogs: [] };
	const html = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${JOPLIN_CSP}">
<link rel="stylesheet" href="/echarts.css"></head><body>${bodyHtml}</body></html>`;
	const context = await browser.newContext({ viewport: { width, height: 800 } });
	try {
		await context.route('**/*', (route) => {
			const url = new URL(route.request().url());
			if (url.origin === ORIGIN) {
				if (url.pathname === '/') return route.fulfill({ status: 200, body: html, contentType: 'text/html; charset=utf-8' });
				if (url.pathname === '/echarts.css') {
					return route.fulfill({ status: 200, body: fs.readFileSync(path.join(DIST, 'echarts.css')), contentType: 'text/css' });
				}
			}
			run.blocked.push(url.href);
			return route.abort();
		});
		const page = await context.newPage();
		page.on('pageerror', (e) => run.pageErrors.push(e.message));
		page.on('dialog', async (d) => {
			run.dialogs.push(d.message());
			await d.dismiss();
		});
		await page.addInitScript(() => {
			document.addEventListener('securitypolicyviolation', (e) => {
				((window as any).__csp = (window as any).__csp || []).push(`${e.violatedDirective} ${e.blockedURI}`);
			});
		});
		await page.goto(`${ORIGIN}/`);
		await page.waitForLoadState('load');
		// Give images and late requests a moment.
		await page.waitForTimeout(300);
		run.blocks = await page.$$eval('.joplin-echarts', (els) => els.map((el) => {
			const svg = el.querySelector('.joplin-echarts-output > svg');
			return {
				svg: !!svg,
				svgWidth: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
				error: (el.querySelector('.joplin-echarts-error') || { textContent: '' }).textContent || '',
				notes: (el.querySelector('.joplin-echarts-notes') || { textContent: '' }).textContent || '',
				label: (el.querySelector('.joplin-echarts-output') as HTMLElement).getAttribute('aria-label'),
			};
		}));
		run.cspViolations = await page.evaluate(() => (window as any).__csp || []);
	} finally {
		await context.close();
	}
	return run;
}
