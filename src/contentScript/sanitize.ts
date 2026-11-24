// SPDX-License-Identifier: MIT
// Sanitises the SVG of the engine before it goes into the HTML (design 12).
// DOMPurify needs a window: the Markdown-it content script runs in Joplin's
// renderer process, which has one (spike round 2).
import createDOMPurify from 'dompurify';

type Purifier = ReturnType<typeof createDOMPurify>;
let purifier: Purifier | null = null;
let purifierWindow: unknown = null;

function getPurifier(win: Window): Purifier {
	if (!purifier || purifierWindow !== win) {
		// DOMPurify's factory takes a window-like object.
		const p = createDOMPurify(win as unknown as Parameters<typeof createDOMPurify>[0]);
		// The SVG profile keeps <image href> with external URLs and <a href>:
		// drop links, and images that are not data:image/ URLs (design 12).
		p.addHook('uponSanitizeAttribute', (node, data) => {
			if (data.attrName !== 'href' && data.attrName !== 'xlink:href') return;
			const tag = String(node.nodeName).toLowerCase();
			if (tag === 'a' || (tag === 'image' && !/^data:image\//i.test(String(data.attrValue).trim()))) data.keepAttr = false;
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
