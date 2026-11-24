# 段階2 の手動テスト

設計書 18章の段階2（テーマと文字サイズ、設定画面）のうち、Joplin の中でしか確かめられないことの手順。自動テスト（`npm test`）は通っている。

| 項目     | 内容                                                                                    |
| -------- | --------------------------------------------------------------------------------------- |
| 対象     | `publish/io.github.akiratamcat.dg-echarts.jpl`（版数 0.2.0）。`npm run dist` で作る     |
| 環境     | Joplin の最新の安定版（Windows）                                                        |
| ノート   | [mvp-note.md](mvp-note.md)（段階1 と同じ）、`large-note.md`（大きな図。下の準備で作る） |
| 所要時間 | 約 20分                                                                                 |

結果は、各「確認」の下に ○ / × とひとことを書く（段階1 と同じ）。

---

## A. 更新

1. 歯車のアイコン →「ファイルからインストール」で `publish/io.github.akiratamcat.dg-echarts.jpl`（0.2.0）を選び、再起動する。
2. **確認 A-1**：プラグインの一覧で、版数が 0.2.0 になっている。dg-echarts が2つ並んでいない。
3. **確認 A-2**：設定の dg-echarts の画面に、Match the font size of the note と Smallest font size (px) が加わっている。

**確認 A-1**：v 0.2.0 となった。v0.1.0を先にアンインストールしてから v0.2.0をインストールしたため、dg-echarts が2つ並んでいない点は確認できなかった。
**確認 A-2**：期待通り。

## B. 図の文字サイズをノートの本文に合わせる（設計書 8.7節）

デスクトップ版のノートビューアの本文は 15px の固定です（Joplin のテーマの `noteViewerFontSize`。設定の「エディタの文字サイズ」はエディタにしか効かない）。画面全体の拡大・縮小（ズーム）は、本文と図に同じように効く。

1. 段階1 の mvp-note のノートを開く。
2. 設定で Match the font size of the note を有効にして OK を押す。
3. **確認 B-1**：図の文字が、本文の文字サイズ（15px）に合わせて大きくなる。12px の文字（軸の目盛り、凡例、ラベル）が 15px に、題名は 18px が 23px 程度に、同じ比率で大きくなる。文字が重なったり、図からはみ出したりしていない。
4. Match the font size of the note を無効に戻す。**確認 B-2**：元の大きさに戻る。

**確認 B-1**：期待通り。
**確認 B-2**：期待通り。但し、備考あり。

備考：
"3. Pie chart with Chinese, Korean and Japanese [chart]" の下部に円グラフの凡例がある。この判例の色サンプルと文字タイトルのベースライン（下端）がずれており、不自然に見える。 このベースラインのずれは、"Match the font size of the note" の on/off どちらでも発生している。

## C. 最小の文字サイズ（設計書 8.7節、D-05）

1. 設定で Smallest font size (px) を 16 にして OK を押す。
2. **確認 C-1**：mvp-note のすべての図で、小さな文字（軸の目盛り、凡例、ラベル）が 16px 以上になる。文字が重なったり、図からはみ出したりしていない。
3. **確認 C-2**：11番（レーダー、ゲージ、ファネル）でも、ゲージの目盛りの数字が大きくなっている。
4. Smallest font size を 0 に戻す。

**確認 C-1**：幅が十分にある場合は 16px 以上になる。しかし、幅を狭くすると図と文字の両方が縮小する。文字は 16px よりも小さくなる。
**確認 C-2**：期待通り。

## D. 暗いテーマと透明の背景（V-02）

1. Joplin のテーマを暗いもの（Dark など）にする。
2. **確認 D-1**：Transparent chart background が有効（既定）のとき、テーマを指定していない図は、ノートの背景のまま暗い配色で読める。
3. Transparent chart background を無効にする。
4. **確認 D-2**：図の中が ECharts の暗い背景（ほぼ黒）になる。
5. **決めてほしいこと D-3**：既定を「透明（有効）」のままにするか。読みやすいと感じる方を書く。
6. Transparent chart background を有効に戻し、テーマを明るいものに戻す。

**確認 D-1**：期待通り。
**確認 D-2**：期待通り。
**決めてほしいこと D-3**：Transparent chart background は off の方が、背景が真っ黒になり、補助線などが見やすい。

## E. 大きな図の描画の時間（設計書 7.3節、V-14）

### 準備

1. コマンドプロンプトなどで、リポジトリのフォルダーで `node tests/manual/generate-large-note.cjs` を実行する。`tests/manual/large-note.md`（約 330KB）ができる。
2. Joplin で、ヘルプ → 開発ツールの切り替え（Toggle development tools）を開き、Console のタブを表示しておく。
3. `large-note.md` を VS Code などで開いてすべてをコピーし、Joplin の新しいノートに貼る。

### 確かめること

1. **確認 E-1**：6つの図がすべて表示される。貼ってから表示されるまでのおおよその時間を書く。
2. **確認 E-2**：Console に出た「dg-echarts: a chart of ... characters took ... ms to draw」の行を、すべて書き写す（200ms 以上かかった図だけが出る）。
3. 1番（小さな図）の数字を1つ書き換える。
4. **確認 E-3**：書き換えてから図が変わるまで、待たされる感じがあるか（大きな図はキャッシュから出るので、待たされない見込み）。
5. 6番（5000切れの円グラフ）の数字を1つ書き換える。
6. **確認 E-4**：入力が止まる時間のおおよそ。Console の時間も書く。
7. 別のノートを選んでから、このノートに戻る。**確認 E-5**：すぐに表示される（キャッシュ）。
8. 後片付け：このノートを削除する。開発ツールを閉じる。

**確認 E-1**：1～2秒くらい。
**確認 E-2**：下記の通り。

dg-echarts: a chart of 97918 characters took 547 ms to draw
（markdownItPlugin.js:2）

dg-echarts: a chart of 143427 characters took 800 ms to draw
（markdownItPlugin.js:2）

**確認 E-3**：待たされる感じは無い。
**確認 E-4**：1～2秒くらい。Consoleの時間は下記の通り。

dg-echarts: a chart of 143428 characters took 1072 ms to draw
（markdownItPlugin.js:2）

**確認 E-5**：期待通り。

最大文字数の既定値（200000 文字）が適切かを、この結果で決める。
