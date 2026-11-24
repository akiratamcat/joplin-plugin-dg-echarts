// SPDX-License-Identifier: MIT
// Markdown-it content script (design 5, 7): draws ECharts fences while Joplin
// turns Markdown into HTML, and puts the sanitised SVG straight into the HTML.
// The same HTML works in the note viewer, the Rich Text editor and exports
// (PDF, HTML), without any viewer script (spike round 2, lessons 1.1).
// The HTML follows the structure of Joplin's own code blocks and Mermaid
// (joplin-editable + pre.joplin-source), so that the Rich Text editor shows
// and edits the source without losing it.
import { isEChartsLanguage, parseInfo } from '../shared/fence';
import { cacheKey, LruCache } from './cache';
import { EChartsEngine } from './engine';
import { adjustOption, REMOVE_LABEL_BORDERS } from './engineTheme';
import { applyFontSizes, smallestFontSize } from './fontSize';
import { parseInput } from './input';
import { guardInput } from './inputGuard';
import { checkOption } from './optionCheck';
import { globalConfig, PluginOptions, renderConfig, RenderConfig } from './renderConfig';
import { canSanitize, sanitizeSvg } from './sanitize';
import manifest from '../manifest.json';
import { ENGLISH, Translator } from '../i18n/gettext';
import { uiTranslator } from './uiLanguage';

/* eslint-disable @typescript-eslint/no-explicit-any -- markdown-it is untyped here */

export function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface FenceToken {
	info: string;
	markup: string;
	content: string;
}

/** What a block shows: the output (SVG or error box) and the notes. Cached. */
export interface BlockOutput {
	ok: boolean;
	/** HTML of the output element's content. */
	output: string;
	/** Plain-text notes shown under the chart. */
	notes: string[];
	/** Name of the chart for screen readers. */
	label: string;
}

/** Lines shown around the line of a syntax error. */
const EXCERPT_CONTEXT = 2;

/** HTML of an error box: message, line and an excerpt of the source (design 7.4). */
export function errorBox(message: string, source?: string, line?: number, t: Translator = ENGLISH): string {
	const parts = [`<div class="joplin-echarts-error" role="alert"><div class="joplin-echarts-error-message">${escapeHtml(message)}</div>`];
	if (source !== undefined && line !== undefined && line >= 1) {
		const lines = source.split('\n');
		const from = Math.max(1, line - EXCERPT_CONTEXT);
		const to = Math.min(lines.length, line + EXCERPT_CONTEXT);
		const width = String(to).length;
		const rows: string[] = [];
		for (let n = from; n <= to; n++) {
			const text = `${String(n).padStart(width, ' ')} | ${lines[n - 1] ?? ''}`;
			rows.push(n === line ? `<mark>${escapeHtml(text)}</mark>` : escapeHtml(text));
		}
		parts.push(`<div class="joplin-echarts-error-line">${escapeHtml(t._('Line {line}', { line }))}</div><pre class="joplin-echarts-excerpt">${rows.join('\n')}</pre>`);
	}
	parts.push('</div>');
	return parts.join('');
}

/** Name of the chart for screen readers: "ECharts chart", plus the title if any (design 11). */
export function chartLabel(option: Record<string, unknown> | null, t: Translator = ENGLISH): string {
	// TRANSLATORS: Name of a chart for screen readers. "ECharts" is not translated.
	const base = t._('ECharts chart');
	if (!option) return base;
	const title = Array.isArray(option.title) ? option.title[0] : option.title;
	const text = title && typeof title === 'object' ? (title as Record<string, unknown>).text : undefined;
	// TRANSLATORS: Name of a chart for screen readers; {title} is the title of the chart.
	return typeof text === 'string' && text.trim() ? t._('ECharts chart: {title}', { title: text.trim() }) : base;
}

/** Draws one chart: parse, guard, check, adjust, render, sanitise (design 5.2 step 4). */
export function drawChart(source: string, config: RenderConfig, maxSourceLength: number, engine: EChartsEngine, t: Translator = ENGLISH): BlockOutput {
	const box = (message: string, src?: string, line?: number) => errorBox(message, src, line, t);
	const parsed = parseInput(source, maxSourceLength, t);
	if (!parsed.ok) {
		// The parser's own message (from JSON.parse or yaml) stays in English.
		const message = parsed.reason !== 'syntax' ? parsed.message
			: parsed.format === 'json' ? t._('JSON syntax error: {message}', { message: parsed.message })
				: t._('YAML syntax error: {message}', { message: parsed.message });
		return { ok: false, output: box(message, source, parsed.line), notes: [], label: chartLabel(null, t) };
	}
	const guarded = guardInput(parsed.value, t);
	if (!guarded.ok) return { ok: false, output: box(guarded.message), notes: [], label: chartLabel(null, t) };

	const option = guarded.option;
	const label = chartLabel(option, t);
	const notes: string[] = [];
	if (guarded.removedImages) notes.push(t._('Images are not shown (the plugin does not load images).'));
	const check = checkOption(option, t);
	notes.push(...check.notes);
	if (check.errors.length > 0) return { ok: false, output: box(check.errors.join('\n')), notes, label };
	if (check.empty) return { ok: false, output: '', notes, label };

	if (!canSanitize()) return { ok: false, output: box(t._('The chart cannot be drawn here (no window to sanitise the output).')), notes, label };
	try {
		engine.init();
	} catch (e) {
		return { ok: false, output: box(t._('The ECharts engine could not be loaded: {message}', { message: (e as Error).message })), notes, label };
	}
	const adjusted = applyFontSizes(adjustOption(option, config), config.fontSizes);
	const result = engine.render(adjusted, { theme: config.theme, width: config.width, height: config.height, locale: config.locale });
	if (!result.ok) {
		return { ok: false, output: box(t._('ECharts could not draw the chart: {message}', { message: result.message })), notes, label };
	}
	for (const w of result.warnings) notes.push(`ECharts: ${w}`);
	// Design 8.7: report texts the smallest font size did not reach (for diagnostics only).
	const smallest = smallestFontSize(result.svg);
	if (config.fontSizes.min > 0 && smallest !== null && smallest < config.fontSizes.min) {
		console.info(`dg-echarts: a text of ${smallest}px is smaller than the smallest font size (${config.fontSizes.min}px)`);
	}
	return { ok: true, output: sanitizeSvg(result.svg), notes, label };
}

