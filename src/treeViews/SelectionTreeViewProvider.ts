import * as path from 'path';
import * as vscode from 'vscode';
import { QueueManager } from '../components/QueueManager';

export class SelectionTreeViewProvider implements vscode.TreeDataProvider<SelectionTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SelectionTreeItem | null> = new vscode.EventEmitter<SelectionTreeItem | null>();
    readonly onDidChangeTreeData: vscode.Event<SelectionTreeItem | null> = this._onDidChangeTreeData.event;
    
    constructor(private queueManager: QueueManager) {}

    refresh(): void {
		this._onDidChangeTreeData.fire(null);
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
                const files = queue[element.label.toString()] || [];
                return Promise.resolve(files.map((file, index) => new SelectionTreeItem(file, vscode.TreeItemCollapsibleState.None, element.label.toString(), false, index)));
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
            this.description = path.basename(label);
            this.tooltip = label;
            // ラベルをファイル名だけにする
            this.label = path.basename(label);
            // ファイルアイコンを設定
            this.iconPath = {
                light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'file.svg'),
                dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'file.svg')
            };
        } else {
            this.contextValue = 'category';
            // カテゴリアイコンを設定
            this.iconPath = {
                light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
                dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
            };
        }
    }
}
