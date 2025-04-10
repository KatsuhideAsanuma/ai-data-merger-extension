import * as vscode from 'vscode';
import { ConfigManager } from './components/ConfigManager';
import { QueueManager } from './components/QueueManager';
import { MergeManager } from './components/MergeManager';
import { HistoryManager } from './components/HistoryManager';
import { SelectionTreeViewProvider } from './treeViews/SelectionTreeViewProvider';
import { HistoryTreeViewProvider } from './treeViews/HistoryTreeViewProvider';

export function activate(context: vscode.ExtensionContext) {
    // 各マネージャーの初期化
    const configManager = new ConfigManager();
    const queueManager = new QueueManager();
    const historyManager = new HistoryManager(context);
    const mergeManager = new MergeManager(queueManager, configManager, historyManager);

    // ツリービュープロバイダーの登録
    const selectionTreeProvider = new SelectionTreeViewProvider(queueManager);
    const historyTreeProvider = new HistoryTreeViewProvider(historyManager);
    vscode.window.registerTreeDataProvider('selectionTreeView', selectionTreeProvider);
    vscode.window.registerTreeDataProvider('historyTreeView', historyTreeProvider);

    // コマンドの登録
    context.subscriptions.push(vscode.commands.registerCommand('extension.addFileToQueue', (uri: vscode.Uri) => {
        queueManager.addFile(uri.fsPath);
        selectionTreeProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.clearQueue', () => {
        queueManager.clearQueue();
        selectionTreeProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.generateMergedFile', async () => {
        try {
            await mergeManager.generateMergedFile();
            vscode.window.showInformationMessage("マージファイルが正常に生成されました。");
            historyTreeProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`マージ処理中にエラーが発生しました: ${error}`);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.reexecuteMerge', async (historyItem) => {
        try {
            mergeManager.loadHistoryMerge(historyItem);
            await mergeManager.generateMergedFile();
            vscode.window.showInformationMessage("履歴からのマージ再実行に成功しました。");
        } catch (error) {
            vscode.window.showErrorMessage(`再実行中にエラーが発生しました: ${error}`);
        }
    }));
}

export function deactivate() {}
