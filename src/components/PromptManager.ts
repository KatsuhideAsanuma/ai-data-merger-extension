import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// プロンプトデータの基本インターフェース
export interface PromptData {
  id: string;
  name: string;
  category: string;
  type: 'template' | 'simpleText';
  createdAt: number;
  updatedAt: number;
  content: string; // content属性を基本インターフェースに追加
}

// テンプレート型プロンプト
export interface TemplatePrompt extends PromptData {
  type: 'template';
  content: string; // プレースホルダー含むテンプレート
  variables: PromptVariable[];
}

// 単純テキスト型プロンプト
export interface SimpleTextPrompt extends PromptData {
  type: 'simpleText';
  content: string; // 実際のプロンプトテキスト
  sourceTemplateId?: string; // 元テンプレートがある場合のみ
  mergedFileIds?: string[]; // 関連マージファイルID
  tokenCount?: number;
}

// プロンプト変数定義
export interface PromptVariable {
  name: string;
  type: 'text' | 'fileList' | 'mdHeading' | 'mergedData';
  defaultValue?: string;
  description?: string;
}

// プロンプトマネージャークラス
export class PromptManager {
  private promptsPath: string;
  private templates: Map<string, TemplatePrompt> = new Map();
  private simpleTexts: Map<string, SimpleTextPrompt> = new Map();
  private indexFilePath: string;
  private _onDidChangePrompts: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  
  public readonly onDidChangePrompts: vscode.Event<void> = this._onDidChangePrompts.event;

  constructor(private context: vscode.ExtensionContext) {
    // プロンプトデータの保存先設定を取得
    const config = vscode.workspace.getConfiguration('aiDataMerger');
    this.promptsPath = config.get('promptsStoragePath', './prompts');
    
    // 絶対パスにする
    if (!path.isAbsolute(this.promptsPath) && vscode.workspace.workspaceFolders) {
      this.promptsPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, this.promptsPath);
    }
    
    // ディレクトリ構造を確保
    this.ensureDirectories();
    
    // インデックスファイルのパスを設定
    this.indexFilePath = path.join(this.promptsPath, 'prompts-index.json');
    
