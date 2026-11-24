# 段階1（MVP）の手動テスト

設計書 18章の段階1 の完了条件のうち、Joplin の中でしか確かめられないことの手順。自動テスト（`npm test`）は通っている。

| 項目     | 内容                                                                                |
| -------- | ----------------------------------------------------------------------------------- |
| 対象     | `publish/io.github.akiratamcat.dg-echarts.jpl`（版数 0.1.0）。`npm run dist` で作る |
| 環境     | Joplin の最新の安定版（Windows）                                                    |
| ノート   | [mvp-note.md](mvp-note.md)（1〜21番。見出しに期待する結果を書いてある）             |
| 所要時間 | 約 30分                                                                             |

結果は、各項目の「確認」ごとに ○ / × とひとことを Claude に伝える。出力したファイル（PDF、HTML）は `spike/test/` などに置いて、場所を伝える。

---

## A. インストール

1. 設定 → プラグインで、試作のプラグイン「dg-echarts (spike)」（`io.github.akiratamcat.dg-echarts.spike`）を削除して、Joplin を再起動する。
2. 歯車のアイコン →「ファイルからインストール」で `publish/io.github.akiratamcat.dg-echarts.jpl` を選び、再起動する。
3. **確認 A-1**：プラグインの一覧に「dg-echarts」が版数 0.1.0 で表示される。
4. **確認 A-2**：設定に「dg-echarts」の画面があり、Chart theme、Transparent chart background、Chart height、Chart width が並ぶ（英語のまま。翻訳は段階3）。「詳細設定を表示」で、Extra language names、Largest chart、Number of charts kept in the cache も出る。

**確認 A-1**：期待通り。
**確認 A-2**：期待通り。

## B. ノートビューア（明るいテーマ）

1. 新しいノートを作り、[mvp-note.md](mvp-note.md) の中身を貼る。
2. **確認 B-1**：各ブロックが見出しのとおりに表示される。[chart] は図、[error] はエラーの枠、[note] は図の下の黄色の注意。
3. **確認 B-2**：15番のエラーの枠に「Line 3」と、3行目に印の付いた抜粋が出る。
4. **確認 B-3**：14番で、警告のダイアログが出ない。`<img ...>` と `<script>...` が文字として出る。
5. **確認 B-4**：21番は普通の JSON のコードブロックになる。
6. **確認 B-5**：9番は幅 400px で左に寄る。10番はペインの幅に縮む。ペインを狭くすると、1番などもはみ出さずに縮む。

**確認 B-1**：期待通り。
**確認 B-2**：期待通り。
**確認 B-3**：期待通り。
**確認 B-4**：期待通り。
**確認 B-5**：期待通り。

## C. 暗いテーマ

1. Joplin のテーマを暗いもの（Dark など）にする。
2. **確認 C-1**：テーマを指定していない図が、暗い配色で描き直される。
3. **確認 C-2**：**補助線（グラフの横線）が見える**。プラグインが補助線の色を `#454a54` に変えている（仮の色。設計書 V-02）。見えにくい、または目立ちすぎるときは、そう伝える。
4. **確認 C-3**：5番（theme=light）は図の中が白い背景になる。
5. テーマを明るいものに戻す。

**確認 C-1**：期待通り。
**確認 C-2**：期待通り。
**確認 C-3**：期待通り。

## D. 設定の変更

1. 設定で Chart width を 500 にして OK を押す。
2. **確認 D-1**：ノートに戻ると、幅を指定していない図が細くなっている。
3. Chart width を 800 に戻す。
4. Chart theme を Dark にする。**確認 D-2**：明るいテーマのまま、図が暗い配色（暗い背景）になる。Auto に戻す。

**確認 D-1**：期待通り。
**確認 D-2**：期待通り。

## E. PDF のエクスポート

1. ファイル → エクスポート → PDF で書き出す（暗いテーマのままでもよい）。
2. **確認 E-1**：図がすべて出て、ページの途中で切れていない。
3. **確認 E-2**：**Adobe Acrobat で開き**、8番の「120」をコピーして貼ると「120」になる（二重の「120120」にならない）。1番の「120」、3番の「北京市」も同じ。プラグインは、エクスポートのときだけラベルの縁取りを外している（設計書 V-11）。
4. **確認 E-3**：6番（theme=dark）が白い紙の上で読め、補助線も見える。
5. PDF を `spike/test/` などに置き、場所を Claude に伝える。

**確認 E-1**：期待通り。
**確認 E-2**：期待通り。
**確認 E-3**：期待通り。

PDF ファイル：
"spike/test/dg-echarts stage 1 (MVP) test note-stage1-manual-tests-E-light-theme.pdf"

## F. HTML のエクスポート

1. ファイル → エクスポート → HTML ファイルで書き出し、ブラウザで開く。
2. **確認 F-1**：図が出る。
3. HTML を `spike/test/` などに置き、場所を Claude に伝える（Claude は全体を読まず、スクリプトで調べる）。

**確認 F-1**：期待通り。

HTMLファイル：
"spike/test/dg-echarts stage 1 (MVP) test note-stage1-manual-tests-F-light-theme.html"

## G. リッチテキストエディタ

1. ノートをリッチテキストエディタに切り替える。
2. **確認 G-1**：図とエラーの枠が出て、ノートが壊れない。
3. **確認 G-2**：1番をダブルクリックすると JSON の編集の画面が開く。数字を1つ変えて OK を押すと、図に反映される。
4. Markdown エディタに戻し、**確認 G-3**：ノートのソースが、変えた数字のほかは元のまま（フェンスや `theme=dark` などのオプションが残っている）。

**確認 G-1**：期待通り。
**確認 G-2**：期待通り。
**確認 G-3**：実質問題ではないが、下記に補足あり。

補足：

５行目の
`[chart] a chart is drawn, [error] an error box, [note] a note under the block.`
の行が
`\[chart\] a chart is drawn, \[error\] an error box, \[note\] a note under the block.`
という具合にエスケープされる。

見出しヘッダの
`## 1. Bar chart with Japanese labels [chart]`
も
`## 1\. Bar chart with Japanese labels \[chart\]`
という具合にエスケープされる。

## H. 印刷（Joplin の問題の確認）

1. ファイル → 印刷で、仮想プリンタ（Microsoft Print to PDF など）に出力する。
2. **確認 H-1**：ECharts のブロックは普通のコードブロックになる（Joplin の問題。設計書 14章。図が出たら、Joplin が直したということなので、Claude に伝える）。

**確認 H-1**：期待通り。（印刷では図は出ない。コードブロックが出ている）

Windowsの仮想プリンタ経由で出力された PDF
"spike/test/dg-echarts stage 1 (MVP) test note-stage1-manual-tests-H-light-theme.pdf"
