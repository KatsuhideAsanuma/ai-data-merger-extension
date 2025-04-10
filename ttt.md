## プロンプト出力

### LICENSE

MIT License

Copyright (c) 2025 Katsuhide Asanuma

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## 設計書出力

### README.md

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


### clearQueue.ts

import * as vscode from 'vscode';

export function clearQueue() {
    vscode.commands.executeCommand('extension.clearQueue');
}


## 参照コード出力

### package.json

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
      "onCommand:extension.loadProjectMergeList"
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
        }
      ],
      "viewsContainers": {
        "activitybar": [
          {
            "id": "aiDataMerger",
            "title": "AI Data Merger",
            "icon": "resources/icon.png"
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
  
