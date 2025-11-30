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

    // Initial scan when extension is activated
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Spring Endpoint Navigator",
        cancellable: false
    }, async (progress) => {
        progress.report({ increment: 0, message: "Clearing old cache and rescanning..." });
        endpointCache.clearCache(); // Force clear cache
        await searchProvider.initializeCache();
        progress.report({ increment: 100, message: "Done!" });
    });
}

export function deactivate() {
    // Clean up resources
    if (endpointCache) {
        endpointCache.dispose();
    }
}