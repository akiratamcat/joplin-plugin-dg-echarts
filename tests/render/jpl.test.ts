// SPDX-License-Identifier: MIT
// The built .jpl carries the engine byte for byte (design 15.1, D-09).
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as tar from 'tar';
import { ROOT } from './renderPage';

const JPL = path.join(ROOT, 'publish', 'io.github.akiratamcat.dg-echarts.jpl');
const VENDOR = path.join(ROOT, 'vendor', 'echarts');

function sha256(data: Buffer): string {
	return crypto.createHash('sha256').update(data).digest('hex');
}

async function jplFiles(): Promise<Map<string, Buffer>> {
	const files = new Map<string, Buffer>();
	await tar.t({
		file: JPL,
		onReadEntry: (entry) => {
			const chunks: Buffer[] = [];
			entry.on('data', (c: Buffer) => chunks.push(c));
			entry.on('end', () => files.set(entry.path.replace(/^\.?\//, ''), Buffer.concat(chunks)));
		},
	});
	return files;
}

describe('.jpl contents', () => {
	let files: Map<string, Buffer>;

	beforeAll(async () => {
		files = await jplFiles();
	});

	test('the engine, the locales and their licenses are the vendored files', () => {
		const vendored = fs.readdirSync(VENDOR).filter((f) => f !== 'SOURCE.md');
		for (const name of vendored) {
			const packed = files.get(`contentScript/engine/${name}`);
			expect(packed).toBeDefined();
			expect(sha256(packed as Buffer)).toBe(sha256(fs.readFileSync(path.join(VENDOR, name))));
		}
	});

	test('the plugin files are there, and nothing from vendor/ besides the engine folder', () => {
		for (const name of ['index.js', 'manifest.json', 'LICENSE', 'contentScript/markdownItPlugin.js', 'contentScript/echarts.css']) {
			expect(files.has(name)).toBe(true);
		}
		expect([...files.keys()].filter((n) => n.includes('SOURCE.md'))).toEqual([]);
	});
});
