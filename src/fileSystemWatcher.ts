import * as vscode from 'vscode';
import * as path from 'path';
import { CompositeSearchProvider } from './compositeSearchProvider';

export enum FileChangeType {
    Created = 'created',
    Modified = 'modified',
    Deleted = 'deleted'
}

/**
 * 监听工作区文件变更并触发增量更新。
 * 只在批处理时输出摘要日志，避免大量无意义的控制台刷屏。
 */
export class FileSystemWatcher {
    private watchers: vscode.FileSystemWatcher[] = [];
    private updateQueue: Map<string, Set<FileChangeType>> = new Map();
    private debounceTimer: NodeJS.Timeout | null = null;
    private readonly debounceDelay = 1200;
    private isEnabled = true;

    constructor(private readonly compositeSearchProvider: CompositeSearchProvider) {
        this.initializeWatchers();
        this.setupConfigurationListener();
    }

    /**
     * 初始化文件监听器
     */
    private initializeWatchers(): void {
        this.disposeWatchers();

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        try {
            const watcher = vscode.workspace.createFileSystemWatcher('**/*');
            watcher.onDidCreate(uri => this.handleFileChange(uri, FileChangeType.Created));
            watcher.onDidChange(uri => this.handleFileChange(uri, FileChangeType.Modified));
            watcher.onDidDelete(uri => this.handleFileChange(uri, FileChangeType.Deleted));
            this.watchers.push(watcher);
            console.log('[FileSystemWatcher] Watcher initialized');
        } catch (error) {
            console.error('[FileSystemWatcher] Failed to initialize watchers:', error);
        }
    }

    /**
     * 配置更新时重新初始化
     */
    private setupConfigurationListener(): void {
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('springEndpointNavigator')) {
                this.initializeWatchers();
            }
        });
    }

    private handleFileChange(uri: vscode.Uri, type: FileChangeType): void {
        if (!this.isEnabled) {
            return;
        }

        const filePath = uri.fsPath;
        if (this.shouldIgnore(filePath)) {
            return;
        }

        const existing = this.updateQueue.get(filePath) ?? new Set<FileChangeType>();
        existing.add(type);
        this.updateQueue.set(filePath, existing);
        this.scheduleUpdate();
    }

    private shouldIgnore(filePath: string): boolean {
        const normalized = this.normalizePath(filePath).toLowerCase();
        const quickExclude = [
            '/node_modules/',
            '/.git/',
            '/target/',
            '/build/',
            '/dist/',
            '/out/',
            '/.idea/',
            '/.vscode/'
        ];

        if (quickExclude.some(pattern => normalized.includes(pattern))) {
            return true;
        }

        const ignoredExtensions = ['.class', '.jar', '.war', '.log', '.tmp', '.bak'];
        if (ignoredExtensions.some(ext => normalized.endsWith(ext))) {
            return true;
        }

        return this.compositeSearchProvider.isFileIgnored(filePath);
    }

    private normalizePath(filePath: string): string {
        return filePath.split(path.sep).join('/');
    }

    private scheduleUpdate(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => this.processUpdateQueue(), this.debounceDelay);
    }

    private async processUpdateQueue(): Promise<void> {
        if (this.updateQueue.size === 0) {
            return;
        }

        const changes = Array.from(this.updateQueue.entries());
        this.updateQueue.clear();
        console.log(`[FileSystemWatcher] Processing ${changes.length} file(s)`);

        for (const [filePath, types] of changes) {
            const orderedTypes = Array.from(types).sort((a, b) => {
                const order: Record<FileChangeType, number> = {
                    [FileChangeType.Deleted]: 0,
                    [FileChangeType.Created]: 1,
                    [FileChangeType.Modified]: 2
                };
                return order[a] - order[b];
            });

            for (const type of orderedTypes) {
                try {
                    await this.compositeSearchProvider.handleFileChange(filePath, type);
                } catch (error) {
                    console.error(`[FileSystemWatcher] Failed to apply ${type} for ${filePath}:`, error);
                }
            }
        }
    }

    enable(): void {
        this.isEnabled = true;
    }

    disable(): void {
        this.isEnabled = false;
    }

    async forceFullRefresh(): Promise<void> {
        await this.compositeSearchProvider.refreshCaches(false);
    }

    private disposeWatchers(): void {
        this.watchers.forEach(watcher => watcher.dispose());
        this.watchers = [];
    }

    dispose(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        this.disposeWatchers();
        this.updateQueue.clear();
    }
}
