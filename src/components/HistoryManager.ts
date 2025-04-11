import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface MergeHistoryItem {
    timestamp: string;
    queue: { [category: string]: string[] };
    outputPath: string;
    fileName: string;
    name?: string; // Name of merge list (for display)
}

export class HistoryManager {
    private history: MergeHistoryItem[] = [];
    private historyFilePath: string;

    constructor(private context: vscode.ExtensionContext) {
        // Save history file in global storage path
        this.historyFilePath = path.join(context.globalStoragePath, 'mergeHistory.json');
        this.loadHistory();
    }

    private loadHistory() {
        if (fs.existsSync(this.historyFilePath)) {
            const content = fs.readFileSync(this.historyFilePath, 'utf8');
            try {
                this.history = JSON.parse(content);
            } catch (error) {
                vscode.window.showErrorMessage("Error loading history file.");
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