/** HTML of one block (design 7.1). */
export function blockHtml(token: FenceToken, config: RenderConfig, out: BlockOutput, lang = 'en'): string {
	const info = (token.info || '').trim();
	// Same as Joplin's own code blocks: the last newline of the content goes to
	// the close fence ("&#10;" + fence). Joplin's edit dialog rebuilds the block
	// as open + source + close (lessons of the base plugin 1.4).
	const source = token.content.replace(/\n$/, '');
	const notes = out.notes.length > 0
		? `<div class="joplin-echarts-notes">${out.notes.map((n) => `<div class="joplin-echarts-note">${escapeHtml(n)}</div>`).join('')}</div>`
		: '';
	return [
		// data-echarts-toolbar and data-echarts-lang tell the viewer script whether to add the
		// toolbar and in which language (design 11); the chart itself needs no script.
		`<div class="joplin-editable joplin-echarts joplin-echarts-align-${config.align}" data-echarts-theme="${config.theme}" data-echarts-lang="${escapeHtml(lang)}"${out.ok && config.toolbar ? ' data-echarts-toolbar="1"' : ''}>`,
		'<pre class="joplin-source"',
		` data-joplin-language="${escapeHtml(info)}"`,
		` data-joplin-source-open="${escapeHtml(token.markup + info)}&#10;"`,
		` data-joplin-source-close="&#10;${escapeHtml(token.markup)}">`,
		escapeHtml(source),
		'</pre>',
		`<div class="joplin-echarts-output" role="figure" aria-label="${escapeHtml(out.label)}">${out.output}</div>`,
		notes,
		'</div>\n',
	].join('');
}

/** Charts that take longer are reported on the console (V-14). */
const SLOW_CHART_MS = 200;

const engine = new EChartsEngine();
const cache = new LruCache<BlockOutput>(100);

/** Renders one fence token, using the cache (design 7.2). */
export function renderFence(token: FenceToken, options: PluginOptions | null | undefined, eng: EChartsEngine = engine, store: LruCache<BlockOutput> = cache): string {
	const global = globalConfig(options);
	const t = uiTranslator(options);
	store.setLimit(global.cacheSize);
	const config = renderConfig(options, parseInfo(token.info || '').options);
	const source = token.content.replace(/\n$/, '');
	const key = cacheKey(source, {
		theme: config.theme,
		background: config.background,
		width: config.width,
		height: config.height,
		locale: config.locale,
		ui: t.locale,
		baseFont: config.fontSizes.base,
		minFont: config.fontSizes.min,
		labels: REMOVE_LABEL_BORDERS === 'export' ? config.exporting : REMOVE_LABEL_BORDERS,
		max: global.maxSourceLength,
		engine: eng.version,
		plugin: manifest.version,
	});
	let out = store.get(key);
	if (!out) {
		const start = Date.now();
		try {
			out = drawChart(source, config, global.maxSourceLength, eng, t);
		} catch (e) {
			// Never break the rendering of the whole note.
			out = { ok: false, output: errorBox(t._('The chart could not be drawn: {message}', { message: e instanceof Error ? e.message : String(e) }), undefined, undefined, t), notes: [], label: chartLabel(null, t) };
		}
		store.set(key, out);
		// V-14: the note waits while a chart is drawn. Slow charts are reported
		// in the developer tools (Help > Toggle development tools).
		const ms = Date.now() - start;
		if (ms >= SLOW_CHART_MS) console.info(`dg-echarts: a chart of ${source.length} characters took ${ms} ms to draw`);
	}
	return blockHtml(token, config, out, t.locale);
}

export default function(_context: unknown) {
	return {
		plugin: function(markdownIt: any, pluginOptions: PluginOptions) {
			const defaultRender = markdownIt.renderer.rules.fence || function(tokens: any, idx: number, options: any, env: any, self: any) {
				return self.renderToken(tokens, idx, options, env, self);
			};
			markdownIt.renderer.rules.fence = function(tokens: any, idx: number, options: any, env: any, self: any) {
				const token = tokens[idx];
				// Read on every block: the settings can change while Joplin runs.
				if (!isEChartsLanguage(parseInfo(token.info || '').language, globalConfig(pluginOptions).aliases)) {
					return defaultRender(tokens, idx, options, env, self);
				}
				return renderFence(token, pluginOptions);
			};
		},
		assets: function() {
			return [{ name: 'echarts.css' }, { name: 'viewer.js' }];
		},
	};
}