    // プロンプトデータをロード
    this.loadPrompts();
  }

  // ディレクトリ構造を確保するメソッド
  private ensureDirectories(): void {
    if (!fs.existsSync(this.promptsPath)) {
      fs.mkdirSync(this.promptsPath, { recursive: true });
    }
    
    const templatesDir = path.join(this.promptsPath, 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir);
    }
    
    const simpleTextsDir = path.join(this.promptsPath, 'simpleTexts');
    if (!fs.existsSync(simpleTextsDir)) {
      fs.mkdirSync(simpleTextsDir);
    }
  }

  // プロンプトデータを読み込むメソッド
  private loadPrompts(): void {
    try {
      // インデックスファイルが存在する場合のみロード
      if (fs.existsSync(this.indexFilePath)) {
        const indexData = JSON.parse(fs.readFileSync(this.indexFilePath, 'utf8'));
        
        // テンプレートの読み込み
        if (indexData.templates && Array.isArray(indexData.templates)) {
          indexData.templates.forEach((id: string) => {
            try {
              const templatePath = path.join(this.promptsPath, 'templates', `${id}.json`);
              if (fs.existsSync(templatePath)) {
                const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
                this.templates.set(id, template);
              }
            } catch (error) {
              console.error(`テンプレート読み込みエラー: ${id}`, error);
            }
          });
        }
        
        // 単純テキストプロンプトの読み込み
        if (indexData.simpleTexts && Array.isArray(indexData.simpleTexts)) {
          indexData.simpleTexts.forEach((id: string) => {
            try {
              const simplePath = path.join(this.promptsPath, 'simpleTexts', `${id}.json`);
              if (fs.existsSync(simplePath)) {
                const simpleText = JSON.parse(fs.readFileSync(simplePath, 'utf8'));
                this.simpleTexts.set(id, simpleText);
              }
            } catch (error) {
              console.error(`単純テキストプロンプト読み込みエラー: ${id}`, error);
            }
          });
        }
      }
    } catch (error) {
      console.error('プロンプトデータ読み込みエラー:', error);
      vscode.window.showErrorMessage('プロンプトデータの読み込みに失敗しました');
      
      // 初期化
      this.templates.clear();
      this.simpleTexts.clear();
    }
  }

  // インデックスファイルを保存するメソッド
  private saveIndex(): void {
    try {
      const indexData = {
        templates: Array.from(this.templates.keys()),
        simpleTexts: Array.from(this.simpleTexts.keys())
      };
      
      fs.writeFileSync(this.indexFilePath, JSON.stringify(indexData, null, 2));
    } catch (error) {
      console.error('インデックスファイル保存エラー:', error);
      vscode.window.showErrorMessage('プロンプトインデックスの保存に失敗しました');
    }
  }

  // プロンプト保存メソッド
  private savePrompt(prompt: PromptData): void {
    try {
      const isTemplate = prompt.type === 'template';
      const dirName = isTemplate ? 'templates' : 'simpleTexts';
      const filePath = path.join(this.promptsPath, dirName, `${prompt.id}.json`);
      
      fs.writeFileSync(filePath, JSON.stringify(prompt, null, 2));
      
      // Mapに追加
      if (isTemplate) {
        this.templates.set(prompt.id, prompt as TemplatePrompt);
      } else {
        this.simpleTexts.set(prompt.id, prompt as SimpleTextPrompt);
      }
      
      // インデックスファイルを更新
      this.saveIndex();
      
      // 変更通知
      this._onDidChangePrompts.fire();
    } catch (error) {
      console.error('プロンプト保存エラー:', error);
      vscode.window.showErrorMessage('プロンプトの保存に失敗しました');
    }
  }

  // テンプレートプロンプト作成メソッド
  public async createTemplatePrompt(): Promise<TemplatePrompt | undefined> {
    // プロンプト名の入力
    const name = await vscode.window.showInputBox({
      prompt: 'テンプレート名',
      placeHolder: '例: コード説明リクエスト'
    });
    
    if (!name) {
      return undefined; // キャンセル
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
      return undefined; // キャンセル
    }
    
    // 新しいカテゴリを作成
    if (category === '$(add) 新しいカテゴリを作成...') {
      category = await vscode.window.showInputBox({
        prompt: '新しいカテゴリ名',
        placeHolder: '例: コード生成'
      });
      
      if (!category) {
        return undefined; // キャンセル
      }
      
      // 設定に新しいカテゴリを追加
      const updatedCategories = [...categories, category];
      await vscode.workspace.getConfiguration('aiDataMerger').update('promptCategories', updatedCategories, vscode.ConfigurationTarget.Workspace);
    }
    
    // 新しいテンプレートの作成
    const template: TemplatePrompt = {
      id: `template-${Date.now()}`,
      name,
      category,
      type: 'template',
      content: '',
      variables: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // テンプレート編集用のドキュメントを作成
    const document = await vscode.workspace.openTextDocument({
      content: `# ${name}\n\n以下に内容を記述してください。変数は ${"{$変数名:タイプ:説明}"} の形式で指定できます。\n例: ${"{$code:text:説明が必要なコード}"}\n\n`,
      language: 'markdown'
    });
    
    // エディタで開く
    const editor = await vscode.window.showTextDocument(document);
    
    // 編集完了コマンドを登録（一時的）
    const disposable = vscode.commands.registerCommand('extension.finishPromptTemplateEdit', async () => {
      const content = editor.document.getText();
      
      // 変数を抽出
      const variables: PromptVariable[] = [];
      const regex = /\${([^}]+)}/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const varParts = match[1].split(':');
        if (varParts.length >= 2) {
          const name = varParts[0];
          const type = varParts[1] as 'text' | 'fileList' | 'mdHeading' | 'mergedData';
          const description = varParts[2] || '';
          
          variables.push({
            name,
            type,
            description
          });
        }
      }
      
      // テンプレートを更新
      template.content = content;
      template.variables = variables;
      
      // 保存
      this.savePrompt(template);
      
      // エディタを閉じる
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      
      // コマンドの登録解除
      disposable.dispose();
      
      vscode.window.showInformationMessage(`テンプレート「${name}」を作成しました`);
      
      return template;
    });
    
    // ステータスバーアイテムを表示
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(check) テンプレート編集完了';
    statusBarItem.tooltip = 'クリックするとテンプレートを保存します';
    statusBarItem.command = 'extension.finishPromptTemplateEdit';
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
    
    return template;
  }

  // 単純テキストプロンプト作成メソッド
  public async createSimpleTextPrompt(): Promise<SimpleTextPrompt | undefined> {
    // プロンプト名の入力
    const name = await vscode.window.showInputBox({
      prompt: 'プロンプト名',
      placeHolder: '例: コード最適化リクエスト'
    });
    
    if (!name) {
      return undefined; // キャンセル
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
      return undefined; // キャンセル
    }
    
    // 新しいカテゴリを作成
    if (category === '$(add) 新しいカテゴリを作成...') {
      category = await vscode.window.showInputBox({
        prompt: '新しいカテゴリ名',
        placeHolder: '例: コード生成'
      });
      
      if (!category) {
        return undefined; // キャンセル
      }
      
      // 設定に新しいカテゴリを追加
      const updatedCategories = [...categories, category];
      await vscode.workspace.getConfiguration('aiDataMerger').update('promptCategories', updatedCategories, vscode.ConfigurationTarget.Workspace);
    }
    
    // 新しい単純テキストプロンプトの作成
    const simpleText: SimpleTextPrompt = {
      id: `simple-${Date.now()}`,
      name,
      category,
      type: 'simpleText',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // プロンプト編集用のドキュメントを作成
    const document = await vscode.workspace.openTextDocument({
      content: `# ${name}\n\n以下に内容を記述してください。このプロンプトはそのままAIに送信されます。\n\n`,
      language: 'markdown'
    });
    
    // エディタで開く
    const editor = await vscode.window.showTextDocument(document);
    
    // 編集完了コマンドを登録（一時的）
    const disposable = vscode.commands.registerCommand('extension.finishSimplePromptEdit', async () => {
      const content = editor.document.getText();
      
      // プロンプトを更新
      simpleText.content = content;
      
      // トークン数の概算（簡易計算）
      simpleText.tokenCount = Math.ceil(content.length / 4);
      
      // 保存
      this.savePrompt(simpleText);
      
      // エディタを閉じる
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      
      // コマンドの登録解除
      disposable.dispose();
      
      vscode.window.showInformationMessage(`プロンプト「${name}」を作成しました`);
      
      return simpleText;
    });
    
    // ステータスバーアイテムを表示
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(check) プロンプト編集完了';
    statusBarItem.tooltip = 'クリックするとプロンプトを保存します';
    statusBarItem.command = 'extension.finishSimplePromptEdit';
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
    
    return simpleText;
  }

  // テンプレートからテキストプロンプト生成メソッド
  public async generateFromTemplate(templateId: string): Promise<SimpleTextPrompt | undefined> {
    const template = this.templates.get(templateId);
    if (!template) {
      vscode.window.showErrorMessage('テンプレートが見つかりません');
      return undefined;
    }
    
    // 変数値の入力
    const variableValues: Record<string, string> = {};
    
    for (const variable of template.variables) {
      let value: string | undefined;
      
      switch (variable.type) {
        case 'text':
          // テキスト入力
          value = await vscode.window.showInputBox({
            prompt: variable.description || variable.name,
            placeHolder: `${variable.name}の値を入力`,
            value: variable.defaultValue
          });
          break;
          
        case 'fileList':
          // ファイル選択
          const fileUris = await vscode.window.showOpenDialog({
            canSelectMany: true,
            openLabel: '選択',
            filters: { 'All Files': ['*'] }
          });
          
          if (fileUris && fileUris.length > 0) {
            value = fileUris.map(uri => uri.fsPath).join('\n');
          }
          break;
          
        case 'mdHeading':
          // マークダウン見出し選択（実装は簡略化）
          value = await vscode.window.showInputBox({
            prompt: '見出しを入力',
            placeHolder: '例: ## 概要'
          });
          break;
          
        case 'mergedData':
          // マージデータ選択（実装は簡略化）
          value = await vscode.window.showInputBox({
            prompt: 'マージデータの参照を入力',
            placeHolder: '例: merged_data.md'
          });
          break;
      }
      
      if (value === undefined) {
        return undefined; // キャンセル
      }
      
      variableValues[variable.name] = value;
    }
    
    // 変数置換
    let content = template.content;
    for (const [name, value] of Object.entries(variableValues)) {
      // 変数プレースホルダーを値に置換
      const regex = new RegExp(`\\$\\{${name}:[^}]+\\}`, 'g');
      content = content.replace(regex, value);
    }
    
    // 新しい単純テキストプロンプトの作成
    const simpleText: SimpleTextPrompt = {
      id: `simple-${Date.now()}`,
      name: `${template.name} (生成)`,
      category: template.category,
      type: 'simpleText',
      content,
      sourceTemplateId: template.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tokenCount: Math.ceil(content.length / 4) // 簡易計算
    };
    
    // 保存
    this.savePrompt(simpleText);
    
    // エディタで開く
    const document = await vscode.workspace.openTextDocument({
      content: simpleText.content,
      language: 'markdown'
    });
    
    await vscode.window.showTextDocument(document);
    
    vscode.window.showInformationMessage(`テンプレートから「${simpleText.name}」を生成しました`);
    
    return simpleText;
  }

  // プロンプト編集メソッド
  public async editPrompt(promptId: string): Promise<void> {
    // IDからプロンプトを取得
    let prompt: PromptData | undefined;
    let isTemplate = false;
    
    if (this.templates.has(promptId)) {
      prompt = this.templates.get(promptId);
      isTemplate = true;
    } else if (this.simpleTexts.has(promptId)) {
      prompt = this.simpleTexts.get(promptId);
    }
    
    if (!prompt) {
      vscode.window.showErrorMessage('プロンプトが見つかりません');
      return;
    }
    
    // エディタでプロンプト内容を開く
    const document = await vscode.workspace.openTextDocument({
      content: prompt.content,
      language: 'markdown'
    });
    
    const editor = await vscode.window.showTextDocument(document);
    
    // 編集完了コマンドを登録（一時的）
    const disposable = vscode.commands.registerCommand('extension.finishPromptEdit', async () => {
      const content = editor.document.getText();
      
      // プロンプトを更新
      prompt!.content = content;
      prompt!.updatedAt = Date.now();
      
      if (isTemplate) {
        // テンプレートの場合は変数を再抽出
        const templatePrompt = prompt as TemplatePrompt;
        const variables: PromptVariable[] = [];
        const regex = /\${([^}]+)}/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          const varParts = match[1].split(':');
          if (varParts.length >= 2) {
            const name = varParts[0];
            const type = varParts[1] as 'text' | 'fileList' | 'mdHeading' | 'mergedData';
            const description = varParts[2] || '';
            
            variables.push({
              name,
              type,
              description
            });
          }
        }
        
        templatePrompt.variables = variables;
      } else {
        // 単純テキストの場合はトークン数を更新
        const simplePrompt = prompt as SimpleTextPrompt;
        simplePrompt.tokenCount = Math.ceil(content.length / 4);
      }
      
      // 保存
      this.savePrompt(prompt!);
      
      // エディタを閉じる
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      
      // コマンドの登録解除
      disposable.dispose();
      
      vscode.window.showInformationMessage(`プロンプト「${prompt!.name}」を更新しました`);
    });
    
    // ステータスバーアイテムを表示
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(check) 編集完了';
    statusBarItem.tooltip = 'クリックするとプロンプトの変更を保存します';
    statusBarItem.command = 'extension.finishPromptEdit';
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
  }

  // プロンプトのエクスポートメソッド
  public async exportPrompts(): Promise<void> {
    // エクスポート対象の選択
    const exportTarget = await vscode.window.showQuickPick([
      { label: '全てのプロンプト', id: 'all' },
      { label: 'テンプレートのみ', id: 'templates' },
      { label: '単純テキストプロンプトのみ', id: 'simpleTexts' }
    ], {
      placeHolder: 'エクスポート対象を選択'
    });
    
    if (!exportTarget) {
      return; // キャンセル
    }
    
    // エクスポート形式の選択
    const exportFormat = await vscode.window.showQuickPick([
      { label: 'JSON形式', id: 'json' },
      { label: 'テキスト形式', id: 'text' },
      { label: 'マークダウン形式', id: 'markdown' }
    ], {
      placeHolder: 'エクスポート形式を選択'
    });
    
    if (!exportFormat) {
      return; // キャンセル
    }
    
    // エクスポートデータの作成
    let exportData: any;
    let fileExtension = '';
    
    // テンプレートの収集
    const templateArray = Array.from(this.templates.values());
    
    // 単純テキストプロンプトの収集
    const simpleTextArray = Array.from(this.simpleTexts.values());
    
    // 対象に基づいてエクスポートデータを作成
    let promptsToExport: PromptData[] = [];
    
    if (exportTarget.id === 'all') {
      promptsToExport = [...templateArray, ...simpleTextArray];
    } else if (exportTarget.id === 'templates') {
      promptsToExport = templateArray;
    } else if (exportTarget.id === 'simpleTexts') {
      promptsToExport = simpleTextArray;
    }
    
    // 形式に基づいてエクスポートデータを作成
    if (exportFormat.id === 'json') {
      exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        prompts: promptsToExport
      };
      fileExtension = '.json';
    } else if (exportFormat.id === 'text' || exportFormat.id === 'markdown') {
      // テキストまたはマークダウン形式
      const lines: string[] = [];
      
      for (const prompt of promptsToExport) {
        if (exportFormat.id === 'markdown') {
          lines.push(`# プロンプト: ${prompt.name}`);
          lines.push(`## カテゴリ: ${prompt.category}`);
          lines.push(`## タイプ: ${prompt.type === 'template' ? 'テンプレート' : '単純テキスト'}`);
          lines.push('');
          lines.push(prompt.content);
          lines.push('');
          lines.push('---');
          lines.push('');
        } else {
          // プレーンテキスト形式
          lines.push(`[${prompt.name}]`);
          lines.push(prompt.content);
          lines.push('');
          lines.push('----------');
          lines.push('');
        }
      }
      
      exportData = lines.join('\n');
      fileExtension = exportFormat.id === 'markdown' ? '.md' : '.txt';
    }
    
    // 出力先の選択
    const destination = await vscode.window.showQuickPick([
      { label: 'ファイルに保存', id: 'file' },
      { label: 'クリップボードにコピー', id: 'clipboard' }
    ], {
      placeHolder: '出力先を選択'
    });
    
    if (!destination) {
      return; // キャンセル
    }
    
    if (destination.id === 'file') {
      // ファイル保存ダイアログを表示
      const defaultPath = path.join(
        vscode.workspace.workspaceFolders?.[0].uri.fsPath || '',
        `prompts_export${fileExtension}`
      );
      
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(defaultPath),
        filters: {
          'All Files': ['*']
        }
      });
      
      if (uri) {
        // ファイルに書き込み
        const content = typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, 2);
        fs.writeFileSync(uri.fsPath, content);
        vscode.window.showInformationMessage(`プロンプトを ${uri.fsPath} にエクスポートしました`);
      }
    } else if (destination.id === 'clipboard') {
      // クリップボードにコピー
      const content = typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, 2);
      await vscode.env.clipboard.writeText(content);
      vscode.window.showInformationMessage('プロンプトをクリップボードにコピーしました');
    }
  }

  // プロンプトのインポートメソッド
  public async importPrompts(): Promise<void> {
    // インポート方法の選択
    const importSource = await vscode.window.showQuickPick([
      { label: 'ファイルから', id: 'file' },
      { label: 'クリップボードから', id: 'clipboard' },
      { label: '開いているエディタから', id: 'editor' }
    ], {
      placeHolder: 'インポート方法を選択'
    });
    
    if (!importSource) {
      return; // キャンセル
    }
    
    let content = '';
    
    // インポートソースに応じてコンテンツを取得
    if (importSource.id === 'file') {
      // ファイル選択ダイアログを表示
      const fileUris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: {
          'Prompt Files': ['json', 'md', 'txt'],
          'All Files': ['*']
        }
      });
      
      if (!fileUris || fileUris.length === 0) {
        return; // キャンセル
      }
      
      // ファイルを読み込み
      content = fs.readFileSync(fileUris[0].fsPath, 'utf8');
    } else if (importSource.id === 'clipboard') {
      // クリップボードから取得
      content = await vscode.env.clipboard.readText();
      
      if (!content) {
        vscode.window.showErrorMessage('クリップボードが空です');
        return;
      }
    } else if (importSource.id === 'editor') {
      // アクティブエディタから取得
      const editor = vscode.window.activeTextEditor;
      
      if (!editor) {
        vscode.window.showErrorMessage('アクティブなエディタがありません');
        return;
      }
      
      content = editor.document.getText();
    }
    
    // インポート形式の検出
    let importedPrompts: PromptData[] = [];
    
    try {
      // JSONとして解析を試みる
      const jsonData = JSON.parse(content);
      
      if (jsonData.prompts && Array.isArray(jsonData.prompts)) {
        importedPrompts = jsonData.prompts;
      }
    } catch (error) {
      // JSONとして解析できない場合はテキスト/マークダウン形式として処理
      // 単純化のため、マークダウン見出しで分割する簡易実装
      const sections = content.split(/(?=^# )/m);
      
      for (const section of sections) {
        if (!section.trim()) {
          continue;
        }
        
        // マークダウン形式の解析
        const titleMatch = section.match(/^# プロンプト: (.+)$/m);
        const categoryMatch = section.match(/^## カテゴリ: (.+)$/m);
        const typeMatch = section.match(/^## タイプ: (.+)$/m);
        
        if (titleMatch) {
          const name = titleMatch[1];
          const category = categoryMatch ? categoryMatch[1] : 'インポート';
          const type = typeMatch && typeMatch[1] === 'テンプレート' ? 'template' : 'simpleText';
          
          // 内容を抽出（ヘッダー部分を除く）
          let content = section;
          if (titleMatch) {
            content = content.replace(titleMatch[0], '');
          }
          if (categoryMatch) {
            content = content.replace(categoryMatch[0], '');
          }
          if (typeMatch) {
            content = content.replace(typeMatch[0], '');
          }
          
          // 先頭の空行を削除
          content = content.replace(/^\s+/, '');
          
          if (type === 'template') {
            // テンプレートとして処理
            const variables: PromptVariable[] = [];
            const regex = /\${([^}]+)}/g;
            let match;
            
            while ((match = regex.exec(content)) !== null) {
              const varParts = match[1].split(':');
              if (varParts.length >= 2) {
                const name = varParts[0];
                const type = varParts[1] as 'text' | 'fileList' | 'mdHeading' | 'mergedData';
                const description = varParts[2] || '';
                
                variables.push({
                  name,
                  type,
                  description
                });
              }
            }
            
            importedPrompts.push({
              id: `template-${Date.now()}-${importedPrompts.length}`,
              name,
              category,
              type: 'template',
              content,
              variables,
              createdAt: Date.now(),
              updatedAt: Date.now()
            } as TemplatePrompt);
          } else {
            // 単純テキストとして処理
            importedPrompts.push({
              id: `simple-${Date.now()}-${importedPrompts.length}`,
              name,
              category,
              type: 'simpleText',
              content,
              tokenCount: Math.ceil(content.length / 4),
              createdAt: Date.now(),
              updatedAt: Date.now()
            } as SimpleTextPrompt);
          }
        } else {
          // ヘッダーが見つからない場合は単純テキストとして扱う
          importedPrompts.push({
            id: `simple-${Date.now()}-${importedPrompts.length}`,
            name: `インポートされたプロンプト ${importedPrompts.length + 1}`,
            category: 'インポート',
            type: 'simpleText',
            content: section.trim(),
            tokenCount: Math.ceil(section.length / 4),
            createdAt: Date.now(),
            updatedAt: Date.now()
          } as SimpleTextPrompt);
        }
      }
    }
    
    if (importedPrompts.length === 0) {
      vscode.window.showErrorMessage('インポートできるプロンプトが見つかりませんでした');
      return;
    }
    
    // 重複時の対応を選択
    const duplicateAction = await vscode.window.showQuickPick([
      { label: '上書き', id: 'overwrite' },
      { label: 'リネーム', id: 'rename' },
      { label: 'スキップ', id: 'skip' }
    ], {
      placeHolder: '既存のプロンプトと重複した場合の対応を選択'
    });
    
    if (!duplicateAction) {
      return; // キャンセル
    }
    
    // インポートの実行
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const prompt of importedPrompts) {
      // 既存プロンプトとの重複をチェック
      const existingPrompts = prompt.type === 'template' ? this.templates : this.simpleTexts;
      
      // Map.valuesの結果を配列に変換して使用する
      const promptsArray = [...existingPrompts.values()];
      const isDuplicate = promptsArray.some(p => p.name === prompt.name);
      
      if (isDuplicate) {
        if (duplicateAction.id === 'skip') {
          skippedCount++;
          continue;
        } else if (duplicateAction.id === 'rename') {
          // リネーム
          prompt.name = `${prompt.name} (インポート)`;
        }
        // 上書きの場合はそのまま保存
      }
      
      // プロンプトを保存
      this.savePrompt(prompt);
      importedCount++;
    }
    
    vscode.window.showInformationMessage(
      `${importedCount}個のプロンプトをインポートしました${skippedCount > 0 ? `（${skippedCount}個をスキップ）` : ''}`
    );
  }

  // プロンプトを取得するメソッド
  public getPrompts(): { templates: TemplatePrompt[], simpleTexts: SimpleTextPrompt[] } {
    return {
      templates: Array.from(this.templates.values()),
      simpleTexts: Array.from(this.simpleTexts.values())
    };
  }

  // プロンプトの削除メソッド
  public deletePrompt(promptId: string): boolean {
    if (this.templates.has(promptId)) {
      const template = this.templates.get(promptId);
      this.templates.delete(promptId);
      
      // ファイルの削除
      const filePath = path.join(this.promptsPath, 'templates', `${promptId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // インデックスの更新
      this.saveIndex();
      
      // 変更通知
      this._onDidChangePrompts.fire();
      
      vscode.window.showInformationMessage(`テンプレート「${template?.name}」を削除しました`);
      return true;
    } else if (this.simpleTexts.has(promptId)) {
      const simpleText = this.simpleTexts.get(promptId);
      this.simpleTexts.delete(promptId);
      
      // ファイルの削除
      const filePath = path.join(this.promptsPath, 'simpleTexts', `${promptId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // インデックスの更新
      this.saveIndex();
      
      // 変更通知
      this._onDidChangePrompts.fire();
      
      vscode.window.showInformationMessage(`プロンプト「${simpleText?.name}」を削除しました`);
      return true;
    }
    
    return false;
  }
} 