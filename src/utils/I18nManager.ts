import * as vscode from 'vscode';

/**
 * Internationalization (i18n) Manager
 * Supports internationalization of VSCode extensions
 */
export class I18nManager {
  private static instance: I18nManager;
  private messages: { [key: string]: string } = {};
  private locale: string;

  private constructor() {
    // Get current locale
    this.locale = vscode.env.language || 'en';
    
    // Initialize default messages
    this.initializeMessages();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  /**
   * Initialize messages
   * Note: VS Code automatically processes package.nls.json,
   * but we use this class for hardcoded messages in source code.
   */
  private initializeMessages(): void {
    // English (default) messages
    const defaultMessages: { [key: string]: string } = {
      // Common
      'common.error': 'Error',
      'common.info': 'Information',
      'common.warning': 'Warning',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      'common.ok': 'OK',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.create': 'Create',
      
      // Prompt management
      'prompt.create.title': 'Create New Prompt',
      'prompt.create.nameInput': 'Enter prompt name',
      'prompt.create.categorySelect': 'Select category',
      'prompt.create.newCategory': '+ Create new category',
      'prompt.create.newCategoryInput': 'Enter new category name',
      'prompt.create.success': 'Prompt "{0}" has been created.',
      'prompt.edit.title': 'Edit Prompt',
      'prompt.edit.success': 'Prompt "{0}" has been updated.',
      'prompt.delete.confirm': 'Are you sure you want to delete this prompt?',
      'prompt.delete.success': 'Prompt "{0}" has been deleted.',
      
      // Templates
      'template.create.title': 'Create Template',
      'template.create.nameInput': 'Enter template name',
      'template.create.categorySelect': 'Select category',
      'template.create.newCategory': '+ Create new category',
      'template.create.newCategoryInput': 'Enter new category name',
      'template.create.success': 'Template "{0}" has been created.',
      'template.edit.title': 'Edit Template',
      'template.edit.success': 'Template "{0}" has been updated.',
      'template.delete.confirm': 'Are you sure you want to delete this template?',
      'template.delete.success': 'Template "{0}" has been deleted.',
      'template.variable.edit': 'Edit template variables',
      
      // Merged files
      'merge.queue.add': 'File added to merge queue',
      'merge.queue.remove': 'File removed from merge queue',
      'merge.queue.clear': 'Merge queue cleared',
      'merge.generate.title': 'Generate Merged File',
      'merge.generate.nameInput': 'Enter merged file name',
      'merge.generate.success': 'Merged file "{0}" has been generated.',
      'merge.category.select': 'Select category for file',
      
      // Errors
      'error.fileNotFound': 'File not found: {0}',
      'error.fileRead': 'Failed to read file: {0}',
      'error.fileWrite': 'Failed to write file: {0}',
      'error.promptSave': 'Failed to save prompt: {0}',
      'error.templateSave': 'Failed to save template: {0}',
      'error.mergeGenerate': 'Failed to generate merged file: {0}'
    };
    
    // Japanese messages
    const jaMessages: { [key: string]: string } = {
      // 共通
      'common.error': 'エラー',
      'common.info': '情報',
      'common.warning': '警告',
      'common.success': '成功',
      'common.cancel': 'キャンセル',
      'common.ok': 'OK',
      'common.save': '保存',
      'common.delete': '削除',
      'common.edit': '編集',
      'common.create': '作成',
      
      // プロンプト管理
      'prompt.create.title': '新規プロンプト作成',
      'prompt.create.nameInput': 'プロンプト名を入力してください',
      'prompt.create.categorySelect': 'カテゴリを選択してください',
      'prompt.create.newCategory': '+ 新しいカテゴリを作成',
      'prompt.create.newCategoryInput': '新しいカテゴリ名を入力してください',
      'prompt.create.success': 'プロンプト「{0}」を作成しました。',
      'prompt.edit.title': 'プロンプト編集',
      'prompt.edit.success': 'プロンプト「{0}」を更新しました。',
      'prompt.delete.confirm': 'このプロンプトを削除してもよろしいですか？',
      'prompt.delete.success': 'プロンプト「{0}」を削除しました。',
      
      // テンプレート
      'template.create.title': 'テンプレート作成',
      'template.create.nameInput': 'テンプレート名を入力してください',
      'template.create.categorySelect': 'カテゴリを選択してください',
      'template.create.newCategory': '+ 新しいカテゴリを作成',
      'template.create.newCategoryInput': '新しいカテゴリ名を入力してください',
      'template.create.success': 'テンプレート「{0}」を作成しました。',
      'template.edit.title': 'テンプレート編集',
      'template.edit.success': 'テンプレート「{0}」を更新しました。',
      'template.delete.confirm': 'このテンプレートを削除してもよろしいですか？',
      'template.delete.success': 'テンプレート「{0}」を削除しました。',
      'template.variable.edit': 'テンプレート変数を編集',
      
      // マージファイル
      'merge.queue.add': 'ファイルをマージキューに追加しました',
      'merge.queue.remove': 'ファイルをマージキューから削除しました',
      'merge.queue.clear': 'マージキューをクリアしました',
      'merge.generate.title': 'マージファイル生成',
      'merge.generate.nameInput': 'マージファイル名を入力してください',
      'merge.generate.success': 'マージファイル「{0}」を生成しました。',
      'merge.category.select': 'ファイルのカテゴリを選択してください',
      
      // エラー
      'error.fileNotFound': 'ファイルが見つかりません: {0}',
      'error.fileRead': 'ファイルの読み込みに失敗しました: {0}',
      'error.fileWrite': 'ファイルの書き込みに失敗しました: {0}',
      'error.promptSave': 'プロンプトの保存に失敗しました: {0}',
      'error.templateSave': 'テンプレートの保存に失敗しました: {0}',
      'error.mergeGenerate': 'マージファイルの生成に失敗しました: {0}'
    };
    
    // Set messages based on current locale
    if (this.locale.startsWith('ja')) {
      this.messages = { ...defaultMessages, ...jaMessages };
    } else {
      this.messages = defaultMessages;
    }
  }

  /**
   * Get message
   * @param key Message key
   * @param args Replacement arguments
   * @returns Translated message
   */
  public getMessage(key: string, ...args: any[]): string {
    let message = this.messages[key] || key;
    
    // Replace arguments if available
    if (args.length > 0) {
      args.forEach((arg, index) => {
        message = message.replace(`{${index}}`, arg.toString());
      });
    }
    
    return message;
  }

  /**
   * Get current locale
   * @returns Current locale
   */
  public getLocale(): string {
    return this.locale;
  }
}

/**
 * Helper function for translation
 * @param key Message key
 * @param args Replacement arguments
 * @returns Translated message
 */
export function t(key: string, ...args: any[]): string {
  return I18nManager.getInstance().getMessage(key, ...args);
}

/**
 * Show information message
 * @param key Message key
 * @param args Replacement arguments
 */
export function showInfo(key: string, ...args: any[]): Thenable<string | undefined> {
  return vscode.window.showInformationMessage(t(key, ...args));
}

/**
 * Show error message
 * @param key Message key
 * @param args Replacement arguments
 */
export function showError(key: string, ...args: any[]): Thenable<string | undefined> {
  return vscode.window.showErrorMessage(t(key, ...args));
}

/**
 * Show warning message
 * @param key Message key
 * @param args Replacement arguments
 */
export function showWarning(key: string, ...args: any[]): Thenable<string | undefined> {
  return vscode.window.showWarningMessage(t(key, ...args));
}

/**
 * Show confirmation message
 * @param key Message key
 * @param args Replacement arguments
 */
export async function showConfirmation(key: string, ...args: any[]): Promise<boolean> {
  const result = await vscode.window.showWarningMessage(
    t(key, ...args),
    { modal: true },
    t('common.ok'),
    t('common.cancel')
  );
  return result === t('common.ok');
} 