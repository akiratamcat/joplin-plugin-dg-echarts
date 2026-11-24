// SPDX-License-Identifier: MIT
// Language of the texts the renderer writes (error boxes, notes, chart names):
// Joplin's display language, from the hidden setting the main script copies
// (design 10.3, 10.4).
import { Translator } from '../i18n/gettext';
import { translatorFor } from '../i18n/translators';
import { KEYS } from '../shared/settingKeys';
import { PluginOptions } from './renderConfig';

export function uiTranslator(options: PluginOptions | null | undefined): Translator {
	let value: unknown;
	try {
		value = options && typeof options.settingValue === 'function' ? options.settingValue(KEYS.locale) : '';
	} catch {
		value = '';
	}
	return translatorFor(typeof value === 'string' ? value : '');
}
