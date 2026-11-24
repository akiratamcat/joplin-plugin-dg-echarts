// SPDX-License-Identifier: MIT
// A small chart of each series type, for tests (map is refused by the input
// guard; custom needs a renderItem function, which JSON cannot hold).

const CAT = { xAxis: { type: 'category', data: ['a', 'b'] }, yAxis: {} };
const NODES = { data: [{ name: 'a' }, { name: 'b' }], links: [{ source: 'a', target: 'b', value: 1 }] };
export const SAMPLES: Record<string, Record<string, unknown>> = {
	line: { ...CAT, series: [{ type: 'line', data: [1, 2] }] },
	bar: { ...CAT, series: [{ type: 'bar', data: [1, 2] }] },
	scatter: { ...CAT, series: [{ type: 'scatter', data: [1, 2] }] },
	effectScatter: { ...CAT, series: [{ type: 'effectScatter', data: [1, 2] }] },
	pictorialBar: { ...CAT, series: [{ type: 'pictorialBar', data: [1, 2] }] },
	candlestick: { ...CAT, series: [{ type: 'candlestick', data: [[1, 2, 0, 3], [2, 1, 0, 3]] }] },
	boxplot: { ...CAT, series: [{ type: 'boxplot', data: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]] }] },
	heatmap: { xAxis: { type: 'category', data: ['a'] }, yAxis: { type: 'category', data: ['x'] }, visualMap: { min: 0, max: 1 }, series: [{ type: 'heatmap', data: [[0, 0, 1]] }] },
	pie: { series: [{ type: 'pie', data: [{ name: 'a', value: 1 }] }] },
	radar: { radar: { indicator: [{ name: 'a', max: 5 }, { name: 'b', max: 5 }, { name: 'c', max: 5 }] }, series: [{ type: 'radar', data: [{ value: [1, 2, 3] }] }] },
	tree: { series: [{ type: 'tree', data: [{ name: 'r', children: [{ name: 'c' }] }] }] },
	treemap: { series: [{ type: 'treemap', data: [{ name: 'a', value: 1 }] }] },
	sunburst: { series: [{ type: 'sunburst', data: [{ name: 'a', value: 1 }] }] },
	parallel: { parallelAxis: [{ dim: 0 }, { dim: 1 }], series: [{ type: 'parallel', data: [[1, 2]] }] },
	lines: { xAxis: { type: 'value' }, yAxis: { type: 'value' }, series: [{ type: 'lines', coordinateSystem: 'cartesian2d', data: [{ coords: [[0, 0], [1, 1]] }] }] },
	graph: { series: [{ type: 'graph', layout: 'circular', ...NODES }] },
	sankey: { series: [{ type: 'sankey', ...NODES }] },
	funnel: { series: [{ type: 'funnel', data: [{ name: 'a', value: 1 }] }] },
	gauge: { series: [{ type: 'gauge', data: [{ value: 50 }] }] },
	themeRiver: { singleAxis: { type: 'time' }, series: [{ type: 'themeRiver', data: [['2026-01-01', 1, 'a'], ['2026-01-02', 2, 'a']] }] },
	chord: { series: [{ type: 'chord', ...NODES }] },
};
