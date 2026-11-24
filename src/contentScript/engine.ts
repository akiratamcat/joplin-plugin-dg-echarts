// SPDX-License-Identifier: MIT
// The ECharts engine (design 7.5, 7.6): loaded on the first chart with Node's
// require from the folder of this content script (the official minified UMD
// build, copied unchanged into dist/contentScript/engine/), and called
// synchronously, because the Markdown-it rule cannot wait for a promise.

/* eslint-disable @typescript-eslint/no-explicit-any -- the engine is untyped (UMD, loaded at run time) */

/** Version of the bundled engine (vendor/echarts/SOURCE.md). Part of the cache key. */
export const ENGINE_VERSION = '6.1.0';

/** Locales with a file in engine/ (design 10.3). EN and ZH are built in. */
export const LOCALE_FILES = ['JA', 'KO', 'DE', 'FR', 'ES', 'PT-br', 'IT', 'RU'];

export interface RenderOptions {
	theme: 'light' | 'dark' | 'none';
	width: number;
	height: number;
	locale: string;
}

export type RenderResult =
	| { ok: true; svg: string; warnings: string[] }
	| { ok: false; reason: 'engine'; message: string };

/** Loads a file of the engine folder ("echarts.min.js", "langJA-obj.js"). */
export type EngineLoader = (file: string) => any;

declare const __non_webpack_require__: (path: string) => any;

/**
 * The loader used in Joplin: Node's own require (not webpack's), relative to
 * the folder of the built content script (webpack keeps __dirname as is:
 * plugin.config.json, node.__dirname = false).
 */
export function defaultLoader(): EngineLoader {
	return (file: string) => __non_webpack_require__(`${__dirname}/engine/${file}`);
}

/** Small seeded random number generator (mulberry32). */
export function seededRandom(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Makes the SVG follow the page width (design 8.7, D-12): the fixed width and
 * height of the root element are replaced by a style that shrinks the chart in
 * a narrow pane and never stretches it. The viewBox keeps the proportions.
 */
export function fitSvg(svg: string, width: number): string {
	return svg.replace(/^<svg width="[\d.]+" height="[\d.]+"/, `<svg style="display:block;width:100%;max-width:${width}px;height:auto"`);
}

function messageOf(args: unknown[]): string {
	return args.map((a) => (a instanceof Error ? a.message : typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
}

export class EChartsEngine {
	readonly name = 'echarts';
	readonly version = ENGINE_VERSION;
	private echarts: any = null;
	private readonly locales = new Set<string>(['EN', 'ZH']);

	constructor(private readonly load: EngineLoader = defaultLoader()) {}

	/** Loads the engine once. Throws when it cannot be loaded. */
	init(): void {
		if (this.echarts) return;
		const echarts = this.load('echarts.min.js');
		if (!echarts || typeof echarts.init !== 'function') throw new Error('require returned no ECharts engine');
		this.echarts = echarts;
	}

	/** Registers an ECharts locale from its file. Unknown or broken locales fall back to English. */
	useLocale(code: string): string {
		if (this.locales.has(code)) return code;
		if (!LOCALE_FILES.includes(code)) return 'EN';
		try {
			this.echarts.registerLocale(code, this.load(`lang${code}-obj.js`));
			this.locales.add(code);
			return code;
		} catch {
			return 'EN';
		}
	}

	render(option: Record<string, unknown>, opts: RenderOptions): RenderResult {
		this.init();
		const locale = this.useLocale(opts.locale);
		const warnings: string[] = [];
		const origRandom = Math.random;
		const origWarn = console.warn;
		const origError = console.error;
		// ECharts reports problems on the console (design 7.4).
		console.warn = (...args: unknown[]) => { warnings.push(messageOf(args)); };
		console.error = (...args: unknown[]) => { warnings.push(messageOf(args)); };
		// Same input, same chart (design 7.5): the force layout uses Math.random.
		Math.random = seededRandom(1);
		let chart: any = null;
		try {
			chart = this.echarts.init(null, opts.theme === 'dark' ? 'dark' : null, {
				renderer: 'svg', ssr: true, width: opts.width, height: opts.height, locale,
			});
			chart.setOption(option);
			const svg = fitSvg(chart.renderToSVGString(), opts.width);
			return { ok: true, svg, warnings };
		} catch (e) {
			return { ok: false, reason: 'engine', message: e instanceof Error ? e.message : String(e) };
		} finally {
			if (chart) {
				try {
					chart.dispose();
				} catch {
					// Ignore: the chart is thrown away anyway.
				}
			}
			Math.random = origRandom;
			console.warn = origWarn;
			console.error = origError;
		}
	}
}
