import * as vscode from 'vscode';
import { QueueManager } from '../components/QueueManager';

export class SelectionTreeViewProvider implements vscode.TreeDataProvider<SelectionTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SelectionTreeItem | undefined | void> = new vscode.EventEmitter<SelectionTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<SelectionTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private queueManager: QueueManager) {}

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    getTreeItem(element: SelectionTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SelectionTreeItem): Thenable<SelectionTreeItem[]> {
        if (!element) {
            // キューに登録されている各カテゴリを親ノードとして返す
            const queue = this.queueManager.getQueue();
            const categories = Object.keys(queue);
            return Promise.resolve(categories.map(cat => new SelectionTreeItem(cat, vscode.TreeItemCollapsibleState.Collapsed, cat, true)));
        } else {
            // カテゴリノードの場合、子ノードとしてファイルパスを返す
            if (element.isCategory) {
                const queue = this.queueManager.getQueue();
                const files = queue[element.label] || [];
                return Promise.resolve(files.map((file, index) => new SelectionTreeItem(file, vscode.TreeItemCollapsibleState.None, element.label, false, index)));
            }
            return Promise.resolve([]);
        }
    }
}

export class SelectionTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly category?: string,
        public readonly isCategory: boolean = false,
        public readonly index?: number
    ) {
        super(label, collapsibleState);
        if (!isCategory) {
            this.contextValue = 'file';
            this.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [vscode.Uri.file(label)]
            };
        } else {
            this.contextValue = 'category';
        }
    }
}
