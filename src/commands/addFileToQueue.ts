import * as vscode from 'vscode';

export function addFileToQueue(uri: vscode.Uri) {
    vscode.commands.executeCommand('extension.addFileToQueue', uri);
}
