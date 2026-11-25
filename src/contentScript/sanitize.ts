// SPDX-License-Identifier: MIT
// Sanitises the SVG of the engine before it goes into the HTML (design 12).
// DOMPurify needs a window: the Markdown-it content script runs in Joplin's
// renderer process, which has one (spike round 2).
import createDOMPurify from 'dompurify';

type Purifier = ReturnType<typeof createDOMPurify>;
let purifier: Purifier | null = null;
let purifierWindow: unknown = null;

/**
 * True when a value has a CSS url() that does not point inside the document
 * (url(#id)). Escapes and comments are not expected in ECharts' output, but
 * a backslash or a comment opener counts as external too, to be safe.
 */
export function hasExternalUrl(value: string): boolean {
	const re = /url\s*\(\s*(['"]?)([^)'"]*)/gi;
	let m: RegExpExecArray | null;
	while ((m = re.exec(value)) !== null) {
		if (!/^#[A-Za-z0-9_.:-]*$/.test(m[2].trim())) return true;
	}
	// CSS escapes (u\72 l(...)) or comments could hide a url(); ECharts never writes them.
	return /\\|\/\*/.test(value) && /\(/.test(value);
}

/** The line forms of the <style> that zrender writes (hover styles, animations). */
const CSS_LINES = [
	/^\.zr\d+-[A-Za-z0-9_-]+(:hover)? \{$/, // .zr0-cls-2:hover {
	/^@keyframes zr\d+-[A-Za-z0-9_-]+ \{$/, // @keyframes zr0-ani-0 {
	/^\d+(\.\d+)?% \{$/, // 100% {
	/^\}$/,
	/^d:path\("[A-Za-z0-9 .,+-]*"\);$/, // d:path("M106.5 220l207 0Z");
	/^[a-z-]+:[^;{}"'\\@<>]*;$/, // fill:#5470c6;
];

/**
 * True when the text of a <style> has only the lines zrender writes and no
 * external url(). zrender copies the colours of `emphasis` into :hover rules
 * as they are, so a colour such as "red;}svg{...}" adds any CSS to the note
 * (fixed in 1.0.1; design 12).
 */
export function isChartCss(css: string): boolean {
	if (hasExternalUrl(css)) return false;
	return css.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '')
		.every((l) => CSS_LINES.some((re) => re.test(l)));
}

function getPurifier(win: Window): Purifier {
	if (!purifier || purifierWindow !== win) {
		// DOMPurify's factory takes a window-like object.
		const p = createDOMPurify(win as unknown as Parameters<typeof createDOMPurify>[0]);
		// The SVG profile keeps <image href> with external URLs and <a href>:
		// drop links, and images that are not data:image/ URLs (design 12).
		p.addHook('uponSanitizeAttribute', (node, data) => {
			// A colour or a style can be a CSS url(): ECharts writes a colour
			// value such as "url(https://...)" (backgroundColor, itemStyle.color,
			// borderColor, textStyle.color) into fill or stroke unchecked, and the
			// browser loads it. Only references inside the SVG (url(#zr0-g0) for
			// gradients and clips) are kept (fixed in 1.0.1; design 12).
			if (hasExternalUrl(String(data.attrValue))) {
				// Without fill, SVG paints black: paint nothing instead.
				if (data.attrName === 'fill' || data.attrName === 'stroke') data.attrValue = 'none';
				else data.keepAttr = false;
				return;
			}
			if (data.attrName !== 'href' && data.attrName !== 'xlink:href') return;
			const tag = String(node.nodeName).toLowerCase();
			if (tag === 'a' || (tag === 'image' && !/^data:image\//i.test(String(data.attrValue).trim()))) data.keepAttr = false;
		});
		// A <style> that is not what zrender writes is emptied: the chart loses
		// its hover styles only.
		p.addHook('uponSanitizeElement', (node, data) => {
			if (data.tagName === 'style' && !isChartCss(node.textContent ?? '')) node.textContent = '';
		});
		purifier = p;
		purifierWindow = win;
	}
	return purifier;
}

/** True when a window is available for DOMPurify. */
export function canSanitize(): boolean {
	return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/** Returns a sanitised copy of `svg`. */
export function sanitizeSvg(svg: string, win: Window = window): string {
	return getPurifier(win).sanitize(svg, {
		USE_PROFILES: { svg: true, svgFilters: true },
	}) as string;
}
