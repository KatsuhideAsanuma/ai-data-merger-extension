import * as vscode from 'vscode';

export class ConfigManager {
    public categories: string[] = [];

    constructor() {
        this.loadCategories();
        // Reload categories when configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('aiDataMerger.categories')) {
                this.loadCategories();
            }
        });
    }

    loadCategories() {
        // Load categories from VSCode settings
        const configCategories = vscode.workspace.getConfiguration('aiDataMerger').get('categories') as string[];
        
        if (configCategories && Array.isArray(configCategories) && configCategories.length > 0) {
            this.categories = configCategories;
            console.log(`Categories loaded from settings: ${this.categories.join(', ')}`);
        } else {
            // Use default values if settings not found
            this.categories = ["Prompt Output", "Design Document Output", "Reference Code Output"];
            console.log("Categories not found in settings. Using default categories.");
        }
    }
}
