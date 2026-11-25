# リリース手順

設計書 21章の手順の詳細。基準プラグイン（dg-plantuml）の `docs/release.ja.md` と同じ手順で、名前を dg-echarts に置き換えたもの。GitHub のリポジトリと npm のパッケージは 2026-11-24 に作り、v1.0.0 を公開した。npm への最初の公開は手で行い、2回目の版から GitHub Actions で公開する（下の「3. 公開」）。

## 0. GitHub に push する前（毎回）

公開のリポジトリに push すると、そのブランチの全履歴が公開され、後から消すのは難しい。push の前に、毎回次を確かめる。

1. `npm run check:publish`（ブランチを指定するときは `npm run check:publish -- <ブランチ名>`）が `check:publish: OK` になる。このスクリプトは、push するブランチの全履歴について、次を調べる。
   - コミットの作者とコミッターのメールアドレスが、許可したもの（`akiratamcat@gmail.com`、Claude の共同作者の表記、GitHub の画面でのマージと Dependabot が使う GitHub の公開用のアドレス）だけであること。
   - 公開してはいけないファイル（`.env`、ログ、エディタの個人設定、`dist/`、`publish/`、`node_modules/`、試作の `spike/` など）が、最新の版に入っていないこと。過去のコミットにだけあるものは注意として表示されるので、中身に個人の情報がないことを確かめる。
   - ファイルの中身に、トークンや秘密鍵らしい文字列、PC のパス（`C:\Users\…`、`C:\git_repos\…` など）がないこと。
2. **push するのは `main` だけ**にする（`git push -u origin main`）。`git push --all` と `git push --mirror` は使わない。開発のブランチ `feature/mvp` と試作のブランチ（`spike/engine`、`spike/plugin`）は push しない（`feature/mvp` の履歴には、手動テストの記録の古い版に PC のパスが残っているため。`main` には1つのコミットにまとめてマージした）。
3. 作者の gmail のアドレスは、コミットの情報として公開される（基準プラグインと同じ）。そのため、GitHub の「Block command line pushes that expose my email」は有効にしない。
4. 最初の push の後、GitHub のリポジトリの設定で次を有効にする。
   - Secret scanning と Push protection
   - Private vulnerability reporting（`SECURITY.md` の案内先）
   - Dependabot alerts
   - `main` の保護（プルリクエストからだけマージでき、CI が通らないとマージできない）と「Automatically delete head branches」

## 1. 準備

1. `main` が最新で、作業中のファイルがないことを確かめる。
2. `npm audit --omit=dev` を実行し、配布物に含まれる依存パッケージに脆弱性がないことを確かめる。
3. `CHANGELOG.ja.md` と `CHANGELOG.md` の `[Unreleased]` を `[X.Y.Z] - YYYY-MM-DD` に変える（`CHANGELOG.ja.md` を直したら `npm run docs` で `CHANGELOG.md` の後半に写す）。利用者に影響する変更（設定、グラフの見た目、対応するグラフ）を必ず書く。
4. 版数を上げる。`package.json` と `src/manifest.json` の `version` を同じ値にする。
5. エンジンを更新した場合は、`vendor/echarts/SOURCE.md` の「Updating」の手順をすべて済ませたことを確かめる（ライセンス、版数を書く場所、系列の種類の一覧、入力の検査、テスト）。
6. エンジン、DOMPurify、yaml を更新した場合は、`src/thirdParty.ts`（設定画面に出す一覧）と、`README.md`・`README.ja.md` の同梱ソフトウェアの表の版数を直し、`npm run notices` で `THIRD_PARTY_NOTICES.md` と `THIRD_PARTY_NOTICES.ja.md` を作り直す。`npm run licenses:check`（`npm test` から自動で実行される）が、直し忘れを検出する。

## 2. 確認

1. `npm test`、`npm run typecheck`、`npm run lint` がすべて通る。
2. 手動テストを行う（`tests/manual/` の手順書）。結果は下の「記録」に書く。
3. 初回の公開（v1.0.0）では、設計書 21章の公開前の確認（基準プラグインの 21.6節）をすべて確かめる。

手動テストに合格するまで、タグを push しない。

## 3. 公開

1. `main` にマージし、タグ `vX.Y.Z` を作って push する。
2. リリース用のワークフロー（`.github/workflows/release.yml`）が、検査とビルドを行い、GitHub Releases にリリースを作る。`.jpl`、`LICENSE`、`THIRD_PARTY_NOTICES.md`、`THIRD_PARTY_NOTICES.ja.md` が添付され、リリースノートは英語と日本語の二部構成で、それぞれの先頭に「描画エンジン内蔵・外部通信なし」の定型文が入る（`.github/scripts/release-notes.js`）。
3. リポジトリの変数 `NPM_PUBLISH` が `true` のとき、続けて同じワークフローが npm に公開する（Trusted Publishing。npm のトークンを GitHub に保存しない）。`true` でないときは、下の「3.2 手で npm に公開する」で公開する。
4. 公開できたことを `npm view joplin-plugin-dg-echarts version` で確かめる。

