/** @jest-environment jsdom */
import MarkdownIt from 'markdown-it';
import { LruCache } from '../src/contentScript/cache';
import plugin, { BlockOutput, chartLabel, errorBox, renderFence } from '../src/contentScript/markdownItPlugin';
import { PluginOptions } from '../src/contentScript/renderConfig';
import { cleanStyle, hasExternalUrl, isChartCss, isSafeCssValue } from '../src/contentScript/sanitize';
import { KEYS } from '../src/shared/settingKeys';
import { quietCanvas, vendorEngine } from './helpers/engine';

quietCanvas();
const engine = vendorEngine();

function options(values: Record<string, unknown> = {}, appearance = 'light', exporting = false): PluginOptions {
	const o: PluginOptions = { settingValue: (key) => values[key], theme: { appearance } };
	if (exporting) o.plainResourceRendering = true;
	return o;
}

function fence(content: string, info = 'echarts', markup = '```') {
	return { info, markup, content };
}

function render(content: string, info = 'echarts', opts: PluginOptions = options()): string {
	return renderFence(fence(content, info), opts, engine, new LruCache<BlockOutput>(10));
}

function dom(html: string): HTMLElement {
	const div = document.createElement('div');
	div.innerHTML = html;
	return div;
}

const BAR = '{\n  "title": { "text": "Sales" },\n  "xAxis": { "type": "category", "data": ["a", "b"] },\n  "yAxis": {},\n  "series": [{ "type": "bar", "data": [1, 2] }]\n}\n';

describe('block HTML (design 7.1)', () => {
	test('joplin-editable with the source and the SVG', () => {
		const root = dom(render(BAR, 'echarts height=300'));
		const block = root.querySelector('.joplin-editable.joplin-echarts') as HTMLElement;
		expect(block).not.toBeNull();
		expect(block.dataset.echartsTheme).toBe('light');
		const pre = block.querySelector('pre.joplin-source') as HTMLElement;
		expect(pre.textContent).toBe(BAR.replace(/\n$/, ''));
		expect(pre.getAttribute('data-joplin-language')).toBe('echarts height=300');
		expect(pre.getAttribute('data-joplin-source-open')).toBe('```echarts height=300\n');
		expect(pre.getAttribute('data-joplin-source-close')).toBe('\n```');
		const output = block.querySelector('.joplin-echarts-output') as HTMLElement;
		expect(output.getAttribute('role')).toBe('figure');
		expect(output.getAttribute('aria-label')).toBe('ECharts chart: Sales');
		const svg = output.querySelector('svg') as SVGElement;
		expect(svg.getAttribute('viewBox')).toBe('0 0 800 300');
		expect(block.querySelector('.joplin-echarts-notes')).toBeNull();
	});

	test('YAML input', () => {
		const root = dom(render('xAxis: { type: category, data: [a, b] }\nyAxis: {}\nseries:\n  - type: line\n    data: [1, 2]\n'));
		expect(root.querySelector('.joplin-echarts-output svg')).not.toBeNull();
	});

	test('align and width options', () => {
		const root = dom(render(BAR, 'echarts align=right width=400'));
		expect(root.querySelector('.joplin-echarts-align-right')).not.toBeNull();
		expect(root.querySelector('svg')!.getAttribute('style')).toContain('max-width:400px');
	});
});

