# ai-data-merger-extension

# AI Data Merger Extension

このVSCode拡張は、エクスプローラーから追加した複数のファイルをマージし、AI用の参照データファイル（Markdown形式）を生成するためのツールです。

## 特徴
- コンテキストメニューからのファイル追加
- サイドバー上でファイル順序の編集や削除が可能なツリービュー
- ユーザー設定（大項目名称・順序、出力先、ファイル名）の指定
- マージ実行時の履歴管理と再実行機能

## プロジェクト構成

（上記の構成図を参照）

## 使用方方法
1：　`npm run package` で拡張機能をパッケージ化
2：　`vsce publish` で拡張機能を公開
3：　(cursor)cursor --install-extension path/to/ai-data-merger-extension-0.0.1.vsix

## デバッグ
1. `npm install` で依存パッケージをインストール
2. `npm run compile` でTypeScriptをコンパイル
3. VSCodeでデバッグ実行
