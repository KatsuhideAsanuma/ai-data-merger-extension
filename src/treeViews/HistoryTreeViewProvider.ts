import * as vscode from 'vscode';
import { HistoryManager, MergeHistoryItem } from '../components/HistoryManager';

export class HistoryTreeViewProvider implements vscode.TreeDataProvider<HistoryTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HistoryTreeItem | null> = new vscode.EventEmitter<HistoryTreeItem | null>();
    readonly onDidChangeTreeData: vscode.Event<HistoryTreeItem | null> = this._onDidChangeTreeData.event;
    
    constructor(private historyManager: HistoryManager) {}

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: HistoryTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: HistoryTreeItem): Thenable<HistoryTreeItem[]> {
        const history = this.historyManager.getHistory();
        return Promise.resolve(history.map((item, index) => {
            const label = `${item.timestamp} - ${item.fileName}`;
            return new HistoryTreeItem(label, index);
        }));
    }
}

export class HistoryTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly index: number
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'history';
    }
}