describe('errors and notes (design 7.4)', () => {
	test('a syntax error shows the line and an excerpt', () => {
		const root = dom(render('{\n  "a": 1,,\n  "b": 2\n}'));
		const box = root.querySelector('.joplin-echarts-error') as HTMLElement;
		expect(box.querySelector('.joplin-echarts-error-message')!.textContent).toMatch(/^JSON syntax error: /);
		expect(box.querySelector('.joplin-echarts-error-line')!.textContent).toBe('Line 2');
		expect(box.querySelector('mark')!.textContent).toBe('2 |   "a": 1,,');
		expect(root.querySelector('svg')).toBeNull();
	});

	test('a map is refused', () => {
		expect(dom(render('{"geo": {}, "series": []}')).querySelector('.joplin-echarts-error')!.textContent).toContain('Maps');
	});

	test('missing axes are an error, not an engine crash', () => {
		const text = dom(render('{"series": [{"type": "bar", "data": [1]}]}')).querySelector('.joplin-echarts-error')!.textContent;
		expect(text).toContain('xAxis and yAxis');
	});

	test('an unknown series type gives a note, not an empty chart', () => {
		const root = dom(render('{"series": [{"type": "nosuchchart"}]}'));
		expect(root.querySelector('svg')).toBeNull();
		const notes = Array.from(root.querySelectorAll('.joplin-echarts-note')).map((n) => n.textContent);
		expect(notes.join('\n')).toContain('nosuchchart');
		expect(notes.join('\n')).toContain('nothing to draw');
	});

	test('removed images give a note', () => {
		const root = dom(render('{"xAxis": {"type": "category", "data": ["a"]}, "yAxis": {}, "series": [{"type": "scatter", "symbol": "image://https://example.com/x.png", "data": [1]}]}'));
		expect(root.querySelector('svg')).not.toBeNull();
		expect(root.querySelector('.joplin-echarts-note')!.textContent).toContain('Images are not shown');
		// The source keeps the URL; the chart does not.
		expect(root.querySelector('.joplin-echarts-output')!.innerHTML).not.toContain('example.com');
	});

	test('error box helper escapes and marks the line', () => {
		const html = errorBox('<b>bad</b>', 'a\n<script>\nc', 2);
		expect(html).toContain('&lt;b&gt;bad&lt;/b&gt;');
		expect(html).toContain('<mark>2 | &lt;script&gt;</mark>');
		expect(errorBox('x')).not.toContain('Line');
	});

	test('chart label', () => {
		expect(chartLabel(null)).toBe('ECharts chart');
		expect(chartLabel({ title: [{ text: ' A ' }] })).toBe('ECharts chart: A');
		expect(chartLabel({ title: { text: 3 } })).toBe('ECharts chart');
	});
});

