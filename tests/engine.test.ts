import { EChartsEngine, fitSvg, seededRandom } from '../src/contentScript/engine';
import { vendorEngine } from './helpers/engine';

const BAR = { animation: false, xAxis: { type: 'category', data: ['a', 'b'] }, yAxis: {}, series: [{ type: 'bar', data: [1, 2] }] };
const OPTS = { theme: 'light' as const, width: 400, height: 300, locale: 'EN' };

describe('EChartsEngine (design 7.5)', () => {
	const engine = vendorEngine();

	test('renders an SVG that follows the page width (D-12)', () => {
		const r = engine.render(JSON.parse(JSON.stringify(BAR)), OPTS);
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.svg).toMatch(/^<svg style="display:block;width:100%;max-width:400px;height:auto"/);
			expect(r.svg).toContain('viewBox="0 0 400 300"');
			expect(r.warnings).toEqual([]);
		}
	});

	test('the dark theme', () => {
		const r = engine.render(JSON.parse(JSON.stringify(BAR)), { ...OPTS, theme: 'dark' });
		// The dark theme paints its own near-black background.
		expect(r.ok && r.svg).toMatch(/fill="rgb\(4,8,16\)"|fill="#100c2a"|fill="rgb\(16,12,42\)"/);
	});

	test('locale files: Japanese month names (design 10.3)', () => {
		const option = { animation: false, xAxis: { type: 'time' }, yAxis: {}, series: [{ type: 'line', data: [['2026-01-01', 1], ['2026-06-01', 2]] }] };
		const r = engine.render(option, { ...OPTS, locale: 'JA' });
		expect(r.ok && r.svg).toMatch(/[2-6]月/);
		expect(engine.useLocale('JA')).toBe('JA');
		expect(engine.useLocale('XX')).toBe('EN');
	});

	test('every locale file loads', () => {
		for (const code of ['JA', 'KO', 'DE', 'FR', 'ES', 'PT-br', 'IT', 'RU']) expect(engine.useLocale(code)).toBe(code);
	});

	test('same input, same chart: force layout (design 7.5)', () => {
		const graph = () => ({
			animation: false,
			series: [{
				type: 'graph', layout: 'force', force: { layoutAnimation: false },
				data: [{ name: 'a' }, { name: 'b' }, { name: 'c' }], links: [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }],
			}],
		});
		const r1 = engine.render(graph(), OPTS);
		engine.render(JSON.parse(JSON.stringify(BAR)), OPTS);
		const r2 = engine.render(graph(), OPTS);
		// Class names of the hover styles carry a running number.
		const strip = (s: string) => s.replace(/zr\d*-cls-\d+/g, 'zr-cls');
		expect(r1.ok && r2.ok).toBe(true);
		if (r1.ok && r2.ok) expect(strip(r2.svg)).toBe(strip(r1.svg));
	});

	test('Math.random and the console are restored, also after an error', () => {
		const random = Math.random;
		const warn = console.warn;
		const error = console.error;
		engine.render(JSON.parse(JSON.stringify(BAR)), OPTS);
		// Cartesian series without axes make the minified build throw.
		const r = engine.render({ series: [{ type: 'bar', data: [1] }] }, OPTS);
		expect(r).toMatchObject({ ok: false, reason: 'engine' });
		expect(Math.random).toBe(random);
		expect(console.warn).toBe(warn);
		expect(console.error).toBe(error);
	});

	test('a loader that fails', () => {
		const broken = new EChartsEngine(() => { throw new Error('missing'); });
		expect(() => broken.init()).toThrow('missing');
		const empty = new EChartsEngine(() => ({}));
		expect(() => empty.init()).toThrow('no ECharts engine');
	});

	test('a broken locale file falls back to English', () => {
		const real = vendorEngine();
		real.init();
		const load = (file: string) => {
			if (file.startsWith('lang')) throw new Error('broken');
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			return require(`../vendor/echarts/${file}`);
		};
		const e = new EChartsEngine(load);
		e.init();
		expect(e.useLocale('JA')).toBe('EN');
	});
});

describe('helpers', () => {
	test('fitSvg replaces only the root size', () => {
		expect(fitSvg('<svg width="800" height="400" viewBox="0 0 800 400"><rect width="10" height="10"/></svg>', 800))
			.toBe('<svg style="display:block;width:100%;max-width:800px;height:auto" viewBox="0 0 800 400"><rect width="10" height="10"/></svg>');
	});

	test('seededRandom is repeatable and in [0, 1)', () => {
		const a = seededRandom(1);
		const b = seededRandom(1);
		for (let i = 0; i < 100; i++) {
			const x = a();
			expect(x).toBe(b());
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x).toBeLessThan(1);
		}
	});
});
