import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from './ConfigManager';
import { HistoryManager, MergeHistoryItem } from './HistoryManager';
import { QueueManager } from './QueueManager';

export class MergeManager {
    constructor(
        private queueManager: QueueManager,
        private configManager: ConfigManager,
        private historyManager: HistoryManager
    ) {}

    async generateMergedFile(customFileName?: string) {
        const outputPath = vscode.workspace.getConfiguration('aiDataMerger').get('outputPath') as string || './merged';
        // デフォルトファイル名は設定から取得
        const defaultFileName = vscode.workspace.getConfiguration('aiDataMerger').get('defaultFileName') as string || 'merged_data.md';
        
        // ファイル名選択ダイアログを表示
        let fileName = customFileName;
        if (!fileName) {
            fileName = await vscode.window.showInputBox({
                prompt: 'マージファイルの名前を入力してください（相対パス可、例: docs/merged_data.md）',
                value: defaultFileName,
                placeHolder: '例: docs/data_merged.md'
            });
            
            if (!fileName) {
                // ユーザーがキャンセルした場合
                return;
            }
            
            // 拡張子がない場合は.mdを追加
            if (!path.extname(fileName)) {
                fileName += '.md';
            }
        }

        // ワークスペースルートを取得
        let workspaceRoot = '';
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }

        // 出力パスの処理
        let outputFilePath: string;
        
        // ファイル名に相対パスが含まれている場合
        if (fileName.includes('/') || fileName.includes('\\')) {
            // 相対パスをフルパスに変換
            if (path.isAbsolute(fileName)) {
                // 絶対パスの場合はそのまま使用
                outputFilePath = fileName;
            } else {
                // 相対パスの場合はワークスペースルートからの相対パスとして扱う
                outputFilePath = path.join(workspaceRoot, fileName);
            }
            
            // ディレクトリが存在しない場合は作成
            const dirPath = path.dirname(outputFilePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        } else {
            // 相対パスの場合はワークスペースからの相対パスに変換
            let absoluteOutputPath = outputPath;
            if (!path.isAbsolute(outputPath) && outputPath.startsWith('./')) {
                absoluteOutputPath = path.join(workspaceRoot, outputPath.substring(2));
            }

            // 出力先フォルダがなければ作成
            if (!fs.existsSync(absoluteOutputPath)) {
                fs.mkdirSync(absoluteOutputPath, { recursive: true });
            }
            
            // 出力パスとファイル名を結合
            outputFilePath = path.join(absoluteOutputPath, fileName);
        }

        // AIが理解しやすいフォーマットに整形
        const mergedContent: string[] = [];
        const queue = this.queueManager.getQueue();

        // メタデータセクションの追加
        const timestamp = new Date().toISOString();
        const totalFiles = Object.values(queue).reduce((sum, files) => sum + files.length, 0);
        const totalCategories = Object.keys(queue).filter(cat => queue[cat] && queue[cat].length > 0).length;

        mergedContent.push(`---`);
        mergedContent.push(`title: マージファイル`);
        mergedContent.push(`timestamp: ${timestamp}`);
        mergedContent.push(`total_files: ${totalFiles}`);
        mergedContent.push(`categories: ${totalCategories}`);
        
        // ワークスペース名を取得してプロジェクト名として使用
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const workspaceName = path.basename(vscode.workspace.workspaceFolders[0].uri.fsPath);
            mergedContent.push(`project: ${workspaceName}`);
        }
        
        mergedContent.push(`purpose: AIプロンプト用データ`);
        mergedContent.push(`---\n`);
        
