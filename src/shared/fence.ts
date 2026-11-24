// SPDX-License-Identifier: MIT
// Fence and info-string handling (design 6.1, 6.2), shared by the Markdown-it
// plugin and the editor highlighting (7.7).

/** Language names that are always treated as ECharts. `json` is not one (D-01). */
export const DEFAULT_LANGUAGES = ['echarts'];

export type ThemeOption = 'light' | 'dark' | 'none';
export type AlignOption = 'left' | 'center' | 'right';

export interface BlockOptions {
	theme?: ThemeOption;
	align?: AlignOption;
	/** Height in px as written. renderConfig.ts checks the range. */
	height?: number;
	/** Width in px as written (D-12). renderConfig.ts checks the range. */
	width?: number;
}

export interface ParsedInfo {
	/** First word of the info string, lower case ('' when empty). */
	language: string;
	/** Known block options with valid values. Unknown options are ignored. */
	options: BlockOptions;
}

/**
 * Parses aliases written in the settings ("chart, ec" -> ['chart', 'ec']).
 * Invalid names are dropped.
 */
export function parseAliases(text: string): string[] {
	return text
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter((s) => /^[a-z0-9_+-]+$/.test(s));
}

/** True when `language` (any case) is ECharts: a default name or an alias. */
export function isEChartsLanguage(language: string, aliases: string[] = []): boolean {
	const lang = language.toLowerCase();
	return DEFAULT_LANGUAGES.includes(lang) || aliases.includes(lang);
}

/**
 * Parses a Markdown-it info string such as "echarts theme=dark height=300".
 * Option values that are not allowed are ignored (design 6.2).
 */
export function parseInfo(info: string): ParsedInfo {
	const words = info.trim().split(/\s+/).filter((w) => w.length > 0);
	const language = (words.shift() || '').toLowerCase();
	const options: BlockOptions = {};
	for (const word of words) {
		const m = word.match(/^([a-z]+)=(.*)$/i);
		if (!m) continue;
		const key = m[1].toLowerCase();
		const value = m[2].toLowerCase();
		if (key === 'theme' && (value === 'light' || value === 'dark' || value === 'none')) options.theme = value;
		if (key === 'align' && (value === 'left' || value === 'center' || value === 'right')) options.align = value;
		if ((key === 'height' || key === 'width') && /^\d{1,6}$/.test(value)) options[key] = Number(value);
	}
	return { language, options };
}

export interface OpenFence {
	/** The fence characters, e.g. "```" or "~~~~". */
	marker: string;
	info: string;
}

/**
 * Matches an opening code fence line (CommonMark): up to 3 spaces of
 * indentation, then 3 or more backticks or tildes. A backtick fence's info
 * string must not contain a backtick.
 */
export function matchOpenFence(line: string): OpenFence | null {
	const m = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
	if (!m) return null;
	const marker = m[1];
	const info = m[2];
	if (marker[0] === '`' && info.includes('`')) return null;
	return { marker, info: info.trim() };
}

/**
 * True when `line` closes a block opened with `open`: same character, at least
 * as long, and nothing but spaces after it (CommonMark).
 */
export function isCloseFence(line: string, open: OpenFence): boolean {
	const m = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
	if (!m) return false;
	return m[1][0] === open.marker[0] && m[1].length >= open.marker.length;
}
