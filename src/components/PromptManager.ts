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

// プロンプトタイプの定義
export type PromptType = 'template' | 'simpleText';

// テンプレート型プロンプト
export interface TemplatePrompt extends PromptData {
  type: 'template';
  content: string; // プレースホルダー含むテンプレート
  variables: PromptVariable[];
  tokenCount: number; // トークン数（必須）
  variableDefinitions: VariableDefinition[]; // 変数定義（必須）
}

// 単純テキスト型プロンプト
export interface SimpleTextPrompt extends PromptData {
  type: 'simpleText';
  content: string; // 実際のプロンプトテキスト
  sourceTemplateId?: string; // 元テンプレートがある場合のみ
  mergedFileIds?: string[]; // 関連マージファイルID
  tokenCount: number; // トークン数（必須）
}

// プロンプト変数定義
export interface PromptVariable {
  name: string;
  type: 'text' | 'fileList' | 'mdHeading' | 'mergedData';
  defaultValue?: string;
  description?: string;
}

/**
 * プロンプトテンプレートの型定義
 */
export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  type: 'template';
  createdAt: number;
  updatedAt: number;
  tokenCount: number;
  variables?: PromptVariable[]; // TemplatePromptと合わせて同じくする
  variableDefinitions: VariableDefinition[];
}

/**
 * 変数定義の型
 */
export interface VariableDefinition {
    name: string;
    type: 'text' | 'textarea' | 'file' | 'heading' | 'mergedData' | 'select';
    description?: string;
    options?: string[]; // selectタイプの場合の選択肢
    default?: string;
}

// プロンプトマネージャークラス
export class PromptManager {
  private promptsPath: string;
  private templates: Map<string, TemplatePrompt> = new Map();
  private simpleTexts: Map<string, SimpleTextPrompt> = new Map();
  private indexFilePath: string;
  private _onDidChangePrompts: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  private fileWatchers: Map<string, vscode.FileSystemWatcher> = new Map();
  
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
    this.initializeDirectoryStructure();
    
    // インデックスファイルのパスを設定
    this.indexFilePath = path.join(this.promptsPath, 'prompts-index.json');
    
    // プロンプトデータをロード
    this.loadPrompts();
    
