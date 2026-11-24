import { checkOption, SERIES_TYPES } from '../src/contentScript/optionCheck';
import { vendorEngine } from './helpers/engine';
import { SAMPLES } from './helpers/samples';

describe('checkOption (design 7.4)', () => {
	test('a correct chart has no errors or notes', () => {
		expect(checkOption({ xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [1, 2] }] })).toEqual({ errors: [], notes: [], empty: false });
		expect(checkOption({ series: { type: 'pie', data: [{ name: 'a', value: 1 }] } })).toEqual({ errors: [], notes: [], empty: false });
	});

	test('unknown series type', () => {
		const r = checkOption({ series: [{ type: 'nosuchchart' }] });
		expect(r.notes[0]).toContain('nosuchchart');
		expect(r.empty).toBe(true);
	});

	test('data that is not an array', () => {
		const r = checkOption({ xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: 5 }] });
		expect(r.notes).toEqual(['series[0].data must be an array.']);
		expect(r.empty).toBe(false);
	});

	test('cartesian series without axes', () => {
		expect(checkOption({ series: [{ type: 'bar', data: [1] }, { type: 'line', data: [1] }] }).errors).toHaveLength(1);
		expect(checkOption({ xAxis: {}, series: [{ type: 'scatter', data: [[1, 2]] }] }).errors).toHaveLength(1);
		// Other coordinate systems need no x/y axes.
		expect(checkOption({ polar: {}, angleAxis: {}, radiusAxis: {}, series: [{ type: 'bar', coordinateSystem: 'polar', data: [1] }] }).errors).toEqual([]);
		expect(checkOption({ calendar: {}, series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: [] }] }).errors).toEqual([]);
		// Empty arrays count as missing.
		expect(checkOption({ xAxis: [], yAxis: [], series: [{ type: 'bar', data: [1] }] }).errors).toHaveLength(1);
	});

	test('nothing to draw', () => {
		expect(checkOption({}).empty).toBe(true);
		expect(checkOption({ series: [] }).notes).toEqual(['There is nothing to draw (no series of a known chart type).']);
	});

	test('timeline options are not reported as empty', () => {
		expect(checkOption({ baseOption: { timeline: {} }, options: [{ series: [{ type: 'pie', data: [] }] }] }).empty).toBe(false);
	});
});


describe('series types', () => {
	const engine = vendorEngine();

	test('every listed type has a sample', () => {
		expect(Object.keys(SAMPLES).sort()).toEqual(SERIES_TYPES.filter((t) => t !== 'map' && t !== 'custom').sort());
	});

	test.each(Object.keys(SAMPLES))('%s draws a chart', (type) => {
		const option = JSON.parse(JSON.stringify(SAMPLES[type]));
		expect(checkOption(option)).toEqual({ errors: [], notes: [], empty: false });
		const r = engine.render({ animation: false, ...option }, { theme: 'light', width: 300, height: 200, locale: 'EN' });
		expect(r.ok).toBe(true);
		// More than the background rectangle.
		if (r.ok) expect(r.svg).toMatch(/<path|<text|<circle/);
	});

	test('an unknown type draws nothing', () => {
		const r = engine.render({ animation: false, series: [{ type: 'nosuchchart', data: [1] }] }, { theme: 'light', width: 300, height: 200, locale: 'EN' });
		expect(r.ok && r.svg).not.toMatch(/<path|<text|<circle/);
	});
});
