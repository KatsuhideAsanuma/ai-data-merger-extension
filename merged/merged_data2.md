---
title: マージファイル
timestamp: 2025-04-10T23:59:51.718Z
total_files: 3
categories: 2
project: ai-data-merger-extension
purpose: AIプロンプト用データ
---

# 目次

- [設計書出力](#設計書出力)
  - [README.md](#readmemd)
    - [AI Data Merger Extension](#readmemd-ai-data-merger-extension)
      - [概要](#readmemd-)
        - [主な特徴](#readmemd-)
      - [インストール方法](#readmemd-)
        - [方法1: VSCode Marketplaceからインストール](#readmemd-1-vscode-marketplace)
        - [方法2: VSIXファイルからインストール](#readmemd-2-vsix)
      - [使用方法](#readmemd-)
        - [基本的な使い方](#readmemd-)
        - [ファイル管理機能](#readmemd-)
        - [履歴と再利用](#readmemd-)
      - [設定オプション](#readmemd-)
        - [カテゴリのカスタマイズ](#readmemd-)
        - [データファイル表示の設定](#readmemd-)
      - [出力ファイル形式](#readmemd-)
      - [プロジェクト構成](#readmemd-)
      - [デバッグ方法](#readmemd-)
      - [ライセンス](#readmemd-)
      - [謝辞](#readmemd-)
      - [フィードバックと貢献](#readmemd-)
  - [merge-lists.json](#merge-listsjson)
    - [ファイル構造](#merge-listsjson-file-structure)
      - [📚 root](#merge-listsjson-root)
        - [📦 [0]](#merge-listsjson-0)
        - [📝 timestamp](#merge-listsjson-timestamp)
        - [📦 queue](#merge-listsjson-queue)
        - [📝 outputPath](#merge-listsjson-outputpath)
        - [📝 fileName](#merge-listsjson-filename)
        - [📝 name](#merge-listsjson-name)
- [参照コード出力](#参照コード出力)
  - [ConfigManager.ts](#configmanagerts)
    - [ファイル構造](#configmanagerts-file-structure)
      - [🔷 ConfigManager](#configmanagerts-configmanager)
        - [📎 categories](#configmanagerts-categories)

## 設計書出力

### README.md
> パス: `README.md`, 行数: 169

# AI Data Merger Extension

複数ファイルをマージしてAI用の参照データを生成するVSCode拡張機能です。大規模言語モデル（LLM）への入力用データファイルを効率的に作成できます。

![Extension Icon](resources/icon.png)

## 概要

AI開発やプロンプトエンジニアリングでは、複数のファイルからコンテキスト情報を集めてAIに提供する必要があります。この拡張機能は、複数のファイルを選択し、整形された単一のMarkdownファイルに結合することで、AIへの効率的な情報提供をサポートします。

### 主な特徴

- **直感的なファイル選択**: エクスプローラーの右クリックメニューからファイルを追加
- **カテゴリ管理**: ファイルを「プロンプト出力」「設計書出力」「参照コード出力」などのカテゴリに分類
- **柔軟な順序管理**: サイドバーでファイル順序の変更・カテゴリ変更が可能
- **目次生成**: マージファイルには自動的に階層構造の目次が生成される
- **カスタマイズ可能**: 出力先パス、ファイル名、カテゴリなどをカスタマイズ可能
- **マージ履歴**: 過去のマージ操作を保存し、再実行可能
- **プロジェクト別マージリスト**: プロジェクト単位でよく使うマージリストを保存・再利用

## インストール方法

### 方法1: VSCode Marketplaceからインストール

1. VSCodeの拡張機能タブを開く
2. 検索ボックスに「AI Data Merger」と入力
3. 「AI Data Merger Extension」を選択してインストール

### 方法2: VSIXファイルからインストール

1. リポジトリをクローン: `git clone https://github.com/katsuhideAsanuma/ai-data-merger-extension.git`
2. 依存パッケージをインストール: `npm install`
3. 拡張機能をパッケージ化: `npm run package`
4. 生成されたVSIXファイルをインストール:
   - VSCodeで `Ctrl+Shift+P` → 「Install from VSIX」を選択
   - または、コマンドラインで: `code --install-extension ai-data-merger-extension-0.0.1.vsix`

## 使用方法

### 基本的な使い方

1. **サイドバーアイコン**: VSCodeの左側のアクティビティバーで「AI Data Merger」アイコンをクリック
2. **ファイルの追加**: エクスプローラーでファイルを右クリックし、「Add to File Merge Queue」を選択
   - ファイルがカテゴリ選択ダイアログで指定したカテゴリに追加されます
3. **マージファイルの生成**: サイドバーの「Generate Merged File」ボタンをクリック
   - ファイル名を指定するダイアログが表示されます
   - 既定のファイル名またはカスタムファイル名を入力
4. **結果の確認**: 生成されたマージファイルが自動的に開きます

### ファイル管理機能

- **ファイルの順序変更**: サイドバーのファイル項目にある上下矢印ボタンで順序を変更
- **カテゴリの変更**: ファイル項目のフォルダアイコンをクリックしてカテゴリを変更
- **ファイルの削除**: ファイル項目のゴミ箱アイコンをクリックして削除
- **キューのクリア**: サイドバー上部の「Clear Merge Queue」ボタンでキューをクリア

### 履歴と再利用

- **マージ履歴**: サイドバーの「Merge History」タブで過去のマージ操作を確認
- **マージの再実行**: 履歴項目をクリックして過去のマージ設定を再実行
- **マージリストの保存**: よく使うマージ設定を「Add to Project Merge Lists」で保存
- **保存済みリストの読み込み**: 「Load Project Merge List」ボタンでプロジェクト内のマージリストを読み込み

## 設定オプション

VSCodeの設定（`settings.json`）で以下の項目をカスタマイズできます：

```json
{
  "aiDataMerger.outputPath": "./merged",      // マージファイルの出力先フォルダ
  "aiDataMerger.defaultFileName": "merged_data.md",  // デフォルトのファイル名
  "aiDataMerger.allowedFileTypes": [          // マージ可能なファイル形式
    "markdown", "plaintext", "javascript", "typescript", "json", "yaml",
    "python", "java", "cpp", "csharp", "go", "rust", "ruby", "php",
    "html", "css", "xml", "shellscript", "bat", "sql"
    // その他多数のファイル形式をサポート
  ],
  "aiDataMerger.showDataFileContent": false,  // JSONやYAMLファイルの全コード表示(falseの場合は構造のみ)
  "aiDataMerger.categories": [                // マージファイル内のカテゴリ一覧
    "プロンプト出力",
    "設計書出力", 
    "参照コード出力"
    // カスタムカテゴリを追加可能
  ]
}
```

### カテゴリのカスタマイズ

カテゴリは、VSCodeの設定から簡単にカスタマイズできます：

1. **設定画面から変更**: 
   - VSCodeの設定画面（`Ctrl+,`）を開く
   - 「AI Data Merger」を検索
   - `aiDataMerger.categories` の配列を編集

2. **settings.jsonで直接編集**:
   - `settings.json`に以下を追加・編集
   ```json
   "aiDataMerger.categories": [
     "プロンプト出力",
     "設計書出力",
     "参照コード出力",
     "カスタムカテゴリ1",  // 独自のカテゴリを追加
     "カスタムカテゴリ2"
   ]
   ```

### データファイル表示の設定

JSONやYAMLなどのデータファイルの表示方法を設定できます：

- `aiDataMerger.showDataFileContent`: `false`（デフォルト）の場合、データファイルは構造のみ表示され、コード全体は表示されません。`true`に設定すると、データファイルも完全表示されます。

## 出力ファイル形式

生成されるマージファイルは以下の形式で構造化されます：

1. **メタデータセクション**: タイトル、タイムスタンプ、ファイル数などの情報
2. **目次**: すべてのカテゴリとファイルへのリンクを含む階層的な目次
3. **コンテンツ**: カテゴリごとにグループ化されたファイル内容
   - マークダウンファイル: インラインで内容を表示、見出しレベルを調整
   - コードファイル: 言語に応じた構文ハイライトを含むコードブロックで表示
   - ディレクトリ: ファイル一覧をコードブロックで表示

## プロジェクト構成

```
ai-data-merger-extension/
├── src/                    # ソースコード
│   ├── extension.ts        # 拡張機能のエントリーポイント
│   ├── components/         # 主要コンポーネント
│   │   ├── ConfigManager.ts    # 設定管理
│   │   ├── HistoryManager.ts   # 履歴管理
│   │   ├── MergeManager.ts     # マージ処理
│   │   └── QueueManager.ts     # ファイルキュー管理
│   ├── treeViews/          # ツリービュー実装
│   │   ├── HistoryTreeViewProvider.ts
│   │   └── SelectionTreeViewProvider.ts
│   ├── commands/           # コマンド実装
│   └── utils/              # ユーティリティ関数
├── resources/              # アイコンなどのリソース
├── config/                 # 設定ファイル
└── merged/                 # デフォルト出力ディレクトリ
```

## デバッグ方法

1. リポジトリをクローン: `git clone https://github.com/katsuhideAsanuma/ai-data-merger-extension.git`
2. 依存パッケージをインストール: `npm install`
3. VSCodeで開く: `code ai-data-merger-extension`
4. F5キーを押してデバッグセッションを開始（新しいVSCodeウィンドウが開く）
5. 開いたウィンドウで拡張機能をテストできます

## ライセンス

MITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 謝辞

- この拡張機能はVSCode Extension APIを使用して開発されています
- アイコンとUI要素はVSCodeの標準アイコンセットを使用しています

## フィードバックと貢献

このエクステンションは高貴なるデータサイエンスお嬢様の卓越した知性と美学によって生成されました。拡張機能のアルゴリズム設計から最適化まで、お嬢様の優雅な手捌きの下で完成に至りましたの。お嬢様のエレガントな統計学的センスと芸術的コーディングセンスが見事に融合した逸品ですわ。

問題報告や機能提案は[GitHubリポジトリ](https://github.com/katsuhideAsanuma/ai-data-merger-extension/issues)にお寄せください。プルリクエストも歓迎します。


### merge-lists.json
> パス: `merge-lists.json`, 行数: 20

<a id="merge-listsjson-file-structure"></a>
<a id="merge-listsjson-root"></a>
<a id="merge-listsjson-0"></a>
<a id="merge-listsjson-timestamp"></a>
<a id="merge-listsjson-queue"></a>
<a id="merge-listsjson-outputpath"></a>
<a id="merge-listsjson-filename"></a>
<a id="merge-listsjson-name"></a>

> 📝 このファイルの構造は目次セクションに表示されています

```json
[
  {
    "timestamp": "2025-04-10T19:21:46.291Z",
    "queue": {
      "参照コード出力": [
        "d:\\works\\ai-data-merger-extension\\package.json"
      ],
      "設計書出力": [
        "d:\\works\\ai-data-merger-extension\\README.md",
        "d:\\works\\ai-data-merger-extension\\src\\commands\\clearQueue.ts"
      ],
      "プロンプト出力": [
        "d:\\works\\ai-data-merger-extension\\LICENSE"
      ]
    },
    "outputPath": "d:\\works\\ai-data-merger-extension",
    "fileName": "ttt.md",
    "name": "ttt.md"
  }
]

```

## 参照コード出力

### ConfigManager.ts
> パス: `src\components\ConfigManager.ts`, 行数: 30

<a id="configmanagerts-file-structure"></a>
<a id="configmanagerts-configmanager"></a>
<a id="configmanagerts-categories"></a>

> 📝 このファイルの構造は目次セクションに表示されています

```typescript
import * as vscode from 'vscode';

export class ConfigManager {
    public categories: string[] = [];

    constructor() {
        this.loadCategories();
        // 設定変更時にカテゴリを再読み込み
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('aiDataMerger.categories')) {
                this.loadCategories();
            }
        });
    }

    loadCategories() {
        // VSCode設定からカテゴリを読み込む
        const configCategories = vscode.workspace.getConfiguration('aiDataMerger').get('categories') as string[];
        
        if (configCategories && Array.isArray(configCategories) && configCategories.length > 0) {
            this.categories = configCategories;
            console.log(`カテゴリを設定から読み込みました: ${this.categories.join(', ')}`);
        } else {
            // 設定が見つからない場合はデフォルト値を使用
            this.categories = ["プロンプト出力", "設計書出力", "参照コード出力"];
            console.log("設定からカテゴリが見つかりません。デフォルトのカテゴリを使用します。");
        }
    }
}

```
