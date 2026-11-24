// SPDX-License-Identifier: MIT
// Plugin settings (design 9). Labels, descriptions and option names are
// translated (design 10).
import { SettingItem, SettingItemType } from 'api/types';
import { ENGLISH, Translator } from './i18n/gettext';
import { DEFAULTS, KEYS, RANGES, SECTION } from './shared/settingKeys';
import { THIRD_PARTY, thirdPartyLine } from './thirdParty';

export { SECTION };

export function settingsSection(t: Translator = ENGLISH) {
	return {
		// The plugin name is not translated.
		label: 'dg-echarts',
		iconName: 'fas fa-chart-bar',
		// TRANSLATORS: Description at the top of the settings section. Keep ```echarts as it is.
		description: t._('A plugin that renders Apache ECharts charts. The Apache ECharts rendering engine is built in, and the plugin makes no network connections to the outside. Write the data in ```echarts code blocks.'),
	};
}

export function settingItems(t: Translator = ENGLISH): Record<string, SettingItem> {
	return {
		[KEYS.themeMode]: {
			section: SECTION,
			public: true,
			type: SettingItemType.String,
			isEnum: true,
			value: DEFAULTS.themeMode,
			options: {
				auto: t._('Auto (follow Joplin)'),
				// TRANSLATORS: A chart theme with light colours.
				light: t._('Light'),
				// TRANSLATORS: A chart theme with dark colours.
				dark: t._('Dark'),
			},
			label: t._('Chart theme'),
		},
		[KEYS.transparentBackground]: {
			section: SECTION,
			public: true,
			type: SettingItemType.Bool,
			value: DEFAULTS.transparentBackground,
			label: t._('Transparent chart background'),
			description: t._('When a chart uses another theme than the page (for example theme=dark on a light page), its background is always painted.'),
		},
		[KEYS.defaultHeight]: {
			section: SECTION,
			public: true,
			type: SettingItemType.Int,
			value: DEFAULTS.defaultHeight,
			minimum: RANGES.height.min,
			maximum: RANGES.height.max,
			step: 10,
			label: t._('Chart height (px)'),
			// TRANSLATORS: Keep height= and ```echarts height=300 as they are.
			description: t._('A block can set its own height with height=, for example ```echarts height=300.'),
		},
		[KEYS.chartWidth]: {
			section: SECTION,
			public: true,
			type: SettingItemType.Int,
			value: DEFAULTS.chartWidth,
			minimum: RANGES.width.min,
			maximum: RANGES.width.max,
			step: 10,
			label: t._('Chart width (px)'),
			// TRANSLATORS: Keep width= as it is.
			description: t._('Charts are drawn at this width and shrink in a narrower pane; they are never stretched. A block can set its own width with width=.'),
		},
		[KEYS.matchNoteFontSize]: {
			section: SECTION,
			public: true,
			type: SettingItemType.Bool,
			value: DEFAULTS.matchNoteFontSize,
			label: t._('Match the font size of the note'),
			description: t._('Chart texts use the font size of the note text (15px in the desktop app) instead of 12px. Titles and other texts keep their proportions.'),
		},
		[KEYS.minFontSizePx]: {
			section: SECTION,
			public: true,
			type: SettingItemType.Int,
			value: DEFAULTS.minFontSizePx,
			minimum: RANGES.minFontSizePx.min,
			maximum: RANGES.minFontSizePx.max,
			label: t._('Smallest font size (px)'),
			description: t._('0 turns it off. Smaller texts, including sizes written in a chart, are enlarged before the chart is laid out. A chart that shrinks in a narrow pane shows smaller texts.'),
		},
		[KEYS.showToolbar]: {
			section: SECTION,
			public: true,
			type: SettingItemType.Bool,
			value: DEFAULTS.showToolbar,
			label: t._('Show the chart toolbar'),
			description: t._('Buttons to copy and save the chart (SVG, PNG) and to copy its source, shown when the mouse is over a chart.'),
		},
		[KEYS.editorHighlight]: {
			section: SECTION,
			public: true,
			type: SettingItemType.Bool,
			value: DEFAULTS.editorHighlight,
			label: t._('Colour ECharts blocks in the Markdown editor'),
			description: t._('Keys, strings, numbers and comments of JSON and YAML get colours.'),
		},
		[KEYS.fenceAliases]: {
			section: SECTION,
			public: true,
			advanced: true,
			type: SettingItemType.String,
			value: DEFAULTS.fenceAliases,
			label: t._('Extra language names'),
			// TRANSLATORS: "chart, json" and "echarts" are language names of code blocks. Keep them as they are.
			description: t._('Comma-separated, for example "chart, json". "echarts" always works.'),
		},
		[KEYS.maxSourceLength]: {
			section: SECTION,
			public: true,
			advanced: true,
			type: SettingItemType.Int,
			value: DEFAULTS.maxSourceLength,
			minimum: RANGES.maxSourceLength.min,
			maximum: RANGES.maxSourceLength.max,
			label: t._('Largest chart (characters)'),
			description: t._('Larger blocks are not drawn. While a chart is drawn, the note waits.'),
		},
		[KEYS.cacheSize]: {
			section: SECTION,
			public: true,
			advanced: true,
			type: SettingItemType.Int,
			value: DEFAULTS.cacheSize,
			minimum: RANGES.cacheSize.min,
			maximum: RANGES.cacheSize.max,
			label: t._('Number of charts kept in the cache'),
		},
		// Last, so that it is at the bottom of the screen (above the advanced
		// settings). Joplin has no text-only setting, so the list of bundled
		// software is a drop-down list: one line per component when opened.
		// The value is not used. (From dg-plantuml.)
		[KEYS.thirdParty]: {
			section: SECTION,
			public: true,
			type: SettingItemType.String,
			isEnum: true,
			value: THIRD_PARTY[0].id,
			options: Object.fromEntries(THIRD_PARTY.map((c) => [c.id, thirdPartyLine(c)])),
			label: t._('Bundled third-party software'),
			description: t._('Open the list to see the name, version, license and website of each component. Choosing an item changes nothing. The full license texts are in THIRD_PARTY_NOTICES.md in the plugin package.'),
		},
		// Hidden copy of Joplin's display language, read by the renderer (design 9).
		// Not shown, so not translated.
		[KEYS.locale]: {
			section: SECTION,
			public: false,
			type: SettingItemType.String,
			value: DEFAULTS.locale,
			label: 'Joplin display language (copy)',
		},
	};
}
