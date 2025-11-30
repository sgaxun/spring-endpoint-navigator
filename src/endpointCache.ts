import * as vscode from 'vscode';
import * as path from 'path';
import { SpringEndpoint } from './springControllerParser';

export interface CacheData {
    endpoints: SpringEndpoint[];
    lastScan: number;
    workspacePath: string;
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

        this.cacheData = {
            endpoints,
            lastScan: Date.now(),
            workspacePath
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