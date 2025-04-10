import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class ConfigManager {
    public categories: string[] = [];

    constructor() {
        this.loadCategories();
    }

    loadCategories() {
        // 設定ファイルのパスを複数の場所で試す
        let configFilePath = path.join(__dirname, '..', '..', 'config', 'categories.json');
        
        // ファイルが見つからない場合は、別の場所も試す
        if (!fs.existsSync(configFilePath)) {
            configFilePath = path.join(__dirname, '..', 'config', 'categories.json');
        }
        
        // ワークスペースルートでも試す
        if (!fs.existsSync(configFilePath) && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            configFilePath = path.join(workspaceRoot, 'config', 'categories.json');
        }

        if (fs.existsSync(configFilePath)) {
            try {
                const content = fs.readFileSync(configFilePath, 'utf8');
                const json = JSON.parse(content);
                if (Array.isArray(json.categories)) {
                    this.categories = json.categories;
                    console.log(`カテゴリを読み込みました: ${this.categories.join(', ')}`);
                } else {
                    console.error("categories.json の形式が不正です");
                    vscode.window.showErrorMessage("categories.json の形式が不正です。 { 'categories': [] } を想定しています。");
                }
            } catch (error) {
                console.error("categories.json パースエラー:", error);
                vscode.window.showErrorMessage("categories.json のパース中にエラーが発生しました。");
            }
        } else {
            console.log("categories.json が見つかりません。デフォルトカテゴリを使用します。パス試行:", configFilePath);
            vscode.window.showWarningMessage("categories.json が見つかりません。デフォルトのカテゴリを使用します。");
            this.categories = ["プロンプト出力", "設計書出力", "参照コード出力"];
        }
    }
}
