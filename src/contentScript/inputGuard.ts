// SPDX-License-Identifier: MIT
// Input guard (design 12): walks the whole option and removes values that
// load external URLs, take HTML or do nothing in a static chart. The places are
// not hard-coded, because ECharts has a very large number of options.
// This is a deny list: check it when the engine is updated (vendor/echarts/SOURCE.md).

import { ENGLISH, Translator } from '../i18n/gettext';

/** Keys that have no effect in a static SVG. Removed without a note (design 12). */
export const SILENT_KEYS = ['tooltip', 'toolbox', 'link', 'sublink', 'axisPointer'];

/** Keys whose removal changes the chart: images. Removed with a note. */
export const VISIBLE_KEYS = ['image'];

/** Deeper input is refused: it is not a real chart, and it guards against cycles. */
export const MAX_DEPTH = 64;

export type GuardResult =
	| { ok: true; option: Record<string, unknown>; removedImages: boolean }
	| { ok: false; reason: 'blocked' | 'invalid'; message: string };

class GuardError extends Error {
	constructor(readonly reason: 'blocked' | 'invalid', message: string) {
		super(message);
	}
}

function isImageUrl(value: string): boolean {
	return /^\s*image:\/\//i.test(value);
}

/**
 * True when an object of the option uses a map, which the plugin does not
 * support (design 7.4, 12): a `geo` component, a series of type "map", or
 * `coordinateSystem: "geo"`. Checked at every level, so that `baseOption` and
 * the `options` of a timeline are covered too. No other ECharts option uses
 * these names.
 */
function objectUsesMap(obj: Record<string, unknown>): boolean {
	return obj.geo !== undefined || obj.type === 'map' || obj.coordinateSystem === 'geo';
}

export function guardInput(input: Record<string, unknown>, t: Translator = ENGLISH): GuardResult {
	let removedImages = false;

	const walk = (value: unknown, depth: number): unknown => {
		if (depth > MAX_DEPTH) throw new GuardError('invalid', t._('The chart is nested too deeply (more than {depth} levels).', { depth: MAX_DEPTH }));
		if (typeof value === 'string') {
			if (isImageUrl(value)) {
				removedImages = true;
				return undefined;
			}
			return value;
		}
		if (Array.isArray(value)) {
			// Keep the positions of the other items: a removed item becomes null.
			return value.map((item) => {
				const r = walk(item, depth + 1);
				return r === undefined ? null : r;
			});
		}
		if (value && typeof value === 'object') {
			if (objectUsesMap(value as Record<string, unknown>)) throw new GuardError('blocked', t._('Maps (geo, series type "map") are not supported.'));
			const out: Record<string, unknown> = {};
			for (const key of Object.keys(value)) {
				// JSON.parse makes "__proto__" an own key; copying it would change the prototype.
				if (key === '__proto__') continue;
				if (SILENT_KEYS.includes(key)) continue;
				if (VISIBLE_KEYS.includes(key)) {
					removedImages = true;
					continue;
				}
				const r = walk((value as Record<string, unknown>)[key], depth + 1);
				if (r !== undefined) out[key] = r;
			}
			return out;
		}
		return value;
	};

	try {
		const option = walk(input, 0) as Record<string, unknown>;
		return { ok: true, option, removedImages };
	} catch (e) {
		if (e instanceof GuardError) return { ok: false, reason: e.reason, message: e.message };
		throw e;
	}
}
