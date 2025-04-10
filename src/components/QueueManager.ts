export class QueueManager {
    // キュー：カテゴリ名をキー、ファイルパス配列を値として保持
    private queue: { [category: string]: string[] } = {};
    private defaultCategory: string = "参照コード出力";

    constructor() {
        // 初期状態としてデフォルトカテゴリを準備
        this.queue[this.defaultCategory] = [];
    }

    // ファイル追加（オプションでカテゴリ指定、未指定の場合はデフォルトカテゴリ）
    addFile(filePath: string, category?: string) {
        const cat = category || this.defaultCategory;
        if (!this.queue[cat]) {
            this.queue[cat] = [];
        }
        this.queue[cat].push(filePath);
    }

    getQueue() {
        return this.queue;
    }

    clearQueue() {
        this.queue = {};
    }

    // ファイル削除（カテゴリとインデックス指定）
    removeFile(category: string, index: number) {
        if (this.queue[category]) {
            this.queue[category].splice(index, 1);
        }
    }

    // ファイルの順序変更
    moveFile(category: string, fromIndex: number, toIndex: number) {
        if (this.queue[category]) {
            const files = this.queue[category];
            if (fromIndex < 0 || fromIndex >= files.length || toIndex < 0 || toIndex >= files.length) {
                return;
            }
            const [file] = files.splice(fromIndex, 1);
            files.splice(toIndex, 0, file);
        }
    }
}