        // 目次の生成
        mergedContent.push(`# 目次\n`);
        for (const category of this.configManager.categories) {
            if(queue[category] && queue[category].length > 0) {
                mergedContent.push(`- [${category}](#${category.toLowerCase().replace(/\s+/g, '-')})`);
                for (const filePath of queue[category]) {
                    if (fs.existsSync(filePath)) {
                        const fileName = path.basename(filePath);
                        // リンク用のIDを生成（ファイル名をURLセーフにする）
                        const fileId = fileName.toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\w-]/g, '');
                        mergedContent.push(`  - [${fileName}](#${fileId})`);
                    }
                }
            }
        }
        mergedContent.push(``);

        // configManagerで定義されたカテゴリ順にマージ
        for (const category of this.configManager.categories) {
            if(queue[category] && queue[category].length > 0) {
                mergedContent.push(`## ${category}\n`);
                for (const filePath of queue[category]) {
                    // ファイルが存在するか確認
                    if (fs.existsSync(filePath)) {
                        const fileName = path.basename(filePath);
                        
                        // ファイルパスの情報（ワークスペースルートからの相対パス）
                        let relativePath = filePath;
                        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                            const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
                            if (filePath.startsWith(workspaceRoot)) {
                                relativePath = filePath.substring(workspaceRoot.length + 1);
                            }
                        }
                        
                        // ディレクトリの場合はファイル一覧を表示
                        if (fs.statSync(filePath).isDirectory()) {
                            mergedContent.push(`### ${fileName} (ディレクトリ)`);
                            mergedContent.push(`> パス: \`${relativePath}\``);
                            mergedContent.push(``);
                            mergedContent.push("```");
                            try {
                                const files = fs.readdirSync(filePath);
                                if (files.length > 0) {
                                    for (const file of files) {
                                        const fullPath = path.join(filePath, file);
                                        const stats = fs.statSync(fullPath);
                                        const isDir = stats.isDirectory() ? '/' : '';
                                        mergedContent.push(`${file}${isDir}`);
                                    }
                                } else {
                                    mergedContent.push("(空のディレクトリ)");
                                }
                            } catch (error) {
                                mergedContent.push(`(ディレクトリ一覧の取得に失敗しました: ${error})`);
                            }
                            mergedContent.push("```\n");
                        } else {
                            // 通常のファイル処理
                            try {
                                // ファイルの拡張子から言語を推測
                                const ext = path.extname(filePath).substring(1).toLowerCase();
                                let language = "";
                                
                                // 主要な言語の拡張子マッピング
                                const langMap: {[key: string]: string} = {
                                    'js': 'javascript',
                                    'ts': 'typescript',
                                    'py': 'python',
                                    'java': 'java',
                                    'c': 'c',
                                    'cpp': 'cpp',
                                    'cs': 'csharp',
                                    'go': 'go',
                                    'rs': 'rust',
                                    'rb': 'ruby',
                                    'php': 'php',
                                    'html': 'html',
                                    'css': 'css',
                                    'json': 'json',
                                    'yaml': 'yaml',
                                    'yml': 'yaml',
                                    'md': 'markdown',
                                    'sql': 'sql',
                                    'sh': 'bash',
                                    'bat': 'batch',
                                    'ps1': 'powershell',
                                    'xml': 'xml',
                                    'txt': 'text'
                                };
                                
                                language = langMap[ext] || '';
                                
                                // ファイル内容を読み込み
                                const fileContent = fs.readFileSync(filePath, 'utf8');
                                const lines = fileContent.split('\n').length;
                                
                                // ファイル見出しとメタ情報
                                mergedContent.push(`### ${fileName}`);
                                mergedContent.push(`> パス: \`${relativePath}\`, 行数: ${lines}`);
                                mergedContent.push(``);
                                
                                // コード形式でファイル内容を出力
                                mergedContent.push("```" + (language ? language : ''));
                                mergedContent.push(fileContent);
                                if (!fileContent.endsWith('\n')) {
                                    mergedContent.push("");
                                }
                                mergedContent.push("```\n");
                            } catch (error) {
                                mergedContent.push(`### ${fileName}`);
                                mergedContent.push(`> パス: \`${relativePath}\``);
                                mergedContent.push(``);
                                mergedContent.push(`(ファイルの読み取りに失敗しました: ${error})\n`);
                            }
                        }
                    } else {
                        mergedContent.push(`### ${path.basename(filePath)}`);
                        mergedContent.push(`> パス: \`${filePath}\``);
                        mergedContent.push(``);
                        mergedContent.push(`(ファイルが見つかりません)\n`);
                    }
                }
            }
        }

        // マージファイルを出力
        fs.writeFileSync(outputFilePath, mergedContent.join('\n'));

        // 履歴アイテムを作成
        const historyItem: MergeHistoryItem = {
            timestamp: new Date().toISOString(),
            queue: queue,
            outputPath: path.dirname(outputFilePath), // 出力パスはファイルのディレクトリパスを保存
            fileName: path.basename(outputFilePath), // ファイル名は相対パスがあれば除いたベース名
            name: path.basename(outputFilePath, path.extname(outputFilePath)) // デフォルトの名前は拡張子なしのファイル名
        };

        // 履歴をHistoryManagerに保存
        this.historyManager.saveHistory(historyItem);

        // 成功したら通知とファイルの場所を表示
        vscode.window.showInformationMessage(
            `マージファイルを生成しました: ${outputFilePath}`, 
            '開く'
        ).then(selection => {
            if (selection === '開く') {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(outputFilePath));
            }
        });

        return outputFilePath;
    }

    // 履歴情報からキューを復元する処理
    loadHistoryMerge(historyItem: any) {
        this.queueManager.clearQueue();
        for (const category in historyItem.queue) {
            for (const filePath of historyItem.queue[category]) {
                this.queueManager.addFile(filePath, category);
            }
        }
    }

    // 履歴アイテムをマージリストに追加（マージリスト名は履歴から自動設定）
    async addHistoryToProjectMergeList(historyItem: MergeHistoryItem): Promise<void> {
        // マージリスト名が無い場合は入力を求める
        if (!historyItem.name) {
            const defaultName = historyItem.fileName ? path.basename(historyItem.fileName, path.extname(historyItem.fileName)) : '無題のマージリスト';
            historyItem.name = await this.promptForMergeListName(defaultName);
        }
        
        // プロジェクトのマージリストに保存
        await this.saveHistoryToProjectFile(historyItem);
    }

    // マージリスト名を入力するプロンプトを表示
    async promptForMergeListName(defaultName: string): Promise<string> {
        const name = await vscode.window.showInputBox({
            prompt: 'このマージリストの名前を入力してください（履歴リストに表示されます）',
            value: defaultName,
            placeHolder: '例: プロジェクトA仕様書マージ'
        });
        
        return name || defaultName;
    }

    // 履歴をプロジェクトルートのJSONファイルに保存
    async saveHistoryToProjectFile(historyItem: MergeHistoryItem): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('プロジェクトルートが見つかりません。');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const historyFilePath = path.join(workspaceRoot, 'merge-lists.json');

        // マージリストのファイルが存在するか確認
        let mergeListsData: MergeHistoryItem[] = [];
        if (fs.existsSync(historyFilePath)) {
            try {
                const content = fs.readFileSync(historyFilePath, 'utf8');
                mergeListsData = JSON.parse(content);
            } catch (error) {
                vscode.window.showErrorMessage(`マージリストファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
                mergeListsData = [];
            }
        }

        // 同じ名前の項目があれば上書き、なければ追加
        const existingIndex = mergeListsData.findIndex(item => item.name === historyItem.name);
        if (existingIndex >= 0) {
            mergeListsData[existingIndex] = historyItem;
        } else {
            mergeListsData.push(historyItem);
        }

        try {
            fs.writeFileSync(historyFilePath, JSON.stringify(mergeListsData, null, 2));
            vscode.window.showInformationMessage(`マージリストをプロジェクトに保存しました: ${historyItem.name}`);
        } catch (error) {
            vscode.window.showErrorMessage(`マージリストの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // プロジェクトのマージリストを読み込む
    async loadProjectMergeLists(): Promise<MergeHistoryItem[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return [];
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const historyFilePath = path.join(workspaceRoot, 'merge-lists.json');

        if (!fs.existsSync(historyFilePath)) {
            return [];
        }

        try {
            const content = fs.readFileSync(historyFilePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            vscode.window.showErrorMessage(`マージリストファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
}
