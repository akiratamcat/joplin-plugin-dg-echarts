import { applyFontSizes, placeSize, raiseFontSizes, smallestFontSize } from '../src/contentScript/fontSize';
import { vendorEngine } from './helpers/engine';
import { SAMPLES } from './helpers/samples';

type Obj = Record<string, unknown>;

describe('applyFontSizes (design 8.7)', () => {
	test('nothing changes with the defaults', () => {
		const option = { title: { text: 'a' }, xAxis: {}, series: [] };
		expect(applyFontSizes(JSON.parse(JSON.stringify(option)), { base: null, min: 0 })).toEqual(option);
	});

	test('a base font size scales the places with their own defaults (V-01)', () => {
		const o = applyFontSizes({ title: { text: 't' }, xAxis: {}, yAxis: [{}, {}], series: [{ type: 'gauge' }] }, { base: 18, min: 0 });
		expect(o.textStyle).toEqual({ fontSize: 18 });
		expect(o.title).toEqual({ text: 't', textStyle: { fontSize: 27 }, subtextStyle: { fontSize: 18 } });
		expect(o.xAxis).toEqual({ axisLabel: { fontSize: 18 } });
		expect((o.yAxis as Obj[])[1]).toEqual({ axisLabel: { fontSize: 18 } });
		expect((o.series as Obj[])[0]).toMatchObject({ axisLabel: { fontSize: 18 }, title: { fontSize: 24 }, detail: { fontSize: 45 } });
	});

	test("the user's sizes win over the base, but not below the smallest size", () => {
		const o = applyFontSizes({ textStyle: { fontSize: 10 }, xAxis: { axisLabel: { fontSize: 9 } }, series: [{ type: 'bar', label: { fontSize: 30 } }] }, { base: 20, min: 14 });
		expect(o.textStyle).toEqual({ fontSize: 14 });
		expect((o.xAxis as Obj).axisLabel).toEqual({ fontSize: 14 });
		expect(((o.series as Obj[])[0].label as Obj).fontSize).toBe(30);
	});

	test('components that are not there are not created', () => {
		const o = applyFontSizes({ series: [{ type: 'pie' }] }, { base: 20, min: 0 });
		expect(o).toEqual({ textStyle: { fontSize: 20 }, series: [{ type: 'pie' }] });
	});

	test('timeline base and options', () => {
		const o = applyFontSizes({ baseOption: { xAxis: {} }, options: [{ title: { text: 'x' } }] }, { base: null, min: 16 });
		expect(((o.baseOption as Obj).xAxis as Obj).axisLabel).toEqual({ fontSize: 16 });
		expect((o.baseOption as Obj).textStyle).toEqual({ fontSize: 16 });
		expect((((o.options as Obj[])[0].title as Obj).subtextStyle as Obj).fontSize).toBe(16);
	});

	test('helpers', () => {
		expect(placeSize(18, { base: null, min: 0 })).toBe(18);
		expect(placeSize(18, { base: 16, min: 0 })).toBe(24);
		expect(placeSize(12, { base: null, min: 14 })).toBe(14);
		const deep = { a: [{ fontSize: 8 }, { b: { fontSize: '8' } }], fontSize: 20 };
		raiseFontSizes(deep, 10);
		expect(deep).toEqual({ a: [{ fontSize: 10 }, { b: { fontSize: '8' } }], fontSize: 20 });
		expect(smallestFontSize('<text style="font-size:12px">a</text><text style="font-size: 9.5px">b</text>')).toBe(9.5);
		expect(smallestFontSize('<svg></svg>')).toBeNull();
	});
});

describe('with the engine: no text below the smallest size (V-01)', () => {
	const engine = vendorEngine();
	const extra: Record<string, Obj> = {
		titled: { title: { text: 'T', subtext: 'S' }, legend: {}, xAxis: { type: 'category', data: ['a'], name: 'X' }, yAxis: { name: 'Y' }, series: [{ name: 'n', type: 'bar', data: [1], label: { show: true } }] },
		time: { xAxis: { type: 'time' }, yAxis: {}, series: [{ type: 'line', data: [['2026-01-01', 1], ['2026-06-01', 2]] }] },
		calendar: { visualMap: { min: 0, max: 1 }, calendar: { range: '2026-01' }, series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: [['2026-01-02', 1]] }] },
		polar: { polar: {}, angleAxis: { type: 'category', data: ['a', 'b'] }, radiusAxis: {}, series: [{ type: 'bar', coordinateSystem: 'polar', data: [1, 2] }] },
		marks: { xAxis: { type: 'category', data: ['a', 'b'] }, yAxis: {}, series: [{ type: 'line', data: [1, 2], markPoint: { data: [{ type: 'max' }] }, markLine: { data: [{ type: 'average' }] } }] },
	};
	const cases = { ...SAMPLES, ...extra };

	test.each(Object.keys(cases))('%s', (name) => {
		const option = applyFontSizes(JSON.parse(JSON.stringify({ animation: false, ...cases[name] })), { base: null, min: 16 });
		const r = engine.render(option, { theme: 'light', width: 600, height: 400, locale: 'EN' });
		expect(r.ok).toBe(true);
		if (r.ok) {
			const small = [...r.svg.matchAll(/font-size:([\d.]+)px/g)].map((m) => Number(m[1])).filter((n) => n < 16);
			expect(small).toEqual([]);
		}
	});
});