describe('security (design 12)', () => {
	test('HTML in the input is plain text in the SVG', () => {
		const root = dom(render('{"title": {"text": "<img src=x onerror=alert(1)>"}, "xAxis": {"type": "category", "data": ["<script>alert(2)</script>"]}, "yAxis": {}, "series": [{"type": "bar", "data": [1]}]}'));
		expect(root.querySelector('img')).toBeNull();
		expect(root.querySelector('script')).toBeNull();
		expect(root.querySelector('svg')!.textContent).toContain('<img src=x onerror=alert(1)>');
		expect(root.querySelector('[onerror]')).toBeNull();
	});

	test('external url() in colours becomes "none"; url(#id) of gradients and clips stays (1.0.1)', () => {
		const option = {
			backgroundColor: 'url(https://example.com/bg.png)',
			title: { text: 'T', textStyle: { color: 'url(https://example.com/t.png)' } },
			xAxis: { type: 'category', data: ['a'] }, yAxis: {},
			series: [
				{ type: 'bar', data: [1], itemStyle: { color: 'url(https://example.com/c.png)', borderColor: "url( '//example.com/b.png' )", borderWidth: 2 } },
				{ type: 'line', data: [1], areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'red' }, { offset: 1, color: 'blue' }] } } },
			],
		};
		// The source is kept in the block for editing; only the SVG is shown.
		const html = dom(render(JSON.stringify(option))).querySelector('svg')!.outerHTML;
		expect(html).not.toContain('example.com');
		expect(html).toContain('fill="none"');
		expect(html).toContain('stroke="none"');
		expect(html).toMatch(/fill="url\(#zr\d+-g\d+\)"/);
		expect(html).toMatch(/clip-path="url\(#zr\d+-c\d+\)"/);
	});

	test('the hover <style> is kept, unless an emphasis colour adds CSS or a url() (1.0.1)', () => {
		const chart = (emphasis: Record<string, unknown>) => {
			const style = dom(render(JSON.stringify({ xAxis: { type: 'category', data: ['a'] }, yAxis: {}, series: [{ type: 'bar', data: [1], emphasis }] }))).querySelector('style');
			return style ? style.textContent ?? '' : null;
		};
		expect(chart({ itemStyle: { color: '#123456' } })).toContain('fill:#123456;');
		const injected = chart({ itemStyle: { color: 'red;}svg{background-image:image-set("https://example.com/i.png" 1x)}.a{fill:red' } });
		expect(injected).toBe('');
		expect(chart({ itemStyle: { borderColor: 'url(https://example.com/e.png)' } })).toBe('');
	});

	test('CSS added to a font option is removed from the style attribute; the font stays (1.0.2)', () => {
		const inj = "sans-serif;mask-image:image-set('https://example.com/m.png' 1x)";
		const option = (font: Record<string, string>) => JSON.stringify({ title: { text: 'T', textStyle: font }, xAxis: { type: 'category', data: ['a'] }, yAxis: {}, series: [{ type: 'bar', data: [1] }] });
		const fonts: Record<string, string>[] = [{ fontFamily: inj }, { fontWeight: inj }, { fontStyle: inj }];
		for (const font of fonts) {
			const svg = dom(render(option(font))).querySelector('svg')!.outerHTML;
			expect(svg).not.toContain('example.com');
			expect(svg).not.toContain('mask-image');
		}
		const title = [...dom(render(option({ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 'bold' }))).querySelectorAll('text')].find((t) => t.textContent === 'T')!;
		expect(title.getAttribute('style')).toContain("font-family:'Noto Sans JP', sans-serif");
		expect(title.getAttribute('style')).toContain('font-weight:bold');
	});

	test('isSafeCssValue and cleanStyle', () => {
		expect(isSafeCssValue('rgba(0,0,0,0.5)')).toBe(true);
		expect(isSafeCssValue('animation:zr0-ani-0 1s cubic-bezier(0.65,0,0.35,1) both;')).toBe(true);
		expect(isSafeCssValue('url(#zr0-g0)')).toBe(true);
		expect(isSafeCssValue("image-set('https://x' 1x)")).toBe(false);
		expect(isSafeCssValue("-webkit-image-set('x' 1x)")).toBe(false);
		expect(isSafeCssValue("image('x')")).toBe(false);
		expect(isSafeCssValue('(x)')).toBe(false);
		expect(isSafeCssValue('url(https://x)')).toBe(false);
		expect(isSafeCssValue(String.raw`image-set\28 'x' 1x)`)).toBe(false);
		expect(cleanStyle('font-size:12px;font-family:sans-serif;mask-image:image-set(\'x\' 1x);cursor:image-set(\'y\' 1x),auto')).toBe('font-size:12px;font-family:sans-serif');
		expect(cleanStyle('mask-image:image-set(\'x\' 1x)')).toBe('');
	});

	test('hasExternalUrl', () => {
		expect(hasExternalUrl('url(#zr0-g0)')).toBe(false);
		expect(hasExternalUrl('url( "#clip0" )')).toBe(false);
		expect(hasExternalUrl('red')).toBe(false);
		expect(hasExternalUrl('url(https://x)')).toBe(true);
		expect(hasExternalUrl('URL(data:image/png;base64,AAA)')).toBe(true);
		expect(hasExternalUrl('url(#a) url(x.png)')).toBe(true);
		expect(hasExternalUrl(String.raw`u\72 l(https://x)`)).toBe(true);
		expect(hasExternalUrl('u/**/rl(x)')).toBe(true);
	});

	test('isChartCss', () => {
		const css = '\n.zr0-cls-1 {\nanimation:zr0-ani-0 1s cubic-bezier(0.65,0,0.35,1) both;\n}\n.zr0-cls-2:hover {\ncursor:pointer;\nfill:url(#zr0-g1);\n}\n'
			+ '@keyframes zr0-ani-0 {\n0% {\nd:path("M106.5 220l207 0l0 0l-207 0Z");\n}\n}\n';
		expect(isChartCss(css)).toBe(true);
		expect(isChartCss('.zr0-cls-2:hover {\nfill:red;}svg{fill:blue;\n}')).toBe(false);
		expect(isChartCss('.zr0-cls-2:hover {\nfill:red;\n}\nsvg {\nfill:blue;\n}')).toBe(false);
		expect(isChartCss('.zr0-cls-2:hover {\nbackground:image-set("https://x" 1x);\n}')).toBe(false);
		expect(isChartCss('.zr0-cls-2:hover {\nfill:url(https://x);\n}')).toBe(false);
		expect(isChartCss('@import "https://x";')).toBe(false);
		// A function that loads a file without quotes or url() (1.0.2).
		expect(isChartCss('.zr0-cls-2:hover {\ncursor:-webkit-image-set(x 1x),auto;\n}')).toBe(false);
		expect(isChartCss('.zr0-cls-2:hover {\nfill:rgba(0,0,0,1);\n}')).toBe(true);
	});

	test('tooltip and toolbox are removed without a note', () => {
		const root = dom(render('{"tooltip": {"formatter": "<b>x</b>"}, "toolbox": {"feature": {"saveAsImage": {}}}, "xAxis": {"type": "category", "data": ["a"]}, "yAxis": {}, "series": [{"type": "bar", "data": [1]}]}'));
		expect(root.querySelector('svg')).not.toBeNull();
		expect(root.querySelector('.joplin-echarts-notes')).toBeNull();
	});
});

