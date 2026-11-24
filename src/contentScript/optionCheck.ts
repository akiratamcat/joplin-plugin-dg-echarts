// SPDX-License-Identifier: MIT
// Checks for common mistakes (design 7.4, V-09). The official minified build
// of ECharts drops its development checks: an unknown series type or wrong
// data gives an empty chart without a word, and a cartesian series without
// axes throws "Cannot read properties of undefined".

import { ENGLISH, Translator } from '../i18n/gettext';

/**
 * Series types of ECharts 6.1.0 (the option reference). Update with the
 * engine (vendor/echarts/SOURCE.md). "map" is refused earlier (inputGuard.ts).
 */
export const SERIES_TYPES = [
	'line', 'bar', 'pie', 'scatter', 'effectScatter', 'radar', 'tree', 'treemap', 'sunburst',
	'boxplot', 'candlestick', 'heatmap', 'map', 'parallel', 'lines', 'graph', 'sankey',
	'funnel', 'gauge', 'pictorialBar', 'themeRiver', 'custom', 'chord',
];

/** Series types that are drawn on x and y axes unless another coordinate system is named. */
const CARTESIAN_TYPES = ['line', 'bar', 'scatter', 'effectScatter', 'pictorialBar', 'candlestick', 'boxplot', 'heatmap'];

export interface CheckResult {
	/** Mistakes that stop the chart from being drawn. */
	errors: string[];
	/** Notes shown under the chart. */
	notes: string[];
	/** True when nothing would be drawn (no series of a known type). */
	empty: boolean;
}

function asArray(value: unknown): unknown[] {
	if (Array.isArray(value)) return value;
	return value === undefined || value === null ? [] : [value];
}

function hasComponent(value: unknown): boolean {
	return Array.isArray(value) ? value.length > 0 : !!value && typeof value === 'object';
}

/**
 * Checks one option object. With a timeline (`baseOption` and `options`),
 * the series may be spread over several objects, so only the base is checked
 * for emptiness.
 */
export function checkOption(option: Record<string, unknown>, t: Translator = ENGLISH): CheckResult {
	const errors: string[] = [];
	const notes: string[] = [];
	const base = option.baseOption && typeof option.baseOption === 'object' ? option.baseOption as Record<string, unknown> : option;
	const series = asArray(base.series);
	const timeline = Array.isArray(option.options) && option.options.length > 0;
	let known = 0;

	series.forEach((s, i) => {
		if (!s || typeof s !== 'object') {
			notes.push(t._('series[{index}] is not an object.', { index: i }));
			return;
		}
		const item = s as Record<string, unknown>;
		const type = item.type;
		if (typeof type !== 'string' || !SERIES_TYPES.includes(type)) {
			notes.push(t._('series[{index}]: unknown chart type: {type}', { index: i, type: String(type) }));
			return;
		}
		known++;
		if ('data' in item && item.data !== undefined && (item.data === null || typeof item.data !== 'object')) {
			notes.push(t._('series[{index}].data must be an array.', { index: i }));
		}
		const cs = item.coordinateSystem;
		// With a timeline, the axes may be in `options`: not checked.
		if (!timeline && CARTESIAN_TYPES.includes(type) && (cs === undefined || cs === 'cartesian2d')
			&& (!hasComponent(base.xAxis) || !hasComponent(base.yAxis))) {
			// TRANSLATORS: xAxis and yAxis are ECharts option names. Do not translate them.
			const msg = t._('Charts such as bar, line and scatter charts need both xAxis and yAxis.');
			if (!errors.includes(msg)) errors.push(msg);
		}
	});

	const empty = known === 0 && !timeline;
	if (empty && errors.length === 0) notes.push(t._('There is nothing to draw (no series of a known chart type).'));
	return { errors, notes, empty };
}
