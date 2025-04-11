export class QueueManager {
    // Queue: stores file paths as values with category names as keys
    private queue: { [category: string]: string[] } = {};
    private defaultCategory: string = "Reference Code Output";

    constructor() {
        // Prepare default category for initial state
        this.queue[this.defaultCategory] = [];
    }

    // Add file (with optional category specification, default category if not specified)
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

    // Remove file (specify category and index)
    removeFile(category: string, index: number) {
        if (this.queue[category]) {
            this.queue[category].splice(index, 1);
        }
    }

    // Change file order
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
