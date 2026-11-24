// SPDX-License-Identifier: MIT
// Which ranges of the Markdown text to colour (design 7.7): the lines inside
// ECharts fences, tokenized as JSON or YAML. Independent of CodeMirror so that
// it can be tested. (From dg-plantuml.)
import { isCloseFence, isEChartsLanguage, matchOpenFence, OpenFence, parseInfo } from './fence';
import { INITIAL_STATE, TokenKind, tokenizeLine, TokenizerState } from './tokenizer';

export interface HighlightRange {
	/** 1-based line number in the document. */
	line: number;
	/** Offsets in the line. */
	from: number;
	to: number;
	kind: TokenKind;
}

export interface LineSource {
	/** Number of lines of the document. */
	lines: number;
	/** Text of a 1-based line. */
	text(line: number): string;
}

/**
 * Ranges to colour in lines firstLine..lastLine. The document is read from
 * the first line up to lastLine, because fences and block scalars that start
 * above the visible part matter; nothing after lastLine is read.
 */
export function highlightRanges(doc: LineSource, firstLine: number, lastLine: number, aliases: string[] = []): HighlightRange[] {
	const out: HighlightRange[] = [];
	let fence: OpenFence | null = null;
	let state: TokenizerState = INITIAL_STATE;
	const last = Math.min(lastLine, doc.lines);
	for (let n = 1; n <= last; n++) {
		const text = doc.text(n);
		if (!fence) {
			const open = matchOpenFence(text);
			if (open && isEChartsLanguage(parseInfo(open.info).language, aliases)) {
				fence = open;
				state = INITIAL_STATE;
			}
			continue;
		}
		if (isCloseFence(text, fence)) {
			fence = null;
			continue;
		}
		const r = tokenizeLine(text, state);
		state = r.state;
		if (n >= firstLine) for (const t of r.tokens) out.push({ line: n, from: t.from, to: t.to, kind: t.kind });
	}
	return out;
}
