// SPDX-License-Identifier: MIT
// npm run notices (design 20.4): builds THIRD_PARTY_NOTICES.md (English) and
// THIRD_PARTY_NOTICES.ja.md (Japanese) from the license files of what the
// plugin package contains: the ECharts engine in vendor/echarts (with the d3
// code, ZRender and tslib inside its build), DOMPurify (with the
// regenerator-runtime helper inside its build) and yaml. The license texts
// themselves stay in English in both files. Run it after updating a
// component; scripts/check-licenses.mjs checks that the committed files are
// up to date. (From dg-plantuml.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const NOTICES_FILE = path.join(ROOT, 'THIRD_PARTY_NOTICES.md');
export const NOTICES_FILE_JA = path.join(ROOT, 'THIRD_PARTY_NOTICES.ja.md');

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n').trimEnd();
const fence = '```';

/** A value of the first table of vendor/echarts/SOURCE.md ("| Version | 6.1.0 ..."). */
function sourceRow(name) {
	const m = new RegExp(`^\\|\\s*${name}\\s*\\|\\s*([^|]+?)\\s*\\|`, 'm').exec(read('vendor/echarts/SOURCE.md'));
	if (!m) throw new Error(`"${name}" not found in vendor/echarts/SOURCE.md`);
	return m[1];
}

/** Versions of the bundled components. */
export function versions() {
	const engine = /^([0-9]+\.[0-9]+\.[0-9]+)/.exec(sourceRow('Version'));
	const bundled = sourceRow('Bundled in `echarts.min.js`');
	const zrender = /zrender`\s+([0-9.]+)/.exec(bundled);
	const tslib = /tslib`\s+([0-9.]+)/.exec(bundled);
	if (!engine || !zrender || !tslib) throw new Error('versions not found in vendor/echarts/SOURCE.md');
	return {
		engine: engine[1],
		zrender: zrender[1],
		tslib: tslib[1],
		dompurify: JSON.parse(read('node_modules/dompurify/package.json')).version,
		yaml: JSON.parse(read('node_modules/yaml/package.json')).version,
	};
}

const mit = (copyright) => `MIT License

${copyright}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

/** Header and component table of THIRD_PARTY_NOTICES.md. */
function headerEn(v) {
	return `# Third-party notices

[日本語](THIRD_PARTY_NOTICES.ja.md)

dg-echarts (MIT License, see \`LICENSE\`) bundles the third-party software
below in its plugin package (\`.jpl\`). Their licenses and notices follow.

| Component | Version | License | Website | Where |
| --------- | ------- | ------- | ------- | ----- |
| Apache ECharts (\`echarts\`) | ${v.engine} | Apache-2.0 | <https://echarts.apache.org/> | \`contentScript/engine/\` |
| Parts of d3 (inside ECharts) | as bundled in ECharts ${v.engine} | BSD-3-Clause | <https://github.com/d3/d3> | \`contentScript/engine/echarts.min.js\` |
| ZRender (inside ECharts) | ${v.zrender} | BSD-3-Clause | <https://github.com/ecomfe/zrender> | \`contentScript/engine/echarts.min.js\` |
| tslib (inside ECharts) | ${v.tslib} | 0BSD | <https://github.com/microsoft/tslib> | \`contentScript/engine/echarts.min.js\` |
| DOMPurify | ${v.dompurify} | Apache-2.0 OR MPL-2.0 (used under Apache-2.0) | <https://github.com/cure53/DOMPurify> | \`contentScript/markdownItPlugin.js\` |
| regenerator-runtime (inside DOMPurify) | as bundled in DOMPurify ${v.dompurify} | MIT | <https://github.com/facebook/regenerator> | \`contentScript/markdownItPlugin.js\` |
| YAML (\`yaml\`) | ${v.yaml} | ISC | <https://eemeli.org/yaml/> | \`contentScript/markdownItPlugin.js\` |

---

`;
}

