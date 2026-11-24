// SPDX-License-Identifier: MIT
// SVG -> PNG in the viewer (design 11, "Copy PNG" / "Save PNG"). From
// dg-plantuml; the size comes from the viewBox, because the chart's SVG has no
// width and height (it follows the page width, engine.ts fitSvg).

export interface PngOptions {
	/** Pixels per SVG unit (2 gives a sharp image on high-density screens). */
	scale: number;
	/** Background colour under the chart (a transparent PNG of a dark chart is unreadable on a light page). */
	background: string;
}

/** Size of an SVG string from its root viewBox (or width and height), or null. */
export function svgStringSize(svg: string): { width: number; height: number } | null {
	const root = /^\s*<svg\b[^>]*>/.exec(svg);
	if (!root) return null;
	const vb = /\sviewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/i.exec(root[0]);
	if (vb) return { width: Number(vb[1]), height: Number(vb[2]) };
	const w = /\swidth="([\d.]+)"/.exec(root[0]);
	const h = /\sheight="([\d.]+)"/.exec(root[0]);
	return w && h ? { width: Number(w[1]), height: Number(h[1]) } : null;
}

/** The SVG with a fixed width and height (instead of the page-width style), so that it can be drawn as an image or saved. */
export function standaloneSvg(svg: string, size: { width: number; height: number }): string {
	let out = svg.trim().replace(/^<svg\s+style="[^"]*"/, '<svg');
	if (!/^<svg[^>]*\swidth=/.test(out)) out = out.replace(/^<svg/, `<svg width="${size.width}"`);
	if (!/^<svg[^>]*\sheight=/.test(out)) out = out.replace(/^<svg/, `<svg height="${size.height}"`);
	if (!/^<svg[^>]*\sxmlns=/.test(out)) out = out.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
	return out;
}

/** Draws the SVG on a canvas and returns a PNG data URL. */
export function svgToPng(svg: string, doc: Document, opts: PngOptions): Promise<string> {
	const size = svgStringSize(svg);
	if (!size) return Promise.reject(new Error('The chart has no size.'));
	const view = doc.defaultView;
	if (!view) return Promise.reject(new Error('No window.'));
	return new Promise((resolve, reject) => {
		const img = new view.Image();
		img.onload = () => {
			try {
				const canvas = doc.createElement('canvas');
				canvas.width = Math.ceil(size.width * opts.scale);
				canvas.height = Math.ceil(size.height * opts.scale);
				const ctx = canvas.getContext('2d');
				if (!ctx) throw new Error('No canvas.');
				ctx.fillStyle = opts.background;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				resolve(canvas.toDataURL('image/png'));
			} catch (e) {
				reject(e);
			}
		};
		img.onerror = () => reject(new Error('The chart could not be drawn as an image.'));
		img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(standaloneSvg(svg, size))}`;
	});
}
