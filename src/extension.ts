import * as vscode from 'vscode';
import { EndpointCache } from './endpointCache';
import { SpringControllerParser } from './springControllerParser';
import { EndpointSearchProvider } from './endpointSearchProvider';
import { FileIndex } from './fileIndex';
import { FileSearchProvider } from './fileSearchProvider';
import { CompositeSearchProvider } from './compositeSearchProvider';

let endpointCache: EndpointCache;
let fileIndex: FileIndex;
let controllerParser: SpringControllerParser;
let searchProvider: EndpointSearchProvider;
let fileSearchProvider: FileSearchProvider;
let compositeSearchProvider: CompositeSearchProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('Spring Endpoint Navigator is now active!');

    // Initialize components
    endpointCache = new EndpointCache(context);
    fileIndex = new FileIndex(context);
    controllerParser = new SpringControllerParser();
    searchProvider = new EndpointSearchProvider(controllerParser, endpointCache);
    fileSearchProvider = new FileSearchProvider(fileIndex);
    compositeSearchProvider = new CompositeSearchProvider(controllerParser, endpointCache, fileIndex);

    // Register composite search command (main command)
    let compositeSearchCommand = vscode.commands.registerCommand('spring-endpoint-navigator.search', async () => {
        // 获取当前选中的文本
        const editor = vscode.window.activeTextEditor;
        let selectedText = '';

        if (editor) {
            const selection = editor.selection;
            if (!selection.isEmpty) {
                selectedText = editor.document.getText(selection);
            }
        }

        await compositeSearchProvider.showCompositeSearch(selectedText);
    });

    // Register legacy endpoint search command
    let endpointSearchCommand = vscode.commands.registerCommand('spring-endpoint-navigator.searchEndpoint', async () => {
        await searchProvider.showEndpointSearch();
    });

    // Register file search command
    let fileSearchCommand = vscode.commands.registerCommand('spring-endpoint-navigator.searchFile', async () => {
        await fileSearchProvider.showFileSearch();
    });

    // Register command to clear cache for testing
    let clearCacheCommand = vscode.commands.registerCommand('spring-endpoint-navigator.clearCache', async () => {
        endpointCache.clearCache();
        fileIndex.clearCache();
        await compositeSearchProvider.refreshCaches();
        vscode.window.showInformationMessage('Cache cleared and workspace rescanned');
    });

    context.subscriptions.push(compositeSearchCommand);
    context.subscriptions.push(endpointSearchCommand);
    context.subscriptions.push(fileSearchCommand);
    context.subscriptions.push(clearCacheCommand);

    // Start background initialization without blocking the UI
    startBackgroundScan();
}

async function startBackgroundScan(): Promise<void> {
    // Always show initial progress to let user know the extension is working
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Spring Endpoint Navigator",
        cancellable: false
    }, async (progress) => {
        try {
            // Initialize both caches
            progress.report({ increment: 0, message: "Initializing caches..." });
            await compositeSearchProvider.initializeCaches();

            // Check what we have after cache initialization
            const endpointCount = compositeSearchProvider.getEndpointCount();
            const fileCount = compositeSearchProvider.getFileCount();

            if (endpointCount > 0 || fileCount > 0) {
                // Cache is valid, show brief success message
                progress.report({ increment: 40, message: `Loaded ${endpointCount} endpoints and ${fileCount} files from cache` });

                // Start background refresh to ensure data is fresh
                progress.report({ increment: 30, message: "Checking for updates..." });
                await compositeSearchProvider.refreshCaches(false); // Background scan without progress

                const finalEndpointCount = compositeSearchProvider.getEndpointCount();
                const finalFileCount = compositeSearchProvider.getFileCount();

                if (finalEndpointCount !== endpointCount || finalFileCount !== fileCount) {
                    progress.report({ increment: 30, message: `Updated to ${finalEndpointCount} endpoints and ${finalFileCount} files` });
                } else {
                    progress.report({ increment: 30, message: "Caches are up to date" });
                }
            } else {
                // No cache available, start full scan
                progress.report({ increment: 25, message: "No cache found, scanning workspace..." });
                await compositeSearchProvider.refreshCaches(false); // Background scan

                const finalEndpointCount = compositeSearchProvider.getEndpointCount();
                const finalFileCount = compositeSearchProvider.getFileCount();
                progress.report({ increment: 75, message: `Found ${finalEndpointCount} endpoints and ${finalFileCount} files` });
            }

            // Complete the progress
            progress.report({ increment: 100, message: `Ready! (${compositeSearchProvider.getEndpointCount()} endpoints, ${compositeSearchProvider.getFileCount()} files)` });

            // Auto-hide after 3 seconds to not clutter the UI
            setTimeout(() => {
                progress.report({ increment: 100, message: "" });
            }, 3000);

        } catch (error) {
            console.error('Error in background scan:', error);
            progress.report({ increment: 100, message: "Ready (with limited functionality)" });

            // Auto-hide after 2 seconds on error
            setTimeout(() => {
                progress.report({ increment: 100, message: "" });
            }, 2000);
        }
    });
}

export function deactivate() {
    // Clean up resources
    if (endpointCache) {
        endpointCache.dispose();
    }
    if (fileIndex) {
        fileIndex.dispose();
    }
}