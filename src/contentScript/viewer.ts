// SPDX-License-Identifier: MIT
// Viewer script (an asset of the Markdown-it plugin): adds the toolbar to the
// charts (design 5.1, 11). The charts themselves are already in the HTML, so
// nothing here is needed to show them. Built as a classic browser script by
// webpack.viewer.js.
import { translatorFor } from '../i18n/translators';
import { MARKDOWN_IT_SCRIPT_ID, ViewerMessage } from '../shared/messages';
import { standaloneSvg, svgStringSize, svgToPng } from './image';
import { buildToolbar, ChartActions, TOOLBAR_CLASS } from './toolbar';

interface WebviewApi {
	postMessage(contentScriptId: string, message: unknown): Promise<unknown>;
}

declare global {
	interface Window {
		__dgEchartsViewer?: boolean;
		webviewApi?: WebviewApi;
	}
}

/** PNG background under the chart (design 11): the chart's own background, if any, is drawn over it. */
export const PNG_BACKGROUND = { light: '#ffffff', dark: '#181818' };

function api(): WebviewApi | null {
	const a = window.webviewApi;
	return a && typeof a.postMessage === 'function' ? a : null;
}

/** Sends an action to the main script. The main script shows the result as a toast. */
function post(message: ViewerMessage): void {
	const a = api();
	if (a) a.postMessage(MARKDOWN_IT_SCRIPT_ID, message).catch((e: unknown) => console.warn('dg-echarts:', e));
}

/** The SVG as a file: fixed size instead of the page-width style. */
function fileSvg(svg: string): string {
	const size = svgStringSize(svg);
	return size ? standaloneSvg(svg, size) : svg;
}

function png(svg: string, dark: boolean): Promise<string> {
	return svgToPng(svg, document, { scale: 2, background: dark ? PNG_BACKGROUND.dark : PNG_BACKGROUND.light });
}

const actions: ChartActions = {
	copyText: (text, what) => post({ type: 'copyText', text: what === 'svg' ? fileSvg(text) : text, what }),
	copyImage: (svg, dark) => {
		png(svg, dark).then((dataUrl) => post({ type: 'copyImage', dataUrl }), (e: unknown) => console.warn('dg-echarts: PNG failed', e));
	},
	saveSvg: (svg, index) => post({ type: 'saveFile', kind: 'svg', data: fileSvg(svg), index }),
	savePng: (svg, dark, index) => {
		png(svg, dark).then((dataUrl) => post({ type: 'saveFile', kind: 'png', data: dataUrl, index }), (e: unknown) => console.warn('dg-echarts: PNG failed', e));
	},
};

/**
 * Adds a toolbar to each chart that asks for one (data-echarts-toolbar, set by
 * the Markdown-it plugin from the setting) and has none yet.
 */
export function addToolbars(doc: Document, chartActions: ChartActions = actions): number {
	let added = 0;
	const blocks = Array.from(doc.querySelectorAll<HTMLElement>('.joplin-echarts'));
	blocks.forEach((block, i) => {
		if (block.dataset.echartsToolbar !== '1' || block.querySelector(`:scope > .${TOOLBAR_CLASS}`)) return;
		const svg = block.querySelector(':scope > .joplin-echarts-output > svg');
		if (!svg) return;
		const source = block.querySelector(':scope > pre.joplin-source');
		const bar = buildToolbar(doc, translatorFor(block.dataset.echartsLang || ''), {
			svg: svg.outerHTML,
			source: source ? source.textContent || '' : '',
			dark: block.dataset.echartsTheme === 'dark',
			index: i + 1,
		}, chartActions);
		block.appendChild(bar);
		added++;
	});
	return added;
}

/** A tap on a chart shows its toolbar (touch screens have no hover, design 11). */
function handleChartTap(event: MouseEvent): void {
	const target = event.target as Element | null;
	if (!target || typeof target.closest !== 'function' || target.closest('button')) return;
	const block = target.closest('.joplin-echarts');
	if (!block || !block.querySelector(`:scope > .${TOOLBAR_CLASS}`)) return;
	document.querySelectorAll('.joplin-echarts-tools-open').forEach((el) => { if (el !== block) el.classList.remove('joplin-echarts-tools-open'); });
	block.classList.toggle('joplin-echarts-tools-open');
}

function start(): void {
	// Joplin may run the asset again; once per page is enough. Without the
	// main script (an exported HTML file), the buttons could do nothing.
	if (window.__dgEchartsViewer || !api()) return;
	window.__dgEchartsViewer = true;
	const check = () => { addToolbars(document); };
	document.addEventListener('click', handleChartTap);
	document.addEventListener('joplin-noteDidUpdate', check);
	// Backup for pages that do not send joplin-noteDidUpdate.
	const observe = () => {
		if (!document.body) return;
		new MutationObserver(check).observe(document.body, { childList: true, subtree: true });
		check();
	};
	if (document.body) observe();
	else document.addEventListener('DOMContentLoaded', observe);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') start();
