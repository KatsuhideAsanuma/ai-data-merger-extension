---
title: マージファイル
timestamp: 2025-04-10T23:19:51.890Z
total_files: 4
categories: 3
project: ai-data-merger-extension
purpose: AIプロンプト用データ
---

# 目次

- [プロンプト出力](#プロンプト出力)
  - [merge-lists.json](#merge-listsjson)
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
      - [出力ファイル形式](#readmemd-)
      - [プロジェクト構成](#readmemd-)
      - [デバッグ方法](#readmemd-)
      - [ライセンス](#readmemd-)
      - [謝辞](#readmemd-)
      - [フィードバックと貢献](#readmemd-)
  - [package.json](#packagejson)
- [参照コード出力](#参照コード出力)
  - [MergeManager.ts](#mergemanagerts)

## プロンプト出力

### merge-lists.json
> パス: `merge-lists.json`, 行数: 20

#### ファイル構造
- 📚 **root** (Array: 1 items)
  - 📦 **[0]**
    - 📝 **timestamp** "2025-04-10T19:21:46.291Z"
    - 📦 **queue** (Object: 3 keys)
    - 📝 **outputPath** "d:\works\ai-data-merger-ext..."
    - 📝 **fileName** "ttt.md"
    - 📝 **name** "ttt.md"

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

## 設計書出力

### README.md
> パス: `README.md`, 行数: 151

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
  ]
}
```

### カテゴリのカスタマイズ

プロジェクトルートまたは拡張機能ディレクトリの `config/categories.json` ファイルでカテゴリを定義できます：

```json
{
  "categories": [
    "プロンプト出力",
    "設計書出力",
    "参照コード出力"
    // カスタムカテゴリを追加可能
  ]
}
```

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
│   └── categories.json     # カテゴリ定義
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

このエクステンションは高貴なるデータサイエンスお嬢様の卓越した知性と美学によって洗練されました。拡張機能のアルゴリズム設計から最適化まで、お嬢様の優雅な指導の下で完成に至りましたの。お嬢様のエレガントな統計学的センスと芸術的コーディングセンスが見事に融合した逸品ですわ。

問題報告や機能提案は[GitHubリポジトリ](https://github.com/katsuhideAsanuma/ai-data-merger-extension/issues)にお寄せください。プルリクエストも歓迎します。


### package.json
> パス: `package.json`, 行数: 229

#### ファイル構造
- 📦 **root** (Object: 14 keys)
  - 📝 **name** "ai-data-merger-extension"
  - 📝 **displayName** "AI Data Merger Extension"
  - 📝 **description** "ファイルをマージしてAI参照データを生成する拡張機能"
  - 📝 **version** "0.0.1"
  - 📦 **engines** (Object: 1 keys)
    - 📝 **vscode** "^1.60.0"
  - 📚 **categories** (Array: 1 items)
    - 📝 **categories[0]** "Other"
  - 📚 **activationEvents** (Array: 10 items)
  - 📝 **main** "./out/extension.js"
  - 📦 **contributes** (Object: 5 keys)
    - 📚 **commands** (Array: 10 items)
    - 📦 **viewsContainers** (Object: 1 keys)
    - 📦 **views** (Object: 1 keys)
    - 📦 **menus** (Object: 3 keys)
    - 📦 **configuration** (Object: 3 keys)
  - 📦 **scripts** (Object: 3 keys)
    - 📝 **vscode:prepublish** "npm run compile"
    - 📝 **compile** "tsc -p ./"
    - 📝 **package** "vsce package"
  - 📝 **publisher** "katsuhide-asanuma"
  - 📦 **devDependencies** (Object: 4 keys)
    - 📝 **@types/node** "^14.0.0"
    - 📝 **@vscode/vsce** "^3.3.2"
    - 📝 **typescript** "^4.0.0"
    - 📝 **vscode** "^1.1.37"
  - 📦 **repository** (Object: 2 keys)
    - 📝 **type** "git"
    - 📝 **url** "https://github.com/katsuhid..."
  - 📝 **icon** "resources/icon.png"

```json
{
    "name": "ai-data-merger-extension",
    "displayName": "AI Data Merger Extension",
    "description": "ファイルをマージしてAI参照データを生成する拡張機能",
    "version": "0.0.1",
    "engines": {
      "vscode": "^1.60.0"
    },
    "categories": [
      "Other"
    ],
    "activationEvents": [
      "onCommand:extension.addFileToQueue",
      "onCommand:extension.clearQueue",
      "onCommand:extension.generateMergedFile",
      "onCommand:extension.reexecuteMerge",
      "onCommand:extension.changeFileCategory",
      "onCommand:extension.removeFileFromQueue",
      "onCommand:extension.moveFileUp",
      "onCommand:extension.moveFileDown",
      "onCommand:extension.loadProjectMergeList",
      "onCommand:extension.addHistoryToMergeList"
    ],
    "main": "./out/extension.js",
    "contributes": {
      "commands": [
        {
          "command": "extension.addFileToQueue",
          "title": "Add File to Merge Queue",
          "icon": "$(add)"
        },
        {
          "command": "extension.clearQueue",
          "title": "Clear Merge Queue",
          "icon": "$(trash)"
        },
        {
          "command": "extension.generateMergedFile",
          "title": "Generate Merged File",
          "icon": "$(merge)"
        },
        {
          "command": "extension.reexecuteMerge",
          "title": "Re-Execute Merge from History",
          "icon": "$(history)"
        },
        {
          "command": "extension.changeFileCategory",
          "title": "Change File Category",
          "icon": "$(symbol-folder)"
        },
        {
          "command": "extension.removeFileFromQueue",
          "title": "Remove File from Queue",
          "icon": "$(trash)"
        },
        {
          "command": "extension.moveFileUp",
          "title": "Move File Up",
          "icon": "$(arrow-up)"
        },
        {
          "command": "extension.moveFileDown",
          "title": "Move File Down",
          "icon": "$(arrow-down)"
        },
        {
          "command": "extension.loadProjectMergeList",
          "title": "Load Project Merge List",
          "icon": "$(notebook)"
        },
        {
          "command": "extension.addHistoryToMergeList",
          "title": "Add to Project Merge Lists",
          "icon": "$(add)"
        }
      ],
      "viewsContainers": {
        "activitybar": [
          {
            "id": "aiDataMerger",
            "title": "AI Data Merger",
            "icon": "resources/icon_transparent.png"
          }
        ]
      },
      "views": {
        "aiDataMerger": [
          {
            "id": "selectionTreeView",
            "name": "Selected Files"
          },
          {
            "id": "historyTreeView",
            "name": "Merge History"
          }
        ]
      },
      "menus": {
        "explorer/context": [
          {
            "command": "extension.addFileToQueue",
            "title": "Add to File Merge Queue",
            "when": "explorerResourceIsFolder || resourceLangId == markdown || resourceLangId == plaintext || resourceLangId == javascript || resourceLangId == typescript || resourceLangId == json || resourceLangId == yaml || resourceLangId == python || resourceLangId == java || resourceLangId == cpp || resourceLangId == c || resourceLangId == csharp || resourceLangId == go || resourceLangId == rust || resourceLangId == ruby || resourceLangId == php || resourceLangId == html || resourceLangId == css || resourceLangId == xml || resourceLangId == bat || resourceLangId == shellscript || resourceLangId == sql || resourceLangId == scala || resourceLangId == kotlin || resourceLangId == swift || resourceLangId == dart || resourceLangId == groovy || resourceLangId == r || resourceLangId == powershell || resourceLangId == perl || resourceLangId == lua || resourceLangId == clojure || resourceLangId == fsharp || resourceLangId == coffeescript", 
            "group": "navigation"
          }
        ],
        "view/title": [
          {
            "command": "extension.generateMergedFile",
            "when": "view == selectionTreeView",
            "group": "navigation"
          },
          {
            "command": "extension.clearQueue",
            "when": "view == selectionTreeView",
            "group": "navigation"
          },
          {
            "command": "extension.loadProjectMergeList",
            "when": "view == selectionTreeView",
            "group": "navigation"
          }
        ],
        "view/item/context": [
          {
            "command": "extension.changeFileCategory",
            "when": "view == selectionTreeView && viewItem == file",
            "group": "inline"
          },
          {
            "command": "extension.removeFileFromQueue",
            "when": "view == selectionTreeView && viewItem == file",
            "group": "inline"
          },
          {
            "command": "extension.moveFileUp",
            "when": "view == selectionTreeView && viewItem == file",
            "group": "inline"
          },
          {
            "command": "extension.moveFileDown",
            "when": "view == selectionTreeView && viewItem == file",
            "group": "inline"
          },
          {
            "command": "extension.addHistoryToMergeList",
            "title": "Add to Project Merge Lists",
            "when": "view == historyTreeView && viewItem == historyItem",
            "group": "inline"
          }
        ]
      },
      "configuration": {
        "type": "object",
        "title": "AI Data Merger Configuration",
        "properties": {
          "aiDataMerger.outputPath": {
            "type": "string",
            "default": "./merged",
            "description": "マージ後のファイル出力先フォルダ"
          },
          "aiDataMerger.defaultFileName": {
            "type": "string",
            "default": "merged_data.md",
            "description": "マージファイルのデフォルトファイル名"
          },
          "aiDataMerger.allowedFileTypes": {
            "type": "array",
            "default": [
              "markdown",
              "plaintext",
              "json",
              "yaml",
              "javascript",
              "typescript",
              "python",
              "java",
              "cpp",
              "c",
              "csharp",
              "go",
              "rust",
              "ruby",
              "php",
              "html",
              "css",
              "xml",
              "shellscript",
              "bat",
              "sql",
              "scala",
              "kotlin",
              "swift",
              "dart",
              "groovy",
              "r",
              "powershell",
              "perl",
              "lua",
              "clojure",
              "fsharp",
              "coffeescript"
            ],
            "description": "マージキューに追加可能なファイルタイプ（VSCodeの言語識別子）"
          }
        }
      }
    },
    "scripts": {
      "vscode:prepublish": "npm run compile",
      "compile": "tsc -p ./",
      "package": "vsce package"
    },
    "publisher": "katsuhide-asanuma",
    "devDependencies": {
      "@types/node": "^14.0.0",
      "@vscode/vsce": "^3.3.2",
      "typescript": "^4.0.0",
      "vscode": "^1.1.37"
    },
    "repository": {
      "type": "git",
      "url": "https://github.com/katsuhideAsanuma/ai-data-merger-extension.git"
    },
    "icon": "resources/icon.png"

  }
  

```

## 参照コード出力

### MergeManager.ts
> パス: `src\components\MergeManager.ts`, 行数: 1093

#### ファイル構造
- 🔷 **MergeManager**
  - 🔹 **generateMergedFile** (customFileName?: string)
  - 🔹 **if** (!fileName)
  - 🔹 **if** (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
  - 📎 **workspaceRoot**
  - 🔹 **if** (!path.isAbsolute(outputPath) && outputPath.startsWith('./'))
  - 📎 **defaultOutputPath**
  - 📎 **defaultOutputPath**
  - 🔹 **if** (!fs.existsSync(defaultOutputPath))
  - 🔹 **if** (!uri)
  - 📎 **return**
  - 📎 **fileName**
  - 🔹 **if** (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
  - 📎 **workspaceRoot**
  - 🔹 **if** (!fs.existsSync(dirPath))
  - 🔹 **if** (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
  - 📎 **filePath**
  - 📎 **fileName**
  - 📎 **fileId**
  - 🔹 **for** (const category of this.configManager.categories)
  - 🔹 **if** (queue[category] && queue[category].length > 0)
- 📦 **categoryEntry**
  - 🔗 **category**
  - 🔗 **files**
  - 🔹 **for** (const filePath of queue[category])
  - 🔹 **if** (fs.existsSync(filePath))
  - 🔗 **headings**
  - 🔹 **if** (path.extname(filePath).toLowerCase() === '.md' && fs.statSync(filePath).isFile())
  - 🔹 **for** (const line of lines)
  - 🔹 **if** (headingMatch)
  - 🔗 **id**
  - 🔹 **for** (const catEntry of tocStructure)
  - 🔹 **for** (const fileEntry of catEntry.files)
  - 🔹 **if** (fileEntry.headings.length > 0)
  - 🔹 **for** (const heading of fileEntry.headings)
  - 🔹 **for** (const category of this.configManager.categories)
  - 🔹 **if** (queue[category] && queue[category].length > 0)
  - 🔹 **for** (const filePath of queue[category])
  - 🔹 **if** (fs.existsSync(filePath))
  - 🔹 **if** (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
  - 🔹 **if** (filePath.startsWith(workspaceRoot))
  - 📎 **relativePath**
  - 🔹 **if** (fs.statSync(filePath).isDirectory())
  - 🔹 **if** (files.length > 0)
  - 🔹 **for** (const file of files)
  - 📎 **language**
  - 🔹 **if** (ext === 'md')
  - 🔹 **for** (const line of mdLines)
  - 🔹 **if** (line.trim().startsWith('#'))
  - 🔹 **if** (match)
  - 📎 **baseHeadingLevel**
  - 📎 **break**
  - 🔹 **for** (const line of mdLines)
  - 🔹 **if** (line.trim().startsWith('#'))
  - 🔹 **if** (headingMatch)
  - 🔹 **if** (baseHeadingLevel > 0)
  - 📎 **calculatedLevel**
  - 📎 **calculatedLevel**
  - 🔹 **if** (calculatedLevel > 6)
  - 📎 **indentSpaces**
  - 📎 **language**
  - 🔹 **if** (isStructuredCodeFile)
  - 🔹 **if** (codeStructure.length > 0)
  - 🔹 **for** (const item of codeStructure)
  - 🔹 **if** (!fileContent.endsWith('\n'))
  - 🔗 **timestamp**
  - 🔗 **queue**
  - 🔗 **outputPath**
  - 🔗 **fileName**
  - 🔗 **name**
  - 🔹 **if** (selection === '開く')
  - 🔹 **loadHistoryMerge** (historyItem: any)
  - 🔹 **for** (const category in historyItem.queue)
  - 🔹 **for** (const filePath of historyItem.queue[category])
  - 🔹 **addHistoryToProjectMergeList** (historyItem: MergeHistoryItem)
  - 🔹 **if** (!historyItem.name)
  - 🔹 **promptForMergeListName** (defaultName: string)
  - 🔗 **prompt**
  - 🔗 **value**
  - 🔗 **placeHolder**
  - 🔹 **saveHistoryToProjectFile** (historyItem: MergeHistoryItem)
  - 🔹 **if** (!workspaceFolders || workspaceFolders.length === 0)
  - 📎 **return**
  - 🔹 **if** (fs.existsSync(historyFilePath))
  - 📎 **mergeListsData**
  - 📎 **mergeListsData**
  - 🔹 **if** (existingIndex >= 0)
  - 🔹 **loadProjectMergeLists** ()
  - 🔹 **if** (!workspaceFolders || workspaceFolders.length === 0)
  - 🔹 **if** (!fs.existsSync(historyFilePath))
  - 🔹 **extractCodeStructure** (content: string, language: string)
  - 🔹 **if** (language === 'json' || language === 'yaml')
  - 🔹 **if** (language === 'json')
  - 📎 **parsedData**
  - 📎 **parsedData**
  - 🔹 **if** (parsedData && typeof parsedData === 'object')
  - 🔹 **if** (Array.isArray(parsedData))
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **info**
  - 🔹 **for** (let i = 0; i < maxItems; i++)
  - 🔹 **if** (typeof item === 'object' && item !== null)
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔹 **if** (!Array.isArray(item))
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **info**
  - 🔹 **if** (parsedData.length > maxItems)
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **info**
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **info**
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **info**
  - 🔹 **if** (language === 'javascript' || language === 'typescript')
  - 🔹 **for** (let i = 0; i < lines.length; i++)
  - 🔹 **if** (classMatch)
  - 📎 **currentClass**
  - 📎 **continue**
  - 🔹 **if** (reactMatch)
  - 📎 **continue**
  - 🔹 **if** (funcMatch)
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **params**
  - 📎 **continue**
  - 🔹 **if** (objMatch)
  - 📎 **currentObject**
  - 📎 **continue**
  - 🔹 **if** (currentClass)
  - 🔹 **if** (methodMatch && !line.startsWith('//') && !line.includes('function('))
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **params**
  - 📎 **continue**
  - 🔹 **if** (fieldMatch && !line.startsWith('//'))
  - 📎 **continue**
  - 🔹 **if** (currentObject)
  - 🔹 **if** (objMethodMatch)
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **params**
  - 📎 **continue**
  - 🔹 **if** (shortMethodMatch)
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **params**
  - 📎 **continue**
  - 🔹 **if** (propMatch && !line.startsWith('//'))
  - 📎 **continue**
  - 🔹 **if** ((currentClass || currentObject) && braceLevel === 0)
  - 📎 **currentClass**
  - 📎 **currentObject**
  - 🔹 **for** (let i = 0; i < lines.length; i++)
  - 🔹 **if** (currentClass && indent <= currentIndent)
  - 📎 **currentClass**
  - 🔹 **if** (classMatch)
  - 📎 **currentClass**
  - 📎 **currentIndent**
  - 📎 **continue**
  - 🔹 **if** (currentClass)
  - 🔹 **if** (methodMatch)
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **params**
  - 📎 **continue**
  - 🔹 **if** (!currentClass)
  - 🔹 **if** (funcMatch)
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **params**
  - 🔹 **for** (let i = 0; i < lines.length; i++)
  - 🔹 **if** (classMatch)
  - 📎 **currentClass**
  - 📎 **continue**
  - 🔹 **if** (objectMatch)
  - 📎 **currentClass**
  - 📎 **continue**
  - 🔹 **if** (traitMatch)
  - 📎 **currentClass**
  - 📎 **continue**
  - 🔹 **if** (methodMatch && !line.endsWith(";"))
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **params**
  - 📎 **continue**
  - 🔹 **if** (currentClass)
  - 🔹 **if** (valMatch && !line.startsWith("//"))
  - 📎 **continue**
  - 🔹 **if** (currentClass && braceLevel === 0)
  - 📎 **currentClass**
  - 🔹 **parseYaml** (content: string)
  - 🔹 **for** (const line of lines)
  - 🔹 **if** (line.trim().startsWith('#') || line.trim() === '')
  - 🔹 **if** (match)
  - 🔹 **if** (lineIndent < indentLevel)
  - 🔹 **for** (let i = 0; i < levels; i++)
  - 📎 **currentObject**
  - 🔹 **if** (lineIndent > indentLevel)
  - 🔹 **if** (!currentObject[currentKey])
  - 📎 **currentObject**
  - 📎 **indentLevel**
  - 📎 **currentKey**
  - 🔹 **if** (value)
  - 🔹 **if** (value.startsWith('[') && value.endsWith(']'))
  - 🔹 **if** (!isNaN(Number(value)))
  - 🔹 **if** (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
  - 🔹 **if** ((value.startsWith('"') && value.endsWith('"'))
  - 🔹 **extractObjectStructure** (obj: any, result: Array<{name: string, type: string, level: number, params?: string, info?: string}>, level: number, maxLevel: number = 2)
  - 🔹 **if** (level > maxLevel)
  - 🔹 **for** (const key of Object.keys(obj))
  - 🔹 **if** (typeof value === 'object' && value !== null)
  - 🔹 **if** (Array.isArray(value))
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **info**
  - 🔹 **if** (value.length > 0 && value.length <= 3 && level < maxLevel)
  - 🔹 **for** (let i = 0; i < value.length; i++)
  - 🔹 **if** (typeof item === 'object' && item !== null)
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **info**
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **info**
  - 🔗 **name**
  - 🔗 **type**
  - 🔗 **level**
  - 🔗 **info**
  - 🔹 **getDataType** (value: any)
  - 🔹 **if** (value === null)
  - 🔹 **if** (Array.isArray(value))
  - 🔹 **if** (typeof value === 'object')
  - 🔹 **getValuePreview** (value: any)
  - 🔹 **if** (value === null) return '(null)
  - 🔹 **if** (value === undefined) return '(undefined)
  - 🔹 **if** (typeof value === 'string')
  - 🔹 **if** (value.length > 30)
  - 🔹 **if** (typeof value === 'number' || typeof value === 'boolean')
  - 🔹 **getTypeIcon** (type: string)
  - 🔹 **switch** (type)
  - 🔗 **default**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from './ConfigManager';
import { HistoryManager, MergeHistoryItem } from './HistoryManager';
import { QueueManager } from './QueueManager';

export class MergeManager {
    constructor(
        private queueManager: QueueManager,
        private configManager: ConfigManager,
        private historyManager: HistoryManager
    ) {}

    async generateMergedFile(customFileName?: string) {
        const outputPath = vscode.workspace.getConfiguration('aiDataMerger').get('outputPath') as string || './merged';
        // デフォルトファイル名は設定から取得
        const defaultFileName = vscode.workspace.getConfiguration('aiDataMerger').get('defaultFileName') as string || 'merged_data.md';
        
        // ファイル名選択ダイアログを表示
        let fileName = customFileName;
        if (!fileName) {
            // ワークスペースルートを取得
            let workspaceRoot = '';
            if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            }
            
            // 出力パスの処理
            let defaultOutputPath = outputPath;
            if (!path.isAbsolute(outputPath) && outputPath.startsWith('./')) {
                defaultOutputPath = path.join(workspaceRoot, outputPath.substring(2));
            } else if (!path.isAbsolute(outputPath)) {
                defaultOutputPath = path.join(workspaceRoot, outputPath);
            }
            
            // 出力先フォルダが存在しない場合は作成
            if (!fs.existsSync(defaultOutputPath)) {
                fs.mkdirSync(defaultOutputPath, { recursive: true });
            }
            
            // ファイル選択ダイアログオプションを設定
            const options: vscode.SaveDialogOptions = {
                defaultUri: vscode.Uri.file(path.join(defaultOutputPath, defaultFileName)),
                filters: {
                    'Markdown': ['md'],
                    'すべてのファイル': ['*']
                }
            };
            
            // ファイル保存ダイアログを表示
            const uri = await vscode.window.showSaveDialog(options);
            
            if (!uri) {
                // ユーザーがキャンセルした場合
                return;
            }
            
            // 選択されたパスを使用
            fileName = uri.fsPath;
        }

        // ワークスペースルートを取得
        let workspaceRoot = '';
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }

        // 出力パスの処理
        let outputFilePath = fileName; // 直接選択されたパスを使用
        
        // ディレクトリが存在しない場合は作成
        const dirPath = path.dirname(outputFilePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // AIが理解しやすいフォーマットに整形
        const mergedContent: string[] = [];
        const queue = this.queueManager.getQueue();

        // メタデータセクションの追加
        const timestamp = new Date().toISOString();
        const totalFiles = Object.values(queue).reduce((sum, files) => sum + files.length, 0);
        const totalCategories = Object.keys(queue).filter(cat => queue[cat] && queue[cat].length > 0).length;

        mergedContent.push(`---`);
        mergedContent.push(`title: マージファイル`);
        mergedContent.push(`timestamp: ${timestamp}`);
        mergedContent.push(`total_files: ${totalFiles}`);
        mergedContent.push(`categories: ${totalCategories}`);
        
        // ワークスペース名を取得してプロジェクト名として使用
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const workspaceName = path.basename(vscode.workspace.workspaceFolders[0].uri.fsPath);
            mergedContent.push(`project: ${workspaceName}`);
        }
        
        mergedContent.push(`purpose: AIプロンプト用データ`);
        mergedContent.push(`---\n`);
        
        // 目次生成の前に、マークダウンファイルの見出しを抽出するための処理
        type TocEntry = {
            filePath: string;
            fileName: string;
            fileId: string; 
            headings: {level: number; text: string; id: string}[];
        };

        // カテゴリとファイルごとの目次情報を格納する配列
        const tocStructure: {category: string; files: TocEntry[]}[] = [];

        // 見出し抽出のためにファイルを先に分析
        for (const category of this.configManager.categories) {
            if(queue[category] && queue[category].length > 0) {
                const categoryEntry = {
                    category: category,
                    files: [] as TocEntry[]
                };
                
                for (const filePath of queue[category]) {
                    if (fs.existsSync(filePath)) {
                        const fileName = path.basename(filePath);
                        // リンク用のIDを生成（ファイル名をURLセーフにする）
                        const fileId = fileName.toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\w-]/g, '');
                        
                        const tocEntry: TocEntry = {
                            filePath,
                            fileName,
                            fileId,
                            headings: []
                        };
                        
                        // マークダウンファイルの場合は見出しを抽出
                        if (path.extname(filePath).toLowerCase() === '.md' && fs.statSync(filePath).isFile()) {
                            try {
                                const fileContent = fs.readFileSync(filePath, 'utf8');
                                const lines = fileContent.split('\n');
                                
                                // 見出し行を抽出（# で始まる行）
                                for (const line of lines) {
                                    const headingMatch = line.trim().match(/^(#{1,3})\s+(.+)$/);
                                    if (headingMatch) {
                                        const level = headingMatch[1].length;
                                        const text = headingMatch[2];
                                        
                                        // 見出しIDの生成（URLセーフな形式に）
                                        const headingId = text.toLowerCase()
                                            .replace(/\s+/g, '-')
                                            .replace(/[^\w-]/g, '')
                                            .replace(/^-+|-+$/g, '');
                                        
                                        // ファイルIDと見出しIDを組み合わせてユニークなIDを作成
                                        const uniqueId = `${fileId}-${headingId}`;
                                        
                                        // 目次用に格納
                                        tocEntry.headings.push({
                                            level, 
                                            text,
                                            id: uniqueId
                                        });
                                    }
                                }
                            } catch (error) {
                                console.error(`見出し抽出中にエラーが発生しました: ${filePath}`, error);
                            }
                        }
                        
                        categoryEntry.files.push(tocEntry);
                    }
                }
                
                tocStructure.push(categoryEntry);
            }
        }

        // 目次の生成
        mergedContent.push(`# 目次\n`);

        // カテゴリとファイルの目次を生成
        for (const catEntry of tocStructure) {
            mergedContent.push(`- [${catEntry.category}](#${catEntry.category.toLowerCase().replace(/\s+/g, '-')})`);
            
            for (const fileEntry of catEntry.files) {
                mergedContent.push(`  - [${fileEntry.fileName}](#${fileEntry.fileId})`);
                
                // マークダウンファイルの見出しを目次に含める（H1, H2, H3のみ）
                if (fileEntry.headings.length > 0) {
                    for (const heading of fileEntry.headings) {
                        // レベルに応じてインデントを調整
                        const indent = '  '.repeat(heading.level + 1);
                        mergedContent.push(`${indent}- [${heading.text}](#${heading.id})`);
                    }
                }
            }
        }

        mergedContent.push(``);

        // configManagerで定義されたカテゴリ順にマージ
        for (const category of this.configManager.categories) {
            if(queue[category] && queue[category].length > 0) {
                mergedContent.push(`## ${category}\n`);
                for (const filePath of queue[category]) {
                    // ファイルが存在するか確認
                    if (fs.existsSync(filePath)) {
                        const fileName = path.basename(filePath);
                        
                        // ファイルのIDを取得（目次生成時と同じロジック）
                        const fileId = fileName.toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\w-]/g, '');
                        
                        // ファイルパスの情報（ワークスペースルートからの相対パス）
                        let relativePath = filePath;
                        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                            const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
                            if (filePath.startsWith(workspaceRoot)) {
                                relativePath = filePath.substring(workspaceRoot.length + 1);
                            }
                        }
                        
                        // ディレクトリの場合はファイル一覧を表示
                        if (fs.statSync(filePath).isDirectory()) {
                            mergedContent.push(`### ${fileName} (ディレクトリ)`);
                            mergedContent.push(`> パス: \`${relativePath}\``);
                            mergedContent.push(``);
                            mergedContent.push("```");
                            try {
                                const files = fs.readdirSync(filePath);
                                if (files.length > 0) {
                                    for (const file of files) {
                                        const fullPath = path.join(filePath, file);
                                        const stats = fs.statSync(fullPath);
                                        const isDir = stats.isDirectory() ? '/' : '';
                                        mergedContent.push(`${file}${isDir}`);
                                    }
                                } else {
                                    mergedContent.push("(空のディレクトリ)");
                                }
                            } catch (error) {
                                mergedContent.push(`(ディレクトリ一覧の取得に失敗しました: ${error})`);
                            }
                            mergedContent.push("```\n");
                        } else {
                            // 通常のファイル処理
                            try {
                                // ファイルの拡張子から言語を推測
                                const ext = path.extname(filePath).substring(1).toLowerCase();
                                let language = "";
                                
                                // 主要な言語の拡張子マッピング
                                const langMap: {[key: string]: string} = {
                                    'js': 'javascript',
                                    'ts': 'typescript',
                                    'py': 'python',
                                    'java': 'java',
                                    'c': 'c',
                                    'cpp': 'cpp',
                                    'cs': 'csharp',
                                    'go': 'go',
                                    'rs': 'rust',
                                    'rb': 'ruby',
                                    'php': 'php',
                                    'html': 'html',
                                    'css': 'css',
                                    'json': 'json',
                                    'yaml': 'yaml',
                                    'yml': 'yaml',
                                    'md': 'markdown',
                                    'sql': 'sql',
                                    'sh': 'bash',
                                    'bat': 'batch',
                                    'ps1': 'powershell',
                                    'xml': 'xml',
                                    'txt': 'text'
                                };
                                
                                language = langMap[ext] || '';
                                
                                // ファイル内容を読み込み
                                const fileContent = fs.readFileSync(filePath, 'utf8');
                                const lines = fileContent.split('\n').length;
                                
                                // ファイル見出しとメタ情報
                                mergedContent.push(`### ${fileName}`);
                                mergedContent.push(`> パス: \`${relativePath}\`, 行数: ${lines}`);
                                mergedContent.push(``);
                                
                                // マークダウンファイルの場合は特別な処理をする
                                if (ext === 'md') {
                                    // マークダウンファイルの場合、見出し階層を調整する
                                    const mdLines = fileContent.split('\n');
                                    
                                    // 最初の見出しレベルを検出して基準レベルとする
                                    let baseHeadingLevel = 0;
                                    for (const line of mdLines) {
                                        if (line.trim().startsWith('#')) {
                                            const match = line.match(/^(#+)\s+/);
                                            if (match) {
                                                baseHeadingLevel = match[1].length;
                                                break;
                                            }
                                        }
                                    }
                                    
                                    // マークダウンコンテンツをインラインで追加（見出しレベルを調整）
                                    for (const line of mdLines) {
                                        // 見出し行（#で始まる行）の処理
                                        if (line.trim().startsWith('#')) {
                                            // 現在の見出しレベルを取得
                                            const headingMatch = line.match(/^(#+)\s+(.*)$/);
                                            if (headingMatch) {
                                                const currentLevel = headingMatch[1].length;
                                                const headingText = headingMatch[2];
                                                
                                                // 見出しIDを生成（目次と同じロジック）
                                                const headingId = headingText.toLowerCase()
                                                    .replace(/\s+/g, '-')
                                                    .replace(/[^\w-]/g, '')
                                                    .replace(/^-+|-+$/g, '');
                                                
                                                // IDタグを追加した見出し
                                                const uniqueId = `${fileId}-${headingId}`;
                                                
                                                // マージファイル内では既に ### レベルでファイル名を出力しているため、
                                                // ファイル内の見出しは必ず調整する必要がある
                                                // 計算された新しいレベル（基準レベルからの相対位置 + 3 + 1）
                                                let calculatedLevel;
                                                
                                                if (baseHeadingLevel > 0) {
                                                    // 基準レベルからの相対位置を計算
                                                    const relativeLevel = currentLevel - baseHeadingLevel;
                                                    // 基本は3 + relativeLevel + 1
                                                    calculatedLevel = 3 + relativeLevel + 1;
                                                } else {
                                                    // 基準レベルが検出できなかった場合は単純に3プラス
                                                    calculatedLevel = currentLevel + 3;
                                                }
                                                
                                                // 実際のマークダウン見出しレベル（最大6まで）
                                                const actualHeadingLevel = Math.min(calculatedLevel, 6);
                                                
                                                // 擬似階層インデント（レベル6を超える場合）
                                                let indentSpaces = '';
                                                if (calculatedLevel > 6) {
                                                    // 余分なレベル数×2の空白を先頭に追加
                                                    indentSpaces = ' '.repeat((calculatedLevel - 6) * 2);
                                                }
                                                
                                                // 新しい見出しを作成
                                                const newHeading = indentSpaces + '#'.repeat(actualHeadingLevel) + ' ' + headingText + ` <a id="${uniqueId}"></a>`;
                                                mergedContent.push(newHeading);
                                            } else {
                                                mergedContent.push(line);
                                            }
                                        } else {
                                            // 見出し以外の行はそのまま追加
                                            mergedContent.push(line);
                                        }
                                    }
                                    // 最後に空行を追加
                                    mergedContent.push('');
                                } else {
                                    // コード構造を解析して見出しとして表示（JS/TS/Python/Scala/JSON/YAML）
                                    const isStructuredCodeFile = 
                                        language === 'javascript' || 
                                        language === 'typescript' || 
                                        language === 'python' ||
                                        language === 'scala' ||
                                        language === 'json' ||
                                        language === 'yaml';
                                    
                                    if (isStructuredCodeFile) {
                                        // コードの構造を解析して見出しを抽出
                                        const codeStructure = this.extractCodeStructure(fileContent, language);
                                        
                                        if (codeStructure.length > 0) {
                                            // コード構造の見出しを追加
                                            mergedContent.push(`#### ファイル構造`);
                                            for (const item of codeStructure) {
                                                const indent = '  '.repeat(item.level);
                                                const typeIcon = this.getTypeIcon(item.type);
                                                mergedContent.push(`${indent}- ${typeIcon} **${item.name}**${item.params ? ` ${item.params}` : ''}${item.info ? ` ${item.info}` : ''}`);
                                            }
                                            mergedContent.push('');
                                        }
                                    }
                                    
                                    // 通常のファイルはコード形式で出力
                                    mergedContent.push("```" + (language ? language : ''));
                                    mergedContent.push(fileContent);
                                    if (!fileContent.endsWith('\n')) {
                                        mergedContent.push("");
                                    }
                                    mergedContent.push("```\n");
                                }
                            } catch (error) {
                                mergedContent.push(`### ${fileName}`);
                                mergedContent.push(`> パス: \`${relativePath}\``);
                                mergedContent.push(``);
                                mergedContent.push(`(ファイルの読み取りに失敗しました: ${error})\n`);
                            }
                        }
                    } else {
                        mergedContent.push(`### ${path.basename(filePath)}`);
                        mergedContent.push(`> パス: \`${filePath}\``);
                        mergedContent.push(``);
                        mergedContent.push(`(ファイルが見つかりません)\n`);
                    }
                }
            }
        }

        // マージファイルを出力
        fs.writeFileSync(outputFilePath, mergedContent.join('\n'));

        // 履歴アイテムを作成
        const historyItem: MergeHistoryItem = {
            timestamp: new Date().toISOString(),
            queue: queue,
            outputPath: path.dirname(outputFilePath), // 出力パスはファイルのディレクトリパスを保存
            fileName: path.basename(outputFilePath), // ファイル名は相対パスがあれば除いたベース名
            name: path.basename(outputFilePath, path.extname(outputFilePath)) // デフォルトの名前は拡張子なしのファイル名
        };

        // 履歴をHistoryManagerに保存
        this.historyManager.saveHistory(historyItem);

        // 成功したら通知とファイルの場所を表示
        vscode.window.showInformationMessage(
            `マージファイルを生成しました: ${outputFilePath}`, 
            '開く'
        ).then(selection => {
            if (selection === '開く') {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(outputFilePath));
            }
        });

        return outputFilePath;
    }

    // 履歴情報からキューを復元する処理
    loadHistoryMerge(historyItem: any) {
        this.queueManager.clearQueue();
        for (const category in historyItem.queue) {
            for (const filePath of historyItem.queue[category]) {
                this.queueManager.addFile(filePath, category);
            }
        }
    }

    // 履歴アイテムをマージリストに追加（マージリスト名は履歴から自動設定）
    async addHistoryToProjectMergeList(historyItem: MergeHistoryItem): Promise<void> {
        // マージリスト名が無い場合は入力を求める
        if (!historyItem.name) {
            const defaultName = historyItem.fileName ? path.basename(historyItem.fileName, path.extname(historyItem.fileName)) : '無題のマージリスト';
            historyItem.name = await this.promptForMergeListName(defaultName);
        }
        
        // プロジェクトのマージリストに保存
        await this.saveHistoryToProjectFile(historyItem);
    }

    // マージリスト名を入力するプロンプトを表示
    async promptForMergeListName(defaultName: string): Promise<string> {
        const name = await vscode.window.showInputBox({
            prompt: 'このマージリストの名前を入力してください（履歴リストに表示されます）',
            value: defaultName,
            placeHolder: '例: プロジェクトA仕様書マージ'
        });
        
        return name || defaultName;
    }

    // 履歴をプロジェクトルートのJSONファイルに保存
    async saveHistoryToProjectFile(historyItem: MergeHistoryItem): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('プロジェクトルートが見つかりません。');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const historyFilePath = path.join(workspaceRoot, 'merge-lists.json');

        // マージリストのファイルが存在するか確認
        let mergeListsData: MergeHistoryItem[] = [];
        if (fs.existsSync(historyFilePath)) {
            try {
                const content = fs.readFileSync(historyFilePath, 'utf8');
                mergeListsData = JSON.parse(content);
            } catch (error) {
                vscode.window.showErrorMessage(`マージリストファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
                mergeListsData = [];
            }
        }

        // 同じ名前の項目があれば上書き、なければ追加
        const existingIndex = mergeListsData.findIndex(item => item.name === historyItem.name);
        if (existingIndex >= 0) {
            mergeListsData[existingIndex] = historyItem;
        } else {
            mergeListsData.push(historyItem);
        }

        try {
            fs.writeFileSync(historyFilePath, JSON.stringify(mergeListsData, null, 2));
            vscode.window.showInformationMessage(`マージリストをプロジェクトに保存しました: ${historyItem.name}`);
        } catch (error) {
            vscode.window.showErrorMessage(`マージリストの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // プロジェクトのマージリストを読み込む
    async loadProjectMergeLists(): Promise<MergeHistoryItem[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return [];
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const historyFilePath = path.join(workspaceRoot, 'merge-lists.json');

        if (!fs.existsSync(historyFilePath)) {
            return [];
        }

        try {
            const content = fs.readFileSync(historyFilePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            vscode.window.showErrorMessage(`マージリストファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }

    // コードファイルから構造（クラス、メソッド、フィールドなど）を抽出
    private extractCodeStructure(content: string, language: string): Array<{name: string, type: string, level: number, params?: string, info?: string}> {
        const result: Array<{name: string, type: string, level: number, params?: string, info?: string}> = [];
        
        // JSON/YAMLファイルの構造を解析
        if (language === 'json' || language === 'yaml') {
            try {
                // JSONまたはYAMLをパース
                let parsedData;
                if (language === 'json') {
                    parsedData = JSON.parse(content);
                } else {
                    // YAMLのパースにはJSON.parseを使用できないため、簡易的な処理で代用
                    // 実際のYAMLパースには外部ライブラリ（js-yaml）などを使用するのが理想的
                    parsedData = this.parseYaml(content);
                }
                
                // ルートオブジェクトの処理
                if (parsedData && typeof parsedData === 'object') {
                    // 配列の場合
                    if (Array.isArray(parsedData)) {
                        result.push({ 
                            name: 'root', 
                            type: 'array', 
                            level: 0,
                            info: `(Array: ${parsedData.length} items)` 
                        });
                        
                        // 配列の最初の数アイテムをサンプルとして表示（最大5つまで）
                        const maxItems = Math.min(parsedData.length, 5);
                        for (let i = 0; i < maxItems; i++) {
                            const item = parsedData[i];
                            const itemType = this.getDataType(item);
                            
                            if (typeof item === 'object' && item !== null) {
                                result.push({ 
                                    name: `[${i}]`, 
                                    type: itemType, 
                                    level: 1
                                });
                                
                                // オブジェクトの場合は内部構造を表示
                                if (!Array.isArray(item)) {
                                    this.extractObjectStructure(item, result, 2);
                                }
                            } else {
                                result.push({ 
                                    name: `[${i}]`, 
                                    type: itemType, 
                                    level: 1,
                                    info: this.getValuePreview(item)
                                });
                            }
                        }
                        
                        // 表示されないアイテムがある場合
                        if (parsedData.length > maxItems) {
                            result.push({ 
                                name: `... ${parsedData.length - maxItems} more items`, 
                                type: 'ellipsis', 
                                level: 1 
                            });
                        }
                    } 
                    // オブジェクトの場合
                    else {
                        result.push({ 
                            name: 'root', 
                            type: 'object', 
                            level: 0,
                            info: `(Object: ${Object.keys(parsedData).length} keys)` 
                        });
                        
                        // オブジェクトの内部構造を第二階層まで表示
                        this.extractObjectStructure(parsedData, result, 1);
                    }
                } else {
                    // プリミティブ値の場合（まれ）
                    result.push({ 
                        name: 'value', 
                        type: this.getDataType(parsedData), 
                        level: 0,
                        info: this.getValuePreview(parsedData)
                    });
                }
            } catch (error) {
                // パースエラーの場合
                result.push({ 
                    name: 'Error', 
                    type: 'error', 
                    level: 0,
                    info: `Parse error: ${error instanceof Error ? error.message : String(error)}`
                });
            }
            
            return result;
        }
        
        // 他のプログラミング言語の処理（既存のコード）
        const lines = content.split('\n');
        
        // 言語に応じたパターンを定義
        if (language === 'javascript' || language === 'typescript') {
            // クラス定義
            const classPattern = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+(?:\w+(?:,\s*\w+)*))?/;
            // メソッド定義
            const methodPattern = /^\s*(?:async\s+)?(?:static\s+)?(?:public\s+|private\s+|protected\s+)?(?:[\w<>[\],\s]+\s+)?(\w+)\s*\((.*)\)/;
            // クラスフィールド
            const fieldPattern = /^\s*(?:public\s+|private\s+|protected\s+)?(?:readonly\s+)?(\w+)(?:\:\s*[\w<>[\],\s|]+)?(?:\s*=\s*.*)?;/;
            // 関数定義
            const functionPattern = /^(?:export\s+)?function\s+(\w+)\s*\((.*)\)/;
            // オブジェクト定義（const obj = { 形式）
            const objectPattern = /^(?:export\s+)?const\s+(\w+)\s*=\s*{/;
            // Reactコンポーネント（関数形式）
            const reactFuncPattern = /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:\(.*\)|.*)\s*=>\s*[({]/;
            
            let currentClass: string | null = null;
            let currentObject: string | null = null;
            let braceLevel = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // 波括弧のレベルを追跡
                braceLevel += (line.match(/{/g) || []).length;
                braceLevel -= (line.match(/}/g) || []).length;
                
                // クラス定義
                const classMatch = line.match(classPattern);
                if (classMatch) {
                    currentClass = classMatch[1];
                    result.push({ name: currentClass, type: 'class', level: 0 });
                    continue;
                }
                
                // 関数コンポーネント
                const reactMatch = line.match(reactFuncPattern);
                if (reactMatch) {
                    result.push({ name: reactMatch[1], type: 'component', level: 0 });
                    continue;
                }
                
                // 関数定義
                const funcMatch = line.match(functionPattern);
                if (funcMatch) {
                    result.push({ 
                        name: funcMatch[1], 
                        type: 'function', 
                        level: 0,
                        params: `(${funcMatch[2].trim()})` 
                    });
                    continue;
                }
                
                // オブジェクト定義
                const objMatch = line.match(objectPattern);
                if (objMatch) {
                    currentObject = objMatch[1];
                    result.push({ name: currentObject, type: 'object', level: 0 });
                    continue;
                }
                
                // クラス内のメソッド
                if (currentClass) {
                    const methodMatch = line.match(methodPattern);
                    if (methodMatch && !line.startsWith('//') && !line.includes('function(')) {
                        result.push({ 
                            name: methodMatch[1], 
                            type: 'method', 
                            level: 1,
                            params: `(${methodMatch[2].trim()})` 
                        });
                        continue;
                    }
                    
                    // クラスフィールド
                    const fieldMatch = line.match(fieldPattern);
                    if (fieldMatch && !line.startsWith('//')) {
                        result.push({ name: fieldMatch[1], type: 'field', level: 1 });
                        continue;
                    }
                }
                
                // オブジェクトのメソッド（name: function() 形式）
                if (currentObject) {
                    const objMethodPattern = /^\s*(\w+)\s*:\s*(?:async\s+)?function\s*\((.*)\)/;
                    const objMethodMatch = line.match(objMethodPattern);
                    if (objMethodMatch) {
                        result.push({ 
                            name: objMethodMatch[1], 
                            type: 'method', 
                            level: 1,
                            params: `(${objMethodMatch[2].trim()})` 
                        });
                        continue;
                    }
                    
                    // オブジェクトのメソッド（name() 形式）
                    const shortMethodPattern = /^\s*(\w+)\s*\((.*)\)\s*{/;
                    const shortMethodMatch = line.match(shortMethodPattern);
                    if (shortMethodMatch) {
                        result.push({ 
                            name: shortMethodMatch[1], 
                            type: 'method', 
                            level: 1,
                            params: `(${shortMethodMatch[2].trim()})` 
                        });
                        continue;
                    }
                    
                    // オブジェクトのプロパティ
                    const propPattern = /^\s*(\w+)\s*:\s*(?!function)/;
                    const propMatch = line.match(propPattern);
                    if (propMatch && !line.startsWith('//')) {
                        result.push({ name: propMatch[1], type: 'property', level: 1 });
                        continue;
                    }
                }
                
                // クラスやオブジェクトの終了を検出
                if ((currentClass || currentObject) && braceLevel === 0) {
                    currentClass = null;
                    currentObject = null;
                }
            }
        } else if (language === 'python') {
            // Pythonのクラス定義
            const classPattern = /^class\s+(\w+)(?:\(.*\))?:/;
            // メソッド定義
            const methodPattern = /^(?:\s+)def\s+(\w+)\s*\((.*)\):/;
            // 関数定義
            const functionPattern = /^def\s+(\w+)\s*\((.*)\):/;
            
            let currentClass: string | null = null;
            let currentIndent = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const indent = line.match(/^\s*/)?.[0].length || 0;
                
                // インデントが減少したらクラスから出た可能性がある
                if (currentClass && indent <= currentIndent) {
                    currentClass = null;
                }
                
                // クラス定義
                const classMatch = line.match(classPattern);
                if (classMatch) {
                    currentClass = classMatch[1];
                    currentIndent = indent + 4; // Pythonの標準インデントは4スペース
                    result.push({ name: currentClass, type: 'class', level: 0 });
                    continue;
                }
                
                // メソッド定義（クラス内）
                if (currentClass) {
                    const methodMatch = line.match(methodPattern);
                    if (methodMatch) {
                        result.push({ 
                            name: methodMatch[1], 
                            type: 'method', 
                            level: 1,
                            params: `(${methodMatch[2].trim()})` 
                        });
                        continue;
                    }
                }
                
                // 関数定義（トップレベル）
                if (!currentClass) {
                    const funcMatch = line.match(functionPattern);
                    if (funcMatch) {
                        result.push({ 
                            name: funcMatch[1], 
                            type: 'function', 
                            level: 0,
                            params: `(${funcMatch[2].trim()})` 
                        });
                    }
                }
            }
        } else if (language === 'scala') {
            // Scalaのクラス/オブジェクト定義
            const classPattern = /^(?:abstract\s+)?(?:case\s+)?class\s+(\w+)(?:\[.*\])?(?:\s*\(.*\))?(?:\s+extends\s+[\w\s.]+)?(?:\s+with\s+[\w\s.]+)*/;
            const objectPattern = /^object\s+(\w+)(?:\s+extends\s+[\w\s.]+)?(?:\s+with\s+[\w\s.]+)*/;
            const traitPattern = /^trait\s+(\w+)(?:\s+extends\s+[\w\s.]+)?(?:\s+with\s+[\w\s.]+)*/;
            
            // メソッド定義
            const methodPattern = /^\s*(?:private\s+|protected\s+|override\s+)*def\s+(\w+)(?:\[.*\])?(?:\s*\((.*)\)|\s*=\s*)/;
            
            // val/var定義
            const valPattern = /^\s*(?:private\s+|protected\s+|override\s+)*(?:val|var)\s+(\w+)(?:\s*:.*)?(?:\s*=.*)?/;
            
            let currentClass: string | null = null;
            let braceLevel = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // 波括弧のレベルを追跡
                braceLevel += (line.match(/{/g) || []).length;
                braceLevel -= (line.match(/}/g) || []).length;
                
                // クラス定義
                const classMatch = line.match(classPattern);
                if (classMatch) {
                    currentClass = classMatch[1];
                    result.push({ name: currentClass, type: 'class', level: 0 });
                    continue;
                }
                
                // オブジェクト定義
                const objectMatch = line.match(objectPattern);
                if (objectMatch) {
                    currentClass = objectMatch[1];
                    result.push({ name: currentClass, type: 'object', level: 0 });
                    continue;
                }
                
                // trait定義
                const traitMatch = line.match(traitPattern);
                if (traitMatch) {
                    currentClass = traitMatch[1];
                    result.push({ name: currentClass, type: 'trait', level: 0 });
                    continue;
                }
                
                // メソッド
                const methodMatch = line.match(methodPattern);
                if (methodMatch && !line.endsWith(";")) {
                    const level = currentClass ? 1 : 0;
                    const params = methodMatch[2] ? `(${methodMatch[2].trim()})` : '';
                    result.push({ 
                        name: methodMatch[1], 
                        type: 'method', 
                        level: level,
                        params: params 
                    });
                    continue;
                }
                
                // val/var定義
                if (currentClass) {
                    const valMatch = line.match(valPattern);
                    if (valMatch && !line.startsWith("//")) {
                        result.push({ name: valMatch[1], type: 'field', level: 1 });
                        continue;
                    }
                }
                
                // クラスやオブジェクトの終了を検出
                if (currentClass && braceLevel === 0) {
                    currentClass = null;
                }
            }
        }
        
        return result;
    }
    
    // YAMLを簡易的にパースする関数（完全なYAMLパーサーではない）
    private parseYaml(content: string): any {
        const lines = content.split('\n');
        const result: any = {};
        let currentKey = '';
        let indentLevel = 0;
        let currentObject = result;
        const stack: any[] = [result];
        
        for (const line of lines) {
            // コメント行やブランク行はスキップ
            if (line.trim().startsWith('#') || line.trim() === '') continue;
            
            // インデントレベルを取得
            const lineIndent = line.match(/^\s*/)?.[0].length || 0;
            
            // キーと値の分離（最初の:で分割）
            const match = line.trim().match(/^(.+?):\s*(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                
                // インデントが下がった場合、スタックを調整
                if (lineIndent < indentLevel) {
                    const levels = Math.floor((indentLevel - lineIndent) / 2);
                    for (let i = 0; i < levels; i++) {
                        stack.pop();
                    }
                    currentObject = stack[stack.length - 1];
                } 
                // インデントが上がった場合、新しいオブジェクトを作成
                else if (lineIndent > indentLevel) {
                    if (!currentObject[currentKey]) {
                        currentObject[currentKey] = {};
                    }
                    currentObject = currentObject[currentKey];
                    stack.push(currentObject);
                }
                
                indentLevel = lineIndent;
                currentKey = key;
                
                // 値が空でない場合は処理
                if (value) {
                    // 配列表記 [item1, item2] を処理
                    if (value.startsWith('[') && value.endsWith(']')) {
                        try {
                            currentObject[key] = JSON.parse(value.replace(/'/g, '"'));
                        } catch (e) {
                            currentObject[key] = value;
                        }
                    } 
                    // 数値の場合
                    else if (!isNaN(Number(value))) {
                        currentObject[key] = Number(value);
                    }
                    // 真偽値の場合
                    else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
                        currentObject[key] = value.toLowerCase() === 'true';
                    }
                    // その他の文字列
                    else {
                        // クォートを削除
                        if ((value.startsWith('"') && value.endsWith('"')) || 
                            (value.startsWith("'") && value.endsWith("'"))) {
                            currentObject[key] = value.substring(1, value.length - 1);
                        } else {
                            currentObject[key] = value;
                        }
                    }
                } else {
                    // 値が空の場合は空オブジェクトとして初期化
                    currentObject[key] = {};
                }
            }
        }
        
        return result;
    }
    
    // オブジェクトの構造を再帰的に抽出（レベルを指定）
    private extractObjectStructure(obj: any, result: Array<{name: string, type: string, level: number, params?: string, info?: string}>, level: number, maxLevel: number = 2): void {
        // 第二階層まで（maxLevel=2）
        if (level > maxLevel) return;
        
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            const valueType = this.getDataType(value);
            
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    // 配列の場合
                    result.push({ 
                        name: key, 
                        type: 'array', 
                        level: level,
                        info: `(Array: ${value.length} items)` 
                    });
                    
                    // 配列の要素は特別な場合のみ処理（内容が重要な小さい配列など）
                    if (value.length > 0 && value.length <= 3 && level < maxLevel) {
                        for (let i = 0; i < value.length; i++) {
                            const item = value[i];
                            if (typeof item === 'object' && item !== null) {
                                result.push({ 
                                    name: `${key}[${i}]`, 
                                    type: this.getDataType(item), 
                                    level: level + 1 
                                });
                            } else {
                                result.push({ 
                                    name: `${key}[${i}]`, 
                                    type: this.getDataType(item), 
                                    level: level + 1,
                                    info: this.getValuePreview(item)
                                });
                            }
                        }
                    }
                } else {
                    // オブジェクトの場合
                    result.push({ 
                        name: key, 
                        type: 'object', 
                        level: level,
                        info: `(Object: ${Object.keys(value).length} keys)` 
                    });
                    
                    // 次の階層を処理
                    this.extractObjectStructure(value, result, level + 1, maxLevel);
                }
            } else {
                // プリミティブ値
                result.push({ 
                    name: key, 
                    type: valueType, 
                    level: level,
                    info: this.getValuePreview(value)
                });
            }
        }
    }
    
    // データ型を判定して返す
    private getDataType(value: any): string {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }
    
    // 値のプレビューを生成（文字列表現）
    private getValuePreview(value: any): string {
        if (value === null) return '(null)';
        if (value === undefined) return '(undefined)';
        
        if (typeof value === 'string') {
            // 長い文字列は切り詰める
            if (value.length > 30) {
                return `"${value.substring(0, 27)}..."`;
            }
            return `"${value}"`;
        }
        
        if (typeof value === 'number' || typeof value === 'boolean') {
            return `(${value})`;
        }
        
        return '';
    }
    
    // コード要素の種類に応じたアイコンを返す
    private getTypeIcon(type: string): string {
        switch (type) {
            case 'class': return '🔷';
            case 'component': return '⚛️';
            case 'method': return '🔹';
            case 'function': return '🔸';
            case 'field': return '📎';
            case 'property': return '🔗';
            case 'object': return '📦';
            case 'array': return '📚';
            case 'trait': return '🔶';
            case 'string': return '📝';
            case 'number': return '🔢';
            case 'boolean': return '⚖️';
            case 'null': return '⭕';
            case 'error': return '❌';
            case 'ellipsis': return '…';
            default: return '��';
        }
    }
}

```