    // ファイル監視を設定
    this.setupFileWatchers();
  }

  /**
   * ファイル監視設定
   */
  private setupFileWatchers(): void {
    // すべてのテンプレートに対してファイル監視を設定
    this.templates.forEach((template, id) => {
      const filePath = path.join(this.promptsPath, 'templates', `${id}.md`);
      
      // mdファイルが存在しない場合は作成（jsonは既に存在するはず）
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, template.content);
      }
      
      // 監視設定
      this.watchTemplateFile(id, filePath);
    });
    
    // すべての単純テキストプロンプトに対してファイル監視を設定
    this.simpleTexts.forEach((prompt, id) => {
      const filePath = path.join(this.promptsPath, 'simpleTexts', `${id}.md`);
      
      // mdファイルが存在しない場合は作成
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, prompt.content);
      }
      
      // 監視設定
      this.watchSimpleTextFile(id, filePath);
    });
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

    const tempDir = path.join(this.promptsPath, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  }

  // フォルダ構造初期化メソッド
  private initializeDirectoryStructure(): void {
    // ベースディレクトリ
    if (!fs.existsSync(this.promptsPath)) {
      fs.mkdirSync(this.promptsPath, { recursive: true });
    }
    
    // 必須サブディレクトリ
    const requiredDirs = [
      'templates',
      'simpleTexts'
    ];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.promptsPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
    
    // インデックスファイルの初期化（存在しない場合のみ）
    const indexPath = path.join(this.promptsPath, 'prompts-index.json');
    if (!fs.existsSync(indexPath)) {
      const emptyIndex = { templates: [], simpleTexts: [] };
      fs.writeFileSync(indexPath, JSON.stringify(emptyIndex, null, 2));
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

  /**
   * テンプレートプロンプトを作成します
   * @returns 作成された新しいプロンプト、またはundefined（キャンセル時）
   */
  public async createTemplatePrompt(): Promise<TemplatePrompt | undefined> {
    try {
      // ディレクトリ確保
      this.ensurePromptDirectories();
      
      // プロンプト名の入力を求める
      const promptName = await vscode.window.showInputBox({
        prompt: 'テンプレート名を入力してください',
        placeHolder: '例: API実装テンプレート'
      });
      
      if (!promptName) {
        return undefined; // キャンセル
      }
      
      // カテゴリの選択
      const categories = this.getCategories('template');
      const selectedCategory = await vscode.window.showQuickPick([
        ...categories,
        '+ 新しいカテゴリを作成'
      ], {
        placeHolder: 'カテゴリを選択してください'
      });
      
      if (!selectedCategory) {
        return undefined; // キャンセル
      }
      
      let category = selectedCategory;
      
      // 新しいカテゴリ作成
      if (selectedCategory === '+ 新しいカテゴリを作成') {
        const newCategory = await vscode.window.showInputBox({
          prompt: '新しいカテゴリ名を入力してください',
          placeHolder: '例: APIプロンプト'
        });
        
        if (!newCategory) {
          return undefined; // キャンセル
        }
        
        category = newCategory;
      }
      
      // プロンプトIDを生成
      const promptId = this.generatePromptId('template');
      
      // 初期コンテンツ
      const initialContent = '# テンプレートプロンプト\n\nここに[[変数名]]のように変数を設定してください。\n\n例: こんにちは、[[名前]]さん。';
      
      // 正式なファイルとして直接保存（.md形式で直接編集可能に）
      const filePath = path.join(this.promptsPath, 'templates', `${promptId}.md`);
      fs.writeFileSync(filePath, initialContent);
      
      // テンプレートオブジェクト作成
      const now = Date.now();
      const variables = this.extractVariables(initialContent);
      const variableDefinitions = this.extractVariableDefinitions(initialContent);
      
      const newPrompt: TemplatePrompt = {
        id: promptId,
        name: promptName,
        category,
        type: 'template',
        content: initialContent,
        createdAt: now,
        updatedAt: now,
        tokenCount: this.countTokens(initialContent),
        variables: variables.map(name => ({
          name,
          type: 'text',
          description: `${name}の値`
        })),
        variableDefinitions
      };
      
      // テンプレートをMapに追加
      this.templates.set(promptId, newPrompt);
      
      // インデックスを更新
      this.saveIndex();
      
      // ファイル変更をリスニング開始
      this.watchTemplateFile(promptId, filePath);
      
      // 変更通知
      this._onDidChangePrompts.fire();
      
      // エディタで開く
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);
      
      vscode.window.showInformationMessage(`テンプレート「${promptName}」を作成しました。このファイルを直接編集してください。自動的に保存されます。`);
      
      return newPrompt;
    } catch (error) {
      vscode.window.showErrorMessage(`テンプレートプロンプト作成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * 単純テキストプロンプトを作成します
   * @returns 作成されたプロンプト、またはundefined（キャンセル時）
   */
  public async createSimpleTextPrompt(): Promise<SimpleTextPrompt | undefined> {
    try {
      // ディレクトリ確保
      this.ensurePromptDirectories();
      
      // プロンプト名の入力を求める
      const promptName = await vscode.window.showInputBox({
        prompt: 'プロンプト名を入力してください',
        placeHolder: '例: GPT-4 システムプロンプト'
      });
      
      if (!promptName) {
        return undefined; // キャンセル
      }
      
      // カテゴリの選択または新規作成
      const categories = this.getCategories('simpleText');
      const selectedCategory = await vscode.window.showQuickPick([
        ...categories,
        '+ 新しいカテゴリを作成'
      ], {
        placeHolder: 'カテゴリを選択または新規作成'
      });
      
      if (!selectedCategory) {
        return undefined; // キャンセル
      }
      
      let category = selectedCategory;
      
      // 新しいカテゴリを作成する場合
      if (selectedCategory === '+ 新しいカテゴリを作成') {
        const newCategory = await vscode.window.showInputBox({
          prompt: '新しいカテゴリ名を入力してください',
          placeHolder: '例: システムプロンプト'
        });
        
        if (!newCategory) {
          return undefined; // キャンセル
        }
        
        category = newCategory;
      }
      
      // プロンプトIDを生成
      const promptId = this.generatePromptId('simple');
      
      // 初期コンテンツ
      const initialContent = '# ここにプロンプトの内容を記述してください\n\n';
      
      // 正式なファイルとして直接保存
      const filePath = path.join(this.promptsPath, 'simpleTexts', `${promptId}.md`);
      fs.writeFileSync(filePath, initialContent);
      
      // プロンプトオブジェクト作成
      const now = Date.now();
      const newPrompt: SimpleTextPrompt = {
        id: promptId,
        name: promptName,
        category,
        type: 'simpleText',
        content: initialContent,
        tokenCount: this.countTokens(initialContent),
        createdAt: now,
        updatedAt: now
      };
      
      // Mapに追加
      this.simpleTexts.set(promptId, newPrompt);
      
      // インデックスを更新
      this.saveIndex();
      
      // ファイル変更をリスニング開始
      this.watchSimpleTextFile(promptId, filePath);
      
      // 変更通知
      this._onDidChangePrompts.fire();
      
      // エディタで開く
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);
      
      vscode.window.showInformationMessage(`プロンプト「${promptName}」を作成しました。このファイルを直接編集してください。自動的に保存されます。`);
      
      return newPrompt;
    } catch (error) {
      vscode.window.showErrorMessage(`プロンプト作成エラー: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * テンプレートから新しいプロンプトを生成する
   * @param templateId テンプレートID
   */
  async generateFromTemplate(templateId: string): Promise<void> {
    try {
      // テンプレートの存在確認
      const template = this.templates.get(templateId);
      if (!template) {
        vscode.window.showErrorMessage(`テンプレートID「${templateId}」が見つかりません`);
        return;
      }

      // 変数値を保持するオブジェクト
      const variableValues: { [key: string]: string } = {};

      // WebViewパネルの作成
      const panel = vscode.window.createWebviewPanel(
        'variableInput',
        `${template.name} - 変数入力`,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      // 変数入力フォームのHTMLを生成
      panel.webview.html = this.generateVariableInputFormHtml(template, panel.webview);

      // メッセージハンドリング
      panel.webview.onDidReceiveMessage(async (message) => {
        try {
          switch (message.command) {
            case 'submitVariables':
              // 変数値を保存
              Object.assign(variableValues, message.variables);
              
              // プロンプト名の入力
              const name = await vscode.window.showInputBox({
                prompt: 'プロンプト名を入力してください',
                placeHolder: 'プロンプト名',
                value: `${template.name}から生成`
              });
              
              if (!name) {
                panel.dispose();
                return; // キャンセル
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
                panel.dispose();
                return; // キャンセル
              }
              
              // 新しいカテゴリを作成
              if (category === '$(add) 新しいカテゴリを作成...') {
                category = await vscode.window.showInputBox({
                  prompt: '新しいカテゴリ名を入力してください',
                  placeHolder: '例: コード生成'
                });
                
                if (!category) {
                  panel.dispose();
                  return; // キャンセル
                }
                
                // 設定に新しいカテゴリを追加
                const updatedCategories = [...categories, category];
                await vscode.workspace.getConfiguration('aiDataMerger').update('promptCategories', updatedCategories, vscode.ConfigurationTarget.Workspace);
              }
              
              // テンプレートの内容をコピー
              let content = template.content;
              
              // プレースホルダーを変数値で置換
              const placeholderRegex = /\[\[([^\]]+)\]\]/g;
              content = content.replace(placeholderRegex, (match, variableName) => {
                return variableValues[variableName] || match;
              });
              
              // 新しいシンプルテキストプロンプトの作成
              const promptId = this.generatePromptId('simple');
              const simpleText: SimpleTextPrompt = {
                id: promptId,
                name,
                category,
                type: 'simpleText',
                content,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                tokenCount: this.countTokens(content)
              };
              
              // プロンプトの保存
              this.savePrompt(simpleText);
              
              // WebViewを閉じる
              panel.dispose();
              
              // 成功メッセージと生成されたプロンプトを表示
              vscode.window.showInformationMessage(`テンプレート「${template.name}」からプロンプト「${name}」を生成しました`);
              
              // 生成したプロンプトをエディタで開く
              const filePath = path.join(this.promptsPath, 'simpleTexts', `${promptId}.md`);
              fs.writeFileSync(filePath, content);
              
              // ファイル監視設定
              this.watchSimpleTextFile(promptId, filePath);
              
              // エディタで開く
              const document = await vscode.workspace.openTextDocument(filePath);
              await vscode.window.showTextDocument(document);
              
              break;
              
            case 'selectFile':
              // ファイル選択ダイアログを表示
              const fileUris = await vscode.window.showOpenDialog({
                canSelectMany: false,
                openLabel: '選択',
                filters: {
                  'All Files': ['*']
                }
              });
              
              if (fileUris && fileUris.length > 0) {
                const fileContent = fs.readFileSync(fileUris[0].fsPath, 'utf8');
                panel.webview.postMessage({
                  command: 'fileSelected',
                  variableName: message.variableName,
                  value: fileContent
                });
              }
              break;
              
            case 'selectHeading':
              // 現在アクティブなエディタからヘッディングを収集
              const activeEditor = vscode.window.activeTextEditor;
              if (activeEditor) {
                const documentText = activeEditor.document.getText();
                const headings: string[] = [];
                
                // Markdownヘッディングを探す
                const headingRegex = /^(#{1,6})\s+(.+)$/gm;
                let match;
                while ((match = headingRegex.exec(documentText)) !== null) {
                  const level = match[1].length;
                  const text = match[2];
                  headings.push(`${'#'.repeat(level)} ${text}`);
                }
                
                if (headings.length > 0) {
                  const selectedHeading = await vscode.window.showQuickPick(headings, {
                    placeHolder: 'ヘッディングを選択'
                  });
                  
                  if (selectedHeading) {
                    panel.webview.postMessage({
                      command: 'headingSelected',
                      variableName: message.variableName,
                      value: selectedHeading
                    });
                  }
                } else {
                  vscode.window.showInformationMessage('現在のドキュメントにヘッディングが見つかりません');
                }
              } else {
                vscode.window.showInformationMessage('アクティブなエディタがありません');
              }
              break;
              
            case 'selectMergedData':
              // TODO: マージされたデータ選択機能の実装
              vscode.window.showInformationMessage('マージデータ選択機能は現在開発中です');
              break;
          }
        } catch (error) {
          vscode.window.showErrorMessage(`変数処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
          console.error('変数処理エラー:', error);
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage(`テンプレートからの生成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      console.error('テンプレートからの生成エラー:', error);
    }
  }

  /**
   * 変数入力フォーム用のHTMLを生成する
   * @param template テンプレート
   * @param webview WebViewインスタンス
   * @returns HTML文字列
   */
  private generateVariableInputFormHtml(template: TemplatePrompt, webview: vscode.Webview): string {
    const variables = this.extractVariables(template.content);
    
    // 変数定義を配列で取得
    const variableDefinitions = template.variableDefinitions || [];
    
    // 変数ごとのフォーム要素を生成
    const variableInputs = variables.map(variable => {
      // 変数定義を検索
      const definition = variableDefinitions.find(def => def.name === variable);
      const type = definition?.type || 'text';
      const description = definition?.description || '';
      
      switch (type) {
        case 'file':
          return `
          <div class="form-group">
            <label for="${variable}">${variable}${description ? ` - ${description}` : ''}</label>
            <div class="file-input-container">
              <textarea id="${variable}" name="${variable}" rows="5" placeholder="ファイルの内容がここに表示されます"></textarea>
              <button type="button" class="file-select-button" data-variable="${variable}">ファイル選択</button>
            </div>
          </div>`;
          
        case 'heading':
          return `
          <div class="form-group">
            <label for="${variable}">${variable}${description ? ` - ${description}` : ''}</label>
            <div class="heading-input-container">
              <input type="text" id="${variable}" name="${variable}" placeholder="ヘッディングを選択">
              <button type="button" class="heading-select-button" data-variable="${variable}">ヘッディング選択</button>
            </div>
          </div>`;
          
        case 'mergedData':
          return `
          <div class="form-group">
            <label for="${variable}">${variable}${description ? ` - ${description}` : ''}</label>
            <div class="merged-data-input-container">
              <textarea id="${variable}" name="${variable}" rows="5" placeholder="マージされたデータがここに表示されます"></textarea>
              <button type="button" class="merged-data-select-button" data-variable="${variable}">データ選択</button>
            </div>
          </div>`;
          
        case 'textarea':
          return `
          <div class="form-group">
            <label for="${variable}">${variable}${description ? ` - ${description}` : ''}</label>
            <textarea id="${variable}" name="${variable}" rows="5" placeholder="${description || '入力してください'}"></textarea>
          </div>`;
          
        case 'select':
          if (definition && definition.options) {
            const options = definition.options.map(option => 
              `<option value="${option}">${option}</option>`
            ).join('');
            
            return `
            <div class="form-group">
              <label for="${variable}">${variable}${description ? ` - ${description}` : ''}</label>
              <select id="${variable}" name="${variable}">
                ${options}
              </select>
            </div>`;
          }
          // optionsがない場合はテキスト入力にフォールバック
          return `
          <div class="form-group">
            <label for="${variable}">${variable}${description ? ` - ${description}` : ''}</label>
            <input type="text" id="${variable}" name="${variable}" placeholder="${description || '入力してください'}">
          </div>`;
          
        default: // text
          return `
          <div class="form-group">
            <label for="${variable}">${variable}${description ? ` - ${description}` : ''}</label>
            <input type="text" id="${variable}" name="${variable}" placeholder="${description || '入力してください'}">
          </div>`;
      }
    }).join('');
    
    return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>変数入力</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          padding: 20px;
        }
        h1 {
          color: var(--vscode-editor-foreground);
          font-size: 1.5em;
          margin-bottom: 20px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          color: var(--vscode-input-foreground);
        }
        input[type="text"], textarea, select {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--vscode-input-border);
          background-color: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border-radius: 3px;
        }
        textarea {
          resize: vertical;
          min-height: 100px;
        }
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 3px;
          margin-top: 10px;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .file-input-container, .heading-input-container, .merged-data-input-container {
          display: flex;
          flex-direction: column;
        }
        .file-select-button, .heading-select-button, .merged-data-select-button {
          align-self: flex-start;
        }
        .description {
          margin-top: 5px;
          font-size: 0.9em;
          color: var(--vscode-descriptionForeground);
        }
        .preview {
          margin-top: 20px;
          padding: 10px;
          background-color: var(--vscode-editor-background);
          border: 1px solid var(--vscode-panel-border);
          border-radius: 3px;
        }
        .preview-heading {
          font-size: 1.2em;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <h1>${template.name} - 変数入力</h1>
      <p>下記のフォームに入力して、「生成」ボタンをクリックしてください。</p>
      
      <form id="variableForm">
        ${variableInputs}
        
        <button type="submit" id="submitButton">生成</button>
      </form>
      
      <script>
        (function() {
          const vscode = acquireVsCodeApi();
          
          // フォーム送信時の処理
          document.getElementById('variableForm').addEventListener('submit', (event) => {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            const variables = {};
            
            for (const [key, value] of formData.entries()) {
              variables[key] = value;
            }
            
            vscode.postMessage({
              command: 'submitVariables',
              variables
            });
          });
          
          // ファイル選択ボタンの処理
          document.querySelectorAll('.file-select-button').forEach(button => {
            button.addEventListener('click', () => {
              const variableName = button.getAttribute('data-variable');
              vscode.postMessage({
                command: 'selectFile',
                variableName
              });
            });
          });
          
          // ヘッディング選択ボタンの処理
          document.querySelectorAll('.heading-select-button').forEach(button => {
            button.addEventListener('click', () => {
              const variableName = button.getAttribute('data-variable');
              vscode.postMessage({
                command: 'selectHeading',
                variableName
              });
            });
          });
          
          // マージデータ選択ボタンの処理
          document.querySelectorAll('.merged-data-select-button').forEach(button => {
            button.addEventListener('click', () => {
              const variableName = button.getAttribute('data-variable');
              vscode.postMessage({
                command: 'selectMergedData',
                variableName
              });
            });
          });
          
          // WebViewからのメッセージ受信
          window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
              case 'fileSelected':
                document.getElementById(message.variableName).value = message.value;
                break;
                
              case 'headingSelected':
                document.getElementById(message.variableName).value = message.value;
                break;
                
              case 'mergedDataSelected':
                document.getElementById(message.variableName).value = message.value;
                break;
            }
          });
        })();
      </script>
    </body>
    </html>`;
  }

  /**
   * テンプレートコンテンツから変数を抽出する
   * @param content テンプレートコンテンツ
   * @returns 変数名の配列
   */
  private extractVariables(content: string): string[] {
    const variables: string[] = [];
    const regex = /\[\[([^\]]+)\]\]/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }

  /**
   * プロンプトを編集します
   * @param promptId 編集するプロンプトのID
   */
  public async editPrompt(promptId: string): Promise<void> {
    try {
      // プロンプト取得
      const isTemplate = this.templates.has(promptId);
      const isSimpleText = this.simpleTexts.has(promptId);
      
      if (!isTemplate && !isSimpleText) {
        vscode.window.showErrorMessage(`プロンプトID "${promptId}" が見つかりません`);
        return;
      }
      
      const prompt = isTemplate 
        ? this.templates.get(promptId) 
        : this.simpleTexts.get(promptId);
      
      if (!prompt) {
        return;
      }
      
      // 対応するファイル名
      const dirName = isTemplate ? 'templates' : 'simpleTexts';
      const filePath = path.join(this.promptsPath, dirName, `${promptId}.md`);
      
      // ファイルが存在しない場合は作成
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, prompt.content);
        
        // ファイル監視設定
        if (isTemplate) {
          this.watchTemplateFile(promptId, filePath);
        } else {
          this.watchSimpleTextFile(promptId, filePath);
        }
      }
      
      // エディタで開く
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);
      
      vscode.window.showInformationMessage(
        `プロンプト「${prompt.name}」を編集モードで開きました。ファイルを編集すると自動的に保存されます。`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`プロンプト編集中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
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
              updatedAt: Date.now(),
              tokenCount: Math.ceil(content.length / 4),
              variableDefinitions: []
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

  /**
   * 新しいテンプレートを作成する
   */
  public async createTemplate(): Promise<void> {
    try {
      // プロンプト名の入力
      const name = await vscode.window.showInputBox({
        prompt: 'テンプレート名を入力してください',
        placeHolder: '例: コード説明リクエスト'
      });
      
      if (!name) {
        return; // キャンセル
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
        return; // キャンセル
      }
      
      // 新しいカテゴリを作成
      if (category === '$(add) 新しいカテゴリを作成...') {
        category = await vscode.window.showInputBox({
          prompt: '新しいカテゴリ名を入力してください',
          placeHolder: '例: コード生成'
        });
        
        if (!category) {
          return; // キャンセル
        }
        
        // 設定に新しいカテゴリを追加
        const updatedCategories = [...categories, category];
        await vscode.workspace.getConfiguration('aiDataMerger').update('promptCategories', updatedCategories, vscode.ConfigurationTarget.Workspace);
      }
      
      // 新しいテンプレートの作成
      const templateId = `template-${Date.now()}`;
      const template: PromptTemplate = {
        id: templateId,
        name,
        category,
        type: 'template',
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tokenCount: 0,
        variableDefinitions: []
      };
      
      // 一時ファイルの保存先
      const tempDir = path.join(this.promptsPath, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `${templateId}.md`);
      
      // 初期内容を作成して保存
      const initialContent = `# ${name}\n\n以下に内容を記述してください。変数は [[変数名]] の形式で指定できます。\n例: [[コード]]\n\n`;
      fs.writeFileSync(tempFilePath, initialContent);
      
      // 実ファイルとして開く
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(tempFilePath));
      const editor = await vscode.window.showTextDocument(document);
      
      // 編集完了コマンドを登録（一時的）
      const disposable = vscode.commands.registerCommand('extension.finishTemplateEdit', async () => {
        const content = editor.document.getText();
        
        // 変数を抽出
        const variables = this.extractVariables(content);
        const variableDefinitions: VariableDefinition[] = variables.map(variable => ({
          name: variable,
          type: 'text',
          description: `${variable}の値`
        }));
        
        // テンプレートを更新
        template.content = content;
        template.tokenCount = Math.ceil(content.length / 4); // 簡易トークン計算
        template.variableDefinitions = variableDefinitions;
        
        // テンプレート保存
        this.saveTemplate(template);
        
        // エディタを閉じる
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        
        // コマンドの登録解除
        disposable.dispose();
        
        // 一時ファイルの削除
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        
        vscode.window.showInformationMessage(`テンプレート「${name}」を作成しました`);
      });
      
      // ステータスバーアイテムを表示
      const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
      statusBarItem.text = '$(save) テンプレート保存';
      statusBarItem.tooltip = 'クリックするとテンプレートを保存します';
      statusBarItem.command = 'extension.finishTemplateEdit';
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
      
      // ツールチップ表示
      vscode.window.showInformationMessage(
        `テンプレート「${name}」を編集中です。編集完了後、ステータスバーの「テンプレート保存」ボタンをクリックしてください。`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`テンプレート作成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      console.error('テンプレート作成エラー:', error);
    }
  }

  /**
   * テンプレートを保存する
   * @param template テンプレート
   */
  private saveTemplate(template: PromptTemplate | TemplatePrompt): void {
    try {
      const templatesDir = path.join(this.promptsPath, 'templates');
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }
      
      const filePath = path.join(templatesDir, `${template.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
      
      // MapとインデックスファイルをB更新
      const templatePrompt: TemplatePrompt = {
        id: template.id,
        name: template.name,
        category: template.category,
        type: 'template',
        content: template.content,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        tokenCount: template.tokenCount,
        variables: Array.isArray((template as any).variables) 
          ? (template as any).variables 
          : (template.variableDefinitions || []).map(v => ({
              name: v.name,
              type: this.convertVariableType(v.type),
              description: v.description,
              defaultValue: v.default
            })),
        variableDefinitions: template.variableDefinitions || []
      };
      
      this.templates.set(template.id, templatePrompt);
      this.saveIndex();
      
      // 変更通知
      this._onDidChangePrompts.fire();
    } catch (error) {
      console.error('テンプレート保存エラー:', error);
      vscode.window.showErrorMessage('テンプレートの保存に失敗しました');
    }
  }
  
  /**
   * 変数タイプを変換する
   * @param type 変数タイプ
   * @returns 変換後のタイプ
   */
  private convertVariableType(type: string): 'text' | 'fileList' | 'mdHeading' | 'mergedData' {
    switch (type) {
      case 'file':
        return 'fileList';
      case 'heading':
        return 'mdHeading';
      case 'mergedData':
        return 'mergedData';
      case 'select':
      case 'textarea':
      default:
        return 'text';
    }
  }

  /**
   * テンプレートを編集する
   * @param templateId テンプレートID
   */
  public async editTemplate(templateId: string): Promise<void> {
    try {
      // テンプレートの存在確認
      const template = this.templates.get(templateId);
      if (!template) {
        vscode.window.showErrorMessage(`テンプレートID「${templateId}」が見つかりません`);
        return;
      }
      
      // 一時ファイルの保存先
      const tempDir = path.join(this.promptsPath, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `${templateId}.md`);
      
      // テンプレート内容を保存
      fs.writeFileSync(tempFilePath, template.content);
      
      // 実ファイルとして開く
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(tempFilePath));
      const editor = await vscode.window.showTextDocument(document);
      
      // 編集完了コマンドを登録（一時的）
      const disposable = vscode.commands.registerCommand('extension.finishTemplateEdit', async () => {
        const content = editor.document.getText();
        
        // 変数を抽出
        const variables = this.extractVariables(content);
        
        // 既存の変数定義を保持
        const existingVarDefs = template.variables.map(v => ({
          name: v.name,
          type: this.reverseConvertVariableType(v.type),
          description: v.description,
          default: v.defaultValue
        }));
        
        // 新しい変数定義を作成
        const variableDefinitions: VariableDefinition[] = variables.map(variable => {
          // 既存の変数定義があれば再利用
          const existing = existingVarDefs.find(v => v.name === variable);
          if (existing) {
            return existing;
          }
          
          // 新しい変数定義
          return {
            name: variable,
            type: 'text',
            description: `${variable}の値`
          };
        });
        
        // テンプレートの更新
        const updatedTemplate: PromptTemplate = {
          ...template,
          content,
          updatedAt: Date.now(),
          tokenCount: Math.ceil(content.length / 4), // 簡易トークン計算
          variableDefinitions
        };
        
        // テンプレート保存
        this.saveTemplate(updatedTemplate);
        
        // エディタを閉じる
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        
        // コマンドの登録解除
        disposable.dispose();
        
        // 一時ファイルの削除
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        
        vscode.window.showInformationMessage(`テンプレート「${template.name}」を更新しました`);
      });
      
      // ステータスバーアイテムを表示
      const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
      statusBarItem.text = '$(save) テンプレート保存';
      statusBarItem.tooltip = 'クリックするとテンプレートを保存します';
      statusBarItem.command = 'extension.finishTemplateEdit';
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
      
      // ツールチップ表示
      vscode.window.showInformationMessage(
        `テンプレート「${template.name}」を編集中です。編集完了後、ステータスバーの「テンプレート保存」ボタンをクリックしてください。`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`テンプレート編集中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      console.error('テンプレート編集エラー:', error);
    }
  }
  
  /**
   * 変数タイプを逆変換する
   * @param type 変数タイプ
   * @returns 変換後のタイプ
   */
  private reverseConvertVariableType(type: string): 'text' | 'textarea' | 'file' | 'heading' | 'mergedData' | 'select' {
    switch (type) {
      case 'fileList':
        return 'file';
      case 'mdHeading':
        return 'heading';
      case 'mergedData':
        return 'mergedData';
      default:
        return 'text';
    }
  }

  /**
   * テンプレート変数を編集する
   * @param templateId テンプレートID
   */
  public async editTemplateVariables(templateId: string): Promise<void> {
    try {
      // テンプレートの存在確認
      const template = this.templates.get(templateId);
      if (!template) {
        vscode.window.showErrorMessage(`テンプレートID「${templateId}」が見つかりません`);
        return;
      }
      
      // 変数を抽出
      const variables = this.extractVariables(template.content);
      
      if (variables.length === 0) {
        vscode.window.showInformationMessage(`テンプレート「${template.name}」には変数が定義されていません。テンプレートを編集して変数を追加してください。`);
        return;
      }
      
      // WebViewパネルの作成
      const panel = vscode.window.createWebviewPanel(
        'variableDefinition',
        `${template.name} - 変数定義`,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );
      
      // 変数定義フォームのHTMLを生成
      panel.webview.html = this.generateVariableDefinitionFormHtml(template, variables, panel.webview);
      
      // メッセージハンドリング
      panel.webview.onDidReceiveMessage(async (message) => {
        try {
          switch (message.command) {
            case 'saveVariableDefinitions':
              // 変数定義の保存
              const variableDefinitions = message.definitions;
              
              // テンプレートの更新
              const updatedTemplate: PromptTemplate = {
                ...template,
                updatedAt: Date.now(),
                variableDefinitions
              };
              
              // テンプレート保存
              this.saveTemplate(updatedTemplate);
              
              // WebViewを閉じる
              panel.dispose();
              
              // 成功メッセージ
              vscode.window.showInformationMessage(`テンプレート「${template.name}」の変数定義を更新しました`);
              break;
            
            case 'cancel':
              // キャンセル
              panel.dispose();
              break;
          }
        } catch (error) {
          vscode.window.showErrorMessage(`変数定義の保存中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
          console.error('変数定義保存エラー:', error);
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage(`テンプレート変数編集中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      console.error('テンプレート変数編集エラー:', error);
    }
  }

  /**
   * 変数定義フォーム用のHTMLを生成する
   * @param template テンプレート
   * @param variables 変数名の配列
   * @param webview WebViewインスタンス
   * @returns HTML文字列
   */
  private generateVariableDefinitionFormHtml(template: TemplatePrompt, variables: string[], webview: vscode.Webview): string {
    // 変数定義を取得
    const variableDefinitions = template.variables || [];
    
    // 各変数の定義フォーム要素を生成
    const variableDefinitionInputs = variables.map(variable => {
      // 既存の定義を検索
      const definition = variableDefinitions.find(def => def.name === variable);
      const type = this.reverseConvertVariableType(definition?.type || 'text');
      const description = definition?.description || '';
      const defaultValue = definition?.defaultValue || '';
      
      // 変数タイプの選択肢
      const typeOptions = [
        { value: 'text', label: 'テキスト (一行)' },
        { value: 'textarea', label: 'テキスト (複数行)' },
        { value: 'file', label: 'ファイル内容' },
        { value: 'heading', label: 'Markdownヘッディング' },
        { value: 'mergedData', label: 'マージされたデータ' },
        { value: 'select', label: '選択肢' }
      ].map(option => 
        `<option value="${option.value}" ${type === option.value ? 'selected' : ''}>${option.label}</option>`
      ).join('');
      
      // 変数定義フォーム
      return `
      <div class="variable-definition" data-variable="${variable}">
        <h3>変数: ${variable}</h3>
        <div class="form-group">
          <label for="${variable}-type">タイプ:</label>
          <select id="${variable}-type" class="variable-type" data-variable="${variable}">
            ${typeOptions}
          </select>
        </div>
        <div class="form-group">
          <label for="${variable}-description">説明:</label>
          <input type="text" id="${variable}-description" class="variable-description" data-variable="${variable}" 
                 value="${description}" placeholder="この変数の説明">
        </div>
        <div class="form-group">
          <label for="${variable}-default">デフォルト値:</label>
          <input type="text" id="${variable}-default" class="variable-default" data-variable="${variable}" 
                 value="${defaultValue}" placeholder="デフォルト値">
        </div>
        <div class="form-group ${type === 'select' ? '' : 'hidden'}" id="${variable}-options-group">
          <label for="${variable}-options">選択肢 (カンマ区切り):</label>
          <input type="text" id="${variable}-options" class="variable-options" data-variable="${variable}" 
                 placeholder="選択肢1, 選択肢2, 選択肢3">
        </div>
      </div>
      `;
    }).join('');
    
    // フォーム全体のHTML
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>変数定義</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          font-size: var(--vscode-font-size);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          padding: 20px;
        }
        h2 {
          margin-bottom: 20px;
          color: var(--vscode-editor-foreground);
        }
        .variable-definition {
          margin-bottom: 30px;
          padding: 15px;
          border: 1px solid var(--vscode-panel-border);
          border-radius: 5px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          color: var(--vscode-input-foreground);
        }
        input, select, textarea {
          width: 100%;
          padding: 8px;
          background-color: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
          border-radius: 3px;
        }
        .buttons {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        button {
          padding: 8px 15px;
          margin-left: 10px;
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .hidden {
          display: none;
        }
      </style>
    </head>
    <body>
      <h2>テンプレート「${template.name}」の変数定義</h2>
      <div id="variables-container">
        ${variableDefinitionInputs}
      </div>
      <div class="buttons">
        <button id="cancel-button">キャンセル</button>
        <button id="save-button">保存</button>
      </div>
      
      <script>
        (function() {
          // 変数タイプの変更イベント
          document.querySelectorAll('.variable-type').forEach(select => {
            select.addEventListener('change', function() {
              const variable = this.getAttribute('data-variable');
              const optionsGroup = document.getElementById(\`\${variable}-options-group\`);
              
              if (this.value === 'select') {
                optionsGroup.classList.remove('hidden');
              } else {
                optionsGroup.classList.add('hidden');
              }
            });
          });
          
          // 保存ボタンのクリックイベント
          document.getElementById('save-button').addEventListener('click', function() {
            const variables = ${JSON.stringify(variables)};
            const definitions = [];
            
            variables.forEach(variable => {
              const type = document.getElementById(\`\${variable}-type\`).value;
              const description = document.getElementById(\`\${variable}-description\`).value;
              const defaultValue = document.getElementById(\`\${variable}-default\`).value;
              
              const definition = {
                name: variable,
                type: type,
                description: description,
                default: defaultValue
              };
              
              if (type === 'select') {
                const optionsInput = document.getElementById(\`\${variable}-options\`).value;
                if (optionsInput) {
                  definition.options = optionsInput.split(',').map(o => o.trim()).filter(o => o);
                }
              }
              
              definitions.push(definition);
            });
            
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
              command: 'saveVariableDefinitions',
              definitions: definitions
            });
          });
          
          // キャンセルボタンのクリックイベント
          document.getElementById('cancel-button').addEventListener('click', function() {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
              command: 'cancel'
            });
          });
        })();
      </script>
    </body>
    </html>
    `;
  }

  /**
   * テンプレートを削除する
   * @param templateId テンプレートID
   */
  public async deleteTemplate(templateId: string): Promise<void> {
    try {
      // テンプレートの存在確認
      const template = this.templates.get(templateId);
      if (!template) {
        vscode.window.showErrorMessage(`テンプレートID「${templateId}」が見つかりません`);
        return;
      }
      
      // 確認ダイアログを表示
      const answer = await vscode.window.showWarningMessage(
        `テンプレート「${template.name}」を削除しますか？この操作は元に戻せません。`,
        { modal: true },
        '削除'
      );
      
      if (answer !== '削除') {
        return; // キャンセル
      }
      
      // テンプレートファイルの削除
      const filePath = path.join(this.promptsPath, 'templates', `${templateId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Mapから削除
      this.templates.delete(templateId);
      
      // インデックスファイルの更新
      this.saveIndex();
      
      // 変更通知
      this._onDidChangePrompts.fire();
      
      vscode.window.showInformationMessage(`テンプレート「${template.name}」を削除しました`);
    } catch (error) {
      vscode.window.showErrorMessage(`テンプレート削除中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      console.error('テンプレート削除エラー:', error);
    }
  }

  /**
   * テンプレートへファイルを追加する
   * @param promptId テンプレートID
   * @param filePath ファイルパス
   */
  public async addFileToTemplate(promptId: string, filePath: string): Promise<void> {
    try {
      // テンプレートの存在確認
      const template = this.templates.get(promptId);
      if (!template) {
        vscode.window.showErrorMessage(`テンプレートID「${promptId}」が見つかりません`);
        return;
      }
      
      // ファイルの存在確認
      if (!fs.existsSync(filePath)) {
        vscode.window.showErrorMessage(`ファイル「${filePath}」が見つかりません`);
        return;
      }
      
      // ファイル名を取得
      const fileName = path.basename(filePath);
      
      // ファイル内容を読み込む
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // テンプレート内容を取得
      let content = template.content;
      
      // 挿入する変数名を決定
      const variableName = `file_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // テンプレートに変数を追加
      content += `\n\n## ${fileName}のコンテンツ\n\n[[${variableName}]]\n`;
      
      // テンプレートを更新
      const updatedTemplate: PromptTemplate = {
        ...template,
        content,
        updatedAt: Date.now(),
        tokenCount: Math.ceil(content.length / 4) // 簡易トークン計算
      };
      
      // 変数定義を更新
      const existingVarDefs = template.variableDefinitions ? template.variableDefinitions.map(v => ({
        name: v.name,
        type: v.type, // 既に内部形式なのでそのまま使用
        description: v.description,
        default: v.default
      })) : [];
      
      // 新しい変数定義を追加
      const newVarDef: VariableDefinition = {
        name: variableName,
        type: 'file',
        description: `${fileName}の内容`
      };
      
      updatedTemplate.variableDefinitions = [
        ...existingVarDefs,
        newVarDef
      ];
      
      // テンプレート保存
      this.saveTemplate(updatedTemplate);
      
      // 成功メッセージ
      vscode.window.showInformationMessage(`ファイル「${fileName}」をテンプレート「${template.name}」に追加しました`);
      
      // テンプレートを編集画面で開く
      this.editTemplate(promptId);
    } catch (error) {
      vscode.window.showErrorMessage(`ファイル追加中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      console.error('ファイル追加エラー:', error);
    }
  }

  /**
   * プロンプト関連のディレクトリ構造を初期化する
   */
  private ensurePromptDirectories(): void {
    // ベースディレクトリ確保
    if (!fs.existsSync(this.promptsPath)) {
      fs.mkdirSync(this.promptsPath, { recursive: true });
    }
    
    // テンプレートディレクトリ
    const templatesDir = path.join(this.promptsPath, 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    // 単純テキストディレクトリ
    const simpleTextsDir = path.join(this.promptsPath, 'simpleTexts');
    if (!fs.existsSync(simpleTextsDir)) {
      fs.mkdirSync(simpleTextsDir, { recursive: true });
    }
    
    // 一時ファイルディレクトリ
    const tempDir = path.join(this.promptsPath, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  }

  /**
   * カテゴリのリストを取得する
   * @param type プロンプトのタイプ（'template'または'simpleText'）
   * @returns カテゴリの配列
   */
  private getCategories(type: PromptType): string[] {
    const categories = new Set<string>();
    
    if (type === 'template') {
      this.templates.forEach(template => {
        categories.add(template.category);
      });
    } else {
      this.simpleTexts.forEach(simpleText => {
        categories.add(simpleText.category);
      });
    }
    
    // 設定からデフォルトカテゴリを追加
    const defaultCategories = vscode.workspace.getConfiguration('aiDataMerger').get('promptCategories', []) as string[];
    defaultCategories.forEach(category => categories.add(category));
    
    return Array.from(categories).sort();
  }

  /**
   * ユニークなID文字列を生成する
   * @returns ユニークなID文字列
   */
  private generateUniqueId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `prompt-${timestamp}-${random}`;
  }

  /**
   * テキストのトークン数を概算する
   * @param text トークン数を計算するテキスト
   * @returns 概算トークン数
   */
  private countTokens(text: string): number {
    if (!text) {
      return 0;
    }
    // 単純な計算：英語なら約4文字で1トークン、日本語なら約2文字で1トークン
    // 日本語と英語の混在を考慮して概算
    const japaneseChars = (text.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/g) || []).length;
    const otherChars = text.length - japaneseChars;
    
    return Math.ceil(japaneseChars / 2 + otherChars / 4);
  }

  /**
   * ツリービューを更新する
   */
  private refreshTreeView(): void {
    // イベント発火のみを行い、ツリービューの更新はリスナーに任せる
    this._onDidChangePrompts.fire();
  }

  // ... existing code ...
  
  /**
   * プロンプトツリープロバイダー
   */
  private promptTreeProvider?: vscode.TreeDataProvider<any>;

  /**
   * プロンプトツリープロバイダーを設定する
   * @param provider ツリープロバイダー
   */
  setTreeProvider(provider: vscode.TreeDataProvider<any>): void {
    this.promptTreeProvider = provider;
  }

  // ... existing code ...

  /**
   * プロンプトの絶対パスを取得する
   * @returns プロンプトの絶対パス
   */
  private getAbsolutePromptsPath(): string {
    return this.promptsPath;
  }

  /**
   * シンプルテキストプロンプトを保存する
   * @param prompt 保存するプロンプト
   * @returns 保存されたかどうか
   */
  private saveSimpleTextPrompt(prompt: SimpleTextPrompt): boolean {
    try {
      // ディレクトリの確認
      this.ensurePromptDirectories();
      
      const simpleTextsDir = path.join(this.promptsPath, 'simpleTexts');
      const filePath = path.join(simpleTextsDir, `${prompt.id}.json`);
      
      // ファイルに書き込み
      fs.writeFileSync(filePath, JSON.stringify(prompt, null, 2));
      
      // Mapに保存
      this.simpleTexts.set(prompt.id, prompt);
      
      // インデックスの更新
      this.saveIndex();
      
      // 変更通知
      this._onDidChangePrompts.fire();
      
      return true;
    } catch (error) {
      console.error('プロンプト保存エラー:', error);
      return false;
    }
  }

  /**
   * 全てのプロンプトを取得する
   * @returns すべてのプロンプトの配列
   */
  private getAllPrompts(): PromptData[] {
    const templates = Array.from(this.templates.values());
    const simpleTexts = Array.from(this.simpleTexts.values());
    return [...templates, ...simpleTexts];
  }

  /**
   * すべてのプロンプトを保存する
   * @param prompts プロンプト配列
   */
  private saveAllPrompts(prompts: PromptData[]): void {
    // 各プロンプトを型に応じて適切なマップに分類して保存
    this.templates.clear();
    this.simpleTexts.clear();
    
    for (const prompt of prompts) {
      if (prompt.type === 'template') {
        this.templates.set(prompt.id, prompt as TemplatePrompt);
      } else {
        this.simpleTexts.set(prompt.id, prompt as SimpleTextPrompt);
      }
    }
    
    // インデックスの更新
    this.saveIndex();
    
    // 変更通知
    this._onDidChangePrompts.fire();
  }

  /**
   * ユーティリティメソッド：一時ファイルパスを取得する
   * @param id ファイルID
   * @param extension ファイル拡張子（デフォルトはmd）
   * @returns 一時ファイルの完全パス
   */
  private getTempFilePath(id: string, extension: string = 'md'): string {
    this.ensurePromptDirectories();
    return path.join(this.promptsPath, 'temp', `${id}.${extension}`);
  }

  /**
   * 変数をコンテンツから抽出する
   * @param content テンプレートコンテンツ 
   * @returns 変数定義の配列
   */
  private extractVariableDefinitions(content: string): VariableDefinition[] {
    const variables = this.extractVariables(content);
    return variables.map(variable => ({
      name: variable,
      type: 'text',
      description: `${variable}の値`
    }));
  }

  /**
   * ユニークなプロンプトIDを生成する
   * @param prefix ID接頭辞（template/simpleなど）
   * @returns ユニークID
   */
  private generatePromptId(prefix: string = 'prompt'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * ツリービュープロバイダーを登録する
   * @param provider TreeDataProviderインスタンス
   */
  public registerTreeProvider(provider: vscode.TreeDataProvider<any>): void {
    this.promptTreeProvider = provider;
  }

  /**
   * プロンプトを生成したテンプレートからエディタで開く
   * @param tempFilePath 一時ファイルパス
   * @param content 内容
   */
  private async openGeneratedPromptInEditor(tempFilePath: string, content: string): Promise<void> {
    // 一時ファイルに保存してエディタで開く
    fs.writeFileSync(tempFilePath, content);
    const document = await vscode.workspace.openTextDocument(tempFilePath);
    await vscode.window.showTextDocument(document);
    
    // 変更通知
    this._onDidChangePrompts.fire();
  }

  /**
   * テンプレートファイルの変更を監視する
   * @param promptId プロンプトID
   * @param filePath ファイルパス
   */
  private watchTemplateFile(promptId: string, filePath: string): void {
    // 既存のファイル監視を登録解除
    if (this.fileWatchers.has(promptId)) {
      this.fileWatchers.get(promptId)?.dispose();
    }

    // 新しいファイル監視を登録
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(path.dirname(filePath), path.basename(filePath))
    );

    // ファイル変更イベント
    watcher.onDidChange(async uri => {
      try {
        const content = fs.readFileSync(uri.fsPath, 'utf8');
        const template = this.templates.get(promptId);
        
        if (template) {
          // 変数抽出
          const variables = this.extractVariables(content);
          const variableDefinitions = this.extractVariableDefinitions(content);
          
          // テンプレート更新
          const updatedTemplate: TemplatePrompt = {
            ...template,
            content,
            updatedAt: Date.now(),
            tokenCount: this.countTokens(content),
            variables: variables.map(name => ({
              name,
              type: 'text',
              description: `${name}の値`
            })),
            variableDefinitions
          };
          
          // プロンプト保存（Mapとインデックス更新）
          this.templates.set(promptId, updatedTemplate);
          this.saveIndex();
          
          // 変更通知
          this._onDidChangePrompts.fire();
        }
      } catch (error) {
        console.error('テンプレート更新エラー:', error);
      }
    });

    // ファイル削除イベント（VSCode上での削除をプロンプト削除と連動させる）
    watcher.onDidDelete(uri => {
      try {
        if (this.templates.has(promptId)) {
          // プロンプトを削除
          this.templates.delete(promptId);
          this.saveIndex();
          
          // 変更通知
          this._onDidChangePrompts.fire();
          
          // 監視を解除
          watcher.dispose();
          this.fileWatchers.delete(promptId);
          
          vscode.window.showInformationMessage(`テンプレート「${this.templates.get(promptId)?.name || promptId}」が削除されました`);
        }
      } catch (error) {
        console.error('テンプレート削除エラー:', error);
      }
    });

    // ウォッチャーを保存
    this.fileWatchers.set(promptId, watcher);
  }

  /**
   * 単純テキストプロンプトファイルの変更を監視する
   * @param promptId プロンプトID
   * @param filePath ファイルパス
   */
  private watchSimpleTextFile(promptId: string, filePath: string): void {
    // 既存のファイル監視を登録解除
    if (this.fileWatchers.has(promptId)) {
      this.fileWatchers.get(promptId)?.dispose();
    }

    // 新しいファイル監視を登録
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(path.dirname(filePath), path.basename(filePath))
    );

    // ファイル変更イベント
    watcher.onDidChange(async uri => {
      try {
        const content = fs.readFileSync(uri.fsPath, 'utf8');
        const prompt = this.simpleTexts.get(promptId);
        
        if (prompt) {
          // プロンプト更新
          const updatedPrompt: SimpleTextPrompt = {
            ...prompt,
            content,
            updatedAt: Date.now(),
            tokenCount: this.countTokens(content)
          };
          
          // プロンプト保存（Mapとインデックス更新）
          this.simpleTexts.set(promptId, updatedPrompt);
          this.saveIndex();
          
          // 変更通知
          this._onDidChangePrompts.fire();
        }
      } catch (error) {
        console.error('プロンプト更新エラー:', error);
      }
    });

    // ファイル削除イベント
    watcher.onDidDelete(uri => {
      try {
        if (this.simpleTexts.has(promptId)) {
          // プロンプトを削除
          this.simpleTexts.delete(promptId);
          this.saveIndex();
          
          // 変更通知
          this._onDidChangePrompts.fire();
          
          // 監視を解除
          watcher.dispose();
          this.fileWatchers.delete(promptId);
          
          vscode.window.showInformationMessage(`プロンプト「${this.simpleTexts.get(promptId)?.name || promptId}」が削除されました`);
        }
      } catch (error) {
        console.error('プロンプト削除エラー:', error);
      }
    });

    // ウォッチャーを保存
    this.fileWatchers.set(promptId, watcher);
  }
} 