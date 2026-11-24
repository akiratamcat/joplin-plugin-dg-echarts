// SPDX-License-Identifier: MIT
// npm run docs: copies each Japanese document (README.ja.md, CONTRIBUTING.ja.md,
// SECURITY.ja.md, CHANGELOG.ja.md) into the Japanese half of its English
// document. GitHub and the Joplin plugin site show only the English file, so
// these files have the English text first and the Japanese text after it
// (owner's decision, 2026-11-24). The *.ja.md file stays the file to edit; the
// part between the ja:start and ja:end markers is generated from it (title and
// language link left out, headings one level down). npm run docs:check (run by
// npm run test:unit) fails when an English file is out of date.
// (From dg-plantuml's scripts/readme.mjs, for several documents.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DOCUMENTS = ['README', 'CONTRIBUTING', 'SECURITY', 'CHANGELOG'];
const START = '<!-- ja:start -->';
const END = '<!-- ja:end -->';

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

/** A *.ja.md file as the Japanese half: no title, no link to the English file, headings one level down. */
export function japaneseSection(ja) {
	const out = [];
	let fence = null;
	for (const [i, line] of ja.split('\n').entries()) {
		const f = /^(`{3,}|~{3,})/.exec(line);
		if (fence) {
			if (f && f[1][0] === fence[0] && f[1].length >= fence.length && line.trim() === f[1]) fence = null;
		} else if (f) {
			fence = f[1];
		} else {
			if (i === 0 && line.startsWith('# ')) continue;
			if (/^\[English( README)?\]\([A-Z_]+\.md\)$/.test(line.trim())) continue;
			if (/^#{1,5} /.test(line)) {
				out.push(`#${line}`);
				continue;
			}
		}
		out.push(line);
	}
	return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** The English document with its Japanese half rebuilt from the *.ja.md file. */
export function build(name) {
	const en = read(path.join(ROOT, `${name}.md`));
	const start = en.indexOf(START);
	const end = en.indexOf(END);
	if (start < 0 || end < start) throw new Error(`${name}.md needs the markers ${START} and ${END}`);
	return `${en.slice(0, start + START.length)}\n\n${japaneseSection(read(path.join(ROOT, `${name}.ja.md`)))}\n\n${en.slice(end)}`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	const check = process.argv.includes('--check');
	let stale = 0;
	for (const name of DOCUMENTS) {
		const file = path.join(ROOT, `${name}.md`);
		const built = build(name);
		if (check) {
			if (read(file) !== built) {
				console.error(`${name}.md is out of date: run npm run docs`);
				stale++;
			}
		} else {
			fs.writeFileSync(file, built, 'utf8');
			console.log(`${name}.md written`);
		}
	}
	if (check) {
		if (stale) process.exit(1);
		console.log('docs check: OK');
	}
}
