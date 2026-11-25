// SPDX-License-Identifier: MIT
// Parses the content of an ECharts block: JSON or YAML (design 6.3, D-02).
// The input is never evaluated as JavaScript.
import { parse as parseYaml, YAMLParseError } from 'yaml';
import { ENGLISH, Translator } from '../i18n/gettext';

/** Upper limit of YAML alias expansions (design 6.3, 12). */
export const MAX_ALIAS_COUNT = 100;

export type InputResult =
	| { ok: true; format: 'json' | 'yaml'; value: Record<string, unknown> }
	| { ok: false; reason: 'syntax' | 'invalid'; format?: 'json' | 'yaml'; message: string; line?: number };

/** Line (1-based) of a character position in `text`. */
export function lineOfPosition(text: string, position: number): number {
	let line = 1;
	for (let i = 0; i < position && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
	return line;
}

/** Line of a JSON.parse error, from "(line N column M)" or "at position N". */
export function jsonErrorLine(message: string, text: string): number | undefined {
	const lineMatch = message.match(/\(line (\d+) column \d+\)/);
	if (lineMatch) return Number(lineMatch[1]);
	const posMatch = message.match(/at position (\d+)/);
	if (posMatch) return lineOfPosition(text, Number(posMatch[1]));
	if (/Unexpected end of JSON input/.test(message)) return lineOfPosition(text, text.length);
	// Newer V8 (Node 20+, Chrome): `Unexpected token ']', ..."s": [1, 2,]}" is not valid JSON`,
	// without a position. The quoted part is the text around the error: up to 10
	// characters before it ("..." when cut) and 10 after it (fixed in 1.0.1).
	const ctx = message.match(/^Unexpected token '([\s\S]*?)', (\.\.\.)?"([\s\S]*?)"(\.\.\.)? is not valid JSON$/);
	if (ctx) {
		const [, token, cutBefore, context, cutAfter] = ctx;
		const at = text.indexOf(context);
		if (at < 0) return undefined;
		const offset = cutBefore ? 10 : cutAfter ? context.length - 10 : context.lastIndexOf(token);
		return lineOfPosition(text, at + Math.max(0, offset));
	}
	return undefined;
}

export function isJson(source: string): boolean {
	return source.trimStart().startsWith('{');
}

export function parseInput(source: string, maxLength: number, t: Translator = ENGLISH): InputResult {
	if (source.length > maxLength) {
		return { ok: false, reason: 'invalid', message: t._('The chart is too large ({length} characters; the limit is {limit}).', { length: source.length, limit: maxLength }) };
	}
	if (source.trim() === '') return { ok: false, reason: 'invalid', message: t._('The block is empty.') };

	let value: unknown;
	let format: 'json' | 'yaml';
	if (isJson(source)) {
		format = 'json';
		try {
			value = JSON.parse(source);
		} catch (e) {
			const message = (e as Error).message;
			return { ok: false, reason: 'syntax', format, message, line: jsonErrorLine(message, source) };
		}
	} else {
		format = 'yaml';
		try {
			value = parseYaml(source, { maxAliasCount: MAX_ALIAS_COUNT, prettyErrors: true });
		} catch (e) {
			const message = (e as Error).message.split('\n')[0];
			const line = e instanceof YAMLParseError && e.linePos ? e.linePos[0].line : undefined;
			return { ok: false, reason: 'syntax', format, message, line };
		}
	}
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return { ok: false, reason: 'invalid', format, message: t._('The chart must be an object ({ ... }) with ECharts options.') };
	}
	return { ok: true, format, value: value as Record<string, unknown> };
}
