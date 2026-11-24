// SPDX-License-Identifier: MIT
// Setting keys and defaults (design 9), shared by the main script, which
// registers the settings, and the Markdown-it content script, which reads them
// with options.settingValue().

export const SECTION = 'dgEcharts';

export const KEYS = {
	themeMode: 'echarts.themeMode',
	transparentBackground: 'echarts.transparentBackground',
	defaultHeight: 'echarts.defaultHeight',
	chartWidth: 'echarts.chartWidth',
	matchNoteFontSize: 'echarts.matchNoteFontSize',
	minFontSizePx: 'echarts.minFontSizePx',
	showToolbar: 'echarts.showToolbar',
	editorHighlight: 'echarts.editorHighlight',
	fenceAliases: 'echarts.fenceAliases',
	maxSourceLength: 'echarts.maxSourceLength',
	cacheSize: 'echarts.cacheSize',
	thirdParty: 'echarts.thirdParty',
	// Hidden copy of Joplin's display language (design 9). The main script writes it.
	locale: 'echarts.locale',
} as const;

export type ThemeMode = 'auto' | 'light' | 'dark';

export const DEFAULTS = {
	themeMode: 'auto' as ThemeMode,
	transparentBackground: false,
	defaultHeight: 400,
	chartWidth: 800,
	matchNoteFontSize: false,
	minFontSizePx: 0,
	showToolbar: true,
	editorHighlight: true,
	fenceAliases: '',
	maxSourceLength: 200000,
	cacheSize: 100,
	locale: '',
};

/** Allowed ranges of the numeric settings and block options (design 6.2, 9). */
export const RANGES = {
	height: { min: 100, max: 2000 },
	width: { min: 200, max: 4000 },
	maxSourceLength: { min: 1000, max: 5000000 },
	cacheSize: { min: 1, max: 1000 },
	/** Smallest font size; 0 turns it off. */
	minFontSizePx: { min: 0, max: 48 },
	/** Accepted note font size (theme.noteViewerFontSize) for the base font size. */
	noteFontSize: { min: 6, max: 72 },
};
