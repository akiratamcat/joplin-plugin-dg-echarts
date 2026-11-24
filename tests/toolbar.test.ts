/** @jest-environment jsdom */
// Toolbar and image helpers of the viewer script (design 11).
import { standaloneSvg, svgStringSize } from '../src/contentScript/image';
import { ChartActions } from '../src/contentScript/toolbar';
import { addToolbars } from '../src/contentScript/viewer';

const SVG = '<svg style="display:block;width:100%;max-width:400px;height:auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="10" height="10"></rect></svg>';

function block(attrs: string, output = SVG): string {
	return `<div class="joplin-editable joplin-echarts" ${attrs}><pre class="joplin-source">{"a": 1}</pre><div class="joplin-echarts-output">${output}</div></div>`;
}

function recorder() {
	const log: unknown[][] = [];
	const actions: ChartActions = {
		copyText: (...a) => log.push(['copyText', ...a]),
		copyImage: (...a) => log.push(['copyImage', ...a]),
		saveSvg: (...a) => log.push(['saveSvg', ...a]),
		savePng: (...a) => log.push(['savePng', ...a]),
	};
	return { log, actions };
}

describe('image helpers', () => {
	test('size from the viewBox', () => {
		expect(svgStringSize(SVG)).toEqual({ width: 400, height: 300 });
		expect(svgStringSize('<svg width="10" height="20"></svg>')).toEqual({ width: 10, height: 20 });
		expect(svgStringSize('<div></div>')).toBeNull();
	});

	test('a standalone SVG has a fixed size instead of the page-width style', () => {
		expect(standaloneSvg(SVG, { width: 400, height: 300 }))
			.toBe('<svg height="300" width="400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="10" height="10"></rect></svg>');
	});
});

describe('addToolbars', () => {
	test('a toolbar with five labelled buttons, in the language of the block', () => {
		document.body.innerHTML = block('data-echarts-toolbar="1" data-echarts-lang="ja" data-echarts-theme="dark"');
		const { log, actions } = recorder();
		expect(addToolbars(document, actions)).toBe(1);
		const bar = document.querySelector('.joplin-echarts > .joplin-echarts-toolbar') as HTMLElement;
		expect(bar.getAttribute('role')).toBe('toolbar');
		const buttons = Array.from(bar.querySelectorAll('button'));
		expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['SVG をコピー', 'PNG をコピー', 'SVG を保存', 'PNG を保存', 'グラフのソースをコピー']);
		buttons.forEach((b) => b.click());
		expect(log.map((e) => e[0])).toEqual(['copyText', 'copyImage', 'saveSvg', 'savePng', 'copyText']);
		// The PNG of a dark chart gets a dark background; the source is the block's text.
		expect(log[1][2]).toBe(true);
		expect(log[4]).toEqual(['copyText', '{"a": 1}', 'source']);
		expect(log[2][2]).toBe(1);
	});

	test('only once, and not for blocks without the attribute or without a chart', () => {
		document.body.innerHTML = block('data-echarts-toolbar="1"') + block('') + block('data-echarts-toolbar="1"', '<div class="joplin-echarts-error">x</div>');
		const { actions } = recorder();
		expect(addToolbars(document, actions)).toBe(1);
		expect(addToolbars(document, actions)).toBe(0);
		expect(document.querySelectorAll('.joplin-echarts-toolbar')).toHaveLength(1);
	});

	test('the index counts the charts of the note', () => {
		document.body.innerHTML = block('data-echarts-toolbar="1"') + block('data-echarts-toolbar="1"');
		const { log, actions } = recorder();
		addToolbars(document, actions);
		(document.querySelectorAll('.joplin-echarts-tool-save-svg')[1] as HTMLElement).click();
		expect(log[0][2]).toBe(2);
	});
});
