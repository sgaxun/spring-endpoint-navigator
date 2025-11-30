import * as vscode from 'vscode';
import { EndpointCache } from './endpointCache';
import { SpringControllerParser } from './springControllerParser';
import { EndpointSearchProvider } from './endpointSearchProvider';

let endpointCache: EndpointCache;
let controllerParser: SpringControllerParser;
let searchProvider: EndpointSearchProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('Spring Endpoint Navigator is now active!');

    // Initialize components
    endpointCache = new EndpointCache(context);
    controllerParser = new SpringControllerParser();
    searchProvider = new EndpointSearchProvider(controllerParser, endpointCache);

    // Register command
    let disposable = vscode.commands.registerCommand('spring-endpoint-navigator.searchEndpoint', async () => {
        await searchProvider.showEndpointSearch();
    });

    // Register command to clear cache for testing
    let clearCacheCommand = vscode.commands.registerCommand('spring-endpoint-navigator.clearCache', async () => {
        endpointCache.clearCache();
        await searchProvider.refreshEndpoints();
        vscode.window.showInformationMessage('Cache cleared and endpoints rescanned');
    });

    context.subscriptions.push(disposable);
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
            // Try to initialize cache first
            progress.report({ increment: 0, message: "Initializing..." });
            await searchProvider.initializeCache();

            // Check what we have after cache initialization
            const endpointCount = searchProvider.getEndpointCount();

            if (endpointCount > 0) {
                // Cache is valid, show brief success message
                progress.report({ increment: 50, message: `Loaded ${endpointCount} endpoints from cache` });

                // Start background refresh to ensure data is fresh
                progress.report({ increment: 25, message: "Checking for updates..." });
                await searchProvider.refreshEndpoints(false); // Background scan without progress

                const finalCount = searchProvider.getEndpointCount();
                if (finalCount !== endpointCount) {
                    progress.report({ increment: 25, message: `Updated to ${finalCount} endpoints` });
                } else {
                    progress.report({ increment: 25, message: "Cache is up to date" });
                }
            } else {
                // No cache available, start full scan
                progress.report({ increment: 25, message: "No cache found, scanning workspace..." });
                await searchProvider.refreshEndpoints(false); // Background scan

                const finalCount = searchProvider.getEndpointCount();
                progress.report({ increment: 75, message: `Found ${finalCount} endpoints` });
            }

            // Complete the progress
            progress.report({ increment: 100, message: `Ready! (${searchProvider.getEndpointCount()} endpoints)` });

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
}