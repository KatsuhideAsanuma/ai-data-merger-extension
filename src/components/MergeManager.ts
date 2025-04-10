import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from './ConfigManager';
import { HistoryManager } from './HistoryManager';
import { QueueManager } from './QueueManager';

export class MergeManager {
    constructor(
        private queueManager: QueueManager,
        private configManager: ConfigManager,
        private historyManager: HistoryManager
    ) {}

    async generateMergedFile() {
        const outputPath = vscode.workspace.getConfiguration('aiDataMerger').get('outputPath') as string || './merged';
        const defaultFileName = vscode.workspace.getConfiguration('aiDataMerger').get('defaultFileName') as string || 'merged_data.md';

        // 相対パスの場合はワークスペースからの相対パスに変換
        let absoluteOutputPath = outputPath;
        if (!path.isAbsolute(outputPath) && outputPath.startsWith('./')) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                absoluteOutputPath = path.join(workspaceRoot, outputPath.substring(2));
            }
        }

        // 出力先フォルダがなければ作成
        if (!fs.existsSync(absoluteOutputPath)) {
            fs.mkdirSync(absoluteOutputPath, { recursive: true });
        }

        const mergedContent: string[] = [];
        const queue = this.queueManager.getQueue();

        // configManagerで定義されたカテゴリ順にマージ
        for (const category of this.configManager.categories) {
            if(queue[category] && queue[category].length > 0) {
                mergedContent.push(`## ${category}\n`);
                for (const filePath of queue[category]) {
                    // ファイルが存在するか確認
                    if (fs.existsSync(filePath)) {
                        // ディレクトリの場合はファイル一覧を表示
                        if (fs.statSync(filePath).isDirectory()) {
                            mergedContent.push(`### ${path.basename(filePath)} (ディレクトリ)\n`);
                            mergedContent.push("```\n");
                            try {
                                const files = fs.readdirSync(filePath);
                                if (files.length > 0) {
                                    for (const file of files) {
                                        const fullPath = path.join(filePath, file);
                                        const stats = fs.statSync(fullPath);
                                        const isDir = stats.isDirectory() ? '/' : '';
                                        mergedContent.push(`${file}${isDir}\n`);
                                    }
                                } else {
                                    mergedContent.push("(空のディレクトリ)\n");
                                }
                            } catch (error) {
                                mergedContent.push(`(ディレクトリ一覧の取得に失敗しました: ${error})\n`);
                            }
                            mergedContent.push("```\n\n");
                        } else {
                            // 通常のファイル処理
                            try {
                                const fileContent = fs.readFileSync(filePath, 'utf8');
                                mergedContent.push(`### ${path.basename(filePath)}\n`);
                                mergedContent.push(fileContent + "\n");
                            } catch (error) {
                                mergedContent.push(`### ${path.basename(filePath)}\n`);
                                mergedContent.push(`(ファイルの読み取りに失敗しました: ${error})\n`);
                            }
                        }
                    } else {
                        mergedContent.push(`### ${path.basename(filePath)}\n`);
                        mergedContent.push(`(ファイルが見つかりません)\n`);
                    }
                }
            }
        }

        // マージファイルを出力
        const mergedFileFullPath = path.join(absoluteOutputPath, defaultFileName);
        fs.writeFileSync(mergedFileFullPath, mergedContent.join('\n'));

        // 成功したら通知とファイルの場所を表示
        vscode.window.showInformationMessage(
            `マージファイルを生成しました: ${mergedFileFullPath}`, 
            '開く'
        ).then(selection => {
            if (selection === '開く') {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(mergedFileFullPath));
            }
        });

        // 履歴を保存（実行時の構成情報を記録）
        this.historyManager.saveHistory({
            timestamp: new Date().toISOString(),
            queue: queue,
            outputPath: absoluteOutputPath,
            fileName: defaultFileName
        });
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
}
