import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { QueueManager } from './QueueManager';
import { ConfigManager } from './ConfigManager';
import { HistoryManager } from './HistoryManager';

export class MergeManager {
    constructor(
        private queueManager: QueueManager,
        private configManager: ConfigManager,
        private historyManager: HistoryManager
    ) {}

    async generateMergedFile() {
        const outputPath = vscode.workspace.getConfiguration('aiDataMerger').get('outputPath') as string || './merged';
        const defaultFileName = vscode.workspace.getConfiguration('aiDataMerger').get('defaultFileName') as string || 'merged_data.md';

        // 出力先フォルダがなければ作成
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }

        const mergedContent: string[] = [];
        const queue = this.queueManager.getQueue();

        // configManagerで定義されたカテゴリ順にマージ
        for (const category of this.configManager.categories) {
            if(queue[category] && queue[category].length > 0) {
                mergedContent.push(`## ${category}\n`);
                for (const filePath of queue[category]) {
                    if (fs.existsSync(filePath)) {
                        const fileContent = fs.readFileSync(filePath, 'utf8');
                        mergedContent.push(`### ${path.basename(filePath)}\n`);
                        mergedContent.push(fileContent + "\n");
                    } else {
                        mergedContent.push(`### ${path.basename(filePath)}\n`);
                        mergedContent.push(`(ファイルが見つかりません)\n`);
                    }
                }
            }
        }

        // マージファイルを出力
        const mergedFileFullPath = path.join(outputPath, defaultFileName);
        fs.writeFileSync(mergedFileFullPath, mergedContent.join('\n'));

        // 履歴を保存（実行時の構成情報を記録）
        this.historyManager.saveHistory({
            timestamp: new Date().toISOString(),
            queue: queue,
            outputPath,
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