### 3.1 Trusted Publishing の最初の設定（v1.0.0 の次の版で1回だけ）

Trusted Publishing は、npm のパッケージを一度公開してからでないと登録できない。また、登録してから2日以内に1回も公開しないと、その設定は無効になる（基準プラグインの記録）。そのため、次の版のタグを push する当日に、次の順で行う。

1. npmjs.com に `akiratamcat` でログインし、パッケージ `joplin-plugin-dg-echarts` の Settings を開く。Trusted publishing で GitHub Actions を選び、次を入れる（大文字・小文字も区別される）。

   | 項目 | 値 |
   | ---- | -- |
   | Organization or user | `akiratamcat` |
   | Repository | `joplin-plugin-dg-echarts` |
   | Workflow filename | `release.yml`（パスは書かない） |
   | Environment name | 空のまま |
   | 許可する操作 | `npm publish` も許可する |

2. GitHub のリポジトリの変数 `NPM_PUBLISH` を `true` にする（`gh variable set NPM_PUBLISH --body true`）。
3. いつもどおりタグを push する。リリース用のワークフローの `npm` のジョブが成功し、`npm view joplin-plugin-dg-echarts version` が新しい版になることを確かめる。

### 3.2 手で npm に公開する

v1.0.0 の最初の公開で使う手順。`npm` のジョブが失敗したときも、この手順で公開する（タグは作り直さない）。npm のアカウントは2段階認証を有効にしているので、公開のときに認証を求められる。生成 AI からは認証の操作ができないため、オーナーが自分のターミナルで行う。

1. `npm whoami` が `akiratamcat` になる（ならなければ `npm login`）。
2. リポジトリのフォルダーで `git switch main` の後、`git describe --tags` が公開する版のタグ（例：`v1.0.0`）になる。作業中のファイルがない。
3. `npm ci`、`npm run dist` を実行する。
4. `npm pack --dry-run` で、名前と版数（`joplin-plugin-dg-echarts@X.Y.Z`）と、ファイルが8つ（`LICENSE`、`README.md`、`README.ja.md`、`THIRD_PARTY_NOTICES.md`、`THIRD_PARTY_NOTICES.ja.md`、`package.json`、`publish/` の `.jpl` と `.json`）であることを確かめる（v1.0.0 の準備のときに確認。`.jpl` は約 1.7MB）。
5. `npm publish --access public` を実行し、表示された URL をブラウザで開いて2段階認証を行う。**一度公開した版数は、取り消しても同じ番号では二度と公開できない。**
6. 数分後に `npm view joplin-plugin-dg-echarts version` が新しい版になる（基準プラグインでは、初めての公開のときに仮の版 `0.0.0-stage` が先に作られ、約2分後に本当の版が出た）。

## 4. 公開後

1. Joplin 公式プラグイン一覧に新しい版が出たことを確かめる（npm への公開から反映まで時間がかかる）。
2. Joplin のプラグインの画面から、インストールまたは新しい版への更新ができることを確かめる。

## 記録

| 版 | 日付 | 環境 | 範囲 | 結果 | メモ |
| -- | ---- | ---- | ---- | ---- | ---- |
| 1.0.0 | 2026-11-23〜24 | Windows 11、Joplin 3.7.24 | 段階1〜4 の手動テスト（`tests/manual/stage1〜4-manual-tests.ja.md`） | OK | 段階ごとの手動テストを、v1.0.0 のリリースの手動テストとした（作者の指示で公開まで進めた）。段階4 の B-8（Tab キーでツールバーに移る）は、作者の判断で確かめていない |
| 1.0.0 | 2026-11-24 | GitHub、npm | 公開（3.） | OK | GitHub のリポジトリを作り、`main` だけを push した（`feature/mvp` と `spike/*` は push しない）。CI は Linux・macOS・Windows で成功。タグ `v1.0.0` で GitHub Releases のリリースを作った（`.jpl`、`LICENSE`、`THIRD_PARTY_NOTICES` の英日）。npm にはオーナーが手で公開した（3.2。`npm pack --dry-run` でファイル8つ、523.6 kB）。基準プラグインと同じく、先に仮の版 `0.0.0-stage` ができ、約2分後に `latest` が 1.0.0 になった |
| 1.0.1 | 2026-11-25 | Windows 11、Joplin の最新の安定版 | 1.0.1 の手動テスト（`tests/manual/release-1.0.1-manual-tests.ja.md`） | OK | A-1〜E-1 のすべてが期待どおり。色の値の `url()` と強調表示の CSS で `example.com` への要求が出ないこと（開発ツールの Network）、ふつうの図の強調表示とグラデーション、JSON の行番号（4 行目）、PDF のエクスポートを確かめた |
