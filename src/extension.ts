import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from './components/ConfigManager';
import { HistoryManager } from './components/HistoryManager';
import { MergeManager } from './components/MergeManager';
import { PromptManager } from './components/PromptManager';
import { QueueManager } from './components/QueueManager';
import { HistoryTreeViewProvider } from './treeViews/HistoryTreeViewProvider';
import { PromptTreeViewProvider } from './treeViews/PromptTreeViewProvider';
import { SelectionTreeViewProvider } from './treeViews/SelectionTreeViewProvider';

export function activate(context: vscode.ExtensionContext) {
    // Initialize each manager
    const configManager = new ConfigManager();
    const queueManager = new QueueManager();
    const historyManager = new HistoryManager(context);
    const mergeManager = new MergeManager(queueManager, configManager, historyManager);
    const promptManager = new PromptManager(context);

    // Register tree view providers
    const selectionTreeProvider = new SelectionTreeViewProvider(queueManager);
    const historyTreeProvider = new HistoryTreeViewProvider(historyManager);
    const promptTreeProvider = new PromptTreeViewProvider(promptManager);
    vscode.window.registerTreeDataProvider('selectionTreeView', selectionTreeProvider);
    vscode.window.registerTreeDataProvider('historyTreeView', historyTreeProvider);
    vscode.window.registerTreeDataProvider('promptsTreeView', promptTreeProvider);

    // Function to check if a file is a text file
    const isTextFile = async (filePath: string): Promise<boolean> => {
        // Allow directories
        if (fs.statSync(filePath).isDirectory()) {
            return true;
        }
        
        // Get allowed file types from settings
        const allowedTypes = vscode.workspace.getConfiguration('aiDataMerger').get('allowedFileTypes') as string[];
        
        try {
            // Get the file's LanguageId
            const doc = await vscode.workspace.openTextDocument(filePath);
            const languageId = doc.languageId;
            
            return allowedTypes.includes(languageId);
        } catch (error) {
            // If file can't be opened, consider it a binary file
            console.log(`Could not open file: ${filePath}`, error);
            return false;
        }
    };

    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('extension.addFileToQueue', async (uri: vscode.Uri) => {
        // Check file type
        const isText = await isTextFile(uri.fsPath);
        
        if (!isText && !fs.statSync(uri.fsPath).isDirectory()) {
            vscode.window.showWarningMessage(`Unsupported file type: ${path.basename(uri.fsPath)}`);
            return;
        }
        
        // Show category selection UI
        if (configManager.categories.length > 0) {
            const selectedCategory = await vscode.window.showQuickPick(configManager.categories, {
                placeHolder: 'Select a category to add the file to'
            });

            if (selectedCategory) {
                // Add file to selected category
                queueManager.addFile(uri.fsPath, selectedCategory);
                vscode.window.showInformationMessage(`File added to category "${selectedCategory}"`);
            } else {
                // Cancelled
                return;
            }
        } else {
            // Add to default if no categories
            queueManager.addFile(uri.fsPath);
        }
        selectionTreeProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.clearQueue', () => {
        queueManager.clearQueue();
        selectionTreeProvider.refresh();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.generateMergedFile', async () => {
        // Check if queue is not empty
        const queue = queueManager.getQueue();
        const hasFiles = Object.values(queue).some(files => files && files.length > 0);
        
        if (!hasFiles) {
            vscode.window.showWarningMessage("No files added to merge queue. Please add files first.");
            return;
        }

        try {
            // Execute merge without specifying a file name (dialog will be displayed)
            await mergeManager.generateMergedFile();
            historyTreeProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Error during merge process: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Merge error details:', error);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.reexecuteMerge', async (historyItem) => {
        try {
            mergeManager.loadHistoryMerge(historyItem);
            
            // Combine output path and file name
            let fullOutputPath = '';
            if (historyItem.outputPath && historyItem.fileName) {
                fullOutputPath = path.join(historyItem.outputPath, historyItem.fileName);
            }
            
            // Execute merge using the file name saved in history
            await mergeManager.generateMergedFile(fullOutputPath);
        } catch (error) {
            vscode.window.showErrorMessage(`Error during re-execution: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Re-execution error details:', error);
        }
    }));

    // Command to add a history item to merge list
    context.subscriptions.push(vscode.commands.registerCommand('extension.addHistoryToMergeList', async (item) => {
        try {
            if (item && item.historyItem) {
                // Add to merge list
                await mergeManager.addHistoryToProjectMergeList(item.historyItem);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to add to merge list: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Merge list addition error:', error);
        }
    }));

    // Command to change file category
    context.subscriptions.push(vscode.commands.registerCommand('extension.changeFileCategory', async (item: any) => {
        if (item && item.category && typeof item.index === 'number') {
            const selectedCategory = await vscode.window.showQuickPick(
                configManager.categories.filter(cat => cat !== item.category),
                { placeHolder: 'Select destination category' }
            );

            if (selectedCategory) {
                // Remove from original category
                const filePath = queueManager.getQueue()[item.category][item.index];
                queueManager.removeFile(item.category, item.index);
                
                // Add to new category
                queueManager.addFile(filePath, selectedCategory);
                
                // Update tree
                selectionTreeProvider.refresh();
                vscode.window.showInformationMessage(`File moved to category "${selectedCategory}"`);
            }
        }
    }));

    // ファイルの削除コマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.removeFileFromQueue', (item: any) => {
        if (item && item.category && typeof item.index === 'number') {
            const filePath = queueManager.getQueue()[item.category][item.index];
            queueManager.removeFile(item.category, item.index);
            selectionTreeProvider.refresh();
            vscode.window.showInformationMessage(`File removed from queue: ${path.basename(filePath)}`);
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
                vscode.window.showInformationMessage('No merge lists saved for the project.');
                return;
            }
            
            // マージリストの選択肢を作成
            const items = mergeLists.map(item => ({
                label: item.name || item.fileName,
                description: `Last updated: ${new Date(item.timestamp).toLocaleString()}`,
                detail: `File count: ${Object.values(item.queue).reduce((sum, files) => sum + files.length, 0)}`,
                mergeList: item
            }));
            
            // マージリストを選択
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select merge list to execute'
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

    // プロンプトテンプレート作成コマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.createPromptTemplate', () => promptManager.createTemplatePrompt()));

    // 単純テキストプロンプト作成コマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.createSimplePrompt', () => promptManager.createSimpleTextPrompt()));

    // テンプレートからテキストプロンプト生成コマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.generateFromTemplate', (promptId) => promptManager.generateFromTemplate(promptId)));

    // プロンプト編集コマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.editPrompt', async (item) => {
        try {
            if (item && item.promptId) {
                await promptManager.editPrompt(item.promptId);
                promptTreeProvider.refresh();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`プロンプト編集中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('プロンプト編集エラー:', error);
        }
    }));

    // プロンプトプレビューコマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.previewPrompt', async (promptId, type) => {
        try {
            const { templates, simpleTexts } = promptManager.getPrompts();
            let prompt;
            
            if (type === 'template') {
                prompt = templates.find(t => t.id === promptId);
            } else {
                prompt = simpleTexts.find(t => t.id === promptId);
            }
            
            if (prompt) {
                // プレビュー用ドキュメントを作成
                const document = await vscode.workspace.openTextDocument({
                    content: prompt.content,
                    language: 'markdown'
                });
                
                // エディタで開く
                await vscode.window.showTextDocument(document, { preview: true, viewColumn: vscode.ViewColumn.One });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`プロンプトプレビュー中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('プロンプトプレビューエラー:', error);
        }
    }));

    // プロンプトをマージキューに追加コマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.addPromptToQueue', async (item) => {
        try {
            if (item && item.promptId) {
                // プロンプトデータを取得
                const { simpleTexts } = promptManager.getPrompts();
                const prompt = simpleTexts.find(t => t.id === item.promptId);
                
                if (prompt) {
                    // カテゴリ選択UIを表示
                    if (configManager.categories.length > 0) {
                        const selectedCategory = await vscode.window.showQuickPick(configManager.categories, {
                            placeHolder: 'プロンプトを追加するカテゴリを選択してください'
                        });

                        if (selectedCategory) {
                            // 一時ファイルにプロンプト内容を保存
                            const tempDir = path.join(context.extensionPath, 'prompt_temp');
                            if (!fs.existsSync(tempDir)) {
                                fs.mkdirSync(tempDir, { recursive: true });
                            }
                            
                            const tempFilePath = path.join(tempDir, `${prompt.id}.md`);
                            fs.writeFileSync(tempFilePath, prompt.content);
                            
                            // キューに追加
                            queueManager.addFile(tempFilePath, selectedCategory);
                            selectionTreeProvider.refresh();
                            
                            vscode.window.showInformationMessage(`プロンプト「${prompt.name}」をマージキューに追加しました`);
                        }
                    }
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`プロンプトの追加中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('プロンプト追加エラー:', error);
        }
    }));

    // プロンプトエクスポートコマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.exportPrompts', async () => {
        try {
            await promptManager.exportPrompts();
        } catch (error) {
            vscode.window.showErrorMessage(`プロンプトのエクスポート中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('プロンプトエクスポートエラー:', error);
        }
    }));

    // プロンプトインポートコマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.importPrompts', async () => {
        try {
            await promptManager.importPrompts();
            promptTreeProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`プロンプトのインポート中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('プロンプトインポートエラー:', error);
        }
    }));

    // ファイルからプロンプト作成コマンド
    context.subscriptions.push(vscode.commands.registerCommand('extension.createPromptFromFile', async (uri: vscode.Uri) => {
        try {
            if (uri) {
                // ファイルの内容を読み込み
                const fileContent = fs.readFileSync(uri.fsPath, 'utf8');
                
                // プロンプト名の入力
                const fileName = path.basename(uri.fsPath);
                const name = await vscode.window.showInputBox({
                    prompt: 'プロンプト名を入力してください',
                    placeHolder: 'プロンプト名',
                    value: `${fileName}から作成されたプロンプト`
                });
                
                if (!name) {
                    return; // キャンセル
                }
                
                // カテゴリの選択または入力
                const categories = vscode.workspace.getConfiguration('aiDataMerger').get('promptCategories', []) as string[];
                let category = await vscode.window.showQuickPick([
                    ...categories,
                    '$(add) 新しいカテゴリを作成...'
                ], {
                    placeHolder: 'カテゴリを選択または作成'
                });
                
                if (!category) {
                    return; // キャンセル
                }
                
                // 新しいカテゴリを作成
                if (category === '$(add) 新しいカテゴリを作成...') {
                    category = await vscode.window.showInputBox({
                        prompt: '新しいカテゴリ名を入力してください',
                        placeHolder: '例: コード生成'
                    });
                    
                    if (!category) {
                        return; // キャンセル
                    }
                    
                    // 設定に新しいカテゴリを追加
                    const updatedCategories = [...categories, category];
                    await vscode.workspace.getConfiguration('aiDataMerger').update('promptCategories', updatedCategories, vscode.ConfigurationTarget.Workspace);
                }
                
                // プロンプトID生成
                const promptId = `simple-${Date.now()}`;
                
                // 一時ファイルパスの生成
                const promptsPath = vscode.workspace.getConfiguration('aiDataMerger').get('promptsStoragePath', './prompts') as string;
                let absolutePromptsPath = promptsPath;
                
                if (!path.isAbsolute(promptsPath) && vscode.workspace.workspaceFolders) {
                    absolutePromptsPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, promptsPath);
                }
                
                const tempDir = path.join(absolutePromptsPath, 'temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                const tempFilePath = path.join(tempDir, `${promptId}.md`);
                
                // 一時ファイルに内容を書き込み
                fs.writeFileSync(tempFilePath, fileContent);
                
                // エディタで開く
                const document = await vscode.workspace.openTextDocument(vscode.Uri.file(tempFilePath));
                const editor = await vscode.window.showTextDocument(document);
                
                // 保存コマンドを登録
                const disposable = vscode.commands.registerCommand('extension.finishPromptFromFileEdit', async () => {
                    const content = editor.document.getText();
                    
                    // 新しい単純テキストプロンプトの作成
                    const simpleText = {
                        id: promptId,
                        name,
                        category,
                        type: 'simpleText' as const,
                        content,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        tokenCount: Math.ceil(content.length / 4) // 簡易計算
                    };
                    
                    // 永続化データの保存
                    const simpleTextsDir = path.join(absolutePromptsPath, 'simpleTexts');
                    if (!fs.existsSync(simpleTextsDir)) {
                        fs.mkdirSync(simpleTextsDir, { recursive: true });
                    }
                    
                    const jsonFilePath = path.join(simpleTextsDir, `${promptId}.json`);
                    fs.writeFileSync(jsonFilePath, JSON.stringify(simpleText, null, 2));
                    
                    // インデックスファイルの更新
                    const indexFilePath = path.join(absolutePromptsPath, 'prompts-index.json');
                    let indexData: { templates: string[], simpleTexts: string[] } = { templates: [], simpleTexts: [] };
                    
                    if (fs.existsSync(indexFilePath)) {
                        indexData = JSON.parse(fs.readFileSync(indexFilePath, 'utf8'));
                    }
                    
                    if (!Array.isArray(indexData.simpleTexts)) {
                        indexData.simpleTexts = [];
                    }
                    
                    indexData.simpleTexts.push(promptId);
                    
                    fs.writeFileSync(indexFilePath, JSON.stringify(indexData, null, 2));
                    
                    // エディタを閉じる
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    
                    // 一時ファイルの削除
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                    }
                    
                    // コマンドの登録解除
                    disposable.dispose();
                    
                    vscode.window.showInformationMessage(`プロンプト「${name}」を作成しました`);
                    promptTreeProvider.refresh();
                });
                
                // ステータスバーアイテムを表示
                const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
                statusBarItem.text = '$(save) プロンプト保存';
                statusBarItem.tooltip = 'クリックするとプロンプトを保存します';
                statusBarItem.command = 'extension.finishPromptFromFileEdit';
                statusBarItem.show();
                
                // エディタが閉じられたときにステータスバーアイテムを削除
                const subscriptions: vscode.Disposable[] = [];
                subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e => {
                    if (e !== editor) {
                        statusBarItem.dispose();
                        disposable.dispose();
                        subscriptions.forEach(s => s.dispose());
                    }
                }));
                
                // ツールチップ表示
                vscode.window.showInformationMessage(
                    `プロンプト「${name}」を編集中です。編集完了後、ステータスバーの「プロンプト保存」ボタンをクリックしてください。`
                );
            }
        } catch (error) {
            vscode.window.showErrorMessage(`ファイルからのプロンプト作成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
            console.error('ファイルからのプロンプト作成エラー:', error);
        }
    }));

    // コマンド登録を行う部分に以下のコードを追加
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.addToPromptTemplate', (promptId, filePath) => promptManager.addFileToTemplate(promptId, filePath)),
        vscode.commands.registerCommand('extension.createTemplate', () => promptManager.createTemplate()),
        vscode.commands.registerCommand('extension.editTemplate', (templateId) => promptManager.editTemplate(templateId)),
        vscode.commands.registerCommand('extension.editTemplateVariables', (templateId) => promptManager.editTemplateVariables(templateId)),
        vscode.commands.registerCommand('extension.deleteTemplate', (templateId) => promptManager.deleteTemplate(templateId))
    );
}

export function deactivate() {}
