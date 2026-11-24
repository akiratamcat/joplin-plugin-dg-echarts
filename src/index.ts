// SPDX-License-Identifier: MIT
import joplin from 'api';
import { ContentScriptType, ToastType } from 'api/types';
import { ActionDeps, ActionState, handleAction } from './actions';
import { translatorFor } from './i18n/translators';
import { SECTION, settingItems, settingsSection } from './settings';
import { parseAliases } from './shared/fence';
import { CODEMIRROR_SCRIPT_ID, EditorConfig, MARKDOWN_IT_SCRIPT_ID, ViewerMessage } from './shared/messages';
import { KEYS } from './shared/settingKeys';

/** Joins a folder and a file name with the folder's own separator (no Node.js path module in the plugin). */
function joinPath(folder: string, name: string): string {
	const sep = folder.includes('\\') && !folder.includes('/') ? '\\' : '/';
	return /[\\/]$/.test(folder) ? `${folder}${name}` : `${folder}${sep}${name}`;
}

const TOAST_TYPES = { info: ToastType.Info, success: ToastType.Success, error: ToastType.Error };

joplin.plugins.register({
	onStart: async function() {
		// Joplin's display language (design 10.3). Joplin asks for a restart
		// when it changes, so it is read once.
		const locale = String(await joplin.settings.globalValue('locale') || '');
		const t = translatorFor(locale);

		await joplin.settings.registerSection(SECTION, settingsSection(t));
		await joplin.settings.registerSettings(settingItems(t));

		// Copied into a hidden setting that the renderer reads (design 9, 10.4;
		// options.globalSettings does not have it, V-15). A changed setting
		// makes Joplin draw the note again, so it is only written when it changed.
		if (await joplin.settings.value(KEYS.locale) !== locale) await joplin.settings.setValue(KEYS.locale, locale);

		// Draws ECharts fences while Joplin renders Markdown (design 5.1, 7.1).
		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			MARKDOWN_IT_SCRIPT_ID,
			'./contentScript/markdownItPlugin.js',
		);

		// JSON / YAML highlighting in the Markdown editor (design 7.7).
		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			CODEMIRROR_SCRIPT_ID,
			'./contentScript/codeMirrorPlugin.js',
		);
		await joplin.contentScripts.onMessage(CODEMIRROR_SCRIPT_ID, async (message: { type?: string }): Promise<EditorConfig | null> => {
			if (!message || message.type !== 'getEditorConfig') return null;
			const values = await joplin.settings.values([KEYS.editorHighlight, KEYS.fenceAliases]);
			return {
				enabled: values[KEYS.editorHighlight] !== false,
				aliases: typeof values[KEYS.fenceAliases] === 'string' ? parseAliases(values[KEYS.fenceAliases] as string) : [],
			};
		});

		// Toolbar actions (design 11), through the Joplin API.
		const fs = joplin.require('fs-extra');
		const deps: ActionDeps = {
			t,
			writeText: (text) => joplin.clipboard.writeText(text),
			writeImage: (dataUrl) => joplin.clipboard.writeImage(dataUrl),
			chooseFolder: async (defaultPath) => {
				const chosen = await joplin.views.dialogs.showOpenDialog({
					title: t._('Choose a folder to save the chart in'),
					properties: ['openDirectory', 'createDirectory'],
					...(defaultPath ? { defaultPath } : {}),
				});
				return chosen && chosen.length ? chosen[0] : null;
			},
			exists: (path) => fs.pathExists(path),
			writeFile: (path, data) => fs.writeFile(path, data),
			joinPath,
			noteTitle: async () => {
				const note = await joplin.workspace.selectedNote();
				return note && note.title ? String(note.title) : '';
			},
			toast: (message, kind) => joplin.views.dialogs.showToast({ message, type: TOAST_TYPES[kind], duration: 4000 }),
		};
		const state: ActionState = {};
		await joplin.contentScripts.onMessage(MARKDOWN_IT_SCRIPT_ID, async (message: ViewerMessage) => {
			if (!message || typeof message !== 'object') return null;
			return handleAction(message, deps, state);
		});
	},
});
