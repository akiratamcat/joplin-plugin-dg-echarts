import { jsonErrorLine, lineOfPosition, MAX_ALIAS_COUNT, parseInput } from '../src/contentScript/input';

describe('parseInput (design 6.3)', () => {
	test('JSON when the first character is {', () => {
		const r = parseInput('  {"series": []}', 1000);
		expect(r).toEqual({ ok: true, format: 'json', value: { series: [] } });
	});

	test('YAML otherwise, with comments', () => {
		const r = parseInput('# sales\nxAxis: { type: category, data: [1月, 2月] }\nseries:\n  - type: bar\n    data: [1, 2]\n', 1000);
		expect(r).toEqual({ ok: true, format: 'yaml', value: { xAxis: { type: 'category', data: ['1月', '2月'] }, series: [{ type: 'bar', data: [1, 2] }] } });
	});

	test('a JSON syntax error has the line', () => {
		const r = parseInput('{\n  "a": 1,,\n  "b": 2\n}', 1000);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.reason).toBe('syntax');
			expect(r.format).toBe('json');
			expect(r.line).toBe(2);
		}
	});

	test('a YAML syntax error has the line', () => {
		const r = parseInput('a: 1\nb: [1, 2\nc: 3', 1000);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.reason).toBe('syntax');
			expect(r.format).toBe('yaml');
			expect(r.line).toBeGreaterThanOrEqual(2);
			expect(r.message).not.toContain('\n');
		}
	});

	test('duplicate YAML keys are an error', () => {
		expect(parseInput('a: 1\na: 2', 1000).ok).toBe(false);
	});

	test('the result must be an object', () => {
		for (const source of ['[1, 2]', 'just text', '42']) {
			const r = parseInput(source, 1000);
			expect(r.ok).toBe(false);
			if (!r.ok) expect(r.reason).toBe('invalid');
		}
	});

	test('empty and too large', () => {
		expect(parseInput('  \n ', 1000)).toMatchObject({ ok: false, reason: 'invalid' });
		expect(parseInput(`{"a": "${'x'.repeat(100)}"}`, 50)).toMatchObject({ ok: false, reason: 'invalid' });
	});

	test('YAML alias expansion is limited (design 12)', () => {
		const lines = ['a: &a [1, 2, 3]'];
		for (let i = 0; i <= MAX_ALIAS_COUNT; i++) lines.push(`k${i}: *a`);
		const r = parseInput(lines.join('\n'), 100000);
		expect(r.ok).toBe(false);
	});

	test('the input is not evaluated', () => {
		const r = parseInput('{"formatter": "function () { return 1; }"}', 1000);
		expect(r).toEqual({ ok: true, format: 'json', value: { formatter: 'function () { return 1; }' } });
	});
});

describe('line helpers', () => {
	test('lineOfPosition', () => {
		expect(lineOfPosition('a\nb\nc', 0)).toBe(1);
		expect(lineOfPosition('a\nb\nc', 2)).toBe(2);
		expect(lineOfPosition('a\nb\nc', 4)).toBe(3);
	});

	test('jsonErrorLine reads both message forms', () => {
		const text = '{\n"a":\n}';
		expect(jsonErrorLine('Unexpected token } in JSON at position 7 (line 3 column 1)', text)).toBe(3);
		expect(jsonErrorLine('Unexpected token } in JSON at position 7', text)).toBe(3);
		expect(jsonErrorLine('Unexpected end of JSON input', text)).toBe(3);
		expect(jsonErrorLine('something else', text)).toBeUndefined();
	});
});
