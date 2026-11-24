/** @jest-environment jsdom */
// Translations of the settings and the renderer's texts (design 10).
import { LruCache } from '../src/contentScript/cache';
import { BlockOutput, renderFence } from '../src/contentScript/markdownItPlugin';
import { PluginOptions } from '../src/contentScript/renderConfig';
import { translatorFor } from '../src/i18n/translators';
import { settingItems, settingsSection } from '../src/settings';
import { KEYS } from '../src/shared/settingKeys';
import { quietCanvas, vendorEngine } from './helpers/engine';

quietCanvas();
const engine = vendorEngine();

function options(locale: string): PluginOptions {
	return { settingValue: (key) => (key === KEYS.locale ? locale : undefined), theme: { appearance: 'light' } };
}

function render(content: string, locale: string): string {
	return renderFence({ info: 'echarts', markup: '```', content }, options(locale), engine, new LruCache<BlockOutput>(10));
}

describe('translators (design 10.3)', () => {
	test.each([
		['ja_JP', 'ja'], ['zh_CN', 'zh_CN'], ['zh_HK', 'zh_TW'], ['ko_KR', 'ko'], ['de_DE', 'de'], ['fr_FR', 'fr'],
		['es_ES', 'es'], ['pt_PT', 'pt_BR'], ['it_IT', 'it'], ['ru_RU', 'ru'], ['en_GB', 'en'], ['nl_NL', 'en'], ['', 'en'],
	])('%s -> %s', (joplin, locale) => {
		expect(translatorFor(joplin).locale).toBe(locale);
	});

	test('every language translates every message', () => {
		for (const locale of ['ja', 'zh_CN', 'zh_TW', 'ko', 'de', 'fr', 'es', 'pt_BR', 'it', 'ru']) {
			expect(translatorFor(locale)._('Chart theme')).not.toBe('Chart theme');
		}
	});
});

describe('settings in Japanese', () => {
	const t = translatorFor('ja_JP');

	test('labels, descriptions and option names', () => {
		const items = settingItems(t);
		expect(items[KEYS.themeMode].label).toBe('グラフのテーマ');
		expect(items[KEYS.themeMode].options).toEqual({ auto: '自動（Joplin に合わせる）', light: '明るい配色', dark: '暗い配色' });
		expect(items[KEYS.chartWidth].description).toContain('width=');
		expect(settingsSection(t).label).toBe('dg-echarts');
		expect(settingsSection(t).description).toContain('```echarts');
	});

	test('English without a translator', () => {
		expect(settingItems()[KEYS.themeMode].label).toBe('Chart theme');
	});
});

describe('renderer texts follow the hidden language setting (design 10.4)', () => {
	test('a syntax error in Japanese; the parser message stays in English', () => {
		const html = render('{\n  "a": 1,,\n}', 'ja_JP');
		expect(html).toContain('JSON の構文の誤り: ');
		expect(html).toContain('2 行目');
	});

	test('notes and the chart name in Japanese', () => {
		const html = render('{"title": {"text": "売上"}, "series": [{"type": "nosuchchart"}]}', 'ja_JP');
		expect(html).toContain('series[0]: 未知のグラフの種類: nosuchchart');
		expect(html).toContain('描くものがありません');
		expect(html).toContain('aria-label="ECharts のグラフ: 売上"');
	});

	test('German, and English for an unknown language', () => {
		expect(render('{"geo": {}}', 'de_DE')).toContain('Karten (geo, Serientyp &quot;map&quot;) werden nicht unterstützt.');
		expect(render('{"geo": {}}', 'nl_NL')).toContain('Maps (geo, series type &quot;map&quot;) are not supported.');
	});

	test('the cache keeps languages apart', () => {
		const store = new LruCache<BlockOutput>(10);
		const token = { info: 'echarts', markup: '```', content: '[1]' };
		const ja = renderFence(token, options('ja_JP'), engine, store);
		const en = renderFence(token, options('en_US'), engine, store);
		expect(ja).toContain('オブジェクト');
		expect(en).toContain('must be an object');
	});
});
