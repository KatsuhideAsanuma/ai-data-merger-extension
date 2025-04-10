import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ConfigManager {
    public categories: string[] = [];

    constructor() {
        this.loadCategories();
    }

    loadCategories() {
        const configFilePath = path.join(__dirname, '..', 'config', 'categories.json');
        if (fs.existsSync(configFilePath)) {
            const content = fs.readFileSync(configFilePath, 'utf8');
            try {
                const json = JSON.parse(content);
                if (Array.isArray(json.categories)) {
                    this.categories = json.categories;
                } else {
                    vscode.window.showErrorMessage("categories.json の形式が不正です。 { 'categories': [] } を想定しています。");
                }
            } catch (error) {
                vscode.window.showErrorMessage("categories.json のパース中にエラーが発生しました。");
            }
        } else {
            vscode.window.showWarningMessage("categories.json が見つかりません。デフォルトのカテゴリを使用します。");
            this.categories = ["プロンプト出力", "設計書出力", "参照コード出力"];
        }
    }
}
