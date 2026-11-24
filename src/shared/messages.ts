// SPDX-License-Identifier: MIT
// Messages between the viewer script (toolbar), the Markdown editor content
// script and the main script (design 7.7, 11).

/** ID of the Markdown-it content script. The viewer posts its messages to it. */
export const MARKDOWN_IT_SCRIPT_ID = 'dgEchartsMarkdownIt';

/** ID of the Markdown editor content script. */
export const CODEMIRROR_SCRIPT_ID = 'dgEchartsCodeMirror';

/** Copy text (SVG markup or the chart's source) to the clipboard. */
export interface CopyTextMessage {
	type: 'copyText';
	text: string;
	/** What was copied, for the confirmation message. */
	what: 'svg' | 'source';
}

/** Copy an image (PNG data URL) to the clipboard. */
export interface CopyImageMessage {
	type: 'copyImage';
	dataUrl: string;
}

/** Save an image to a file in a folder the user chooses. */
export interface SaveFileMessage {
	type: 'saveFile';
	kind: 'svg' | 'png';
	/** SVG markup, or a PNG data URL. */
	data: string;
	/** 1-based position of the chart in the note, used in the file name. */
	index: number;
}

export type ViewerMessage = CopyTextMessage | CopyImageMessage | SaveFileMessage;

/** The Markdown editor content script asks for its settings (design 7.7). */
export interface EditorConfigMessage {
	type: 'getEditorConfig';
}

export interface EditorConfig {
	enabled: boolean;
	/** Extra language names of ECharts fences. */
	aliases: string[];
}

/** Answer to the action messages. */
export interface ActionResult {
	ok: boolean;
	/** The user closed the folder dialog without choosing. */
	cancelled?: boolean;
	/** Saved file. */
	path?: string;
	error?: string;
}
