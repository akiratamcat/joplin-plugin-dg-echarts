// SPDX-License-Identifier: MIT
// Test helpers: the engine loaded from vendor/echarts (the same files the
// build copies into the plugin), and a quiet canvas for jsdom.
import * as path from 'path';
import { EChartsEngine } from '../../src/contentScript/engine';

export const VENDOR = path.join(__dirname, '..', '..', 'vendor', 'echarts');

export function vendorEngine(): EChartsEngine {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return new EChartsEngine((file) => require(path.join(VENDOR, file)));
}

/**
 * jsdom has no canvas: getContext() logs "not implemented" on the console,
 * which the engine would collect as an ECharts warning. Joplin has a canvas.
 * Returning null makes zrender estimate text widths, as in Node.
 */
export function quietCanvas(): void {
	if (typeof HTMLCanvasElement !== 'undefined') {
		HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
	}
}
