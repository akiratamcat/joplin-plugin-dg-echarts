// SPDX-License-Identifier: MIT
// Translators for Joplin's display language (design 10.3), shared by the main
// script and the Markdown-it content script. The catalogs are made from the
// PO files at build time (npm run i18n:compile).
import catalogs from './catalog/catalogs.json';
import { Catalog, resolveLocale, Translator } from './gettext';

const AVAILABLE = ['en', ...Object.keys(catalogs)];
const translators = new Map<string, Translator>();

/** Translator for a Joplin locale ("ja_JP" -> Japanese, unknown -> English). */
export function translatorFor(joplinLocale: string): Translator {
	const locale = resolveLocale(joplinLocale, AVAILABLE);
	let t = translators.get(locale);
	if (!t) {
		t = new Translator(locale, (catalogs as Record<string, Catalog>)[locale] || null);
		translators.set(locale, t);
	}
	return t;
}
