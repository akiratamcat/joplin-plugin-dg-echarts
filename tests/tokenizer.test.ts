import { highlightRanges } from '../src/shared/editorHighlight';
import { INITIAL_STATE, TokenizerState, tokenizeLine } from '../src/shared/tokenizer';

/** Tokens of the lines of one block, as [text, kind]. */
function tokens(lines: string[]): [string, string][] {
	const out: [string, string][] = [];
	let state: TokenizerState = INITIAL_STATE;
	for (const line of lines) {
		const r = tokenizeLine(line, state);
		state = r.state;
		for (const t of r.tokens) out.push([line.slice(t.from, t.to), t.kind]);
	}
	return out;
}

describe('JSON (design 7.7)', () => {
	test('keys, strings, numbers, booleans and null', () => {
		expect(tokens(['{', '  "title": { "text": "Sales \\"2026\\"" },', '  "data": [120, -1.5e3, true, false, null]', '}'])).toEqual([
			['"title"', 'key'], ['"text"', 'key'], ['"Sales \\"2026\\""', 'string'],
			['"data"', 'key'], ['120', 'number'], ['-1.5e3', 'number'], ['true', 'bool'], ['false', 'bool'], ['null', 'null'],
		]);
	});

	test('# is not a comment in JSON', () => {
		expect(tokens(['{ "color": "#5070dd" }'])).toEqual([['"color"', 'key'], ['"#5070dd"', 'string']]);
	});
});

describe('YAML (design 7.7)', () => {
	test('keys, comments, flow mappings and plain values', () => {
		expect(tokens([
			'# sales',
			'xAxis: { type: category, data: [1月, 2月] }',
			'series:',
			'  - type: bar   # a comment',
			'    data: [120, 200.5]',
			'    smooth: true',
			'    name: ~',
		])).toEqual([
			['# sales', 'comment'],
			['xAxis', 'key'], ['type', 'key'], ['data', 'key'],
			['series', 'key'],
			['type', 'key'], ['# a comment', 'comment'],
			['data', 'key'], ['120', 'number'], ['200.5', 'number'],
			['smooth', 'key'], ['true', 'bool'],
			['name', 'key'], ['~', 'null'],
		]);
	});

	test('quoted strings and keys; # inside a string is not a comment', () => {
		expect(tokens(["title: 'It''s #1'", '"quoted key": "a # b"'])).toEqual([
			['title', 'key'], ["'It''s #1'", 'string'], ['"quoted key"', 'key'], ['"a # b"', 'string'],
		]);
	});

	test('a block scalar is text until the indentation goes back', () => {
		expect(tokens(['text: |', '  line one', '  line: two', 'next: 1'])).toEqual([
			['text', 'key'], ['line one', 'string'], ['line: two', 'string'], ['next', 'key'], ['1', 'number'],
		]);
	});

	test('a colour value and a key without a space after the colon', () => {
		expect(tokens(['color: "#ff0000"', 'url: a:b'])).toEqual([['color', 'key'], ['"#ff0000"', 'string'], ['url', 'key']]);
	});
});

describe('highlightRanges', () => {
	const doc = (lines: string[]) => ({ lines: lines.length, text: (n: number) => lines[n - 1] });
	const note = [
		'# Note',
		'```json',
		'{ "a": 1 }',
		'```',
		'```echarts theme=dark',
		'{ "b": 2 }',
		'```',
		'~~~~ECharts',
		'c: 3',
		'~~~~',
	];

	test('only ECharts fences, JSON or YAML each', () => {
		expect(highlightRanges(doc(note), 1, note.length).map((r) => [r.line, r.kind])).toEqual([
			[6, 'key'], [6, 'number'], [9, 'key'], [9, 'number'],
		]);
	});

	test('aliases and the visible range', () => {
		expect(highlightRanges(doc(note), 1, note.length, ['json']).map((r) => r.line)).toEqual([3, 3, 6, 6, 9, 9]);
		expect(highlightRanges(doc(note), 7, 9).map((r) => r.line)).toEqual([9, 9]);
	});
});
