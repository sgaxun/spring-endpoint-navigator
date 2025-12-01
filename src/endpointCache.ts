import * as vscode from 'vscode';
import * as path from 'path';
import { SpringEndpoint } from './springControllerParser';

export interface CacheData {
    endpoints: SpringEndpoint[];
    lastScan: number;
    workspacePath: string;
    fileModificationTimes: Record<string, number>;
}

export class EndpointCache {
    private cacheKey = 'spring-endpoints-cache';
    private cacheData: CacheData | null = null;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadCache();
    }

    private loadCache(): void {
        const cachedData = this.context.globalState.get<CacheData>(this.cacheKey);
        if (cachedData) {
            this.cacheData = cachedData;
        }
    }

    private saveCache(): void {
        if (this.cacheData) {
            this.context.globalState.update(this.cacheKey, this.cacheData);
        }
    }

    getEndpoints(): SpringEndpoint[] | null {
        if (this.isCacheValid()) {
            return this.cacheData!.endpoints;
        }
        return null;
    }

    setEndpoints(endpoints: SpringEndpoint[]): void {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const workspacePath = workspaceFolders ? workspaceFolders[0].uri.fsPath : '';

        const fileModificationTimes: Record<string, number> = {};
        for (const endpoint of endpoints) {
            fileModificationTimes[endpoint.filePath] = Date.now();
        }

        this.cacheData = {
            endpoints,
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

        // Check if workspace has changed
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders[0].uri.fsPath !== this.cacheData.workspacePath) {
            return false;
        }

        // Check cache timeout
        const config = vscode.workspace.getConfiguration('springEndpointNavigator');
        const cacheTimeout = config.get<number>('cacheTimeout', 300000); // 5 minutes default

        return (Date.now() - this.cacheData.lastScan) < cacheTimeout;
    }

    clearCache(): void {
        this.cacheData = null;
        this.context.globalState.update(this.cacheKey, null);
    }

    /**
     * 检查指定文件的端点是否需要更新
     */
    needsUpdate(filePath: string): boolean {
        if (!this.cacheData) {
            return true;
        }

        const cachedTime = this.cacheData.fileModificationTimes[filePath];
        return !cachedTime;
    }

    /**
     * 删除指定文件下的端点
     */
    removeEndpointsFromFile(filePath: string): void {
        if (!this.cacheData) {
            return;
        }

        this.cacheData.endpoints = this.cacheData.endpoints.filter(endpoint => endpoint.filePath !== filePath);
        delete this.cacheData.fileModificationTimes[filePath];
        this.saveCache();
    }

    /**
     * 更新指定文件下的端点
     */
    updateEndpointsFromFile(filePath: string, newEndpoints: SpringEndpoint[]): void {
        if (!this.cacheData) {
            return;
        }

        this.cacheData.endpoints = this.cacheData.endpoints.filter(endpoint => endpoint.filePath !== filePath);
        this.cacheData.endpoints.push(...newEndpoints);
        this.cacheData.fileModificationTimes[filePath] = Date.now();
        this.cacheData.lastScan = Date.now();
        this.saveCache();
    }

    getFileModificationTimes(): Record<string, number> {
        return this.cacheData?.fileModificationTimes || {};
    }

    getLastScanTime(): number {
        return this.cacheData?.lastScan || 0;
    }

    getEndpointCount(): number {
        return this.cacheData?.endpoints.length || 0;
    }

    dispose(): void {
        this.saveCache();
    }
}
