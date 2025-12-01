import * as vscode from 'vscode';
import * as path from 'path';

export interface FileIndexItem {
    name: string;              // 文件名，如 "ExampleController.java"
    fullPath: string;          // 完整路径
    relativePath: string;      // 相对于工作区的路径
    extension: string;         // 文件扩展名
    folder: string;            // 所属文件夹
    size: number;              // 文件大小
    lastModified: number;      // 最后修改时间
}

export interface FileIndexCacheData {
    files: FileIndexItem[];
    lastScan: number;
    workspacePath: string;
    fileModificationTimes: Record<string, number>;
}

export class FileIndex {
    private cacheKey = 'file-index-cache';
    private cacheData: FileIndexCacheData | null = null;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadCache();
    }

    private loadCache(): void {
        const cachedData = this.context.globalState.get<FileIndexCacheData>(this.cacheKey);
        if (cachedData) {
            this.cacheData = cachedData;
        }
    }

    private saveCache(): void {
        if (this.cacheData) {
            this.context.globalState.update(this.cacheKey, this.cacheData);
        }
    }

    getFiles(): FileIndexItem[] | null {
        if (this.isCacheValid()) {
            return this.cacheData!.files;
        }
        return null;
    }

    setFiles(files: FileIndexItem[]): void {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const workspacePath = workspaceFolders ? workspaceFolders[0].uri.fsPath : '';

        const fileModificationTimes: Record<string, number> = {};
        for (const file of files) {
            fileModificationTimes[file.fullPath] = file.lastModified;
        }

        this.cacheData = {
            files,
            lastScan: Date.now(),
            workspacePath,
            fileModificationTimes
        };
        this.saveCache();
    }

    isCacheValid(): boolean {
        if (!this.cacheData) {
            return false;
        }

        // 检查工作区是否改变
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders[0].uri.fsPath !== this.cacheData.workspacePath) {
            return false;
        }

        // 检查缓存超时
        const config = vscode.workspace.getConfiguration('springEndpointNavigator');
        const cacheTimeout = config.get<number>('cacheTimeout', 300000); // 默认5分钟

        return (Date.now() - this.cacheData.lastScan) < cacheTimeout;
    }

    clearCache(): void {
        this.cacheData = null;
        this.context.globalState.update(this.cacheKey, null);
    }

    /**
     * 检查文件是否需要更新（基于修改时间）
     */
    async needsUpdate(filePath: string): Promise<boolean> {
        if (!this.cacheData) {
            return true;
        }

        try {
            const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
            const cachedTime = this.cacheData.fileModificationTimes[filePath];
            return !cachedTime || stat.mtime > cachedTime;
        } catch {
            return true;
        }
    }

    /**
     * 添加或更新单个文件
     */
    async updateFile(filePath: string): Promise<void> {
        if (!this.cacheData) {
            return;
        }

        try {
            const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return;
            }

            const workspacePath = workspaceFolders[0].uri.fsPath;
            const relativePath = path.relative(workspacePath, filePath);
            const folder = path.dirname(relativePath);
            const name = path.basename(filePath);
            const extension = path.extname(filePath);

            const fileItem: FileIndexItem = {
                name,
                fullPath: filePath,
                relativePath,
                extension,
                folder: folder === '.' ? '' : folder,
                size: stat.size,
                lastModified: stat.mtime
            };

            this.cacheData.files = this.cacheData.files.filter(file => file.fullPath !== filePath);
            this.cacheData.files.push(fileItem);
            this.cacheData.fileModificationTimes[filePath] = stat.mtime;
            this.cacheData.lastScan = Date.now();
            this.saveCache();
        } catch (error) {
            console.warn(`[FileIndex] Failed to update file ${filePath}:`, error);
            this.removeFile(filePath);
        }
    }

    /**
     * 从索引中移除文件
     */
    removeFile(filePath: string): void {
        if (!this.cacheData) {
            return;
        }

        this.cacheData.files = this.cacheData.files.filter(file => file.fullPath !== filePath);
        delete this.cacheData.fileModificationTimes[filePath];
        this.cacheData.lastScan = Date.now();
        this.saveCache();
    }

    getFileModificationTimes(): Record<string, number> {
        return this.cacheData?.fileModificationTimes || {};
    }

    getLastScanTime(): number {
        return this.cacheData?.lastScan || 0;
    }

    getFileCount(): number {
        return this.cacheData?.files.length || 0;
    }

    dispose(): void {
        this.saveCache();
    }

    /**
     * 扫描工作区中的所有文件
     */
    async scanWorkspace(): Promise<FileIndexItem[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }

        const workspacePath = workspaceFolders[0].uri.fsPath;
        const files: FileIndexItem[] = [];

        // 获取文件搜索的排除模式配置
        const config = vscode.workspace.getConfiguration('springEndpointNavigator');
        const fileExcludePatterns = config.get<string[]>('fileSearch.excludePatterns', [
            '**/node_modules/**',
            '**/target/**',
            '**/build/**',
            '**/.git/**',
            '**/dist/**',
            '**/.vscode/**',
            '**/.idea/**'
        ]);

        try {
            // 搜索所有文件（不限制文件类型）
            const uris = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspacePath, '**/*'),
                '{' + fileExcludePatterns.join(',') + '}'
            );

            for (const uri of uris) {
                try {
                    const stat = await vscode.workspace.fs.stat(uri);
                    const fullPath = uri.fsPath;
                    const relativePath = path.relative(workspacePath, fullPath);
                    const folder = path.dirname(relativePath);
                    const name = path.basename(fullPath);
                    const extension = path.extname(fullPath);

                    files.push({
                        name,
                        fullPath,
                        relativePath,
                        extension,
                        folder: folder === '.' ? '' : folder,
                        size: stat.size,
                        lastModified: stat.mtime
                    });
                } catch (error) {
                    console.warn(`Failed to index file ${uri.fsPath}:`, error);
                }
            }

            console.log(`File indexing completed: ${files.length} files indexed`);
            return files;
        } catch (error) {
            console.error('Error scanning workspace for files:', error);
            return [];
        }
    }
}
