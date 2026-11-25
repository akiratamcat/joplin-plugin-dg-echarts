# Changelog

日本語：[このページの後半](#日本語)（[CHANGELOG.ja.md](CHANGELOG.ja.md) と同じ内容）

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

Changes that users notice (settings, the look of charts, supported charts)
are always listed. The Japanese version (`CHANGELOG.ja.md`) has the same content.

## [Unreleased]

## [1.0.1] - 2026-11-25

### Security

- A CSS `url()` in a colour or background value (`backgroundColor`, `itemStyle.color`, `borderColor`, `textStyle.color` and others) made the note viewer load the external URL. Every `url()` except `url(#…)` (gradients and clips inside the chart's SVG) is now removed, and that part is not painted.
- CSS in an `emphasis` colour could add any CSS to the note through the chart's hover styles (`<style>`), including loading an external URL with `image-set()` and the like. A `<style>` that is not in the form ECharts writes is now emptied; that chart then has no hover highlight.

### Fixed

- JSON syntax errors whose message has no position in newer Joplin versions (newer Chromium), such as the last comma in `[1, 2,]`, now show the line number and the line in the error box.

## [1.0.0] - 2026-11-24

First public release.

### Added

- Rendering of `echarts` code blocks written in JSON or YAML, with the bundled Apache ECharts engine (`echarts` 6.1.0, the official minified build, unchanged). Charts are drawn as SVG while Joplin renders the note, so they show in the note viewer, the Rich Text editor and PDF and HTML exports. No network access.
- Block options `theme=light|dark|none`, `height=`, `width=` and `align=left|center|right`.
- Automatic light / dark charts that follow Joplin's theme. A chart whose theme differs from the page (for example `theme=dark` on a light page) gets its own background. Dark charts get visible grid lines.
- Error box with the line number and an excerpt for JSON and YAML syntax errors, and clear messages for common mistakes (unknown chart type, data that is not an array, bar or line charts without axes, nothing to draw).
- Input guard: images (external and `data:`), tooltips, toolboxes and links are removed before the engine runs; maps are refused. The SVG output is sanitised with DOMPurify.
- Charts are drawn at the setting width (800 px by default) and shrink in a narrower pane; they are never stretched.
- Settings screen (Tools → Options → Plugins → dg-echarts): chart theme (Auto / Light / Dark), transparent background, chart height and width, matching the note's font size, smallest font size, toolbar, editor highlighting, extra language names, largest chart, cache size.
- Translations: the settings screen and the messages follow Joplin's display language, and ECharts date axes use the same language. Japanese, Chinese (Simplified and Traditional), Korean, German, French, Spanish, Portuguese (Brazil), Italian and Russian. The translations were made with generative AI (the Japanese one was checked by the maintainer); corrections are welcome. Messages from the JSON and YAML parsers and from ECharts itself stay in English.
- Chart toolbar: copy the chart as SVG or PNG, save it as an SVG or PNG file in a folder you choose, or copy its source. Shown on mouse-over, on keyboard focus or after a tap; it can be turned off.
- Syntax highlighting of the JSON / YAML of ECharts blocks in the Markdown editor, with the colours of the editor's theme; it can be turned off.
- In PDF and HTML exports, the text border of labels is removed, so that text copied from a PDF is not doubled.
- The settings screen lists the bundled third-party software (name, version, license, website). The plugin package also contains the license notices in Japanese (`THIRD_PARTY_NOTICES.ja.md`).

---

## 日本語

<!-- The Japanese half below is generated from CHANGELOG.ja.md by npm run docs. Edit CHANGELOG.ja.md, not this part. -->
<!-- ja:start -->

このプロジェクトの主な変更を、このファイルに記録します。
書き方は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に、版数の付け方は [セマンティック バージョニング](https://semver.org/lang/ja/) に従います。

利用者が気づく変更（設定、グラフの見た目、対応するグラフ）は必ず書きます。英語版（`CHANGELOG.md`）と同じ内容です。

### [Unreleased]

### [1.0.1] - 2026-11-25

#### Security

- 色や背景の値に CSS の `url()` を書くと（`backgroundColor`、`itemStyle.color`、`borderColor`、`textStyle.color` など）、ノートビューアが外部の URL を読みにいく問題を直しました。グラフの SVG の中を指す `url(#…)`（グラデーションと切り抜き）以外の `url()` は取り除き、その部分は塗りません。
- `emphasis` の色に CSS を書くと、グラフの強調表示のスタイル（`<style>`）を通じて、ノートに任意の CSS を加えられる問題を直しました（`image-set()` などで外部の URL を読むこともできました）。ECharts が書く形でない `<style>` は空にします。その場合、そのグラフはマウスを乗せたときの強調表示をしません。

#### Fixed

- JSON の構文の誤りのうち、新しい Joplin（新しい Chromium）で位置の入らないもの（`[1, 2,]` の最後のコンマなど）でも、エラーの枠に行番号と該当行を表示するようにしました。

### [1.0.0] - 2026-11-24

最初の公開。

#### Added

- JSON か YAML で書いた `echarts` のコードブロックを、内蔵した Apache ECharts の描画エンジン（`echarts` 6.1.0。公式の圧縮版をそのまま使用）でグラフとして表示します。グラフは Joplin がノートを表示するときに SVG として描くので、ノートビューア、リッチテキストエディタ、PDF と HTML のエクスポートで表示されます。ネットワーク通信はしません。
- ブロックのオプション `theme=light|dark|none`、`height=`、`width=`、`align=left|center|right`。
- Joplin のテーマに合わせた明るい / 暗いグラフ。ページと違うテーマのグラフ（明るいページの `theme=dark` など）には、グラフの背景を塗ります。暗いグラフの補助線は見えやすい色にします。
- JSON と YAML の構文の誤りを、行番号と該当行の抜粋つきのエラーの枠で表示します。よくある誤り（未知のグラフの種類、配列でないデータ、軸のない棒グラフや折れ線グラフ、描くものがない）も、分かりやすい文で知らせます。
- 入力の検査：画像（外部のものと `data:` のもの）、ツールチップ、ツールボックス、リンクを、エンジンに渡す前に取り除きます。地図はエラーにします。SVG の出力は DOMPurify で無害化します。
- グラフは設定の幅（既定 800px）で描き、狭いペインでは縮めて表示します。引き伸ばすことはありません。
- 設定画面（ツール → オプション → プラグイン → dg-echarts）：グラフのテーマ（自動 / 明るい配色 / 暗い配色）、背景を透明にする、グラフの高さと幅、文字サイズをノートの本文に合わせる、最小の文字サイズ、ツールバー、エディタの色分け、追加の言語名、グラフの最大の大きさ、キャッシュの数。
- 翻訳：設定画面とメッセージは Joplin の表示言語に合わせて切り替わり、ECharts の日付の軸も同じ言語になります。日本語、中国語（簡体字・繁体字）、韓国語、ドイツ語、フランス語、スペイン語、ポルトガル語（ブラジル）、イタリア語、ロシア語。翻訳は生成 AI で作りました（日本語は作者が確認）。訂正を歓迎します。JSON と YAML の解析の文と、ECharts 自身の文は英語のままです。
- グラフのツールバー：グラフを SVG か PNG でコピーする、選んだフォルダーに SVG か PNG のファイルとして保存する、ソースをコピーする。マウスを乗せたとき、キーボードのフォーカスがあるとき、タップしたときに表示します。表示しないようにもできます。
- Markdown エディタで、ECharts のブロックの JSON / YAML を、エディタのテーマの色で色分けします。色分けしないようにもできます。
- PDF と HTML のエクスポートでは、ラベルの文字の縁取りを外します（PDF から文字をコピーしたときに、文字が二重にならないようにするため）。
- 設定画面に、同梱している外部のソフトウェアの一覧（名前、バージョン、ライセンス、公式サイト）を表示します。プラグインのパッケージには、日本語のライセンス表示（`THIRD_PARTY_NOTICES.ja.md`）も入れています。

<!-- ja:end -->
