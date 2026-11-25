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

/** CSS functions that load nothing (url() is checked by hasExternalUrl). */
const SAFE_FUNCTIONS = new Set([
	'rgb', 'rgba', 'hsl', 'hsla', 'cubic-bezier', 'steps', 'url',
	// Transforms (zrender's animations, such as the ripples of effectScatter).
	'matrix', 'translate', 'translatex', 'translatey', 'scale', 'scalex', 'scaley', 'rotate', 'skew', 'skewx', 'skewy',
]);

/**
 * True when a CSS value loads nothing: no external url(), no other function
 * than SAFE_FUNCTIONS, no escape and no comment. Every way to load a file in
 * CSS needs a function (url(), image-set(), image()...), so allowing only
 * known functions also stops the ones not listed anywhere (fixed in 1.0.2;
 * design 12).
 */
export function isSafeCssValue(value: string): boolean {
	if (hasExternalUrl(value) || /\\|\/\*/.test(value)) return false;
	const re = /([A-Za-z-]*)\s*\(/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(value)) !== null) {
		if (!SAFE_FUNCTIONS.has(m[1].toLowerCase())) return false;
	}
	return true;
}

/**
 * A style attribute without the declarations that could load a file, or ''
 * when none is left. zrender writes fontFamily, fontStyle and fontWeight into
 * style="font-family:...;" as they are, so a value such as
 * "sans-serif;mask-image:image-set('https://...' 1x)" adds a declaration.
 */
export function cleanStyle(value: string): string {
	return value.split(';').map((d) => d.trim())
		.filter((d) => /^[A-Za-z-]+\s*:/.test(d) && isSafeCssValue(d))
		.join(';');
}

/** Presentation attributes whose CSS value can be an image or a reference. */
const CSS_ATTRIBUTES = new Set(['fill', 'stroke', 'cursor', 'mask', 'filter', 'clip-path', 'marker-start', 'marker-mid', 'marker-end']);

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
	// A declaration line also needs a value that loads nothing (1.0.2).
	return css.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '')
		.every((l) => CSS_LINES.some((re) => re.test(l)) && (/[{}]$/.test(l) || l.startsWith('d:path(') || isSafeCssValue(l)));
}

function getPurifier(win: Window): Purifier {
	if (!purifier || purifierWindow !== win) {
		// DOMPurify's factory takes a window-like object.
		const p = createDOMPurify(win as unknown as Parameters<typeof createDOMPurify>[0]);
		// The SVG profile keeps <image href> with external URLs and <a href>:
		// drop links, and images that are not data:image/ URLs (design 12).
		p.addHook('uponSanitizeAttribute', (node, data) => {
			const name = data.attrName;
			// The style attribute keeps only declarations that load nothing (1.0.2).
			if (name === 'style') {
				const style = cleanStyle(String(data.attrValue));
				if (style === '') data.keepAttr = false;
				else data.attrValue = style;
				return;
			}
			// CSS values in presentation attributes: same rule as the style attribute.
			if (CSS_ATTRIBUTES.has(name) && !isSafeCssValue(String(data.attrValue))) {
				// Without fill, SVG paints black: paint nothing instead.
				if (name === 'fill' || name === 'stroke') data.attrValue = 'none';
				else data.keepAttr = false;
				return;
			}
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