describe('settings and cache (design 7.2)', () => {
	test('the dark page draws a dark chart; theme=light on a dark page paints white', () => {
		const dark = dom(render(BAR, 'echarts', options({}, 'dark')));
		expect((dark.querySelector('.joplin-echarts') as HTMLElement).dataset.echartsTheme).toBe('dark');
		const light = render(BAR, 'echarts theme=light', options({}, 'dark'));
		expect(light).toContain('fill="#ffffff"');
	});

	test('the cache returns the same output and is keyed by the settings', () => {
		const store = new LruCache<BlockOutput>(10);
		const a = renderFence(fence(BAR), options(), engine, store);
		expect(store.size).toBe(1);
		expect(renderFence(fence(BAR), options(), engine, store)).toBe(a);
		expect(store.size).toBe(1);
		renderFence(fence(BAR), options({ [KEYS.chartWidth]: 500 }), engine, store);
		expect(store.size).toBe(2);
		renderFence(fence(BAR), options({}, 'light', true), engine, store);
		expect(store.size).toBe(3);
	});

	test('the cache size setting is applied', () => {
		const store = new LruCache<BlockOutput>(10);
		const o = options({ [KEYS.cacheSize]: 1 });
		renderFence(fence(BAR), o, engine, store);
		renderFence(fence(BAR, 'echarts height=200'), o, engine, store);
		expect(store.size).toBe(1);
	});

	test('font size settings reach the SVG (design 8.7)', () => {
		const sizes = (html: string) => [...html.matchAll(/font-size:([\d.]+)px/g)].map((m) => Number(m[1]));
		expect(Math.min(...sizes(render(BAR)))).toBe(12);
		expect(Math.min(...sizes(render(BAR, 'echarts', options({ [KEYS.minFontSizePx]: 15 }))))).toBe(15);
		const noteFont: PluginOptions = { ...options({ [KEYS.matchNoteFontSize]: true }), theme: { appearance: 'light', noteViewerFontSize: 20 } };
		expect(Math.min(...sizes(render(BAR, 'echarts', noteFont)))).toBe(20);
	});

	test('the source size limit', () => {
		const html = render(BAR, 'echarts', options({ [KEYS.maxSourceLength]: 1000 }));
		expect(html).toContain('<svg');
		const big = `{"title": {"text": "${'x'.repeat(2000)}"}, "series": []}`;
		expect(render(big, 'echarts', options({ [KEYS.maxSourceLength]: 1000 }))).toContain('too large');
	});
});

describe('Markdown-it plugin', () => {
	function md(opts: PluginOptions = options()): MarkdownIt {
		const m = new MarkdownIt();
		plugin(null).plugin(m, opts);
		return m;
	}

	test('ECharts fences are drawn, other fences are not', () => {
		const html = md().render(`\`\`\`echarts\n${BAR}\`\`\`\n\n\`\`\`json\n{"a": 1}\n\`\`\`\n`);
		expect(html.match(/joplin-echarts-output/g)).toHaveLength(1);
		expect(html).toContain('<code class="language-json">');
	});

	test('aliases from the settings', () => {
		const html = md(options({ [KEYS.fenceAliases]: 'json' })).render(`\`\`\`json\n${BAR}\`\`\`\n`);
		expect(html).toContain('joplin-echarts-output');
	});

	test('assets: the CSS and the viewer script (toolbar only; charts need no script)', () => {
		expect(plugin(null).assets()).toEqual([{ name: 'echarts.css' }, { name: 'viewer.js' }]);
	});

	test('the toolbar attributes (design 11)', () => {
		const ok = dom(render(BAR, 'echarts', { ...options(), settingValue: (k: string) => (k === KEYS.locale ? 'ja_JP' : undefined) }));
		const block = ok.querySelector('.joplin-echarts') as HTMLElement;
		expect(block.dataset.echartsToolbar).toBe('1');
		expect(block.dataset.echartsLang).toBe('ja');
		// Off by the setting, and never on an error box.
		expect((dom(render(BAR, 'echarts', options({ [KEYS.showToolbar]: false }))).querySelector('.joplin-echarts') as HTMLElement).dataset.echartsToolbar).toBeUndefined();
		expect((dom(render('[1]')).querySelector('.joplin-echarts') as HTMLElement).dataset.echartsToolbar).toBeUndefined();
	});
});
