// SPDX-License-Identifier: MIT
// Font sizes of a chart (design 8.7, D-05, V-01): the base font size (the
// note's font size, when the setting asks for it) and the smallest font size.
// They are applied to the option before the engine runs, so ECharts lays the
// chart out with the final sizes (no overlap from scaling text afterwards).
//
// V-01 (stage 2): `textStyle.fontSize` reaches series labels, the legend, axis
// names, pie labels and radar indicator names, but not axis labels (12px),
// the title (18px), the subtitle (12px) or the gauge's own texts, which have
// their own defaults in the theme. Those places get a size of their own.

type Obj = Record<string, unknown>;

/** The engine's default size of the base text (textStyle). */
export const ENGINE_BASE_FONT_SIZE = 12;

export interface FontSizes {
	/** Base font size in px, or null for the engine's default (12px). */
	base: number | null;
	/** Smallest font size in px, or 0 when off. */
	min: number;
}

/**
 * Places with their own default size, as [component keys, path, default
 * size at a 12px base]. Components may be objects or arrays.
 */
const PLACES: Array<[string[], string[], number]> = [
	[['xAxis', 'yAxis', 'radiusAxis', 'angleAxis', 'singleAxis', 'parallelAxis'], ['axisLabel', 'fontSize'], 12],
	[['title'], ['textStyle', 'fontSize'], 18],
	[['title'], ['subtextStyle', 'fontSize'], 12],
];

/**
 * Texts of series types with their own default sizes (found with all series
 * types and the smallest size set to 16px, stage 2).
 */
const SERIES_PLACES: Record<string, Array<[string[], number]>> = {
	gauge: [[['axisLabel', 'fontSize'], 12], [['title', 'fontSize'], 16], [['detail', 'fontSize'], 30]],
	sankey: [[['label', 'fontSize'], 12]],
	themeRiver: [[['label', 'fontSize'], 11]],
};

function isObj(value: unknown): value is Obj {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asObjects(value: unknown): Obj[] {
	if (Array.isArray(value)) return value.filter(isObj);
	return isObj(value) ? [value] : [];
}

/** Sets obj[path] to value when the user did not set it. Creates the objects on the way. */
function setDefault(obj: Obj, path: string[], value: number): void {
	let cur = obj;
	for (const key of path.slice(0, -1)) {
		if (cur[key] === undefined) cur[key] = {};
		if (!isObj(cur[key])) return;
		cur = cur[key] as Obj;
	}
	const last = path[path.length - 1];
	if (cur[last] === undefined) cur[last] = value;
}

/** Raises every numeric `fontSize` below `min` to `min`, at any depth (the user's values too). */
export function raiseFontSizes(value: unknown, min: number, depth = 0): void {
	if (depth > 64) return;
	if (Array.isArray(value)) {
		for (const item of value) raiseFontSizes(item, min, depth + 1);
		return;
	}
	if (!isObj(value)) return;
	for (const key of Object.keys(value)) {
		const child = value[key];
		if (key === 'fontSize' && typeof child === 'number' && child < min) value[key] = min;
		else if (typeof child === 'object') raiseFontSizes(child, min, depth + 1);
	}
}

/** The size of a place: its default scaled to the base, and not below the smallest size. */
export function placeSize(defaultAt12: number, sizes: FontSizes): number {
	const base = sizes.base ?? ENGINE_BASE_FONT_SIZE;
	return Math.max(Math.round(defaultAt12 * base / ENGINE_BASE_FONT_SIZE), sizes.min);
}

/** Applies the font sizes to the option (changed in place; the user's values win, except below the smallest size). */
export function applyFontSizes(option: Obj, sizes: FontSizes): Obj {
	if (sizes.base === null && sizes.min <= 0) return option;
	const parts = [option, ...asObjects(option.baseOption), ...asObjects(option.options)];
	const baseSize = placeSize(ENGINE_BASE_FONT_SIZE, sizes);
	// The global text style: the option itself, and the base of a timeline.
	if (baseSize !== ENGINE_BASE_FONT_SIZE) {
		for (const part of [option, ...asObjects(option.baseOption)]) setDefault(part, ['textStyle', 'fontSize'], baseSize);
	}
	for (const part of parts) {
		for (const [keys, path, def] of PLACES) {
			const size = placeSize(def, sizes);
			if (size === def) continue;
			for (const key of keys) for (const comp of asObjects(part[key])) setDefault(comp, path, size);
		}
		for (const s of asObjects(part.series)) {
			const places = typeof s.type === 'string' ? SERIES_PLACES[s.type] : undefined;
			if (!places) continue;
			for (const [path, def] of places) {
				const size = placeSize(def, sizes);
				if (size !== def) setDefault(s, path, size);
			}
		}
	}
	if (sizes.min > 0) raiseFontSizes(option, sizes.min);
	return option;
}

/** Smallest font-size of the texts of an SVG, or null without text. For diagnostics (design 8.7). */
export function smallestFontSize(svg: string): number | null {
	let smallest: number | null = null;
	for (const m of svg.matchAll(/font-size:\s*([\d.]+)px/g)) {
		const n = Number(m[1]);
		if (smallest === null || n < smallest) smallest = n;
	}
	return smallest;
}
