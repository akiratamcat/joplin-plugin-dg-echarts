import { guardInput, MAX_DEPTH } from '../src/contentScript/inputGuard';

describe('guardInput (design 12)', () => {
	test('a normal option is unchanged', () => {
		const option = { title: { text: 'x' }, xAxis: { type: 'category', data: ['a'] }, yAxis: {}, series: [{ type: 'bar', data: [1], symbol: 'path://M0 0L1 1' }] };
		expect(guardInput(JSON.parse(JSON.stringify(option)))).toEqual({ ok: true, option, removedImages: false });
	});

	test('keys without effect in a static chart are removed silently', () => {
		const r = guardInput({
			tooltip: { formatter: '<img src=x>' }, toolbox: { feature: { saveAsImage: {} } },
			title: { text: 't', link: 'https://example.com', sublink: 'https://example.com' },
			xAxis: { axisPointer: { show: true } }, series: [],
		});
		expect(r).toEqual({ ok: true, option: { title: { text: 't' }, xAxis: {}, series: [] }, removedImages: false });
	});

	test('images are removed with a note, at any depth', () => {
		const r = guardInput({
			graphic: [{ type: 'image', style: { image: 'https://example.com/a.png' } }],
			series: [{
				type: 'scatter', symbol: 'image://https://example.com/a.png',
				itemStyle: { color: { image: 'https://example.com/p.png', repeat: 'repeat' } },
				data: [{ value: [1, 2], symbol: ' IMAGE://x' }],
			}],
			legend: { data: [{ name: 'a', icon: 'image://x' }] },
		});
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.removedImages).toBe(true);
			const text = JSON.stringify(r.option);
			expect(text).not.toMatch(/image:\/\//i);
			expect(text).not.toContain('"image":');
			expect(text).not.toContain('example.com');
		}
	});

	test('a removed array item keeps the positions of the others', () => {
		const r = guardInput({ series: [{ type: 'line', symbol: ['image://x', 'circle'] }] });
		expect(r.ok && r.option).toEqual({ series: [{ type: 'line', symbol: [null, 'circle'] }] });
	});

	test.each([
		[{ geo: {}, series: [] }],
		[{ series: [{ type: 'map' }] }],
		[{ series: { type: 'scatter', coordinateSystem: 'geo' } }],
		[{ baseOption: { series: [] }, options: [{ series: [{ type: 'map' }] }] }],
	])('maps are refused: %j', (option) => {
		expect(guardInput(option as Record<string, unknown>)).toMatchObject({ ok: false, reason: 'blocked' });
	});

	test('__proto__ does not change the prototype', () => {
		const r = guardInput(JSON.parse('{"__proto__": {"polluted": true}, "series": []}'));
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(Object.getPrototypeOf(r.option)).toBe(Object.prototype);
			expect((r.option as Record<string, unknown>).polluted).toBeUndefined();
		}
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});

	test('too deep input is refused', () => {
		let deep: Record<string, unknown> = {};
		const root = deep;
		for (let i = 0; i < MAX_DEPTH + 5; i++) {
			deep.a = {};
			deep = deep.a as Record<string, unknown>;
		}
		expect(guardInput(root)).toMatchObject({ ok: false, reason: 'invalid' });
	});

	test('the input object is not changed', () => {
		const input = { tooltip: {}, series: [] };
		guardInput(input);
		expect(input).toEqual({ tooltip: {}, series: [] });
	});
});
