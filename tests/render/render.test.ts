// SPDX-License-Identifier: MIT
// Rendering tests in headless Chrome (design 16). Run with `npm run test:render`,
// which builds the plugin first.
import * as fs from 'fs';
import * as path from 'path';
import { Browser } from 'playwright-core';
import { launchBrowser, PageRun, renderMarkdown, ROOT, showInBrowser } from './renderPage';

const NOTE = fs.readFileSync(path.join(ROOT, 'tests', 'manual', 'mvp-note.md'), 'utf8');

/** Expectations of the note's ECharts blocks, from the [tags] of its headings. */
function expectations(): { heading: string; chart: boolean; error: boolean; note: boolean }[] {
	const out = [];
	const parts = NOTE.split(/^## /m).slice(1);
	for (const part of parts) {
		const heading = part.split('\n')[0];
		if (!/```echarts/.test(part)) continue;
		out.push({ heading, chart: heading.includes('[chart]'), error: heading.includes('[error]'), note: heading.includes('[note]') });
	}
	return out;
}

let browser: Browser;

beforeAll(async () => {
	browser = await launchBrowser();
});

afterAll(async () => {
	if (browser) await browser.close();
});

function expectClean(run: PageRun): void {
	expect(run.blocked).toEqual([]);
	expect(run.cspViolations).toEqual([]);
	expect(run.pageErrors).toEqual([]);
	expect(run.dialogs).toEqual([]);
}

describe('the MVP test note', () => {
	const expected = expectations();

	test.each([
		['light page', { appearance: 'light' as const }],
		['dark page', { appearance: 'dark' as const }],
		['PDF/HTML export', { exporting: true }],
	])('%s: every block shows what its heading says, without any request', async (_name, opts) => {
		const html = renderMarkdown(NOTE, opts);
		const run = await showInBrowser(browser, html);
		expectClean(run);
		expect(run.blocks).toHaveLength(expected.length);
		run.blocks.forEach((block, i) => {
			const e = expected[i];
			expect({ heading: e.heading, chart: block.svg, error: block.error !== '', note: block.notes !== '' })
				.toEqual({ heading: e.heading, chart: e.chart, error: e.error, note: e.note });
		});
		// The ordinary JSON block stays a code block.
		expect(html).toContain('<code class="language-json">');
	});

	test('the JSON syntax error names line 3', async () => {
		const run = await showInBrowser(browser, renderMarkdown(NOTE));
		const i = expected.findIndex((e) => e.heading.startsWith('15.'));
		expect(run.blocks[i].error).toContain('Line 3');
	});
});

describe('width (D-12)', () => {
	const chart = (info: string) => `\`\`\`echarts ${info}\n{"xAxis": {"type": "category", "data": ["a"]}, "yAxis": {}, "series": [{"type": "bar", "data": [1]}]}\n\`\`\`\n`;

	test('drawn at the setting width, never stretched; shrinks in a narrow pane', async () => {
		const html = renderMarkdown(chart('') + chart('width=400') + chart('width=1600'));
		const wide = await showInBrowser(browser, html, 1400);
		expect(wide.blocks.map((b) => b.svgWidth)).toEqual([800, 400, expect.any(Number)]);
		expect(wide.blocks[2].svgWidth).toBeLessThan(1400);
		const narrow = await showInBrowser(browser, html, 500);
		for (const b of narrow.blocks) expect(b.svgWidth).toBeLessThanOrEqual(500);
		expect(narrow.blocks[1].svgWidth).toBe(400);
	});
});

describe('security (design 12)', () => {
	test('the recorder sees an external image (the check itself works)', async () => {
		const run = await showInBrowser(browser, '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/x.png" width="10" height="10"/></svg>');
		expect(run.blocked).toEqual(['https://example.com/x.png']);
	});

	test('the recorder sees a CSS url() in fill (the check itself works)', async () => {
		const run = await showInBrowser(browser, '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(https://example.com/f.png)" width="10" height="10"/></svg>');
		expect(run.blocked).toEqual(['https://example.com/f.png']);
	});

	test('url() in colours and CSS in emphasis colours make no request (1.0.1)', async () => {
		const option = {
			backgroundColor: 'url(https://example.com/bg.png)',
			title: { text: 'T', textStyle: { color: 'url(https://example.com/t.png)' } },
			xAxis: { type: 'category', data: ['a', 'b'] }, yAxis: {},
			series: [
				{ type: 'bar', data: [1, 2], itemStyle: { color: 'url(https://example.com/c.png)', borderColor: 'url(https://example.com/b.png)', borderWidth: 2 } },
				{ type: 'bar', data: [2, 1], emphasis: { itemStyle: { color: 'red;}svg{background-image:image-set("https://example.com/i.png" 1x)}.a{fill:red' } } },
			],
		};
		const run = await showInBrowser(browser, renderMarkdown(`\`\`\`echarts\n${JSON.stringify(option)}\n\`\`\`\n`));
		expectClean(run);
		expect(run.blocks[0].svg).toBe(true);
	});

	test('the 1.0.1 manual test note: charts, the error on line 4, no request', async () => {
		const note = fs.readFileSync(path.join(ROOT, 'tests', 'manual', 'release-1.0.1-note.md'), 'utf8');
		const run = await showInBrowser(browser, renderMarkdown(note));
		expectClean(run);
		expect(run.blocks.map((b) => b.svg)).toEqual([true, true, true, true, false]);
		expect(run.blocks[4].error).toContain('Line 4');
	});

	test('images in many places make no request', async () => {
		const option = {
			backgroundColor: { image: 'https://example.com/bg.png', repeat: 'repeat' },
			graphic: [{ type: 'image', style: { image: 'https://example.com/g.png', width: 10, height: 10 } }],
			legend: { data: [{ name: 's', icon: 'image://https://example.com/l.png' }] },
			xAxis: { type: 'category', data: ['a'] }, yAxis: {},
			series: [{ name: 's', type: 'pictorialBar', symbol: 'image://https://example.com/p.png', data: [1] }],
		};
		const run = await showInBrowser(browser, renderMarkdown(`\`\`\`echarts\n${JSON.stringify(option)}\n\`\`\`\n`));
		expectClean(run);
		expect(run.blocks[0].svg).toBe(true);
		expect(run.blocks[0].notes).toContain('Images are not shown');
	});
});
