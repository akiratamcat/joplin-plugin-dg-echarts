# セキュリティについて

[English](SECURITY.md)

## 脆弱性の報告

セキュリティの問題は、公開の Issue には書かないでください。

代わりに、GitHub の非公開の脆弱性報告を使ってください。
リポジトリの **Security** タブを開き、**Report a vulnerability** を選びます
（<https://github.com/akiratamcat/joplin-plugin-dg-echarts/security/advisories/new>）。

次のことを書いてください。

- dg-echarts と Joplin のバージョン、OS
- 問題が起きるグラフのソースかノート
- 何が起きたか、どうなるはずだったか

報告は、報告した人と作者だけが見られます。回答は GitHub で行います。英語でも日本語でもかまいません。

## 対象

知らせてほしい問題の例です。

- Joplin のノートビューアや、エクスポートした HTML の中で、スクリプトが動くグラフ
- プラグインがネットワーク通信をする（グラフに書いた画像を読み込むなど）、またはファイルを読む
- Joplin が応答しなくなるグラフ

Joplin 本体の問題は [Joplin のプロジェクト](https://github.com/laurent22/joplin/security) に報告してください。
ECharts のエンジンの問題は [Apache ECharts のプロジェクト](https://github.com/apache/echarts/security) に報告できます。修正が出たら、内蔵しているエンジンを更新します。

## 対象のバージョン

セキュリティの修正は、最新のリリースだけに行います。
