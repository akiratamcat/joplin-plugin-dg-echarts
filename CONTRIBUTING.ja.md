# dg-echarts の開発への参加

[English](CONTRIBUTING.md)

関心を持っていただき、ありがとうございます。不具合の報告、アイデア、翻訳、プルリクエストを歓迎します。

## 始める前に

- 不具合や要望は、まず [Issue](https://github.com/akiratamcat/joplin-plugin-dg-echarts/issues) を作ってください。
- セキュリティの問題は、公開の Issue に書かないでください。[SECURITY.ja.md](SECURITY.ja.md) をご覧ください。
- 設計は [docs/design.ja.md](docs/design.ja.md) にあります。`docs/` の文書は日本語だけで書いています（`*.ja.md`）。
  - `design.ja.md`：設計書（要求、構成、テスト、リリース）。
  - `lessons-learned.ja.md`：調査とテストで分かり、設計やコードを変えた事柄（ECharts の癖、Joplin の動き）。
  - `spike-results.ja.md`：設計の前に行った試作の結果（Joplin の中で ECharts がどう動くか）。
  - `owner-decisions.ja.md`：作者が決めた事項。

## 開発の環境

- Node.js 22 以降と npm（CI は Node.js 22 を使います）
- Google Chrome（描画テストで使います。ブラウザーのダウンロードは不要です）
- プラグインを試すための、Joplin のデスクトップ版 3.1 以降

```sh
npm ci
npm run dist        # publish/io.github.akiratamcat.dg-echarts.jpl を作る
```

Joplin のプラグインの画面（ツール → オプション → プラグイン。macOS は Joplin → 設定 → プラグイン）の「ファイルからインストール」で `.jpl` を入れ、Joplin を再起動します。

## 仕組み

グラフは、Joplin が Markdown を HTML にするときに描きます。Markdown-it のコンテンツスクリプトが、同梱した ECharts を Node の `require` で読み込み、`echarts` のブロックごとに SVG の文字列を作って無害化し、HTML に直接入れます。そのため、グラフの表示にページのスクリプトは要らず、PDF と HTML のエクスポートにもそのまま出ます。ビューアスクリプトは、ツールバーを付けるだけです。`docs/design.ja.md` の 5章と 7章をご覧ください。

## フォルダーの構成

| 場所 | 中身 |
| ---- | ---- |
| `src/index.ts` | メインスクリプト：設定、コンテンツスクリプトの登録、ツールバーの処理（コピー、保存） |
| `src/contentScript/markdownItPlugin.ts` | Markdown-it のプラグイン：グラフごとに読み取り、検査、描画をして、HTML を作る |
| `src/contentScript/` | エンジンの読み込み、入力の検査、テーマと文字サイズの調整、無害化、キャッシュ、ビューアスクリプト（ツールバー）、CodeMirror のプラグイン |
| `src/shared/` | 複数のスクリプトが使うコード（フェンスの判定、設定のキー、字句解析、メッセージ） |
| `src/i18n/` | gettext の実装。`catalog/catalogs.json` は `npm run i18n:compile` で作ります |
| `vendor/echarts/` | ECharts のエンジンとロケールのファイル。手を加えずにコピーしたもの（`SOURCE.md` を参照） |
| `locales/` | 翻訳（gettext の PO ファイル） |
| `icons/` | プラグインのアイコン。`icon.svg`（独自の円グラフの図案。ECharts のロゴではない）と、それから作った PNG |
| `scripts/` | 翻訳、ライセンス、README、公開前の検査 |
| `tests/` | 単体テスト。`tests/render/` は描画テスト、`tests/manual/` は手動テストの手順と記録（`*.ja.md`、日本語）と Joplin に貼るテスト用のノート（`*.md`、英語）、`tests/evidence/` は手動テストで保存したファイル |

## コマンド

| コマンド | すること |
| -------- | -------- |
| `npm run dist` | プラグインのパッケージ（`publish/*.jpl`）を作る |
| `npm test` | 単体テストの後に描画テスト |
| `npm run test:unit` | 翻訳の変換と検査、ライセンスと英日併記の文書の検査の後、単体テストと外部通信なしの静的検査（ビルドは不要） |
| `npm run test:render` | ビルドの後、ビルドしたコンテンツスクリプトが作ったグラフを、通信を止めたヘッドレスの Chrome で表示して確かめる |
| `npm run typecheck` | TypeScript の型チェック |
| `npm run lint` | ESLint |
| `npm run i18n:extract` | ソースコードから `locales/echarts.pot` とすべての PO ファイルを更新する |
| `npm run i18n:check` | PO ファイルを検査する（置き換えの名前、複数形、fuzzy） |
| `npm run i18n:compile` | PO ファイルから `src/i18n/catalog/catalogs.json` を作る（`dist`、`test:unit`、`typecheck` が実行する） |
| `npm run notices` | `THIRD_PARTY_NOTICES.md` と `THIRD_PARTY_NOTICES.ja.md` を作り直す |
| `npm run docs` | `README.ja.md`、`CONTRIBUTING.ja.md`、`SECURITY.ja.md`、`CHANGELOG.ja.md` を、英語版のファイルの後半（日本語）に写す |
| `npm run docs:check` | 英語版のファイルの後半が `*.ja.md` と同じかを確かめる（`test:unit` が実行する） |
| `npm run licenses:check` | 同梱するパッケージのライセンスと、ライセンス表示・版数の一覧・README の表が最新かを確かめる |
| `npm run icons` | `icons/icon.svg` から、Google Chrome で PNG のアイコンを作る |
| `npm run check:publish` | GitHub に push する前に、ブランチの履歴を調べる（メールアドレス、公開してはいけないファイル、秘密の情報、PC のパス）。作者が使うもの |

プルリクエストを作る前に、`npm test`、`npm run typecheck`、`npm run lint` を実行してください。
描画テストでほかの Chromium を使うときは、その実行ファイルを `DG_CHROME_PATH` に入れてください。

## ブランチとプルリクエスト

GitHub Flow を使います。

- 長く続くブランチは `main` だけで、いつでもリリースできる状態にします。リリースは `main` のタグ `vX.Y.Z` です。
- `main` から、接頭辞を付けたブランチを作ります：`feature/…`（機能の追加や変更）、`fix/…`（不具合の修正）、`docs/…`（文書だけ）。
- `main` へのプルリクエストを作ります。CI（lint、型チェック、Windows・macOS・Linux でのテスト）が通ればマージできます。作者自身の変更もプルリクエストを通します。
- プルリクエストはマージコミットでマージします（squash や rebase のマージはしません）。作業ごとのまとまりが履歴に残るようにするためです。
- マージしたブランチは削除します（GitHub が自動で削除します）。コミットは `main` に残ります。
- リリースした版の修正は、`main` から作った `fix/…` のブランチで行い、新しい PATCH の版としてリリースします。古い版は修正しません。
- `spike/…` のブランチは、使い捨ての試作です。マージも push もしません。

## 決まり

- **ネットワーク通信をしない。** プラグインはネットワーク通信をしてはいけません（README を参照）。通信するコードや依存パッケージを加えないでください。静的検査（`tests/network.test.ts`）は新しい通信のコードで失敗し、描画テストはどんな通信でも失敗します。
- **入力の検査**（`src/contentScript/inputGuard.ts`）は、画像を読み込む設定や HTML を受け取る設定を取り除きます。禁止リストの方式なので、ECharts にそのような設定が増えたら、ここに加えてください。
- **ECharts のエンジン**（`vendor/echarts/`）は、手を加えずに使います（公式の圧縮版）。更新はセキュリティの修正か、必要な不具合の修正のときだけです。更新の手順は `vendor/echarts/SOURCE.md` にあります。
- **グラフのソースを JavaScript として実行しない。** グラフは JSON か YAML のデータだけです。
- **依存パッケージ**は、版をきっちり固定します。プラグインに入るパッケージは、`scripts/check-licenses.mjs` の許可リストにあるライセンスで、`scripts/notices.mjs`、`src/thirdParty.ts`、README の表にも載せる必要があります。
- **文書**：リポジトリの最上位のファイルには、英語版と日本語版（`*.ja.md`）があります。両方を更新するか、どちらの翻訳が要るかをプルリクエストに書いてください。GitHub と Joplin のプラグインのサイトは英語版のファイルだけを表示するので、`README.md`、`CONTRIBUTING.md`、`SECURITY.md`、`CHANGELOG.md` には、英語の文章と、その後に `*.ja.md` の写しがあります。`*.ja.md` を直して `npm run docs` を実行してください。英語版のファイルの日本語の部分を直接直さないでください。
- **変更履歴**：変更は `CHANGELOG.md` と `CHANGELOG.ja.md` の両方に書きます。GitHub のリリースノートは、両方から作ります（英語の後に日本語）。

## 翻訳

翻訳は `locales/` の gettext の PO ファイル（`ja.po`、`de.po` など）なので、Poedit やテキストエディタで直せます。今の翻訳は生成 AI で作ったので、その言語を話す方の訂正をとても歓迎します。

- 訳を直すときは、`locales/<ロケール>.po` の `msgstr` を直し、`npm run i18n:check` を実行します。
- `{line}`、`{message}` などの置き換えの名前は、そのまま残します。ECharts の設定の名前（`series`、`xAxis` など）、`theme=dark`、`width=`、```` ```echarts ```` は訳しません。翻訳者向けの説明は `#.` のコメントです。
- ソースコードの文字を変えたら、`npm run i18n:extract` を実行して、`locales/echarts.pot` とすべての PO ファイルを更新します。
- 新しい言語には、`scripts/i18n-common.mjs` と `src/i18n/gettext.ts`（複数形の規則）への追加が要ります。日付の軸の月の名前は、`vendor/echarts/` の ECharts のロケールのファイルから来ます。

訳していない文字は英語で表示します。

## 寄せられた変更のライセンス

dg-echarts は MIT ライセンスで公開しています。変更（コード、翻訳、文書）を寄せることで、それが MIT ライセンスで提供されることに同意したものとします。

## 生成 AI

このプロジェクトは、生成 AI（Anthropic の Claude）を全面的に用いて開発しており、作者がすべての変更を確認しています。
参加するのに生成 AI は要りません。上の文書とコマンドだけで作業できます。
変更に生成 AI を使ってもかまいませんが、次のことをお願いします。

- 出す前に、結果を自分で確認し、テストしてください。
- 生成 AI を使ったことと、何に使ったかを、プルリクエストに書いてください。
