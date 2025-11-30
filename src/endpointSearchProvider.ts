import * as vscode from 'vscode';
import * as fuzzysort from 'fuzzysort';
import { SpringControllerParser, SpringEndpoint } from './springControllerParser';
import { EndpointCache } from './endpointCache';

interface EndpointQuickPickItem extends vscode.QuickPickItem {
    endpoint: SpringEndpoint;
}

export class EndpointSearchProvider {
    private parser: SpringControllerParser;
    private cache: EndpointCache;
    private endpoints: SpringEndpoint[] = [];

    constructor(parser: SpringControllerParser, cache: EndpointCache) {
        this.parser = parser;
        this.cache = cache;
    }

    async initializeCache(): Promise<void> {
        try {
            const cachedEndpoints = this.cache.getEndpoints();
            if (cachedEndpoints) {
                this.endpoints = cachedEndpoints;
                console.log(`Loaded ${this.endpoints.length} endpoints from cache`);
            } else {
                await this.refreshEndpoints();
            }
        } catch (error) {
            console.error('Error initializing cache:', error);
            await this.refreshEndpoints();
        }
    }

    async refreshEndpoints(): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Spring Endpoint Navigator",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Scanning for Spring controllers..." });

                this.endpoints = await this.parser.scanControllers();
                this.cache.setEndpoints(this.endpoints);

                progress.report({ increment: 100, message: `Found ${this.endpoints.length} endpoints` });

                setTimeout(() => {
                    progress.report({ increment: 100, message: "" });
                }, 2000);
            });
        } catch (error) {
            console.error('Error refreshing endpoints:', error);
            vscode.window.showErrorMessage('Failed to scan Spring controllers');
        }
    }

    async showEndpointSearch(): Promise<void> {
        if (this.endpoints.length === 0) {
            vscode.window.showInformationMessage('No Spring endpoints found. Scanning for controllers...');
            await this.refreshEndpoints();
        }

        if (this.endpoints.length === 0) {
            vscode.window.showWarningMessage('No Spring endpoints found in the workspace');
            return;
        }

        const quickPick = vscode.window.createQuickPick<EndpointQuickPickItem>();
        quickPick.placeholder = 'Enter URL to search (e.g., /api/users)';
        quickPick.matchOnDescription = true;
        quickPick.matchOnDetail = true;

        const allItems = this.createQuickPickItems(this.endpoints);
        quickPick.items = allItems;

        quickPick.onDidChangeValue(async (value: string) => {
            if (value.trim() === '') {
                quickPick.items = allItems;
                return;
            }

            const filteredItems = this.fuzzySearchEndpoints(value);
            quickPick.items = filteredItems;
        });

        quickPick.onDidAccept(async () => {
            const selectedItem = quickPick.selectedItems[0] as EndpointQuickPickItem;
            if (selectedItem) {
                await this.navigateToEndpoint(selectedItem.endpoint);
                quickPick.hide();
            }
        });

        quickPick.onDidHide(() => {
            quickPick.dispose();
        });

        quickPick.show();
    }

    private createQuickPickItems(endpoints: SpringEndpoint[]): EndpointQuickPickItem[] {
        return endpoints.map(endpoint => {
            let description = `${endpoint.controllerClass}.${endpoint.methodName}()`;

            // Add method comment if available
            if (endpoint.methodComment) {
                description += ` - ${endpoint.methodComment}`;
            }

            return {
                label: `${endpoint.method} ${endpoint.url}`,
                description: description,
                detail: `${endpoint.fileName}:${endpoint.lineNumber}`,
                endpoint: endpoint
            };
        });
    }

    private fuzzySearchEndpoints(searchText: string): EndpointQuickPickItem[] {
        const normalizedSearch = searchText.startsWith('/') ? searchText : '/' + searchText;

        // First try exact matches
        const exactMatches = this.endpoints.filter(endpoint =>
            endpoint.url.toLowerCase().includes(normalizedSearch.toLowerCase()) ||
            normalizedSearch.toLowerCase().includes(endpoint.url.toLowerCase())
        );

        if (exactMatches.length > 0) {
            return this.createQuickPickItems(exactMatches);
        }

        // Fallback to fuzzy search
        const fuzzyResults = fuzzysort.go(normalizedSearch, this.endpoints, {
            keys: ['url', 'methodName', 'controllerClass', 'methodComment'],
            threshold: 0.5,
            scoreFn: (result) => {
                let score = 0;
                if (result[0]) score += result[0].score * 3; // URL has highest weight
                if (result[1]) score += result[1].score * 1.5; // Method name
                if (result[2]) score += result[2].score * 0.8; // Class name
                if (result[3]) score += result[3].score * 1; // Method comment
                return score;
            }
        });

        return fuzzyResults.map(result => {
            let description = `${result.obj.controllerClass}.${result.obj.methodName}()`;

            // Add method comment if available
            if (result.obj.methodComment) {
                description += ` - ${result.obj.methodComment}`;
            }

            return {
                label: `${result.obj.method} ${result.obj.url}`,
                description: description,
                detail: `${result.obj.fileName}:${result.obj.lineNumber}`,
                endpoint: result.obj
            };
        });
    }

    private async navigateToEndpoint(endpoint: SpringEndpoint): Promise<void> {
        try {
            // Check if the file exists
            const document = await vscode.workspace.openTextDocument(endpoint.filePath);

            // Open the file
            const editor = await vscode.window.showTextDocument(document);

            // Navigate to the specific line
            const line = endpoint.lineNumber - 1; // Lines are 0-indexed in VS Code
            const position = new vscode.Position(line, 0);

            // Move cursor to the line
            editor.selection = new vscode.Selection(position, position);

            // Reveal the line in the editor
            editor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );

            // Show success message
            vscode.window.setStatusBarMessage(
                `Navigated to ${endpoint.method} ${endpoint.url} in ${endpoint.controllerClass}`,
                3000
            );

        } catch (error) {
            console.error('Error navigating to endpoint:', error);
            vscode.window.showErrorMessage(`Failed to navigate to ${endpoint.url}: ${error}`);
        }
    }

    getEndpointCount(): number {
        return this.endpoints.length;
    }
}