import * as vscode from 'vscode';

export function generateMergedFile() {
    vscode.commands.executeCommand('extension.generateMergedFile');
}
