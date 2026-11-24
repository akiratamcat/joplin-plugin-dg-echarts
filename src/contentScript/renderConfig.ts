// SPDX-License-Identifier: MIT
// Builds the configuration of one chart from the settings (options.settingValue),
// the page appearance and the block options (design 5.2, 8.3, 8.5, 8.7).
// Every value read from Joplin is checked; a wrong or missing value falls back
// to the default (lessons of the base plugin 1.15).
import { BlockOptions, parseAliases } from '../shared/fence';
import { DEFAULTS, KEYS, RANGES, ThemeMode } from '../shared/settingKeys';
import { FontSizes } from './fontSize';

export interface PluginOptions {
	settingValue?: (key: string) => unknown;
	theme?: { appearance?: unknown; noteViewerFontSize?: unknown };
	/** Present only when Joplin exports the note (PDF, HTML). */
	plainResourceRendering?: unknown;
}

export type EffectiveTheme = 'light' | 'dark' | 'none';

export interface RenderConfig {
	theme: EffectiveTheme;
	/** Colour painted inside the SVG, 'transparent', or null (leave the theme's own). */
	background: string | null;
	width: number;
	height: number;
	align: 'left' | 'center' | 'right';
	/** ECharts locale code ("EN", "JA", ...). */
	locale: string;
	/** True when Joplin is exporting the note (PDF, HTML). */
	exporting: boolean;
	/** Base and smallest font sizes (design 8.7). */
	fontSizes: FontSizes;
	/** The viewer adds the toolbar (design 11). */
	toolbar: boolean;
}

export interface GlobalConfig {
	aliases: string[];
	maxSourceLength: number;
	cacheSize: number;
}

/** Background colours painted when the chart theme differs from the page (design 8.5). */
export const PAINTED_BACKGROUND = { light: '#ffffff', dark: '#181818' };

function read(options: PluginOptions | null | undefined, key: string): unknown {
	try {
		return options && typeof options.settingValue === 'function' ? options.settingValue(key) : undefined;
	} catch {
		return undefined;
	}
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
	if (typeof value !== 'number' && typeof value !== 'string') return fallback;
	if (typeof value === 'string' && value.trim() === '') return fallback;
	const n = Math.round(Number(value));
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}

function readInt(options: PluginOptions | null | undefined, key: string, range: { min: number; max: number }, fallback: number): number {
	const value = read(options, key);
	// A value outside the range is wrong, not "too big": use the default.
	const n = clampInt(value, -Infinity, Infinity, NaN);
	return Number.isFinite(n) && n >= range.min && n <= range.max ? n : fallback;
}

/**
 * Font size of the note text in px, or null when unknown (design 8.7). Joplin
 * passes its theme to Markdown-it plugins; the note viewer's text uses
 * `theme.noteViewerFontSize` (15 on the desktop app: Joplin's
 * packages/renderer/noteStyle.ts). The desktop setting "Editor font size" only
 * changes the editor, and `style.viewer.fontSize` is a mobile setting.
 */
export function noteFontSize(options: PluginOptions | null | undefined): number | null {
	const value = options && options.theme ? options.theme.noteViewerFontSize : undefined;
	const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
	return Number.isFinite(n) && n >= RANGES.noteFontSize.min && n <= RANGES.noteFontSize.max ? Math.round(n) : null;
}

export function appearanceOf(options: PluginOptions | null | undefined): 'light' | 'dark' {
	return options && options.theme && options.theme.appearance === 'dark' ? 'dark' : 'light';
}

/**
 * Joplin display language ("ja_JP", "pt_BR", "zh_CN") -> ECharts locale code
 * (design 10.3). Languages ECharts does not have use English.
 */
export function echartsLocale(joplinLocale: unknown): string {
	const text = typeof joplinLocale === 'string' ? joplinLocale.toLowerCase() : '';
	const [lang, region] = text.split(/[_-]/);
	switch (lang) {
	case 'zh': return 'ZH';
	case 'ja': return 'JA';
	case 'ko': return 'KO';
	case 'de': return 'DE';
	case 'fr': return 'FR';
	case 'es': return 'ES';
	case 'it': return 'IT';
	case 'ru': return 'RU';
	case 'pt': return region === 'br' ? 'PT-br' : 'EN';
	default: return 'EN';
	}
}

export function globalConfig(options: PluginOptions | null | undefined): GlobalConfig {
	const aliases = read(options, KEYS.fenceAliases);
	return {
		aliases: typeof aliases === 'string' ? parseAliases(aliases) : [],
		maxSourceLength: readInt(options, KEYS.maxSourceLength, RANGES.maxSourceLength, DEFAULTS.maxSourceLength),
		cacheSize: readInt(options, KEYS.cacheSize, RANGES.cacheSize, DEFAULTS.cacheSize),
	};
}

export function renderConfig(options: PluginOptions | null | undefined, block: BlockOptions): RenderConfig {
	const appearance = appearanceOf(options);
	const modeValue = read(options, KEYS.themeMode);
	const mode: ThemeMode = modeValue === 'light' || modeValue === 'dark' ? modeValue : 'auto';
	// Design 8.3: block option, then the setting, then the page.
	const theme: EffectiveTheme = block.theme || (mode === 'auto' ? appearance : mode);
	const transparentValue = read(options, KEYS.transparentBackground);
	const transparent = typeof transparentValue === 'boolean' ? transparentValue : DEFAULTS.transparentBackground;

	// Design 8.5. theme=none: the plugin leaves the background alone.
	let background: string | null = null;
	if (theme !== 'none') {
		if (theme !== appearance) background = PAINTED_BACKGROUND[theme];
		else if (transparent) background = 'transparent';
	}

	// Design 8.7. theme=none: the plugin leaves the font sizes alone too (design 6.2).
	const fontSizes: FontSizes = { base: null, min: 0 };
	if (theme !== 'none') {
		if (read(options, KEYS.matchNoteFontSize) === true) fontSizes.base = noteFontSize(options);
		fontSizes.min = readInt(options, KEYS.minFontSizePx, RANGES.minFontSizePx, DEFAULTS.minFontSizePx);
	}

	const defaultWidth = readInt(options, KEYS.chartWidth, RANGES.width, DEFAULTS.chartWidth);
	const defaultHeight = readInt(options, KEYS.defaultHeight, RANGES.height, DEFAULTS.defaultHeight);
	return {
		theme,
		background,
		width: block.width !== undefined ? clampInt(block.width, RANGES.width.min, RANGES.width.max, defaultWidth) : defaultWidth,
		height: block.height !== undefined ? clampInt(block.height, RANGES.height.min, RANGES.height.max, defaultHeight) : defaultHeight,
		align: block.align || 'center',
		locale: echartsLocale(read(options, KEYS.locale)),
		exporting: !!(options && 'plainResourceRendering' in options),
		fontSizes,
		toolbar: read(options, KEYS.showToolbar) !== false,
	};
}
