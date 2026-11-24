import { echartsLocale, globalConfig, PluginOptions, renderConfig } from '../src/contentScript/renderConfig';
import { KEYS } from '../src/shared/settingKeys';

function options(values: Record<string, unknown>, appearance?: string, exporting = false): PluginOptions {
	const o: PluginOptions = { settingValue: (key) => values[key], theme: { appearance } };
	if (exporting) o.plainResourceRendering = true;
	return o;
}

describe('renderConfig', () => {
	test('defaults without settings', () => {
		expect(renderConfig(undefined, {})).toEqual({
			theme: 'light', background: null, width: 800, height: 400, align: 'center', locale: 'EN', exporting: false, fontSizes: { base: null, min: 0 }, toolbar: true,
		});
	});

	test('Auto follows the page appearance (design 8.2)', () => {
		expect(renderConfig(options({}, 'dark'), {}).theme).toBe('dark');
		expect(renderConfig(options({ [KEYS.themeMode]: 'light' }, 'dark'), {}).theme).toBe('light');
	});

	test('the block option wins (design 8.3)', () => {
		expect(renderConfig(options({ [KEYS.themeMode]: 'light' }, 'light'), { theme: 'dark' }).theme).toBe('dark');
	});

	test('background (design 8.5)', () => {
		// A theme different from the page paints its background.
		expect(renderConfig(options({}, 'light'), { theme: 'dark' }).background).toBe('#181818');
		expect(renderConfig(options({}, 'dark'), { theme: 'light' }).background).toBe('#ffffff');
		// Same as the page: the theme's own (default, V-02), or transparent when the setting is on.
		expect(renderConfig(options({}, 'dark'), {}).background).toBeNull();
		expect(renderConfig(options({ [KEYS.transparentBackground]: true }, 'dark'), {}).background).toBe('transparent');
		// theme=none: left alone.
		expect(renderConfig(options({}, 'dark'), { theme: 'none' }).background).toBeNull();
	});

	test('width and height (D-12)', () => {
		expect(renderConfig(options({ [KEYS.chartWidth]: 600, [KEYS.defaultHeight]: 300 }), {})).toMatchObject({ width: 600, height: 300 });
		expect(renderConfig(options({ [KEYS.chartWidth]: 600 }), { width: 1600, height: 250 })).toMatchObject({ width: 1600, height: 250 });
		// Block values are clamped to the range.
		expect(renderConfig(options({}), { width: 50, height: 99999 })).toMatchObject({ width: 200, height: 2000 });
		// Wrong settings fall back to the defaults.
		expect(renderConfig(options({ [KEYS.chartWidth]: 'wide', [KEYS.defaultHeight]: 5 }), {})).toMatchObject({ width: 800, height: 400 });
	});

	test('font sizes (design 8.7)', () => {
		const withFont = (values: Record<string, unknown>, size: unknown): PluginOptions => ({ ...options(values), theme: { appearance: 'light', noteViewerFontSize: size } });
		const on = { [KEYS.matchNoteFontSize]: true, [KEYS.minFontSizePx]: 14 };
		expect(renderConfig(withFont(on, 15), {}).fontSizes).toEqual({ base: 15, min: 14 });
		expect(renderConfig(withFont(on, '18px'), {}).fontSizes.base).toBe(18);
		// Off, or no usable note font size: the engine's default.
		expect(renderConfig(withFont({}, 15), {}).fontSizes).toEqual({ base: null, min: 0 });
		expect(renderConfig(withFont(on, undefined), {}).fontSizes.base).toBeNull();
		expect(renderConfig(withFont(on, 'large'), {}).fontSizes.base).toBeNull();
		expect(renderConfig(withFont(on, 500), {}).fontSizes.base).toBeNull();
		// Out of range: the default (off).
		expect(renderConfig(options({ [KEYS.minFontSizePx]: 99 }), {}).fontSizes.min).toBe(0);
		// theme=none: left alone (design 6.2).
		expect(renderConfig(withFont(on, 15), { theme: 'none' }).fontSizes).toEqual({ base: null, min: 0 });
	});

	test('exporting is detected from plainResourceRendering', () => {
		expect(renderConfig(options({}, 'light', true), {}).exporting).toBe(true);
	});

	test('a throwing settingValue is treated as missing', () => {
		const o: PluginOptions = { settingValue: () => { throw new Error('no'); } };
		expect(renderConfig(o, {}).width).toBe(800);
		expect(globalConfig(o)).toEqual({ aliases: [], maxSourceLength: 200000, cacheSize: 100 });
	});

	test('global config', () => {
		expect(globalConfig(options({ [KEYS.fenceAliases]: 'chart, JSON', [KEYS.cacheSize]: 5, [KEYS.maxSourceLength]: 10 })))
			.toEqual({ aliases: ['chart', 'json'], maxSourceLength: 200000, cacheSize: 5 });
	});
});

describe('echartsLocale (design 10.3)', () => {
	test.each([
		['ja_JP', 'JA'], ['ko', 'KO'], ['zh_CN', 'ZH'], ['zh_TW', 'ZH'], ['de_DE', 'DE'], ['fr_FR', 'FR'], ['es_ES', 'ES'],
		['pt_BR', 'PT-br'], ['pt_PT', 'EN'], ['it_IT', 'IT'], ['ru_RU', 'RU'], ['en_GB', 'EN'], ['nl_NL', 'EN'], ['', 'EN'],
	])('%s -> %s', (joplin, code) => {
		expect(echartsLocale(joplin)).toBe(code);
	});

	test('not a string', () => {
		expect(echartsLocale(undefined)).toBe('EN');
		expect(echartsLocale(3)).toBe('EN');
	});
});
