// SPDX-License-Identifier: MIT
// dg-echarts: build of the viewer script (the toolbar) (src/contentScript/viewer.ts).
// The viewer script is an asset of the Markdown-it plugin that the note viewer
// loads with a <script> element, so it is built as a classic browser script,
// not as a CommonJS module like the other extra scripts. It is kept in this
// file so that webpack.config.js (from the plugin generator) changes little.
const path = require('path');

module.exports = (rootDir) => ({
	mode: 'production',
	target: 'web',
	stats: 'errors-only',
	entry: './src/contentScript/viewer.ts',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				loader: 'ts-loader',
			},
		],
	},
	resolve: {
		extensions: ['.ts', '.js', '.json'],
	},
	output: {
		filename: 'viewer.js',
		path: path.resolve(rootDir, 'dist', 'contentScript'),
	},
});
