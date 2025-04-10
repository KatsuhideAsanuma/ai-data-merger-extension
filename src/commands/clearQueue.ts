import * as vscode from 'vscode';

export function clearQueue() {
    vscode.commands.executeCommand('extension.clearQueue');
}
