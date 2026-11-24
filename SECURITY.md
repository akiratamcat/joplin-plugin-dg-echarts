# Security policy

日本語：[このページの後半](#日本語)（[SECURITY.ja.md](SECURITY.ja.md) と同じ内容）

## Reporting a vulnerability

Please do not report security problems in public issues.

Use GitHub's private vulnerability reporting instead:
open the repository's **Security** tab and choose **Report a vulnerability**
(<https://github.com/akiratamcat/joplin-plugin-dg-echarts/security/advisories/new>).

Please include:

- the version of dg-echarts and of Joplin, and your operating system,
- a chart source or note that shows the problem, and
- what happens and what you expected.

The report is visible only to you and the maintainer. You will get an answer on GitHub. English or Japanese is fine.

## Scope

Examples of problems we want to hear about:

- a chart that runs script in Joplin's note viewer, or in an exported HTML file,
- the plugin making a network request (for example, loading an image written in a chart), or reading files,
- a chart that makes Joplin stop responding.

Problems in Joplin itself should be reported to the [Joplin project](https://github.com/laurent22/joplin/security).
Problems in the ECharts engine can be reported to the [Apache ECharts project](https://github.com/apache/echarts/security); we will update the bundled engine when a fix is available.

## Supported versions

Only the latest released version receives security fixes.

---

## 日本語

<!-- The Japanese half below is generated from SECURITY.ja.md by npm run docs. Edit SECURITY.ja.md, not this part. -->
<!-- ja:start -->

### 脆弱性の報告

セキュリティの問題は、公開の Issue には書かないでください。

代わりに、GitHub の非公開の脆弱性報告を使ってください。
リポジトリの **Security** タブを開き、**Report a vulnerability** を選びます
（<https://github.com/akiratamcat/joplin-plugin-dg-echarts/security/advisories/new>）。

次のことを書いてください。

- dg-echarts と Joplin のバージョン、OS
- 問題が起きるグラフのソースかノート
- 何が起きたか、どうなるはずだったか

報告は、報告した人と作者だけが見られます。回答は GitHub で行います。英語でも日本語でもかまいません。

### 対象

知らせてほしい問題の例です。

- Joplin のノートビューアや、エクスポートした HTML の中で、スクリプトが動くグラフ
- プラグインがネットワーク通信をする（グラフに書いた画像を読み込むなど）、またはファイルを読む
- Joplin が応答しなくなるグラフ

Joplin 本体の問題は [Joplin のプロジェクト](https://github.com/laurent22/joplin/security) に報告してください。
ECharts のエンジンの問題は [Apache ECharts のプロジェクト](https://github.com/apache/echarts/security) に報告できます。修正が出たら、内蔵しているエンジンを更新します。

### 対象のバージョン

セキュリティの修正は、最新のリリースだけに行います。

<!-- ja:end -->
