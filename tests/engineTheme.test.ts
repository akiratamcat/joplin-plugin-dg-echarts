import { adjustOption, DARK_SPLIT_LINE_COLOR } from '../src/contentScript/engineTheme';
import { RenderConfig } from '../src/contentScript/renderConfig';
import { vendorEngine } from './helpers/engine';

const LIGHT: RenderConfig = { theme: 'light', background: 'transparent', width: 400, height: 300, align: 'center', locale: 'EN', exporting: false, fontSizes: { base: null, min: 0 }, toolbar: true };
const DARK: RenderConfig = { ...LIGHT, theme: 'dark' };
const EXPORT: RenderConfig = { ...LIGHT, exporting: true };

type Obj = Record<string, unknown>;

describe('adjustOption', () => {
	test('animation off, background (design 8.5)', () => {
		expect(adjustOption({}, LIGHT)).toEqual({ animation: false, backgroundColor: 'transparent' });
		expect(adjustOption({}, { ...LIGHT, background: null })).toEqual({ animation: false });
		// The user's background wins.
		expect(adjustOption({ backgroundColor: '#123' }, LIGHT).backgroundColor).toBe('#123');
	});

	test('force layout is drawn to the end (design 7.5)', () => {
		const o = adjustOption({ series: [{ type: 'graph', layout: 'force' }, { type: 'graph', layout: 'circular' }] }, LIGHT);
		const series = o.series as Obj[];
		expect(series[0].force).toEqual({ layoutAnimation: false });
		expect(series[1].force).toBeUndefined();
	});

	test('dark charts get visible grid lines, unless the user set a colour (V-02)', () => {
		const o = adjustOption({ xAxis: {}, yAxis: [{ splitLine: { lineStyle: { color: 'red' } } }, {}], radar: { indicator: [] } }, DARK);
		expect(o.xAxis).toEqual({ splitLine: { lineStyle: { color: DARK_SPLIT_LINE_COLOR } } });
		expect((o.yAxis as Obj[])[0]).toEqual({ splitLine: { lineStyle: { color: 'red' } } });
		expect((o.yAxis as Obj[])[1]).toEqual({ splitLine: { lineStyle: { color: DARK_SPLIT_LINE_COLOR } } });
		expect((o.radar as Obj).splitLine).toEqual({ lineStyle: { color: DARK_SPLIT_LINE_COLOR } });
		// Light charts are not changed.
		expect(adjustOption({ xAxis: {} }, LIGHT).xAxis).toEqual({});
	});

	test('label borders are removed when exporting (V-11)', () => {
		const o = adjustOption({
			series: [
				{ type: 'pie', data: [{ name: 'a', value: 1, label: { color: 'red' } }] },
				{ type: 'bar', label: { show: true, textBorderColor: 'blue' }, emphasis: { label: { show: true } } },
			],
		}, EXPORT);
		const [pie, bar] = o.series as Obj[];
		expect(pie.label).toEqual({ textBorderColor: 'transparent' });
		expect(((pie.data as Obj[])[0].label as Obj).textBorderColor).toBe('transparent');
		// The user's colour wins.
		expect((bar.label as Obj).textBorderColor).toBe('blue');
		expect(((bar.emphasis as Obj).label as Obj).textBorderColor).toBe('transparent');
		// Not in the note viewer.
		expect((adjustOption({ series: [{ type: 'pie' }] }, LIGHT).series as Obj[])[0].label).toBeUndefined();
	});

	test('timeline options are adjusted too', () => {
		const o = adjustOption({ baseOption: { xAxis: {} }, options: [{ series: [{ type: 'graph', layout: 'force' }] }] }, DARK);
		expect((o.baseOption as Obj).xAxis).toEqual({ splitLine: { lineStyle: { color: DARK_SPLIT_LINE_COLOR } } });
		expect((((o.options as Obj[])[0].series as Obj[])[0].force as Obj).layoutAnimation).toBe(false);
	});
});

describe('with the engine', () => {
	const engine = vendorEngine();
	const bar = (): Obj => ({
		xAxis: { type: 'category', data: ['A', 'B'] }, yAxis: {},
		series: [{ type: 'bar', data: [120, 200], label: { show: true, position: 'inside' } }],
	});
	const pie = (): Obj => ({ series: [{ type: 'pie', radius: '40%', data: [{ name: '北京市', value: 1 }] }] });

	function textElements(svg: string, text: string): string[] {
		return svg.match(new RegExp(`<text[^>]*>${text}</text>`, 'g')) || [];
	}

	test('ECharts draws label borders in the note viewer', () => {
		const b = engine.render(adjustOption(bar(), LIGHT), LIGHT);
		const p = engine.render(adjustOption(pie(), LIGHT), LIGHT);
		expect(b.ok && textElements(b.svg, '120').some((t) => /stroke=/.test(t))).toBe(true);
		expect(p.ok && textElements(p.svg, '北京市').some((t) => /stroke=/.test(t))).toBe(true);
	});

	test('no label borders when exporting, so PDF text is not doubled (V-11)', () => {
		const b = engine.render(adjustOption(bar(), EXPORT), EXPORT);
		const p = engine.render(adjustOption(pie(), EXPORT), EXPORT);
		expect(b.ok && p.ok).toBe(true);
		if (b.ok && p.ok) {
			for (const [svg, text] of [[b.svg, '120'], [b.svg, '200'], [p.svg, '北京市']]) {
				const found = textElements(svg, text);
				expect(found.length).toBeGreaterThan(0);
				for (const t of found) expect(t).not.toMatch(/stroke=/);
			}
		}
	});

	test('dark grid lines use the plugin colour', () => {
		const r = engine.render(adjustOption({ xAxis: { type: 'category', data: ['a'] }, yAxis: {}, series: [{ type: 'bar', data: [1] }] }, DARK), DARK);
		expect(r.ok && r.svg).toContain(`stroke="${DARK_SPLIT_LINE_COLOR}"`);
	});
});
