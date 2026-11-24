// SPDX-License-Identifier: MIT
// Package checks: metadata, and the vendored engine against vendor/echarts/SOURCE.md.
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ENGINE_VERSION, LOCALE_FILES } from '../src/contentScript/engine';

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src', 'manifest.json'), 'utf8'));
const vendor = path.join(root, 'vendor', 'echarts');
const source = fs.readFileSync(path.join(vendor, 'SOURCE.md'), 'utf8');

function sha256(file: string): string {
	return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

describe('package metadata', () => {
	test('manifest and package.json have the same version', () => {
		expect(manifest.version).toBe(pkg.version);
	});

	test('names and IDs (D-01)', () => {
		expect(pkg.name).toBe('joplin-plugin-dg-echarts');
		expect(pkg.keywords).toContain('joplin-plugin');
		expect(pkg.files).toContain('publish');
		expect(manifest.id).toBe('io.github.akiratamcat.dg-echarts');
		expect(manifest.name).toBe('dg-echarts');
		expect(manifest.app_min_version).toBe('3.1');
	});

	test('manifest icons are PNG files in the repository (paths from the repository root)', () => {
		expect(Object.keys(manifest.icons).sort()).toEqual(['128', '16', '32', '48']);
		for (const [size, file] of Object.entries<string>(manifest.icons)) {
			const data = fs.readFileSync(path.join(root, file));
			// PNG signature, then the IHDR width and height.
			expect(data.subarray(1, 4).toString('latin1')).toBe('PNG');
			expect(data.readUInt32BE(16)).toBe(Number(size));
			expect(data.readUInt32BE(20)).toBe(Number(size));
		}
	});

	test('manifest screenshots are PNG files in the repository, each with a label', () => {
		expect(manifest.screenshots.length).toBeGreaterThan(0);
		for (const shot of manifest.screenshots as { src: string; label: string }[]) {
			expect(shot.label).toBeTruthy();
			expect(fs.readFileSync(path.join(root, shot.src)).subarray(1, 4).toString('latin1')).toBe('PNG');
		}
	});

	test('no e-mail address in public metadata', () => {
		expect(JSON.stringify({ pkg, manifest })).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
	});
});

describe('vendored engine (D-09)', () => {
	const rows = [...source.matchAll(/^\| `([^`]+)` \| [^|]+ \| `([0-9a-f]{64})` \|/gm)].map((m) => ({ file: m[1], sha: m[2] }));

	test('SOURCE.md lists every file of vendor/echarts', () => {
		const files = fs.readdirSync(vendor).filter((f) => f !== 'SOURCE.md').sort();
		expect(rows.map((r) => r.file).sort()).toEqual(files);
	});

	test.each(rows)('$file matches its SHA-256', ({ file, sha }) => {
		expect(sha256(path.join(vendor, file))).toBe(sha);
	});

	test('the engine version and the locale files agree with SOURCE.md', () => {
		expect(source).toContain(`| Version | ${ENGINE_VERSION} `);
		for (const code of LOCALE_FILES) expect(rows.map((r) => r.file)).toContain(`lang${code}-obj.js`);
	});
});