/** Header and component table of THIRD_PARTY_NOTICES.ja.md. */
function headerJa(v) {
	return `# 外部のソフトウェアのライセンス表示

[English](THIRD_PARTY_NOTICES.md)

dg-echarts（MIT ライセンス。\`LICENSE\` を参照）は、プラグインのパッケージ（\`.jpl\`）に
次の外部のソフトウェアを同梱しています。それぞれのライセンスと著作権表示を以下に載せます。
ライセンスの文面は、原文（英語）のまま載せています。

| 名称 | バージョン | ライセンス | 公式サイト | 同梱しているファイル |
| ---- | ---------- | ---------- | ---------- | -------------------- |
| Apache ECharts（\`echarts\`） | ${v.engine} | Apache-2.0 | <https://echarts.apache.org/> | \`contentScript/engine/\` |
| d3 の一部（ECharts に含まれる） | ECharts ${v.engine} に含まれるもの | BSD-3-Clause | <https://github.com/d3/d3> | \`contentScript/engine/echarts.min.js\` |
| ZRender（ECharts に含まれる） | ${v.zrender} | BSD-3-Clause | <https://github.com/ecomfe/zrender> | \`contentScript/engine/echarts.min.js\` |
| tslib（ECharts に含まれる） | ${v.tslib} | 0BSD | <https://github.com/microsoft/tslib> | \`contentScript/engine/echarts.min.js\` |
| DOMPurify | ${v.dompurify} | Apache-2.0 または MPL-2.0（Apache-2.0 を選択して利用） | <https://github.com/cure53/DOMPurify> | \`contentScript/markdownItPlugin.js\` |
| regenerator-runtime（DOMPurify に含まれる） | DOMPurify ${v.dompurify} に含まれるもの | MIT | <https://github.com/facebook/regenerator> | \`contentScript/markdownItPlugin.js\` |
| YAML（\`yaml\`） | ${v.yaml} | ISC | <https://eemeli.org/yaml/> | \`contentScript/markdownItPlugin.js\` |

以下の各節の説明は英語版と同じ内容です（英語のまま載せています）。

---

`;
}

/** License sections, shared by both files. */
function sections(v) {
	return `## Apache ECharts

Source: https://echarts.apache.org/ , npm package \`echarts\` ${v.engine}.
The official minified build and locale files are included unchanged. The
license and notice files shipped with the package follow (also included in
\`contentScript/engine/\` as \`LICENSE\` and \`NOTICE\`).

${fence}text
${read('vendor/echarts/LICENSE')}
${fence}

${fence}text
${read('vendor/echarts/NOTICE')}
${fence}

---

## d3 (parts included in ECharts)

ECharts includes parts of d3 (see the ECharts license above). Their license
follows (also included as \`contentScript/engine/LICENSE-d3\`).

${fence}text
${read('vendor/echarts/LICENSE-d3')}
${fence}

---

## ZRender

Included in the ECharts build (\`echarts.min.js\`), version ${v.zrender}. Its
license follows (also included as \`contentScript/engine/LICENSE-zrender\`).

${fence}text
${read('vendor/echarts/LICENSE-zrender')}
${fence}

---

## tslib

Included in the ECharts build (\`echarts.min.js\`), version ${v.tslib}. Its
license follows (also included as \`contentScript/engine/LICENSE-tslib\`).

${fence}text
${read('vendor/echarts/LICENSE-tslib')}
${fence}

---

## DOMPurify

Source: https://github.com/cure53/DOMPurify , version ${v.dompurify}.
Copyright (c) Cure53 and other contributors.
DOMPurify is dual-licensed under the Apache License 2.0 and the Mozilla Public
License 2.0. dg-echarts uses it under the Apache License 2.0, whose text follows.

${fence}text
${read('node_modules/dompurify/LICENSE')}
${fence}

---

## regenerator-runtime

Included in the DOMPurify distribution files.

${fence}text
${mit('Copyright (c) 2014-present, Facebook, Inc.')}
${fence}

---

## YAML

Source: https://eemeli.org/yaml/ , npm package \`yaml\` ${v.yaml}.

${fence}text
${read('node_modules/yaml/LICENSE')}
${fence}
`;
}

export function buildNotices() {
	const v = versions();
	return headerEn(v) + sections(v);
}

export function buildNoticesJa() {
	const v = versions();
	return headerJa(v) + sections(v);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	fs.writeFileSync(NOTICES_FILE, buildNotices(), 'utf8');
	fs.writeFileSync(NOTICES_FILE_JA, buildNoticesJa(), 'utf8');
	console.log(`${path.relative(ROOT, NOTICES_FILE)} and ${path.relative(ROOT, NOTICES_FILE_JA)} written`);
}
