import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface MergeHistoryItem {
    timestamp: string;
    queue: { [category: string]: string[] };
    outputPath: string;
    fileName: string;
    name?: string; // マージリストの名前（表示用）
}

export class HistoryManager {
    private history: MergeHistoryItem[] = [];
    private historyFilePath: string;

    constructor(private context: vscode.ExtensionContext) {
        // グローバルストレージパス内に履歴ファイルを保存
        this.historyFilePath = path.join(context.globalStoragePath, 'mergeHistory.json');
        this.loadHistory();
    }

    private loadHistory() {
        if (fs.existsSync(this.historyFilePath)) {
            const content = fs.readFileSync(this.historyFilePath, 'utf8');
            try {
                this.history = JSON.parse(content);
            } catch (error) {
                vscode.window.showErrorMessage("履歴ファイルの読み込みでエラーが発生しました。");
                this.history = [];
            }
        }
    }

    public saveHistory(item: MergeHistoryItem) {
        this.history.push(item);
        fs.mkdirSync(path.dirname(this.historyFilePath), { recursive: true });
        fs.writeFileSync(this.historyFilePath, JSON.stringify(this.history, null, 2));
    }

    public getHistory() {
        return this.history;
    }

    public deleteHistoryItem(index: number) {
        if (index >= 0 && index < this.history.length) {
            this.history.splice(index, 1);
            fs.writeFileSync(this.historyFilePath, JSON.stringify(this.history, null, 2));
        }
    }
}
