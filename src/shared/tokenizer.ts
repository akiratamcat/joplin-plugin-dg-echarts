// SPDX-License-Identifier: MIT
// JSON / YAML tokenizer for the Markdown editor highlighting (design 7.7).
// It only needs to be good enough for colours; it does not parse. Keys,
// strings, numbers, true/false, null and YAML comments get a kind; ECharts
// option names are not treated specially.

export type TokenKind = 'key' | 'string' | 'number' | 'bool' | 'null' | 'comment';

export interface Token {
	/** Offsets in the line. */
	from: number;
	to: number;
	kind: TokenKind;
}

export interface TokenizerState {
	/** Format of the block, decided by its first non-blank line ('{' = JSON). */
	format: 'json' | 'yaml' | null;
	/** Indentation of the line that started a YAML block scalar (| or >), or -1. */
	blockScalarIndent: number;
}

export const INITIAL_STATE: TokenizerState = { format: null, blockScalarIndent: -1 };

const NUMBER_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
const YAML_NUMBER_RE = /^[-+]?(?:\.inf|\.Inf|\.INF|\.nan|\.NaN|\.NAN|0x[0-9a-fA-F]+|0o[0-7]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/;

/** Letters of any script and digits continue a word ("1月" is not a number). */
const WORD_CHAR = /[\p{L}\p{N}_$]/u;

function isWordEnd(text: string, i: number): boolean {
	return i >= text.length || !(WORD_CHAR.test(text[i]) || text[i] === '.' || text[i] === '-');
}

/** End offset of a quoted string starting at i (the closing quote included, or the line end). */
function stringEnd(text: string, i: number, quote: string, backslash: boolean): number {
	let j = i + 1;
	while (j < text.length) {
		const c = text[j];
		if (backslash && c === '\\') {
			j += 2;
			continue;
		}
		if (c === quote) {
			// YAML single quotes escape a quote by doubling it.
			if (!backslash && text[j + 1] === quote) {
				j += 2;
				continue;
			}
			return j + 1;
		}
		j++;
	}
	return text.length;
}

/** True when a ':' follows at j (after spaces), making the previous token a key. */
function colonFollows(text: string, j: number, yaml: boolean): boolean {
	let k = j;
	while (k < text.length && (text[k] === ' ' || text[k] === '\t')) k++;
	if (text[k] !== ':') return false;
	// In YAML, a key's colon is followed by a space or the line end ("a:b" is a plain scalar).
	return !yaml || k + 1 >= text.length || /[\s,}\]]/.test(text[k + 1]);
}

function indentOf(text: string): number {
	return (/^ */.exec(text) as RegExpExecArray)[0].length;
}

export function tokenizeLine(text: string, state: TokenizerState): { tokens: Token[]; state: TokenizerState } {
	const tokens: Token[] = [];
	let format = state.format;
	if (format === null && text.trim() !== '') format = text.trimStart().startsWith('{') ? 'json' : 'yaml';
	const yaml = format === 'yaml';

	// Inside a YAML block scalar: more-indented (or blank) lines are text.
	if (yaml && state.blockScalarIndent >= 0) {
		if (text.trim() === '' || indentOf(text) > state.blockScalarIndent) {
			if (text.trim() !== '') tokens.push({ from: indentOf(text), to: text.length, kind: 'string' });
			return { tokens, state: { format, blockScalarIndent: state.blockScalarIndent } };
		}
	}

	let blockScalarIndent = -1;
	let i = 0;
	// A YAML plain key at the start of a line or after "- ": "xAxis:", "- type:".
	const plainKey = yaml ? /^(\s*(?:-\s+)*)([^\s#'"{}[\],&*!|>%@`-][^#{}[\],]*?)(?=\s*:(?:\s|$))/.exec(text) : null;
	if (plainKey) {
		const from = plainKey[1].length;
		tokens.push({ from, to: from + plainKey[2].length, kind: 'key' });
		i = from + plainKey[2].length;
	}

	while (i < text.length) {
		const c = text[i];
		if (c === ' ' || c === '\t') {
			i++;
			continue;
		}
		// YAML comment: '#' at the line start or after a space.
		if (yaml && c === '#' && (i === 0 || /\s/.test(text[i - 1]))) {
			tokens.push({ from: i, to: text.length, kind: 'comment' });
			break;
		}
		if (c === '"' || (yaml && c === '\'')) {
			const end = stringEnd(text, i, c, c === '"');
			tokens.push({ from: i, to: end, kind: colonFollows(text, end, yaml) ? 'key' : 'string' });
			i = end;
			continue;
		}
		// YAML block scalar indicator after a key: "text: |" or "text: >-".
		if (yaml && (c === '|' || c === '>') && /^[|>][-+0-9]*\s*(#.*)?$/.test(text.slice(i))) {
			blockScalarIndent = indentOf(text);
			break;
		}
		const rest = text.slice(i);
		const num = (yaml ? YAML_NUMBER_RE : NUMBER_RE).exec(rest);
		if (num && isWordEnd(text, i + num[0].length) && (i === 0 || !WORD_CHAR.test(text[i - 1]))) {
			tokens.push({ from: i, to: i + num[0].length, kind: 'number' });
			i += num[0].length;
			continue;
		}
		const word = /^[A-Za-z_$~][\w$-]*/.exec(rest);
		if (word) {
			const w = word[0];
			const end = i + w.length;
			if (yaml && colonFollows(text, end, true)) {
				// A key inside a flow mapping: "{ type: category }".
				tokens.push({ from: i, to: end, kind: 'key' });
			} else if (w === 'true' || w === 'false' || (yaml && /^(True|TRUE|False|FALSE)$/.test(w))) {
				tokens.push({ from: i, to: end, kind: 'bool' });
			} else if (w === 'null' || (yaml && /^(Null|NULL|~)$/.test(w))) {
				tokens.push({ from: i, to: end, kind: 'null' });
			}
			i = end;
			continue;
		}
		if (yaml && c === '~' && isWordEnd(text, i + 1)) {
			tokens.push({ from: i, to: i + 1, kind: 'null' });
		}
		i++;
	}
	return { tokens, state: { format, blockScalarIndent } };
}
