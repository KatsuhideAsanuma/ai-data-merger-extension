import * as vscode from 'vscode';
import { PromptManager, SimpleTextPrompt, TemplatePrompt } from '../components/PromptManager';

// プロンプトツリーアイテムクラス
export class PromptTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly promptId?: string,
    public readonly type?: 'template' | 'simpleText',
    public readonly contextValue?: string
  ) {
    super(label, collapsibleState);
    
    // アイコン設定
    if (type === 'template') {
      this.iconPath = { light: './resources/light/template.svg', dark: './resources/dark/template.svg' };
    } else if (type === 'simpleText') {
      this.iconPath = { light: './resources/light/text.svg', dark: './resources/dark/text.svg' };
    } else {
      // カテゴリの場合
      this.iconPath = { light: './resources/light/folder.svg', dark: './resources/dark/folder.svg' };
    }
    
    // コマンド設定
    if (promptId) {
      this.command = {
        command: 'extension.previewPrompt',
        title: 'プロンプトをプレビュー',
        arguments: [promptId, type]
      };
    }
  }
}

// プロンプトツリービュープロバイダークラス
export class PromptTreeViewProvider implements vscode.TreeDataProvider<PromptTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<PromptTreeItem | undefined | null> = new vscode.EventEmitter<PromptTreeItem | undefined | null>();
  readonly onDidChangeTreeData: vscode.Event<PromptTreeItem | undefined | null> = this._onDidChangeTreeData.event;
  
  constructor(private promptManager: PromptManager) {
    // プロンプト変更イベントを監視
    this.promptManager.onDidChangePrompts(() => {
      this.refresh();
    });
  }
  
  // ツリービューの更新
  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }
  
  // ツリー要素の取得
  getTreeItem(element: PromptTreeItem): vscode.TreeItem {
    return element;
  }
  
  // ツリーの子要素取得
  getChildren(element?: PromptTreeItem): Thenable<PromptTreeItem[]> {
    // ルート要素の場合
    if (!element) {
      return Promise.resolve([
        new PromptTreeItem('テンプレート', vscode.TreeItemCollapsibleState.Expanded),
        new PromptTreeItem('テキストプロンプト', vscode.TreeItemCollapsibleState.Expanded)
      ]);
    }
    
    // プロンプトデータを取得
    const { templates, simpleTexts } = this.promptManager.getPrompts();
    
    // テンプレートカテゴリの場合
    if (element.label === 'テンプレート') {
      // カテゴリごとにグループ化
      const categories = this.groupByCategory(templates);
      
      // カテゴリごとのツリーアイテムを作成
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
    
    // テキストプロンプトカテゴリの場合
    if (element.label === 'テキストプロンプト') {
      // カテゴリごとにグループ化
      const categories = this.groupByCategory(simpleTexts);
      
      // カテゴリごとのツリーアイテムを作成
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
    
    // テンプレートのサブカテゴリの場合
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
    
    // テキストプロンプトのサブカテゴリの場合
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
  
  // プロンプトをカテゴリでグループ化するヘルパーメソッド
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