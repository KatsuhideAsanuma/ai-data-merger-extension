import * as vscode from 'vscode';
import { PromptManager, SimpleTextPrompt, TemplatePrompt } from '../components/PromptManager';

// Prompt tree item class
export class PromptTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly promptId?: string,
    public readonly type?: 'template' | 'simpleText',
    public readonly contextValue?: string
  ) {
    super(label, collapsibleState);
    
    // Set icon
    if (type === 'template') {
      this.iconPath = { light: './resources/light/template.svg', dark: './resources/dark/template.svg' };
    } else if (type === 'simpleText') {
      this.iconPath = { light: './resources/light/text.svg', dark: './resources/dark/text.svg' };
    } else {
      // For category
      this.iconPath = { light: './resources/light/folder.svg', dark: './resources/dark/folder.svg' };
    }
    
    // Set command
    if (promptId) {
      this.command = {
        command: 'extension.previewPrompt',
        title: 'Preview Prompt',
        arguments: [promptId, type]
      };
    }
  }
}

// Prompt tree view provider class
export class PromptTreeViewProvider implements vscode.TreeDataProvider<PromptTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<PromptTreeItem | undefined | null> = new vscode.EventEmitter<PromptTreeItem | undefined | null>();
  readonly onDidChangeTreeData: vscode.Event<PromptTreeItem | undefined | null> = this._onDidChangeTreeData.event;
  
  constructor(private promptManager: PromptManager) {
    // Monitor prompt change events
    this.promptManager.onDidChangePrompts(() => {
      this.refresh();
    });
  }
  
  // Update tree view
  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }
  
  // Get tree item
  getTreeItem(element: PromptTreeItem): vscode.TreeItem {
    return element;
  }
  
  // Get child elements of tree
  getChildren(element?: PromptTreeItem): Thenable<PromptTreeItem[]> {
    // For root element
    if (!element) {
      return Promise.resolve([
        new PromptTreeItem('Templates', vscode.TreeItemCollapsibleState.Expanded),
        new PromptTreeItem('Text Prompts', vscode.TreeItemCollapsibleState.Expanded)
      ]);
    }
    
    // Get prompt data
    const { templates, simpleTexts } = this.promptManager.getPrompts();
    
    // For template category
    if (element.label === 'Templates') {
      // Group by category
      const categories = this.groupByCategory(templates);
      
      // Create tree items for each category
      return Promise.resolve(
        Object.keys(categories).map(category => 
          new PromptTreeItem(
            category,
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined,
            undefined,
            'promptCategory'
          )
        )
      );
    }
    
    // For text prompt category
    if (element.label === 'Text Prompts') {
      // Group by category
      const categories = this.groupByCategory(simpleTexts);
      
      // Create tree items for each category
      return Promise.resolve(
        Object.keys(categories).map(category => 
          new PromptTreeItem(
            category,
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined,
            undefined,
            'promptCategory'
          )
        )
      );
    }
    
    // For template subcategory
    const { templates: allTemplates } = this.promptManager.getPrompts();
    const templatesByCategory = this.groupByCategory(allTemplates);
    if (templatesByCategory[element.label]) {
      return Promise.resolve(
        templatesByCategory[element.label].map(template => 
          new PromptTreeItem(
            template.name,
            vscode.TreeItemCollapsibleState.None,
            template.id,
            'template',
            'promptTemplate'
          )
        )
      );
    }
    
    // For text prompt subcategory
    const { simpleTexts: allSimpleTexts } = this.promptManager.getPrompts();
    const simpleTextsByCategory = this.groupByCategory(allSimpleTexts);
    if (simpleTextsByCategory[element.label]) {
      return Promise.resolve(
        simpleTextsByCategory[element.label].map(simpleText => 
          new PromptTreeItem(
            simpleText.name,
            vscode.TreeItemCollapsibleState.None,
            simpleText.id,
            'simpleText',
            'promptSimpleText'
          )
        )
      );
    }
    
    return Promise.resolve([]);
  }
  
  // Helper method to group prompts by category
  private groupByCategory<T extends TemplatePrompt | SimpleTextPrompt>(
    prompts: T[]
  ): { [category: string]: T[] } {
    const result: { [category: string]: T[] } = {};
    
    for (const prompt of prompts) {
      if (!result[prompt.category]) {
        result[prompt.category] = [];
      }
      result[prompt.category].push(prompt);
    }
    
    return result;
  }
} 