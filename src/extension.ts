import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from './components/ConfigManager';
import { HistoryManager } from './components/HistoryManager';
import { MergeManager } from './components/MergeManager';
import { QueueManager } from './components/QueueManager';
import { HistoryTreeViewProvider } from './treeViews/HistoryTreeViewProvider';
import { SelectionTreeViewProvider } from './treeViews/SelectionTreeViewProvider';

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

    // ファイルがテキスト形式かどうかをチェックする関数
    const isTextFile = async (filePath: string): Promise<boolean> => {
        // ディレクトリの場合は許可
        if (fs.statSync(filePath).isDirectory()) {
            return true;
        }
        
        // 設定から許可されたファイルタイプを取得
        const allowedTypes = vscode.workspace.getConfiguration('aiDataMerger').get('allowedFileTypes') as string[];
        
        try {
            // ファイルのLanguageIdを取得
            const doc = await vscode.workspace.openTextDocument(filePath);
            const languageId = doc.languageId;
            
            return allowedTypes.includes(languageId);
        } catch (error) {
            // ファイルが開けない場合はバイナリファイルとみなす
            console.log(`ファイルを開けませんでした: ${filePath}`, error);
            return false;
        }
    };

    // コマンドの登録
    context.subscriptions.push(vscode.commands.registerCommand('extension.addFileToQueue', async (uri: vscode.Uri) => {
        // ファイルの種類を確認
        const isText = await isTextFile(uri.fsPath);
        
        if (!isText && !fs.statSync(uri.fsPath).isDirectory()) {
            vscode.window.showWarningMessage(`対応していないファイル形式です: ${path.basename(uri.fsPath)}`);
            return;
        }
        
        // カテゴリ選択UIを表示
        if (configManager.categories.length > 0) {
            const selectedCategory = await vscode.window.showQuickPick(configManager.categories, {
                placeHolder: 'ファイルを追加するカテゴリを選択してください'
            });

            if (selectedCategory) {
                // 選択されたカテゴリにファイルを追加
                queueManager.addFile(uri.fsPath, selectedCategory);
                vscode.window.showInformationMessage(`ファイルを「${selectedCategory}」カテゴリに追加しました`);
            } else {
                // キャンセルされた場合
                return;
            }
        } else {
            // カテゴリがない場合はデフォルトで追加
            queueManager.addFile(uri.fsPath);
        }
        selectionTreeProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.clearQueue', () => {
        queueManager.clearQueue();
        selectionTreeProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.generateMergedFile', async () => {
        // キューが空でないか確認
        const queue = queueManager.getQueue();
        const hasFiles = Object.values(queue).some(files => files && files.length > 0);
        
        if (!hasFiles) {
            vscode.window.showWarningMessage("マージキューにファイルが追加されていません。先にファイルを追加してください。");
            return;
        }

        try {
            await mergeManager.generateMergedFile();
            // メッセージはMergeManagerで表示するため、ここでは表示しない
            historyTreeProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`マージ処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('マージエラー詳細:', error);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.reexecuteMerge', async (historyItem) => {
        try {
            mergeManager.loadHistoryMerge(historyItem);
            await mergeManager.generateMergedFile();
            // メッセージはMergeManagerで表示するため、ここでは表示しない
        } catch (error) {
            vscode.window.showErrorMessage(`再実行中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('再実行エラー詳細:', error);
        }
    }));

    // ファイルのカテゴリ変更コマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.changeFileCategory', async (item: any) => {
        if (item && item.category && typeof item.index === 'number') {
            const selectedCategory = await vscode.window.showQuickPick(
                configManager.categories.filter(cat => cat !== item.category),
                { placeHolder: '移動先のカテゴリを選択してください' }
            );

            if (selectedCategory) {
                // 元のカテゴリから削除
                const filePath = queueManager.getQueue()[item.category][item.index];
                queueManager.removeFile(item.category, item.index);
                
                // 新しいカテゴリに追加
                queueManager.addFile(filePath, selectedCategory);
                
                // ツリーを更新
                selectionTreeProvider.refresh();
                vscode.window.showInformationMessage(`ファイルを「${selectedCategory}」カテゴリに移動しました`);
            }
        }
    }));
}

export function deactivate() {}
