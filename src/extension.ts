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
            // ファイル名を指定せずにマージを実行（ダイアログが表示される）
            await mergeManager.generateMergedFile();
            historyTreeProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`マージ処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('マージエラー詳細:', error);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.reexecuteMerge', async (historyItem) => {
        try {
            mergeManager.loadHistoryMerge(historyItem);
            
            // 出力パスとファイル名を結合
            let fullOutputPath = '';
            if (historyItem.outputPath && historyItem.fileName) {
                fullOutputPath = path.join(historyItem.outputPath, historyItem.fileName);
            }
            
            // 履歴に保存されているファイル名を使用してマージを実行
            await mergeManager.generateMergedFile(fullOutputPath);
        } catch (error) {
            vscode.window.showErrorMessage(`再実行中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('再実行エラー詳細:', error);
        }
    }));

    // 履歴アイテムをマージリストに追加するコマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.addHistoryToMergeList', async (item) => {
        try {
            if (item && item.historyItem) {
                // マージリストに追加
                await mergeManager.addHistoryToProjectMergeList(item.historyItem);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`マージリストへの追加に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('マージリスト追加エラー:', error);
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

    // ファイルの削除コマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.removeFileFromQueue', (item: any) => {
        if (item && item.category && typeof item.index === 'number') {
            const filePath = queueManager.getQueue()[item.category][item.index];
            queueManager.removeFile(item.category, item.index);
            selectionTreeProvider.refresh();
            vscode.window.showInformationMessage(`ファイルをキューから削除しました: ${path.basename(filePath)}`);
        }
    }));

    // ファイルを上に移動コマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.moveFileUp', (item: any) => {
        if (item && item.category && typeof item.index === 'number') {
            // インデックスが0より大きい場合のみ上に移動可能
            if (item.index > 0) {
                queueManager.moveFile(item.category, item.index, item.index - 1);
                selectionTreeProvider.refresh();
            }
        }
    }));

    // ファイルを下に移動コマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.moveFileDown', (item: any) => {
        if (item && item.category && typeof item.index === 'number') {
            const files = queueManager.getQueue()[item.category];
            // インデックスが配列の最後の要素より小さい場合のみ下に移動可能
            if (files && item.index < files.length - 1) {
                queueManager.moveFile(item.category, item.index, item.index + 1);
                selectionTreeProvider.refresh();
            }
        }
    }));

    // プロジェクト固有のマージリストを読み込み実行するコマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.loadProjectMergeList', async () => {
        try {
            // プロジェクトのマージリストを読み込む
            const mergeLists = await mergeManager.loadProjectMergeLists();
            
            if (mergeLists.length === 0) {
                vscode.window.showInformationMessage('プロジェクトにマージリストが保存されていません。');
                return;
            }
            
            // マージリストの選択肢を作成
            const items = mergeLists.map(item => ({
                label: item.name || item.fileName,
                description: `最終更新: ${new Date(item.timestamp).toLocaleString()}`,
                detail: `ファイル数: ${Object.values(item.queue).reduce((sum, files) => sum + files.length, 0)}`,
                mergeList: item
            }));
            
            // マージリストを選択
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: '実行するマージリストを選択してください'
            });
            
            if (!selected) {
                return;
            }
            
            // 選択されたマージリストを実行
            mergeManager.loadHistoryMerge(selected.mergeList);
            await mergeManager.generateMergedFile(selected.mergeList.fileName);
            
        } catch (error) {
            vscode.window.showErrorMessage(`マージリストの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('マージリスト読み込みエラー:', error);
        }
    }));
}

export function deactivate() {}
