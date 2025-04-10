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
