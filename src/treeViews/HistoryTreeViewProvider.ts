import * as path from 'path';
import * as vscode from 'vscode';
import { HistoryManager } from '../components/HistoryManager';

export class HistoryTreeViewProvider implements vscode.TreeDataProvider<HistoryTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HistoryTreeItem | null> = new vscode.EventEmitter<HistoryTreeItem | null>();
    readonly onDidChangeTreeData: vscode.Event<HistoryTreeItem | null> = this._onDidChangeTreeData.event;
    
    constructor(private historyManager: HistoryManager) {}

    refresh(): void {
		this._onDidChangeTreeData.fire(null);
	}

    getTreeItem(element: HistoryTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: HistoryTreeItem): Thenable<HistoryTreeItem[]> {
        if (!element) {
            // ルートノードの場合は履歴項目を返す
            const history = this.historyManager.getHistory();
            
            return Promise.resolve(history.map((item, index) => {
                // 日付とファイル名をラベルに使用
                const date = new Date(item.timestamp);
                const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                const label = item.name 
                    ? `${item.name} (${formattedDate})`
                    : `${path.basename(item.fileName)} (${formattedDate})`;
                
                // ファイル数をカウント
                const totalFiles = Object.values(item.queue).reduce((acc, files) => acc + files.length, 0);
                
                return new HistoryTreeItem(
                    label, 
                    vscode.TreeItemCollapsibleState.None,
                    item,
                    index,
                    `ファイル数: ${totalFiles}`
                );
            }));
        }
        
        return Promise.resolve([]);
    }
}

export class HistoryTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly historyItem: any,
        public readonly index: number,
        public readonly description?: string
    ) {
        super(label, collapsibleState);
        this.contextValue = 'historyItem'; // コンテキストメニュー用の識別子
        this.tooltip = `${label}\n${description || ''}`;
        this.iconPath = {
            light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'history.svg'),
            dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'history.svg')
        };
        
        // コマンドは再実行
        this.command = {
            command: 'extension.reexecuteMerge',
            title: 'Re-Execute Merge',
            arguments: [historyItem]
        };
    }
}
