import * as fs from 'fs';

export function readFileSync(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
}

export function writeFileSync(filePath: string, data: string) {
    fs.writeFileSync(filePath, data);
}

export function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}
