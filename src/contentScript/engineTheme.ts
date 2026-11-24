// SPDX-License-Identifier: MIT
// Adjusts the option before it goes to the engine (design 7.5, 8.5, 14).
// The user's own values always win: a value is only added where the option
// does not have one. The input is the guarded copy (inputGuard.ts), so it is
// changed in place.
import { RenderConfig } from './renderConfig';

type Obj = Record<string, unknown>;

/**
 * Colour of the grid lines of dark charts (design 8.5, V-02). The `dark`
 * theme's rgb(40, 44, 52) is made for its own near-black background and can
 * hardly be seen on Joplin's dark page or #181818 (lessons 2.3). Chosen by
 * the owner after the stage 1 manual test (2026-11-24).
 */
export const DARK_SPLIT_LINE_COLOR = '#454a54';

/** Axis components whose grid lines (splitLine) get DARK_SPLIT_LINE_COLOR. */
const AXIS_KEYS = ['xAxis', 'yAxis', 'radiusAxis', 'angleAxis', 'singleAxis', 'radar'];

/** Label options that get a transparent text border (V-11). */
const LABEL_KEYS = ['label', 'edgeLabel', 'endLabel', 'upperLabel'];

/**
 * When label borders are removed (V-11). ECharts draws labels with a text
 * border (SVG stroke), which a PDF stores as a second copy of the text, so
 * copied text comes out doubled ("120120"). `textBorderWidth: 0` does not help
 * (zrender turns 0 into the default 2); `textBorderColor: 'transparent'` does.
 * Only when exporting, so that the note viewer keeps the look of ECharts
 * (owner's decision after the stage 1 manual test, 2026-11-24).
 */
export const REMOVE_LABEL_BORDERS: 'always' | 'export' | 'never' = 'export';

function isObj(value: unknown): value is Obj {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asObjects(value: unknown): Obj[] {
	if (Array.isArray(value)) return value.filter(isObj);
	return isObj(value) ? [value] : [];
}

/** The option objects that can hold components: the option, baseOption and timeline options. */
function optionParts(option: Obj): Obj[] {
	return [option, ...asObjects(option.baseOption), ...asObjects(option.options)];
}

function setDefault(obj: Obj, path: string[], value: unknown): void {
	let cur = obj;
	for (const key of path.slice(0, -1)) {
		if (cur[key] === undefined) cur[key] = {};
		if (!isObj(cur[key])) return;
		cur = cur[key] as Obj;
	}
	const last = path[path.length - 1];
	if (cur[last] === undefined) cur[last] = value;
}

/** Adds a transparent text border to every label object in a series, at any depth. */
function removeLabelBorders(value: unknown, depth = 0): void {
	if (depth > 64) return;
	if (Array.isArray(value)) {
		for (const item of value) removeLabelBorders(item, depth + 1);
		return;
	}
	if (!isObj(value)) return;
	for (const key of Object.keys(value)) {
		const child = value[key];
		if (LABEL_KEYS.includes(key) && isObj(child) && child.textBorderColor === undefined) child.textBorderColor = 'transparent';
		if (typeof child === 'object') removeLabelBorders(child, depth + 1);
	}
}

export function adjustOption(option: Obj, config: RenderConfig): Obj {
	const parts = optionParts(option);

	option.animation = false;
	if (config.background !== null && option.backgroundColor === undefined) option.backgroundColor = config.background;

	const removeBorders = REMOVE_LABEL_BORDERS === 'always' || (REMOVE_LABEL_BORDERS === 'export' && config.exporting);
	for (const part of parts) {
		for (const s of asObjects(part.series)) {
			// Draw the force layout to the end at once (design 7.5).
			if (s.type === 'graph' && s.layout === 'force') {
				s.force = isObj(s.force) ? s.force : {};
				(s.force as Obj).layoutAnimation = false;
			}
			if (removeBorders) {
				// Labels shown by default (pie, graph, ...) have no label object yet.
				if (s.label === undefined) s.label = {};
				removeLabelBorders(s);
			}
		}
		if (config.theme === 'dark') {
			for (const key of AXIS_KEYS) {
				for (const axis of asObjects(part[key])) setDefault(axis, ['splitLine', 'lineStyle', 'color'], DARK_SPLIT_LINE_COLOR);
			}
		}
	}
	return option;
}
