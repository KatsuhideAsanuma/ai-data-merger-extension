# AI Data Mergerプロンプト管理機能 設計書

## 目次
1. [概要](#概要)
2. [データモデル](#データモデル)
3. [主要機能フロー](#主要機能フロー)
4. [UI設計](#ui設計)
5. [ファイル構造](#ファイル構造)
6. [設定項目](#設定項目)
7. [コマンド一覧](#コマンド一覧)

## 概要

AI Data Merger拡張機能にプロンプト管理機能を追加し、マージ機能と連携させることで、効率的なAI対話環境を提供する。

### 主要コンセプト
- テンプレートと単純テキストの2種類のプロンプト形式
- マージデータとプロンプトの連携
- 変数プレースホルダーによるカスタマイズ
- ファイルインポート/エクスポート機能

## データモデル

### プロンプトデータ構造
```typescript
// プロンプトデータ（基本型）
interface PromptData {
  id: string;
  name: string;
  category: string;
  type: 'template' | 'simpleText';
  createdAt: number;
  updatedAt: number;
}

// テンプレート型プロンプト
interface TemplatePrompt extends PromptData {
  type: 'template';
  content: string; // プレースホルダー含むテンプレート
  variables: PromptVariable[];
}

// 単純テキスト型プロンプト
interface SimpleTextPrompt extends PromptData {
  type: 'simpleText';
  content: string; // 実際のプロンプトテキスト
  sourceTemplateId?: string; // 元テンプレートがある場合のみ
  mergedFileIds?: string[]; // 関連マージファイルID
  tokenCount?: number;
}

// プロンプト変数定義
interface PromptVariable {
  name: string;
  type: 'text' | 'fileList' | 'mdHeading' | 'mergedData';
  defaultValue?: string;
  description?: string;
}
```

## 主要機能フロー

### 1. テンプレート作成・管理フロー
```
1. プロンプトテンプレート作成コマンド実行
2. テンプレート名とカテゴリを入力
3. エディタでテンプレート編集
   - プレースホルダー形式: ${variable_name:type:description}
   - 例: ${context:mergedData:コードの文脈}
4. 変数定義を抽出して保存
5. テンプレートビューに表示（カテゴリ別ツリー構造）
```

### 2. 変数プレースホルダー処理フロー
```
1. テンプレートから「テキストプロンプト生成」コマンド実行
2. 変数入力フォーム表示
3. 変数タイプに応じた入力方法を提供:
   - text: テキスト入力フィールド
   - fileList: プロジェクト内ファイル選択（複数可）
   - mdHeading: キュー内MDファイルの見出し選択
   - mergedData: マージ済みデータの選択
4. 値を入力後、プレースホルダーを置換して単純テキストプロンプト生成
5. 生成されたプロンプトを編集可能なフォームで表示
6. 保存して単純テキストプロンプトとして登録
```

### 3. 単純テキストプロンプト直接作成フロー
```
1. 「Create Simple Text Prompt」コマンド実行
2. プロンプト名とカテゴリを入力
3. 専用エディタビューが開く
   - 通常のテキストエディタ機能
   - トークンカウンター表示
   - プロンプト補助機能バー（挿入ツール）
4. プロンプト内容を自由に記述
5. 追加機能:
   - マークダウン構文ハイライト
   - プレビュー機能
   - 定型句挿入（「以下のコードについて説明してください」など）
6. 保存して単純テキストプロンプトとして登録
```

### 4. 単純テキストプロンプト編集フロー
```
1. プロンプトビューから既存の単純テキストプロンプトを選択
2. 「Edit Prompt」コマンド実行（コンテキストメニューまたはアイコン）
3. 専用エディタビューで開く
4. 変更内容を編集
5. 特殊挿入オプション:
   - プロジェクトファイル内容の挿入
   - マージデータの挿入
   - 定型句の挿入
6. 保存して更新（バージョン履歴も保持）
```

### 5. マージデータとプロンプト連携フロー
```
1. マージデータ生成後に「プロンプトに挿入」オプション選択
2. 挿入先の選択:
   a. 新規テキストプロンプト作成
   b. 既存テキストプロンプトに追加
   c. テンプレートの変数として使用
3. 選択に応じた処理:
   a. 新規テキストフォーム表示、マージデータ挿入位置を指定
   b. 既存プロンプト選択、挿入位置指定
   c. テンプレート選択、変数マッピング（mergedData型の変数に割当）
4. プロンプト保存（元マージデータへの参照情報を保持）
```

### 6. キュー連携フロー
```
1. 単純テキストプロンプトをキューに追加するコマンド実行
2. プロンプトを特殊タイプのファイルとしてキューに登録
3. マージ実行時の処理オプション選択:
   a. プロンプトを通常テキストとして扱う
   b. プロンプトを特別セクションとして扱う（例："## AI指示" など）
4. マージ後の出力ファイルに含める
```

### 7. コンテキスト管理フロー
```
1. テキストプロンプト生成/編集時にトークン概算を表示
2. マージデータ含む場合はデータサイズに応じた警告
3. 制限超過時の対応オプション:
   a. 手動編集（トークン数リアルタイム表示）
   b. 自動要約生成提案
   c. 分割提案（複数プロンプトに分割）
4. 調整後のプロンプト保存
```

### 8. プロンプト出力（エクスポート）フロー
```
1. プロンプトビューから対象を選択
   - 単一プロンプト
   - カテゴリ全体
   - 全プロンプト
2. 「Export Prompts」コマンド実行
3. 出力形式の選択:
   a. JSON形式（メタデータ含む完全形式）
   b. テキスト形式（単純テキストプロンプトのみ）
   c. マークダウン形式（構造化プロンプト）
4. 出力先の選択:
   a. ファイルに保存
   b. クリップボードにコピー
5. ファイル出力時はファイル名とパスを指定
6. エクスポート完了通知
```

### 9. プロンプト取り込み（インポート）フロー
```
1. 「Import Prompts」コマンド実行
2. インポート方法の選択:
   a. ファイルから
   b. クリップボードから
   c. 開いているエディタから
3. ファイル選択またはテキスト確認
4. インポート形式の検出または指定:
   a. JSON形式（拡張形式）
   b. テキスト形式（単純テキストとして）
5. インポート設定:
   a. カテゴリの割り当て
   b. 既存プロンプトと重複時の対応（上書き/リネーム/スキップ）
6. インポート実行
7. 結果サマリー表示（取り込んだプロンプト数など）
```

### 10. プロンプト一括管理フロー
```
1. プロンプトライブラリのバックアップ
   a. 「Backup Prompts Library」コマンド実行
   b. バックアップファイル名と場所を指定
   c. すべてのプロンプトをJSONアーカイブとして出力

2. プロンプトライブラリの復元
   a. 「Restore Prompts Library」コマンド実行
   b. バックアップファイルを選択
   c. 復元方法選択（完全置換/マージ）
   d. 復元実行と結果報告
```

## UI設計

### プロンプトビューのUI構造
```
Prompts
├── テンプレート
│   ├── コード生成
│   │   └── APIクライアント生成
│   └── 説明要求
│       └── コード解説テンプレート
└── テキストプロンプト
    ├── コード生成
    │   └── React Component生成
    └── 一般
        └── プロジェクト概要説明
```

### プロンプトエディタサイドパネル
```
プロンプトエディタサイドパネル:
├── 挿入
│   ├── ファイル挿入
│   ├── スニペット挿入
│   ├── マージデータ挿入
│   └── 変数挿入
├── 分析
│   ├── トークンカウント
│   ├── 文字数
│   └── 最適化提案
└── 表示
    ├── プレビュー
    ├── マークダウン表示
    └── プレーンテキスト表示
```

## ファイル構造

```
/prompts
  /templates
    template1.json
    template2.json
  /simpleTexts
    prompt1.json
    prompt2.json
  prompts-index.json  // 全プロンプトのインデックス
```

### ファイル形式（JSON）
```json
{
  "version": "1.0",
  "exportDate": "2023-06-01T12:00:00Z",
  "prompts": [
    {
      "id": "prompt-1",
      "name": "Code Explanation",
      "category": "説明要求",
      "type": "template",
      "content": "以下のコードについて説明してください：\n\n${code:text:説明が必要なコード}",
      "variables": [
        {
          "name": "code",
          "type": "text",
          "description": "説明が必要なコード"
        }
      ],
      "createdAt": 1685620800000,
      "updatedAt": 1685620800000
    },
    {
      "id": "prompt-2",
      "name": "バグ修正依頼",
      "category": "デバッグ",
      "type": "simpleText",
      "content": "以下のコードにバグがあります。修正方法を教えてください。\n\n```javascript\nfunction add(a, b) {\n  return a - b; // バグ: 引き算になっている\n}\n```",
      "createdAt": 1685624400000,
      "updatedAt": 1685624400000
    }
  ]
}
```

### テキスト形式（マークダウン）
```markdown
# プロンプト: コード最適化依頼
## カテゴリ: コード生成
## タイプ: 単純テキスト

以下のコードを最適化してください。特にパフォーマンスと可読性を向上させてください。

```javascript
function processData(data) {
  let results = [];
  for (let i = 0; i < data.length; i++) {
    let item = data[i];
    if (item.value > 10) {
      results.push({
        id: item.id,
        processedValue: item.value * 2
      });
    }
  }
  return results;
}
```

最適化の理由も説明してください。
```

## 設定項目

```json
"aiDataMerger.promptsStoragePath": {
  "type": "string",
  "default": "./prompts",
  "description": "プロンプトデータの保存先フォルダ"
},
"aiDataMerger.promptCategories": {
  "type": "array",
  "default": [
    "コード生成",
    "説明要求",
    "要約",
    "デバッグ",
    "一般"
  ],
  "description": "プロンプトのカテゴリ一覧"
},
"aiDataMerger.maxTokenWarningThreshold": {
  "type": "number",
  "default": 4000,
  "description": "トークン数警告の閾値"
},
"aiDataMerger.promptSnippets": {
  "type": "array",
  "default": [
    {
      "name": "コード説明",
      "text": "以下のコードについて説明してください："
    },
    {
      "name": "バグ修正",
      "text": "以下のコードにあるバグを見つけて修正してください："
    },
    {
      "name": "リファクタリング",
      "text": "以下のコードをより効率的にリファクタリングしてください："
    }
  ],
  "description": "プロンプト作成時に挿入可能な定型句"
}
```

## コマンド一覧

```json
{
  "command": "extension.createPromptTemplate",
  "title": "Create Prompt Template",
  "icon": "$(file-add)"
},
{
  "command": "extension.createSimplePrompt",
  "title": "Create Simple Text Prompt",
  "icon": "$(new-file)"
},
{
  "command": "extension.generateFromTemplate",
  "title": "Generate Text Prompt from Template",
  "icon": "$(debug-step-over)"
},
{
  "command": "extension.editPrompt",
  "title": "Edit Prompt",
  "icon": "$(edit)"
},
{
  "command": "extension.previewPrompt",
  "title": "Preview Prompt",
  "icon": "$(preview)"
},
{
  "command": "extension.insertSnippet",
  "title": "Insert Prompt Snippet",
  "icon": "$(symbol-snippet)"
},
{
  "command": "extension.addPromptToQueue",
  "title": "Add Prompt to Merge Queue",
  "icon": "$(add)"
},
{
  "command": "extension.insertMergedDataToPrompt",
  "title": "Insert Merged Data to Prompt",
  "icon": "$(insert)"
},
{
  "command": "extension.exportPrompts",
  "title": "Export Prompts",
  "icon": "$(export)"
},
{
  "command": "extension.importPrompts",
  "title": "Import Prompts",
  "icon": "$(import)"
},
{
  "command": "extension.createPromptFromFile",
  "title": "Create Prompt from File",
  "icon": "$(file-add)"
},
{
  "command": "extension.savePromptAsFile",
  "title": "Save Prompt as File",
  "icon": "$(save-as)"
},
{
  "command": "extension.backupPromptsLibrary",
  "title": "Backup Prompts Library",
  "icon": "$(archive)"
},
{
  "command": "extension.restorePromptsLibrary",
  "title": "Restore Prompts Library",
  "icon": "$(unarchive)"
}
``` 