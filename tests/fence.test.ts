import { isEChartsLanguage, parseAliases, parseInfo } from '../src/shared/fence';

describe('fence', () => {
	test('language names', () => {
		expect(isEChartsLanguage('echarts')).toBe(true);
		expect(isEChartsLanguage('ECharts')).toBe(true);
		// json is not a default name (D-01).
		expect(isEChartsLanguage('json')).toBe(false);
		expect(isEChartsLanguage('json', ['json'])).toBe(true);
		expect(isEChartsLanguage('')).toBe(false);
	});

	test('aliases', () => {
		expect(parseAliases(' Chart, ec , bad name, ,x+y')).toEqual(['chart', 'ec', 'x+y']);
	});

	test('info options', () => {
		expect(parseInfo('echarts theme=dark align=left height=300 width=1200')).toEqual({
			language: 'echarts',
			options: { theme: 'dark', align: 'left', height: 300, width: 1200 },
		});
		expect(parseInfo('ECharts THEME=None')).toEqual({ language: 'echarts', options: { theme: 'none' } });
	});

	test('wrong option values are ignored', () => {
		expect(parseInfo('echarts theme=blue align=top height=abc width=-5 width=1e3 foo=1').options).toEqual({});
		expect(parseInfo('').language).toBe('');
	});
});
