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
            // ワークスペースルートを取得
            let workspaceRoot = '';
            if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            }
            
            // 出力パスの処理
            let defaultOutputPath = outputPath;
            if (!path.isAbsolute(outputPath) && outputPath.startsWith('./')) {
                defaultOutputPath = path.join(workspaceRoot, outputPath.substring(2));
            } else if (!path.isAbsolute(outputPath)) {
                defaultOutputPath = path.join(workspaceRoot, outputPath);
            }
            
            // 出力先フォルダが存在しない場合は作成
            if (!fs.existsSync(defaultOutputPath)) {
                fs.mkdirSync(defaultOutputPath, { recursive: true });
            }
            
            // ファイル選択ダイアログオプションを設定
            const options: vscode.SaveDialogOptions = {
                defaultUri: vscode.Uri.file(path.join(defaultOutputPath, defaultFileName)),
                filters: {
                    'Markdown': ['md'],
                    'すべてのファイル': ['*']
                }
            };
            
            // ファイル保存ダイアログを表示
            const uri = await vscode.window.showSaveDialog(options);
            
            if (!uri) {
                // ユーザーがキャンセルした場合
                return;
            }
            
            // 選択されたパスを使用
            fileName = uri.fsPath;
        }

        // ワークスペースルートを取得
        let workspaceRoot = '';
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }

        // 出力パスの処理
        let outputFilePath = fileName; // 直接選択されたパスを使用
        
        // ディレクトリが存在しない場合は作成
        const dirPath = path.dirname(outputFilePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
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
        
        // 目次生成の前に、マークダウンファイルの見出しを抽出するための処理
        type TocEntry = {
            filePath: string;
            fileName: string;
            fileId: string; 
            headings: {level: number; text: string; id: string}[];
        };

        // カテゴリとファイルごとの目次情報を格納する配列
        const tocStructure: {category: string; files: TocEntry[]}[] = [];

        // 見出し抽出のためにファイルを先に分析
        for (const category of this.configManager.categories) {
            if(queue[category] && queue[category].length > 0) {
                const categoryEntry = {
                    category: category,
                    files: [] as TocEntry[]
                };
                
                for (const filePath of queue[category]) {
                    if (fs.existsSync(filePath)) {
                        const fileName = path.basename(filePath);
                        // リンク用のIDを生成（ファイル名をURLセーフにする）
                        const fileId = fileName.toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\w-]/g, '');
                        
                        const tocEntry: TocEntry = {
                            filePath,
                            fileName,
                            fileId,
                            headings: []
                        };
                        
                        // マークダウンファイルの場合は見出しを抽出
                        if (path.extname(filePath).toLowerCase() === '.md' && fs.statSync(filePath).isFile()) {
                            try {
                                const fileContent = fs.readFileSync(filePath, 'utf8');
                                const lines = fileContent.split('\n');
                                
                                // 見出し行を抽出（# で始まる行）
                                for (const line of lines) {
                                    const headingMatch = line.trim().match(/^(#{1,3})\s+(.+)$/);
                                    if (headingMatch) {
                                        const level = headingMatch[1].length;
                                        const text = headingMatch[2];
                                        
                                        // 見出しIDの生成（URLセーフな形式に）
                                        const headingId = text.toLowerCase()
                                            .replace(/\s+/g, '-')
                                            .replace(/[^\w-]/g, '')
                                            .replace(/^-+|-+$/g, '');
                                        
                                        // ファイルIDと見出しIDを組み合わせてユニークなIDを作成
                                        const uniqueId = `${fileId}-${headingId}`;
                                        
                                        // 目次用に格納
                                        tocEntry.headings.push({
                                            level, 
                                            text,
                                            id: uniqueId
                                        });
                                    }
                                }
                            } catch (error) {
                                console.error(`見出し抽出中にエラーが発生しました: ${filePath}`, error);
                            }
                        }
                        // JSONやYAML、コードファイルからも構造を抽出して目次に含める
                        else if (fs.statSync(filePath).isFile()) {
                            try {
                                const fileContent = fs.readFileSync(filePath, 'utf8');
                                const ext = path.extname(filePath).substring(1).toLowerCase();
                                
                                // 言語IDを取得
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
                                    'sql': 'sql',
                                    'sh': 'bash',
                                    'bat': 'batch',
                                    'ps1': 'powershell',
                                    'xml': 'xml',
                                    'txt': 'text'
                                };
                                
                                const language = langMap[ext] || '';
                                
                                // 特定の言語のファイルのみ構造を抽出
                                const isStructuredFile = 
                                    language === 'javascript' || 
                                    language === 'typescript' || 
                                    language === 'python' ||
                                    language === 'scala' ||
                                    language === 'json' ||
                                    language === 'yaml';
                                
                                if (isStructuredFile) {
                                    // ファイル構造を抽出
                                    const codeStructure = this.extractCodeStructure(fileContent, language);
                                    
                                    // 「ファイル構造」見出しを追加
                                    tocEntry.headings.push({
                                        level: 1,
                                        text: 'ファイル構造',
                                        id: `${fileId}-file-structure`
                                    });
                                    
                                    // 抽出した各要素を見出しとして追加
                                    for (const item of codeStructure) {
                                        // この項目をIDとして使用するための文字列を生成
                                        const itemId = item.name.toLowerCase()
                                            .replace(/\s+/g, '-')
                                            .replace(/[^\w-]/g, '')
                                            .replace(/^-+|-+$/g, '');
                                        
                                        // ネストレベルに基づいて階層を設定（level 0は2に、level 1は3に変換など）
                                        const headingLevel = Math.min(item.level + 2, 3); // 最大3までに制限
                                        
                                        tocEntry.headings.push({
                                            level: headingLevel,
                                            text: `${this.getTypeIcon(item.type)} ${item.name}${item.params || ''}`,
                                            id: `${fileId}-${itemId}`
                                        });
                                        
                                        // 目次は最大10項目までに制限（大きなファイルでの過剰な目次を防ぐ）
                                        if (tocEntry.headings.length > 10) {
                                            tocEntry.headings.push({
                                                level: 2,
                                                text: '... その他の項目',
                                                id: `${fileId}-more-items`
                                            });
                                            break;
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error(`ファイル構造抽出中にエラーが発生しました: ${filePath}`, error);
                            }
                        }
                        
                        categoryEntry.files.push(tocEntry);
                    }
                }
                
                tocStructure.push(categoryEntry);
            }
        }

        // 目次の生成
        mergedContent.push(`# 目次\n`);

        // カテゴリとファイルの目次を生成
        for (const catEntry of tocStructure) {
            mergedContent.push(`- [${catEntry.category}](#${catEntry.category.toLowerCase().replace(/\s+/g, '-')})`);
            
            for (const fileEntry of catEntry.files) {
                mergedContent.push(`  - [${fileEntry.fileName}](#${fileEntry.fileId})`);
                
                // マークダウンファイルの見出しを目次に含める（H1, H2, H3のみ）
                if (fileEntry.headings.length > 0) {
                    for (const heading of fileEntry.headings) {
                        // レベルに応じてインデントを調整
                        const indent = '  '.repeat(heading.level + 1);
                        mergedContent.push(`${indent}- [${heading.text}](#${heading.id})`);
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
                        
                        // ファイルのIDを取得（目次生成時と同じロジック）
                        const fileId = fileName.toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\w-]/g, '');
                        
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
                                
                                // マークダウンファイルの場合は特別な処理をする
                                // 拡張子チェックを強化し、README.mdなどの特殊なファイルも確実に処理
                                const isMarkdown = 
                                    ext.toLowerCase() === 'md' || 
                                    language === 'markdown' || 
                                    fileName.toLowerCase() === 'readme.md';
                                
                                if (isMarkdown) {
                                    // マークダウンファイルの場合、見出し階層を調整する
                                    const mdLines = fileContent.split('\n');
                                    
                                    // デバッグ情報（開発時に確認用）
                                    console.log(`マークダウン処理: ${filePath}, 拡張子: ${ext}, 言語: ${language}, 判定: ${isMarkdown}`);
                                    
                                    // マークダウンコンテンツをインラインで追加（見出しレベルを調整）
                                    for (const line of mdLines) {
                                        // 見出し行（#で始まる行）の処理
                                        if (line.trim().startsWith('#')) {
                                            // 現在の見出しレベルを取得
                                            const headingMatch = line.match(/^(#+)\s+(.*)$/);
                                            if (headingMatch) {
                                                const currentLevel = headingMatch[1].length;
                                                const headingText = headingMatch[2];
                                                
                                                // 見出しIDを生成（目次と同じロジック）
                                                const headingId = headingText.toLowerCase()
                                                    .replace(/\s+/g, '-')
                                                    .replace(/[^\w-]/g, '')
                                                    .replace(/^-+|-+$/g, '');
                                                
                                                // IDタグを追加した見出し
                                                const uniqueId = `${fileId}-${headingId}`;
                                                
                                                // 単純に###を追加し、結果が7以上になる場合は空白インデントに置き換える
                                                const newLevel = currentLevel + 3;
                                                if (newLevel <= 6) {
                                                    // 6以下の場合は単純に#を使う
                                                    const newHeading = '#'.repeat(newLevel) + ' ' + headingText + ` <a id="${uniqueId}"></a>`;
                                                    mergedContent.push(newHeading);
                                                } else {
                                                    // 7以上の場合は#を6個にして、残りを空白インデントで表現
                                                    const extraIndent = '  '.repeat(newLevel - 6);
                                                    const newHeading = extraIndent + '#'.repeat(6) + ' ' + headingText + ` <a id="${uniqueId}"></a>`;
                                                    mergedContent.push(newHeading);
                                                }
                                            } else {
                                                mergedContent.push(line);
                                            }
                                        } else {
                                            // 見出し以外の行はそのまま追加
                                            mergedContent.push(line);
                                        }
                                    }
                                    // 最後に空行を追加
                                    mergedContent.push('');
                                } else {
                                    // コード構造を解析して見出しとして表示（JS/TS/Python/Scala/JSON/YAML）
                                    const isStructuredCodeFile = 
                                        language === 'javascript' || 
                                        language === 'typescript' || 
                                        language === 'python' ||
                                        language === 'scala' ||
                                        language === 'json' ||
                                        language === 'yaml';
                                    
                                    // 構造が検出されるファイルの場合は見出しを配置
                                    // (目次には既に構造が含まれているので、ここではファイル内リンク用のアンカーだけを配置)
                                    if (isStructuredCodeFile) {
                                        const codeStructure = this.extractCodeStructure(fileContent, language);
                                        
                                        if (codeStructure.length > 0) {
                                            // ファイル構造のアンカーポイントのみ追加（見えない形で）
                                            mergedContent.push(`<a id="${fileId}-file-structure"></a>`);
                                            
                                            // 個々の項目のアンカーも追加（見えない形で）
                                            for (const item of codeStructure) {
                                                const itemId = item.name.toLowerCase()
                                                    .replace(/\s+/g, '-')
                                                    .replace(/[^\w-]/g, '')
                                                    .replace(/^-+|-+$/g, '');
                                                mergedContent.push(`<a id="${fileId}-${itemId}"></a>`);
                                            }
                                            mergedContent.push('');
                                            
                                            // 表示前にファイル構造の参照情報を追加
                                            mergedContent.push(`> 📝 このファイルの構造は目次セクションに表示されています`);
                                            mergedContent.push('');
                                        }
                                    }
                                    
                                    // JSONとYAMLファイルの場合は構造のみ表示し、コード全体は表示しない
                                    const isDataFile = language === 'json' || language === 'yaml';
                                    
                                    // 設定から「データファイルの全コード表示」オプションを取得
                                    const showDataFileContent = vscode.workspace.getConfiguration('aiDataMerger').get('showDataFileContent') as boolean || false;
                                    
                                    if (isDataFile && !showDataFileContent) {
                                        // データファイルは構造のみ表示し、コード全体は表示しない（デフォルト動作）
                                        mergedContent.push(`> 注: 構造が抽出されたため、ファイル全体のコードは表示されていません。`);
                                        mergedContent.push(`> この動作は設定の 'aiDataMerger.showDataFileContent' で変更できます。`);
                                        mergedContent.push(``);
                                    } else {
                                        // 通常のファイルやshowDataFileContent=trueの場合はコード形式で出力
                                        mergedContent.push("```" + (language ? language : ''));
                                        mergedContent.push(fileContent);
                                        if (!fileContent.endsWith('\n')) {
                                            mergedContent.push("");
                                        }
                                        mergedContent.push("```\n");
                                    }
                                }
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

    // コードファイルから構造（クラス、メソッド、フィールドなど）を抽出
    private extractCodeStructure(content: string, language: string): Array<{name: string, type: string, level: number, params?: string, info?: string}> {
        const result: Array<{name: string, type: string, level: number, params?: string, info?: string}> = [];
        
        // JSON/YAMLファイルの構造を解析
        if (language === 'json' || language === 'yaml') {
            try {
                // JSONまたはYAMLをパース
                let parsedData;
                if (language === 'json') {
                    parsedData = JSON.parse(content);
                } else {
                    // YAMLのパースにはJSON.parseを使用できないため、簡易的な処理で代用
                    // 実際のYAMLパースには外部ライブラリ（js-yaml）などを使用するのが理想的
                    parsedData = this.parseYaml(content);
                }
                
                // ルートオブジェクトの処理
                if (parsedData && typeof parsedData === 'object') {
                    // 配列の場合
                    if (Array.isArray(parsedData)) {
                        result.push({ 
                            name: 'root', 
                            type: 'array', 
                            level: 0,
                            info: `(Array: ${parsedData.length} items)` 
                        });
                        
                        // 配列の最初の数アイテムをサンプルとして表示（最大5つまで）
                        const maxItems = Math.min(parsedData.length, 5);
                        for (let i = 0; i < maxItems; i++) {
                            const item = parsedData[i];
                            const itemType = this.getDataType(item);
                            
                            if (typeof item === 'object' && item !== null) {
                                result.push({ 
                                    name: `[${i}]`, 
                                    type: itemType, 
                                    level: 1
                                });
                                
                                // オブジェクトの場合は内部構造を表示
                                if (!Array.isArray(item)) {
                                    this.extractObjectStructure(item, result, 2);
                                }
                            } else {
                                result.push({ 
                                    name: `[${i}]`, 
                                    type: itemType, 
                                    level: 1,
                                    info: this.getValuePreview(item)
                                });
                            }
                        }
                        
                        // 表示されないアイテムがある場合
                        if (parsedData.length > maxItems) {
                            result.push({ 
                                name: `... ${parsedData.length - maxItems} more items`, 
                                type: 'ellipsis', 
                                level: 1 
                            });
                        }
                    } 
                    // オブジェクトの場合
                    else {
                        result.push({ 
                            name: 'root', 
                            type: 'object', 
                            level: 0,
                            info: `(Object: ${Object.keys(parsedData).length} keys)` 
                        });
                        
                        // オブジェクトの内部構造を第二階層まで表示
                        this.extractObjectStructure(parsedData, result, 1);
                    }
                } else {
                    // プリミティブ値の場合（まれ）
                    result.push({ 
                        name: 'value', 
                        type: this.getDataType(parsedData), 
                        level: 0,
                        info: this.getValuePreview(parsedData)
                    });
                }
            } catch (error) {
                // パースエラーの場合
                result.push({ 
                    name: 'Error', 
                    type: 'error', 
                    level: 0,
                    info: `Parse error: ${error instanceof Error ? error.message : String(error)}`
                });
            }
            
            return result;
        }
        
        // 他のプログラミング言語の処理（既存のコード）
        const lines = content.split('\n');
        
        // 言語に応じたパターンを定義
        if (language === 'javascript' || language === 'typescript') {
            // クラス定義
            const classPattern = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+[\w\s.]+)?(?:\s+implements\s+(?:[\w\s.]+(?:,\s*[\w\s.]+)*))?/;
            // インターフェース定義
            const interfacePattern = /^(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+[\w\s.]+(?:,\s*[\w\s.]+)*)?/;
            // メソッド定義（クラス内のメソッドのみ抽出）
            const methodPattern = /^\s*(?:public|private|protected|async|static|\*)\s+(?!if|for|while|switch)(\w+)\s*(?:<.*?>)?\s*\((.*?)\)/;
            // 重要なクラスフィールド（publicまたはstaticのみ）
            const fieldPattern = /^\s*(?:public|protected|readonly|static)\s+(\w+)(?:\:\s*[\w<>[\],\s|]+)?(?:\s*=\s*.*)?;/;
            // 関数定義（クラス外）
            const functionPattern = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<.*?>)?\s*\((.*?)\)/;
            // 名前付きエクスポート（const obj = { 形式の名前付きオブジェクト）
            const namedExportPattern = /^(?:export\s+)?const\s+(\w+)\s*(?::\s*[\w<>[\],\s|]+)?\s*=\s*(?:[{]|new\s+)/;
            // Reactコンポーネント（関数形式）
            const reactFuncPattern = /^(?:export\s+)?const\s+(\w+)(?:\s*:\s*React\.FC(?:<.*?>)?|\s*=\s*React\.memo)?\s*=\s*(?:\(.*?\)|.*?)\s*=>\s*[({]/;
            // 列挙型
            const enumPattern = /^(?:export\s+)?(?:const\s+)?enum\s+(\w+)/;
            // 型エイリアス
            const typeAliasPattern = /^(?:export\s+)?type\s+(\w+)(?:<.*?>)?\s*=/;
            
            let currentClass: string | null = null;
            let currentInterface: string | null = null;
            let braceLevel = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // コメント行はスキップ
                if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
                    continue;
                }
                
                // 波括弧のレベルを追跡
                braceLevel += (line.match(/{/g) || []).length;
                braceLevel -= (line.match(/}/g) || []).length;
                
                // クラス定義
                const classMatch = line.match(classPattern);
                if (classMatch) {
                    currentClass = classMatch[1];
                    result.push({ name: currentClass, type: 'class', level: 0 });
                    continue;
                }
                
                // インターフェース定義
                const interfaceMatch = line.match(interfacePattern);
                if (interfaceMatch) {
                    currentInterface = interfaceMatch[1];
                    result.push({ name: interfaceMatch[1], type: 'interface', level: 0 });
                    continue;
                }
                
                // 型エイリアス
                const typeMatch = line.match(typeAliasPattern);
                if (typeMatch) {
                    result.push({ name: typeMatch[1], type: 'type', level: 0 });
                    continue;
                }
                
                // 列挙型
                const enumMatch = line.match(enumPattern);
                if (enumMatch) {
                    result.push({ name: enumMatch[1], type: 'enum', level: 0 });
                    continue;
                }
                
                // Reactコンポーネント（関数形式）
                const reactMatch = line.match(reactFuncPattern);
                if (reactMatch) {
                    result.push({ name: reactMatch[1], type: 'component', level: 0 });
                    continue;
                }
                
                // 関数定義（クラス外）
                const funcMatch = line.match(functionPattern);
                if (funcMatch && !currentClass && !currentInterface) {
                    result.push({ 
                        name: funcMatch[1], 
                        type: 'function', 
                        level: 0,
                        params: `(${funcMatch[2].trim()})` 
                    });
                    continue;
                }
                
                // 名前付きエクスポート
                const exportMatch = line.match(namedExportPattern);
                if (exportMatch && !currentClass && !currentInterface) {
                    // オブジェクトが続く場合のみ追加（変数代入を避ける）
                    result.push({ name: exportMatch[1], type: 'object', level: 0 });
                    continue;
                }
                
                // クラス内メソッド
                if (currentClass) {
                    const methodMatch = line.match(methodPattern);
                    if (methodMatch && !line.includes('function(')) {
                        const methodName = methodMatch[1];
                        // if, for, switchなどの制御構文を除外
                        if (!/^(if|for|while|switch|catch)$/.test(methodName)) {
                            result.push({ 
                                name: methodName, 
                                type: 'method', 
                                level: 1,
                                params: `(${methodMatch[2].trim()})` 
                            });
                        }
                        continue;
                    }
                    
                    // 重要なクラスフィールド（public, staticなど）
                    const fieldMatch = line.match(fieldPattern);
                    if (fieldMatch) {
                        // stateやpropsなどの重要なフィールドのみを含める
                        const fieldName = fieldMatch[1];
                        const isImportantField = 
                            line.includes('public') || 
                            line.includes('static') || 
                            /^(props|state|options|config)$/.test(fieldName);
                            
                        if (isImportantField) {
                            result.push({ name: fieldName, type: 'field', level: 1 });
                        }
                        continue;
                    }
                }
                
                // インターフェースメソッド
                if (currentInterface) {
                    // インターフェースメソッド宣言
                    const interfaceMethodPattern = /^\s*(\w+)\s*(?:\?\s*)?:\s*(?:.*?)\((.*?)\)/;
                    const interfaceMethodMatch = line.match(interfaceMethodPattern);
                    if (interfaceMethodMatch) {
                        result.push({ 
                            name: interfaceMethodMatch[1], 
                            type: 'method', 
                            level: 1,
                            params: `(${interfaceMethodMatch[2].trim()})` 
                        });
                        continue;
                    }
                    
                    // インターフェースプロパティ（重要なもののみ）
                    const interfacePropPattern = /^\s*(\w+)\s*(?:\?\s*)?:\s*/;
                    const propMatch = line.match(interfacePropPattern);
                    if (propMatch) {
                        const propName = propMatch[1];
                        // 重要なプロパティのみをリストアップ
                        const isImportantProp = 
                            /^(id|name|type|value|data|config|options)$/.test(propName) ||
                            propName.endsWith('Id') || 
                            propName.endsWith('Type');
                            
                        if (isImportantProp) {
                            result.push({ name: propName, type: 'property', level: 1 });
                        }
                        continue;
                    }
                }
                
                // クラスやインターフェースの終了を検出
                if ((currentClass || currentInterface) && braceLevel === 0) {
                    currentClass = null;
                    currentInterface = null;
                }
            }
        } else if (language === 'python') {
            // Pythonのクラス定義
            const classPattern = /^class\s+(\w+)(?:\(.*\))?:/;
            // メソッド定義
            const methodPattern = /^(?:\s+)def\s+(\w+)\s*\((.*)\):/;
            // 関数定義
            const functionPattern = /^def\s+(\w+)\s*\((.*)\):/;
            
            let currentClass: string | null = null;
            let currentIndent = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const indent = line.match(/^\s*/)?.[0].length || 0;
                
                // インデントが減少したらクラスから出た可能性がある
                if (currentClass && indent <= currentIndent) {
                    currentClass = null;
                }
                
                // クラス定義
                const classMatch = line.match(classPattern);
                if (classMatch) {
                    currentClass = classMatch[1];
                    currentIndent = indent + 4; // Pythonの標準インデントは4スペース
                    result.push({ name: currentClass, type: 'class', level: 0 });
                    continue;
                }
                
                // メソッド定義（クラス内）
                if (currentClass) {
                    const methodMatch = line.match(methodPattern);
                    if (methodMatch) {
                        const methodName = methodMatch[1];
                        // 内部メソッド（__で始まるもの）を除外するオプション
                        if (!methodName.startsWith('__') || methodName === '__init__') {
                            result.push({ 
                                name: methodName, 
                                type: 'method', 
                                level: 1,
                                params: `(${methodMatch[2].trim()})` 
                            });
                        }
                        continue;
                    }
                }
                
                // 関数定義（トップレベル）
                if (!currentClass) {
                    const funcMatch = line.match(functionPattern);
                    if (funcMatch) {
                        const funcName = funcMatch[1];
                        // 内部関数（__で始まるもの）を除外するオプション
                        if (!funcName.startsWith('__')) {
                            result.push({ 
                                name: funcName, 
                                type: 'function', 
                                level: 0,
                                params: `(${funcMatch[2].trim()})` 
                            });
                        }
                    }
                }
            }
        } else if (language === 'scala') {
            // Scalaのクラス/オブジェクト定義
            const classPattern = /^(?:abstract\s+)?(?:case\s+)?class\s+(\w+)(?:\[.*\])?(?:\s*\(.*\))?(?:\s+extends\s+[\w\s.]+)?(?:\s+with\s+[\w\s.]+)*/;
            const objectPattern = /^object\s+(\w+)(?:\s+extends\s+[\w\s.]+)?(?:\s+with\s+[\w\s.]+)*/;
            const traitPattern = /^trait\s+(\w+)(?:\s+extends\s+[\w\s.]+)?(?:\s+with\s+[\w\s.]+)*/;
            
            // メソッド定義
            const methodPattern = /^\s*(?:private\s+|protected\s+|override\s+)*def\s+(\w+)(?:\[.*\])?(?:\s*\((.*)\)|\s*=\s*)/;
            
            // val/var定義（重要なもののみ抽出）
            const valPattern = /^\s*(?:private\s+|protected\s+|override\s+)*(?:val|var)\s+(\w+)(?:\s*:.*)?(?:\s*=.*)?/;
            
            let currentClass: string | null = null;
            let braceLevel = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // コメント行はスキップ
                if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
                    continue;
                }
                
                // 波括弧のレベルを追跡
                braceLevel += (line.match(/{/g) || []).length;
                braceLevel -= (line.match(/}/g) || []).length;
                
                // クラス定義
                const classMatch = line.match(classPattern);
                if (classMatch) {
                    currentClass = classMatch[1];
                    result.push({ name: currentClass, type: 'class', level: 0 });
                    continue;
                }
                
                // オブジェクト定義
                const objectMatch = line.match(objectPattern);
                if (objectMatch) {
                    currentClass = objectMatch[1];
                    result.push({ name: currentClass, type: 'object', level: 0 });
                    continue;
                }
                
                // trait定義
                const traitMatch = line.match(traitPattern);
                if (traitMatch) {
                    currentClass = traitMatch[1];
                    result.push({ name: currentClass, type: 'trait', level: 0 });
                    continue;
                }
                
                // メソッド
                const methodMatch = line.match(methodPattern);
                if (methodMatch && !line.endsWith(";")) {
                    const methodName = methodMatch[1];
                    // 一般的なScalaメソッド名パターンで除外するもの
                    if (!/^apply$|^unapply$/.test(methodName) && !methodName.startsWith('_')) {
                        const level = currentClass ? 1 : 0;
                        const params = methodMatch[2] ? `(${methodMatch[2].trim()})` : '';
                        result.push({ 
                            name: methodName, 
                            type: 'method', 
                            level: level,
                            params: params 
                        });
                    }
                    continue;
                }
                
                // 重要なval/var定義
                if (currentClass) {
                    const valMatch = line.match(valPattern);
                    if (valMatch && !line.startsWith("//")) {
                        const valName = valMatch[1];
                        // パブリックなもののみフィルタリング
                        const isPublic = !line.includes('private');
                        if (isPublic && !valName.startsWith('_')) {
                            result.push({ name: valName, type: 'field', level: 1 });
                        }
                        continue;
                    }
                }
                
                // クラスやオブジェクトの終了を検出
                if (currentClass && braceLevel === 0) {
                    currentClass = null;
                }
            }
        }
        
        return result;
    }
    
    // YAMLを簡易的にパースする関数（完全なYAMLパーサーではない）
    private parseYaml(content: string): any {
        const lines = content.split('\n');
        const result: any = {};
        let currentKey = '';
        let indentLevel = 0;
        let currentObject = result;
        const stack: any[] = [result];
        
        for (const line of lines) {
            // コメント行やブランク行はスキップ
            if (line.trim().startsWith('#') || line.trim() === '') continue;
            
            // インデントレベルを取得
            const lineIndent = line.match(/^\s*/)?.[0].length || 0;
            
            // キーと値の分離（最初の:で分割）
            const match = line.trim().match(/^(.+?):\s*(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                
                // インデントが下がった場合、スタックを調整
                if (lineIndent < indentLevel) {
                    const levels = Math.floor((indentLevel - lineIndent) / 2);
                    for (let i = 0; i < levels; i++) {
                        stack.pop();
                    }
                    currentObject = stack[stack.length - 1];
                } 
                // インデントが上がった場合、新しいオブジェクトを作成
                else if (lineIndent > indentLevel) {
                    if (!currentObject[currentKey]) {
                        currentObject[currentKey] = {};
                    }
                    currentObject = currentObject[currentKey];
                    stack.push(currentObject);
                }
                
                indentLevel = lineIndent;
                currentKey = key;
                
                // 値が空でない場合は処理
                if (value) {
                    // 配列表記 [item1, item2] を処理
                    if (value.startsWith('[') && value.endsWith(']')) {
                        try {
                            currentObject[key] = JSON.parse(value.replace(/'/g, '"'));
                        } catch (e) {
                            currentObject[key] = value;
                        }
                    } 
                    // 数値の場合
                    else if (!isNaN(Number(value))) {
                        currentObject[key] = Number(value);
                    }
                    // 真偽値の場合
                    else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
                        currentObject[key] = value.toLowerCase() === 'true';
                    }
                    // その他の文字列
                    else {
                        // クォートを削除
                        if ((value.startsWith('"') && value.endsWith('"')) || 
                            (value.startsWith("'") && value.endsWith("'"))) {
                            currentObject[key] = value.substring(1, value.length - 1);
                        } else {
                            currentObject[key] = value;
                        }
                    }
                } else {
                    // 値が空の場合は空オブジェクトとして初期化
                    currentObject[key] = {};
                }
            }
        }
        
        return result;
    }
    
    // オブジェクトの構造を再帰的に抽出（レベルを指定）
    private extractObjectStructure(obj: any, result: Array<{name: string, type: string, level: number, params?: string, info?: string}>, level: number, maxLevel: number = 2): void {
        // 第二階層まで（maxLevel=2）
        if (level > maxLevel) return;
        
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            const valueType = this.getDataType(value);
            
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    // 配列の場合
                    result.push({ 
                        name: key, 
                        type: 'array', 
                        level: level,
                        info: `(Array: ${value.length} items)` 
                    });
                    
                    // 配列の要素は特別な場合のみ処理（内容が重要な小さい配列など）
                    if (value.length > 0 && value.length <= 3 && level < maxLevel) {
                        for (let i = 0; i < value.length; i++) {
                            const item = value[i];
                            if (typeof item === 'object' && item !== null) {
                                result.push({ 
                                    name: `${key}[${i}]`, 
                                    type: this.getDataType(item), 
                                    level: level + 1 
                                });
                            } else {
                                result.push({ 
                                    name: `${key}[${i}]`, 
                                    type: this.getDataType(item), 
                                    level: level + 1,
                                    info: this.getValuePreview(item)
                                });
                            }
                        }
                    }
                } else {
                    // オブジェクトの場合
                    result.push({ 
                        name: key, 
                        type: 'object', 
                        level: level,
                        info: `(Object: ${Object.keys(value).length} keys)` 
                    });
                    
                    // 次の階層を処理
                    this.extractObjectStructure(value, result, level + 1, maxLevel);
                }
            } else {
                // プリミティブ値
                result.push({ 
                    name: key, 
                    type: valueType, 
                    level: level,
                    info: this.getValuePreview(value)
                });
            }
        }
    }
    
    // データ型を判定して返す
    private getDataType(value: any): string {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }
    
    // 値のプレビューを生成（文字列表現）
    private getValuePreview(value: any): string {
        if (value === null) return '(null)';
        if (value === undefined) return '(undefined)';
        
        if (typeof value === 'string') {
            // 長い文字列は切り詰める
            if (value.length > 30) {
                return `"${value.substring(0, 27)}..."`;
            }
            return `"${value}"`;
        }
        
        if (typeof value === 'number' || typeof value === 'boolean') {
            return `(${value})`;
        }
        
        return '';
    }
    
    // コード要素の種類に応じたアイコンを返す
    private getTypeIcon(type: string): string {
        switch (type) {
            case 'class': return '🔷';
            case 'interface': return '🔶';
            case 'type': return '📄';
            case 'enum': return '🔢';
            case 'component': return '⚛️';
            case 'method': return '🔹';
            case 'function': return '🔸';
            case 'field': return '📎';
            case 'property': return '🔗';
            case 'object': return '📦';
            case 'array': return '📚';
            case 'trait': return '🔶';
            case 'string': return '📝';
            case 'number': return '🔢';
            case 'boolean': return '⚖️';
            case 'null': return '⭕';
            case 'error': return '❌';
            case 'ellipsis': return '…';
            default: return '��';
        }
    }
}
