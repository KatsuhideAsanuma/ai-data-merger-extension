import * as vscode from 'vscode';

export function reexecuteMerge(historyItem: any) {
    vscode.commands.executeCommand('extension.reexecuteMerge', historyItem);
}
