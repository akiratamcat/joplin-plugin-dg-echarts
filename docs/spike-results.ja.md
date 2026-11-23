# Apache ECharts 試作の結果の記録（段階A）

| 項目 | 内容 |
| --- | --- |
| 対象のエンジン | Apache ECharts（`{key}` = `echarts`） |
| 工程 | 試作（スパイク）の段階A（調査。コードは書かない）。開発の指示文書の「01 試作」の 3.1節に従った |
| 調査日 | 2026-11-23 |
| 調査の方法 | npm のレジストリ、GitHub の脆弱性データベース、`npm pack` で取得したパッケージ（インストールのスクリプトは実行しない）の中身と配布ファイルの静的検査 |
| 状態 | 段階A を完了。次は段階B（8章） |
| 経緯 | エンジンの選定と開発の指示文書は、作者の非公開の作業用リポジトリで作った。この記録もそこで作り、このリポジトリを作ったときに移した。02 の工程（設計）で、設計書の「前提となる技術要素」の節に移す |
| 用語 | 「条件書」はエンジンの採否の判定基準、「個別事項」は開発の指示文書のうちエンジンごとの事項（P-1〜P-17）。どちらも非公開の作業用リポジトリにある。「基準プラグイン」は [dg-plantuml](https://github.com/akiratamcat/joplin-plugin-dg-plantuml)、「教訓」はその `docs/lessons-learned.ja.md` |
| 作成方法 | 生成 AI（Anthropic の Claude）が作成し、オーナーが確認する |

## 1. 結論

- **試作で使う版は `echarts` 6.1.0** とする（最新版。2026-05-19 公開で、2週間以上たっている）。6.1.0 より前の版には XSS の脆弱性がある（2.2節）ので、**6.1.0 以上が必須**。
- ライセンスは条件書 G-1〜G-3 を満たす。ただし、ECharts の `LICENSE` に、d3.js の一部を取り込んだことと、その BSD-3-Clause のライセンス文（`licenses/LICENSE-d3`）が書かれている。これも同梱する（個別事項の P-15 に反映済み）。
- 静的検査では、Worker、WASM、通信の API（`fetch`、`XMLHttpRequest`、`WebSocket`）、`import()` は見つからなかった。動的なコード生成は1か所あるが、描画では通らない。
- **ただし、入力に書いた画像の URL は、SVG を作る途中でエンジン自身が `new Image()` で読みに行く**。出力の SVG の無害化だけでは止まらないので、エンジンに渡す前に入力から取り除くことが必須（4章）。
- 机上の評価での判定（採用推奨）は変わらない。必須の条件 D-3、D-4 などは段階B で確かめる。

## 2. 版とライセンス（手順 2、3）

### 2.1 版

| パッケージ | 選んだ版 | 公開日 | 備考 |
| --- | --- | --- | --- |
| `echarts` | 6.1.0 | 2026-05-19 | 最新版（`latest`）。次の版（`rc`）はまだない |
| `zrender` | 6.1.0 | 2026-05-04 | ECharts の描画の土台。`echarts` の依存（版は固定 `6.1.0`）。配布ファイル（`dist/`）には取り込み済みで、別に同梱しない |
| `tslib` | 2.3.0 | − | `echarts` の依存（版は固定）。補助関数が配布ファイルに取り込み済み |

ECharts と一緒に同梱する予定のもの（ビューアで使う）:

| パッケージ | 推奨する版 | 公開日 | ライセンス | 備考 |
| --- | --- | --- | --- | --- |
| `dompurify` | 3.4.17 | 2026-10-12 | MPL-2.0 OR Apache-2.0 | 基準プラグインと同じ版。3.4.18（11-14）と 3.5.0（11-22）は公開から2週間たっていない（[基準プラグインの教訓](https://github.com/akiratamcat/joplin-plugin-dg-plantuml/blob/main/docs/lessons-learned.ja.md)の 1.11節） |
| `yaml` | 2.9.1 | 2026-09-11 | ISC | YAML に対応する場合だけ（02 の工程でオーナーが決める）。3.0 は開発版 |

### 2.2 既知の脆弱性（GitHub の脆弱性データベース）

| ID | 対象 | 内容 | 影響 |
| --- | --- | --- | --- |
| GHSA-fgmj-fm8m-jvvx（中、2026-05-26） | `echarts` 6.1.0 未満 | Lines の系列のツールチップで、`series.data[i].name` の文字列が HTML のまま `innerHTML` に入る（XSS） | 6.1.0 で修正済み。**6.1.0 未満は使わない** |
| GHSA-fhv8-fx5f-7fxf（中、2021-09-20） | `zrender` 5.2.1 未満、4.3.3 未満 | `merge` と `clone` のプロトタイプ汚染 | 6.1.0 は対象外 |

### 2.3 ライセンス

| もの | ライセンス | 確かめたファイル | 同梱するもの |
| --- | --- | --- | --- |
| ECharts | Apache-2.0 | `LICENSE`、`NOTICE`、`package.json` | `LICENSE`（全文）と `NOTICE` |
| ECharts に取り込まれた d3.js の一部（treemap、tree、graph の配置、数値の処理） | BSD-3-Clause（Copyright 2010-2016 Mike Bostock） | `LICENSE` の「Apache ECharts Subcomponents」の節、`licenses/LICENSE-d3` | `licenses/LICENSE-d3` |
| zrender | BSD-3-Clause（Copyright (c) 2017, Baidu Inc.） | `zrender` の `LICENSE`、`package.json` | `LICENSE` |
| tslib | 0BSD | `tslib` の `LICENSE.txt` | 表示の義務はないが、一覧には載せる |

いずれも条件書 G-1 の許可リストに入る。フォント、アイコン、画像などの付属データは、使う予定の配布ファイルに含まれない（G-3）。

## 3. 配布ファイルの形（個別事項の P-3、P-4 の確かめ）

### 3.1 配布ファイルの種類と大きさ

| ファイル | 形式 | 大きさ | 内容 |
| --- | --- | --- | --- |
| `dist/echarts.esm.min.mjs` | ES モジュール | 1,121,654 バイト | 全部入り |
| `dist/echarts.min.js` | UMD | 1,121,883 バイト | 全部入り |
| `dist/echarts.common.min.js` | UMD | 715,020 バイト | よく使う図だけ |
| `dist/echarts.simple.min.js` | UMD | 500,315 バイト | 最小限の図だけ |

**ES モジュールの形があるのは全部入りだけ**だった。common と simple は UMD だけで、`<script>` で読むと、グローバル変数 `echarts` を作る（条件書 A-8 の副作用）。

選べる方法は次の3つ。

| 方法 | 良い点 | 注意する点 |
| --- | --- | --- |
| (a) 全部入りの ES モジュールを `import()` で読む | 基準プラグインと同じ読み込み方（教訓 1.2節）。グローバル変数を作らない。取得元のファイルと同じであることを SHA-256 で確かめられる（教訓 1.8節） | 1.12MB |
| (b) common の UMD を `<script>` で読む | 0.72MB | グローバル変数 `echarts` を作る。ビューアの CSP で動的な `<script>` を使えるかを確かめる必要がある |
| (c) `echarts/core` から、SVG の描画と使う図の種類だけを webpack でまとめる（ECharts の公式の推奨の方法） | 最も小さい。Canvas の描画の部分を省ける | 取得元のファイルと同じかを確かめられない。どの図の種類を入れるかを決める必要がある |

**段階B は (a) で行う**。大きさと読み込みの時間（B-5）を測り、(c) にするかは 02 の工程で決める（6章の Q-2）。

### 3.2 テーマ

- `default` と `dark` のテーマは、配布ファイルの本体に入っている（`registerTheme('dark', ...)`）。追加のファイルはいらない。
- `theme/` のほかのテーマ（36個）は UMD のファイルで、グローバル変数 `echarts` か CommonJS の `require` を前提にしている。ES モジュールで読んだ ECharts には、そのままでは登録できない。使うなら、ビューアスクリプトに取り込む形に書き直す必要がある。v1.0 は `default` と `dark` だけにすることを推奨する。

### 3.3 ロケール（個別事項の P-13 の確かめ）

- 本体に入っているのは英語（`EN`）と中国語（`ZH`）だけ。ほかの言語は `registerLocale` で登録する必要がある。
- `i18n/langXX-obj.js` は UMD で、ブラウザで普通に読んでも何も登録されない。`lib/i18n/langXX.js` は ES モジュール（`export default` のオブジェクト）なので、**ビューアスクリプトのビルドで取り込んで `registerLocale` する**のがよい。1言語あたり数 KB。
- 用意されている言語は 27（AR、CS、DE、EL、EN、ES、FA、FI、FR、HU、IT、JA、KO、LV、NL、PL、PT-br、RO、RU、SI、SV、TH、TR、UK、VI、ZH、nb-NO）。韓国語はある。中国語は1種類（簡体字）だけ。
- 静的な SVG で、ロケールが表示に効くのは主に日付の軸（月や曜日の名前）。凡例の選択やツールボックスの文字は、静的な図には出ない。

## 4. 静的検査（手順 4、5）

`dist/echarts.esm.mjs`（圧縮していない ES モジュール）を検索し、見つかった箇所の前後を読んだ。圧縮版（`echarts.esm.min.mjs`、`echarts.min.js`、`echarts.common.min.js`）でも、同じ種類の箇所が同じ数だけ見つかった（common には地図の `new Function` がない）。

| 検索したもの | 件数 | 場所と判断 |
| --- | --- | --- |
| `new Function` | 1 | 地図のデータを文字列で渡し、かつ `JSON.parse` がない環境でだけ通る（`parseInput`）。描画では通らない |
| `eval`、文字列の `setTimeout` | 0 | − |
| Worker、`importScripts`、Service Worker | 0 | − |
| `WebAssembly` | 0 | − |
| `fetch(` | 1 | 座標系の情報を集める内部の変数名。通信ではない |
| `XMLHttpRequest`、`WebSocket`、`EventSource`、`sendBeacon`、`import()` | 0 | − |
| `new Image()` と `.src =` | 1 | zrender の `platformApi.loadImage`。**画像の要素と画像のパターンを描くときに、入力に書いた URL を読む**。SVG を文字列で作るとき（SSR）も、画像の大きさを指定していないと、大きさを知るために読みに行く。SVG を作る途中で起きるので、出力の無害化より前に通信が起きる → 入力から取り除くことが必須 |
| `createElement('iframe')`、`window.open`、`document.write` | 各1〜6 | ツールボックスの「画像として保存」（古いブラウザの経路と、新しいタブを開く経路）と、`title.link`、treemap と sunburst のノードの `link`（クリックしたときに開く）。どれもクリックの操作が必要で、静的な SVG の文字列には出ない |
| `innerHTML =` | 13 | 描画の後始末（固定の文字列）、ツールボックスの「データの表示」（`lang` の文字列と、関数の `optionToContent` の戻り値）、HTML のツールチップ（`tooltip.formatter` の文字列）。ツールボックスとツールチップは、DOM に描く場合だけ動き、SVG の文字列を作る場合には動かないはず（段階B の B-7 で確かめる） |
| 外部の URL | 89 | すべてコメントの中の参考資料のリンク。通信に使うものはない |

### 4.1 入力から取り除く項目（個別事項の P-7、P-8 の確かめと追加）

資料とソースから、入力に URL や HTML を書ける項目を洗い出した。

| 項目 | 例 | 理由 |
| --- | --- | --- |
| `image://` で始まる文字列（すべての場所） | `series.symbol`、`markPoint.symbol`、`legend.icon`、`dataZoom.handleIcon`、`timeline` のアイコン、`visualMap` の `symbol`、`pictorialBar` の `symbol`、`decal.symbol` | 描画の途中で画像を読む（`path://` は SVG のパスなので問題ない） |
| キー `image` | `graphic` の `type: 'image'` の `style.image`、色の指定の画像のパターン `{ image, repeat }`（`backgroundColor`、`itemStyle.color`、`areaStyle.color` など）、リッチテキストの `backgroundColor: { image }` | 同上 |
| `toolbox` | − | 静的な図では使わない。「データの表示」に HTML が入る経路がある |
| `tooltip` | − | 静的な図では出ない。HTML が入る経路がある |
| `link`、`sublink`（`title`、treemap と sunburst のノード） | − | クリックで `window.open` する。静的な図では動かないが、念のため取り除く |
| 地図（`geo`、`series.type: 'map'`、`registerMap`） | − | v1.0 は対象外（地図のデータを同梱しない）。分かりやすいエラーにする |

- 取り除くのは、場所を決め打ちにせず、**入力のオブジェクト全体を走査して、上の規則に当たる値をすべて取り除く**方式を推奨する。ECharts の設定の項目は非常に多く、場所の一覧では漏れが出るため。
- `data:` の URL（`image://data:image/png;base64,...`）は通信しないので、許すかどうかを 02 の工程で決める（6章の Q-3）。
- 出力の SVG も、基準プラグインと同じく DOMPurify（SVG のプロファイル）で無害化する。`data:` 以外の URL を持つ `<image>` と `<a>` も取り除く（二重の守り）。

## 5. SVG の文字列の作り方で分かったこと（段階B で確かめること）

| # | 分かったこと | 段階B で確かめること |
| --- | --- | --- |
| S-1 | `echarts.init(null, テーマ, { renderer: 'svg', ssr: true, width, height })` は、`ssr: true` なら描画先の要素がなくてもよい（要素の検査を飛ばす）。条件書 A-7 を満たす | 描画先なしで描けること |
| S-2 | 文字の幅は、zrender が画面に出さない Canvas の `measureText` で測る（Canvas が使えないときだけ、英字の幅の表で見積もる）。ブラウザでは実際のフォントで測るので、日本語なども正しく測れるはず | B-3。測るときのフォントと、SVG を表示するときのフォント（`font-family`）が同じになること。ECharts の既定のフォントは `sans-serif` |
| S-3 | `renderToSVGString()` は、内部で CSS のアニメーションと強調表示（マウスを載せたとき）の CSS を有効にして文字列を作る。**SVG の中に `<style>` が入ることがある**。`animation: false` でアニメーションの CSS は消えるはずだが、強調表示の CSS（`.zr0-cls-1:hover { ... }` の形）は残る | B-9。`<style>` が入るか。DOMPurify で残すか消すか。Joplin のビューアの `style-src`（インラインのスタイル。未確認）で効くか。消す場合、内部の API（`getZr().painter.renderToString({ cssEmphasis: false, cssAnimation: false })`）を使うかは避けたい |
| S-4 | SVG の中の ID とクラス名（グラデーション、切り抜き、影、模様、CSS のクラス）は、`zr{インスタンスの番号}-` で始まる。番号はページの中で増え続けるので、同じページの図どうしで重ならないはず | B-4。複数の図をページに並べて、グラデーションや切り抜きが隣の図と混ざらないこと。キャッシュした SVG を再び挿入したときも重ならないこと |
| S-5 | SSR の場合、データの点の要素に `ecmeta_*` という属性（系列とデータの番号）が付く | DOMPurify で消えてよいか（静的な図では使わない） |
| S-6 | 圧縮版の配布ファイルは、開発用の検査（`renderToSVGString` を Canvas の描画で呼んだときの例外など）を省いている | 誤った使い方をしても例外にならないことがあるので、試作は圧縮していない版でも動かして確かめる |
| S-7 | ES モジュールで読んだ ECharts は、グローバル変数を作らない。SSR では DOM に何も足さない（測るための Canvas はページに追加しない） | 条件書 A-8。描画の前後で、ページの要素と `<style>` の数が変わらないこと |

## 6. オーナーへの確認事項

| # | 事項 | 推奨案 | 決める工程 |
| --- | --- | --- | --- |
| Q-1 | 新しいリポジトリの場所と名前 | 基準プラグインと同じ場所に `joplin-plugin-dg-echarts` として作る | **決定済み**（2026-11-23。このリポジトリ。当面は PC の中だけで、公開するかは後で決める） |
| Q-2 | 同梱する配布ファイル（3.1節の (a)〜(c)） | 段階B は (a) 全部入りの ES モジュール。大きさと読み込みの時間を測ってから決める | 02 |
| Q-3 | `data:` の URL の画像を許すか | 許さない（v1.0）。必要という声があれば v1.x で検討する | 02 |
| Q-4 | 個別事項の修正（7章） | 7章のとおり直す | **決定済み・反映済み**（2026-11-23） |

## 7. 個別事項への修正（ECharts の節）

段階A の結果に合わせて、オーナーの了承を得て、2026-11-23 に個別事項の ECharts の節を下の表のとおり直した（P-17 にも「画像は使えない」を加えた）。

| 項目 | 直す前の記述 | 直した内容 |
| --- | --- | --- |
| P-3 同梱するもの | 全部入りの `dist/echarts.min.js` を基本にし、図の種類を絞るなら `echarts.common.min.js` | ES モジュールは全部入り（`dist/echarts.esm.min.mjs`）だけ。common と simple は UMD だけ。絞るなら `echarts/core` から webpack でまとめる方法になる（本書 3.1節）。6.1.0 以上を使う（XSS の修正） |
| P-4 読み込み | 読めない場合は UMD を `<script>` で読む | UMD はグローバル変数 `echarts` を作ることを書き加える |
| P-7 外部通信 | 画像の URL を取り除く（項目の一覧） | 画像はエンジンが SVG を作る途中で読むので、入力からの除去が必須であることを書く。項目の一覧を本書 4.1節のものに広げ、全体を走査する方式にする。`decal.symbol`、`legend.icon` などを追加 |
| P-8 無害化 | `tooltip` は無効にする | `toolbox` も取り除く（「データの表示」に HTML が入る）。SVG に `<style>` が入ることがある（本書 S-3） |
| P-13 ロケール | ECharts にない言語は英語 | 本体には英語と中国語だけが入っている。ほかの言語は `lib/i18n/langXX.js` をビューアスクリプトに取り込み、`registerLocale` で登録する |
| P-15 ライセンス表示 | ECharts の `LICENSE` と `NOTICE`、zrender、tslib | `licenses/LICENSE-d3`（ECharts に取り込まれた d3.js の一部。BSD-3-Clause）を追加 |
| P-16 試作の確認事項 | （いまの項目） | 本書 5章の S-3（`<style>`）、S-4（ID の重なり）を追加 |

## 8. 次の作業（段階B）

作業用のブランチ `spike/engine` で、開発の指示文書の「01 試作」の 3.2節の B-1〜B-9 を行う。試作のコードは `main` にマージしない。B-9（P-16）には、本書 5章の S-1〜S-7 を含める。

## 9. 調査のやり直し方

- `npm pack echarts@6.1.0 zrender@6.1.0 tslib@2.3.0` で取得し、空のフォルダに展開する（インストールのスクリプトは実行しない）。
- 静的検査は、エンジンの評価のときと同じ種類の文字列（動的なコード生成、Worker、WASM、通信の API、外部の URL、`innerHTML`）で配布ファイルを検索し、見つかった箇所の前後を読む。今回使った一時ファイル（取得したパッケージと検索のスクリプト）は残していない。
- 脆弱性は `gh api "advisories?ecosystem=npm&affects=echarts"` で調べた。
