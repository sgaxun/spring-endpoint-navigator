import * as vscode from 'vscode';
import * as fuzzysort from 'fuzzysort';
import { SpringControllerParser, SpringEndpoint } from './springControllerParser';
import { EndpointCache } from './endpointCache';
import { FileIndex, FileIndexItem } from './fileIndex';
import { FileSearchProvider } from './fileSearchProvider';

interface CompositeQuickPickItem extends vscode.QuickPickItem {
    type: 'endpoint' | 'file';
    endpoint?: SpringEndpoint;
    file?: FileIndexItem;
}

type SearchMode = 'mixed' | 'file' | 'endpoint';

export class CompositeSearchProvider {
    private parser: SpringControllerParser;
    private endpointCache: EndpointCache;
    private fileIndex: FileIndex;
    private fileSearchProvider: FileSearchProvider;

    private endpoints: SpringEndpoint[] = [];
    private files: FileIndexItem[] = [];

    constructor(parser: SpringControllerParser, endpointCache: EndpointCache, fileIndex: FileIndex) {
        this.parser = parser;
        this.endpointCache = endpointCache;
        this.fileIndex = fileIndex;
        this.fileSearchProvider = new FileSearchProvider(fileIndex);
    }

    async initializeCaches(): Promise<void> {
        await Promise.all([
            this.initializeEndpointCache(),
            this.initializeFileCache()
        ]);
    }

    private async initializeEndpointCache(): Promise<void> {
        try {
            const cachedEndpoints = this.endpointCache.getEndpoints();
            if (cachedEndpoints) {
                this.endpoints = cachedEndpoints;
                console.log(`Loaded ${this.endpoints.length} endpoints from cache`);
            } else {
                await this.refreshEndpoints();
            }
        } catch (error) {
            console.error('Error initializing endpoint cache:', error);
            await this.refreshEndpoints();
        }
    }

    private async initializeFileCache(): Promise<void> {
        try {
            const cachedFiles = this.fileIndex.getFiles();
            if (cachedFiles) {
                this.files = cachedFiles;
                console.log(`Loaded ${this.files.length} files from cache`);
            } else {
                await this.refreshFiles();
            }
        } catch (error) {
            console.error('Error initializing file cache:', error);
            await this.refreshFiles();
        }
    }

    async refreshCaches(showProgress: boolean = true): Promise<void> {
        await Promise.all([
            this.refreshEndpoints(showProgress),
            this.refreshFiles(showProgress)
        ]);
    }

    private async refreshEndpoints(showProgress: boolean = true): Promise<void> {
        try {
            if (showProgress) {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Spring Endpoint Navigator",
                    cancellable: false
                }, async (progress) => {
                    progress.report({ increment: 0, message: "Scanning for Spring controllers..." });

                    this.endpoints = await this.parser.scanControllers();
                    this.endpointCache.setEndpoints(this.endpoints);

                    progress.report({ increment: 100, message: `Found ${this.endpoints.length} endpoints` });

                    setTimeout(() => {
                        progress.report({ increment: 100, message: "" });
                    }, 2000);
                });
            } else {
                this.endpoints = await this.parser.scanControllers();
                this.endpointCache.setEndpoints(this.endpoints);
                console.log(`Background endpoint scan completed: found ${this.endpoints.length} endpoints`);
            }
        } catch (error) {
            console.error('Error refreshing endpoints:', error);
        }
    }

    private async refreshFiles(showProgress: boolean = true): Promise<void> {
        try {
            if (showProgress) {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Spring Endpoint Navigator - File Indexing",
                    cancellable: false
                }, async (progress) => {
                    progress.report({ increment: 0, message: "Scanning workspace files..." });

                    this.files = await this.fileIndex.scanWorkspace();
                    this.fileIndex.setFiles(this.files);

                    progress.report({ increment: 100, message: `Indexed ${this.files.length} files` });

                    setTimeout(() => {
                        progress.report({ increment: 100, message: "" });
                    }, 2000);
                });
            } else {
                this.files = await this.fileIndex.scanWorkspace();
                this.fileIndex.setFiles(this.files);
                console.log(`Background file scan completed: indexed ${this.files.length} files`);
            }
        } catch (error) {
            console.error('Error refreshing files:', error);
        }
    }

    async showCompositeSearch(): Promise<void> {
        if (this.endpoints.length === 0 && this.files.length === 0) {
            vscode.window.showInformationMessage('No data indexed. Scanning workspace...');
            await this.refreshCaches();
        }

        if (this.endpoints.length === 0 && this.files.length === 0) {
            vscode.window.showWarningMessage('No files or endpoints found in the workspace');
            return;
        }

        await this.showTabbedSearch();
    }

    private async showTabbedSearch(): Promise<void> {
        const locale = vscode.env.language;
        const isZh = locale.startsWith('zh');

        // 创建 QuickPick 界面
        const quickPick = vscode.window.createQuickPick<CompositeQuickPickItem>();
        quickPick.matchOnDescription = true;
        quickPick.matchOnDetail = true;

        // 设置界面标题和描述
        quickPick.title = isZh ? 'Spring Endpoint Navigator - 综合搜索' : 'Spring Endpoint Navigator - Composite Search';

        // 创建标签页按钮
        const mixedButton = isZh ? '🔍 混合搜索' : '🔍 Mixed Search';
        const fileButton = isZh ? '📁 文件搜索' : '📁 File Search';
        const endpointButton = isZh ? '🌐 端点搜索' : '🌐 Endpoint Search';

        let currentMode: SearchMode = 'mixed';

        const updateSearchMode = (mode: SearchMode) => {
            currentMode = mode;

            // 更新标题
            let newTitle: string;
            switch (mode) {
                case 'mixed':
                    newTitle = isZh ? 'Spring Endpoint Navigator - 综合搜索' : 'Spring Endpoint Navigator - Composite Search';
                    quickPick.placeholder = isZh
                        ? '输入文件名、路径或端点URL进行搜索'
                        : 'Enter filename, path, or endpoint URL to search';
                    quickPick.items = createMixedItems();
                    break;
                case 'file':
                    newTitle = isZh ? 'Spring Endpoint Navigator - 文件搜索' : 'Spring Endpoint Navigator - File Search';
                    quickPick.placeholder = isZh
                        ? '输入文件名或路径进行搜索 (例如: exampleers, demo/Order)'
                        : 'Enter filename or path to search (e.g., exampleers, demo/Order)';
                    quickPick.items = createFileItems();
                    break;
                case 'endpoint':
                    newTitle = isZh ? 'Spring Endpoint Navigator - 端点搜索' : 'Spring Endpoint Navigator - Endpoint Search';
                    quickPick.placeholder = isZh
                        ? '输入URL进行搜索 (例如: /api/users, /example/*/list)'
                        : 'Enter URL to search (e.g., /api/users, /example/*/list)';
                    quickPick.items = createEndpointItems();
                    break;
            }

            // 更新QuickPick的标题
            quickPick.title = newTitle;
        };

        const createMixedItems = (): CompositeQuickPickItem[] => {
            const fileItems = this.files.slice(0, 50).map(file => ({
                label: `📄 ${file.name}`,
                description: this.getExtensionIcon(file.extension) + ' ' + this.formatFileSize(file.size),
                detail: file.relativePath,
                type: 'file' as const,
                file: file,
                alwaysShow: true
            }));

            const endpointItems = this.endpoints.slice(0, 50).map(endpoint => {
                let description = `${endpoint.controllerClass}.${endpoint.methodName}()`;
                if (endpoint.methodComment) {
                    description += ` - ${endpoint.methodComment}`;
                }
                return {
                    label: `🌐 ${endpoint.method} ${endpoint.url}`,
                    description: description,
                    detail: `${endpoint.fileName}:${endpoint.lineNumber}`,
                    type: 'endpoint' as const,
                    endpoint: endpoint,
                    alwaysShow: true
                };
            });

            return [...fileItems, ...endpointItems];
        };

        const createFileItems = (): CompositeQuickPickItem[] => {
            return this.files.map(file => ({
                label: file.name,
                description: this.getExtensionIcon(file.extension) + ' ' + this.formatFileSize(file.size),
                detail: file.relativePath,
                type: 'file' as const,
                file: file,
                alwaysShow: true
            }));
        };

        const createEndpointItems = (): CompositeQuickPickItem[] => {
            return this.endpoints.map(endpoint => {
                let description = `${endpoint.controllerClass}.${endpoint.methodName}()`;
                if (endpoint.methodComment) {
                    description += ` - ${endpoint.methodComment}`;
                }
                return {
                    label: `${endpoint.method} ${endpoint.url}`,
                    description: description,
                    detail: `${endpoint.fileName}:${endpoint.lineNumber}`,
                    type: 'endpoint' as const,
                    endpoint: endpoint,
                    alwaysShow: true
                };
            });
        };

        // 初始化界面
        updateSearchMode(currentMode);

        // 按钮点击处理
        quickPick.buttons = [
            {
                iconPath: new vscode.ThemeIcon('search'),
                tooltip: mixedButton
            },
            {
                iconPath: new vscode.ThemeIcon('file'),
                tooltip: fileButton
            },
            {
                iconPath: new vscode.ThemeIcon('radio-tower'),
                tooltip: endpointButton
            }
        ];

        // 按钮点击事件处理
        quickPick.onDidTriggerButton(async (button) => {
            if (button.tooltip === mixedButton) {
                updateSearchMode('mixed');
            } else if (button.tooltip === fileButton) {
                updateSearchMode('file');
            } else if (button.tooltip === endpointButton) {
                updateSearchMode('endpoint');
            }
        });

        // 搜索逻辑
        quickPick.onDidChangeValue((value: string) => {
            if (value.trim() === '') {
                updateSearchMode(currentMode);
                return;
            }

            console.log(`[CompositeSearchProvider] UI: Searching for "${value}" in mode: ${currentMode}`);

            // Use setTimeout to ensure UI update happens asynchronously
            setTimeout(() => {
                let results;
                switch (currentMode) {
                    case 'mixed':
                        results = this.mixedSearch(value);
                        console.log(`[CompositeSearchProvider] UI: Setting ${results.length} mixed results to QuickPick`);

                        // Debug: Check each result item
                        results.forEach((result, index) => {
                            console.log(`[CompositeSearchProvider] UI: Mixed Item ${index + 1}:`, {
                                label: result.label,
                                description: result.description,
                                detail: result.detail,
                                type: result.type,
                                hasFile: !!result.file,
                                hasEndpoint: !!result.endpoint
                            });
                        });

                        quickPick.items = results;
                        console.log(`[CompositeSearchProvider] UI: QuickPick now has ${quickPick.items.length} items`);
                        break;
                    case 'file':
                        results = this.fileSearch(value);
                        console.log(`[CompositeSearchProvider] UI: Setting ${results.length} file results to QuickPick`);
                        quickPick.items = results;
                        console.log(`[CompositeSearchProvider] UI: QuickPick now has ${quickPick.items.length} items`);
                        break;
                    case 'endpoint':
                        results = this.endpointSearch(value);
                        console.log(`[CompositeSearchProvider] UI: Setting ${results.length} endpoint results to QuickPick`);
                        quickPick.items = results;
                        console.log(`[CompositeSearchProvider] UI: QuickPick now has ${quickPick.items.length} items`);
                        break;
                }
            }, 0); // Execute in next tick
        });

        // 选择处理
        quickPick.onDidAccept(async () => {
            const selectedItem = quickPick.selectedItems[0] as CompositeQuickPickItem;
            if (selectedItem) {
                if (selectedItem.type === 'file' && selectedItem.file) {
                    await this.navigateToFile(selectedItem.file);
                } else if (selectedItem.type === 'endpoint' && selectedItem.endpoint) {
                    await this.navigateToEndpoint(selectedItem.endpoint);
                }
                quickPick.hide();
            }
        });

        quickPick.onDidHide(() => {
            quickPick.dispose();
        });

        quickPick.show();
    }

    private mixedSearch(searchText: string): CompositeQuickPickItem[] {
        console.log(`[CompositeSearchProvider] mixedSearch called with: "${searchText}"`);
        const fileResults = this.fileSearch(searchText);
        const endpointResults = this.endpointSearch(searchText);

        console.log(`[CompositeSearchProvider] mixedSearch - fileResults: ${fileResults.length}, endpointResults: ${endpointResults.length}`);

        // 限制结果数量，优先显示端点
        const results = [...endpointResults.slice(0, 20), ...fileResults.slice(0, 30)];
        console.log(`[CompositeSearchProvider] mixedSearch - returning ${results.length} total results`);
        return results;
    }

    private fileSearch(searchText: string): CompositeQuickPickItem[] {
        console.log(`[CompositeSearchProvider] fileSearch called with: "${searchText}"`);
        const normalizedSearch = searchText.toLowerCase().trim();

        // 首先尝试路径匹配（包含 / 的情况）
        if (normalizedSearch.includes('/')) {
            const searchPath = normalizedSearch;
            const searchParts = searchPath.split('/').filter((part: string) => part !== '');

            const pathMatches = this.files.filter(file => {
                const fullPath = file.relativePath.toLowerCase();
                const folderPath = file.folder.toLowerCase();
                const fileName = file.name.toLowerCase();

                // 多种路径匹配策略
                return (
                    // 完整路径包含搜索词
                    fullPath.includes(searchPath) ||
                    // 文件夹路径包含搜索词
                    folderPath.includes(searchPath) ||
                    // 文件名包含搜索词的最后一个部分
                    fileName.includes(searchPath.split('/').pop() || '') ||
                    // 路径组成部分匹配（支持任意顺序，所有部分都必须存在）
                    searchParts.every((part: string) => fullPath.includes(part)) ||
                    // 使用正则表达式进行灵活匹配
                    new RegExp(searchPath.replace(/\//g, '[\\/\\\\]'), 'i').test(fullPath) ||
                    // 支持路径片段的模糊匹配
                    searchParts.some((part: string) => fullPath.includes(part) && fileName.includes(part))
                );
            });

            // 按匹配度排序：完整路径匹配 > 文件夹路径匹配 > 文件名匹配
            pathMatches.sort((a, b) => {
                const aFullPath = a.relativePath.toLowerCase();
                const bFullPath = b.relativePath.toLowerCase();
                const aFolder = a.folder.toLowerCase();
                const bFolder = b.folder.toLowerCase();
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();

                // 完整路径匹配优先级最高
                const aExactMatch = aFullPath.includes(searchPath);
                const bExactMatch = bFullPath.includes(searchPath);
                if (aExactMatch && !bExactMatch) return -1;
                if (!aExactMatch && bExactMatch) return 1;

                // 文件夹路径匹配次之
                const aFolderMatch = aFolder.includes(searchPath);
                const bFolderMatch = bFolder.includes(searchPath);
                if (aFolderMatch && !bFolderMatch) return -1;
                if (!aFolderMatch && bFolderMatch) return 1;

                // 文件名匹配再次之
                const aNameMatch = searchParts.some((part: string) => aName.includes(part));
                const bNameMatch = searchParts.some((part: string) => bName.includes(part));
                if (aNameMatch && !bNameMatch) return -1;
                if (!aNameMatch && bNameMatch) return 1;

                return 0;
            });

            if (pathMatches.length > 0) {
                return pathMatches.map(file => ({
                    label: file.name,
                    description: this.getExtensionIcon(file.extension) + ' ' + this.formatFileSize(file.size),
                    detail: file.relativePath,
                    type: 'file' as const,
                    file: file
                }));
            }
        }

        // 文件名匹配
        const exactMatches = this.files.filter(file =>
            file.name.toLowerCase().includes(normalizedSearch)
        );

        if (exactMatches.length > 0 && exactMatches.length < 50) {
            return exactMatches.map(file => ({
                label: file.name,
                description: this.getExtensionIcon(file.extension) + ' ' + this.formatFileSize(file.size),
                detail: file.relativePath,
                type: 'file' as const,
                file: file
            }));
        }

        // 特殊处理：对于非常短的搜索词（1-2个字符），使用不同的策略
        if (normalizedSearch.length <= 2) {
            // 对于短搜索词，搜索文件名开头或扩展名匹配
            const shortMatches = this.files.filter(file =>
                file.name.toLowerCase().startsWith(normalizedSearch) ||
                file.extension.toLowerCase().includes(normalizedSearch)
            );

            if (shortMatches.length > 0) {
                return shortMatches.slice(0, 100).map(file => ({
                    label: file.name,
                    description: this.getExtensionIcon(file.extension) + ' ' + this.formatFileSize(file.size),
                    detail: file.relativePath,
                    type: 'file' as const,
                    file: file
                }));
            }
        }

        // 模糊搜索
        const fuzzyResults = fuzzysort.go(normalizedSearch, this.files, {
            keys: ['name', 'relativePath', 'folder'],
            threshold: 0.1, // 更低的阈值以获得更多结果
            scoreFn: (result) => {
                let score = 0;
                if (result[0]) score += result[0].score * 3; // 文件名权重最高
                if (result[1]) score += result[1].score * 1; // 相对路径
                if (result[2]) score += result[2].score * 0.5; // 文件夹
                return score;
            }
        });

        // 如果模糊搜索结果为空，返回所有文件的前50个（作为最后的备选）
        if (fuzzyResults.length === 0) {
            return this.files.slice(0, 50).map(file => ({
                label: file.name,
                description: this.getExtensionIcon(file.extension) + ' ' + this.formatFileSize(file.size),
                detail: file.relativePath,
                type: 'file' as const,
                file: file
            }));
        }

        return fuzzyResults.map(result => ({
            label: result.obj.name,
            description: this.getExtensionIcon(result.obj.extension) + ' ' + this.formatFileSize(result.obj.size),
            detail: result.obj.relativePath,
            type: 'file' as const,
            file: result.obj
        }));
    }

    private endpointSearch(searchText: string): CompositeQuickPickItem[] {
        const normalizedSearch = searchText.startsWith('/') ? searchText : '/' + searchText;

        // 通配符搜索
        if (normalizedSearch.includes('*')) {
            return this.wildcardSearchEndpoints(normalizedSearch);
        }

        // 精确匹配
        const exactMatches = this.endpoints.filter(endpoint =>
            endpoint.url.toLowerCase().includes(normalizedSearch.toLowerCase()) ||
            normalizedSearch.toLowerCase().includes(endpoint.url.toLowerCase())
        );

        if (exactMatches.length > 0) {
            return exactMatches.map(endpoint => {
                let description = `${endpoint.controllerClass}.${endpoint.methodName}()`;
                if (endpoint.methodComment) {
                    description += ` - ${endpoint.methodComment}`;
                }
                return {
                    label: `${endpoint.method} ${endpoint.url}`,
                    description: description,
                    detail: `${endpoint.fileName}:${endpoint.lineNumber}`,
                    type: 'endpoint' as const,
                    endpoint: endpoint
                };
            });
        }

        // 模糊搜索
        const fuzzyResults = fuzzysort.go(normalizedSearch, this.endpoints, {
            keys: ['url', 'methodName', 'controllerClass', 'methodComment'],
            threshold: 0.5,
            scoreFn: (result) => {
                let score = 0;
                if (result[0]) score += result[0].score * 3;
                if (result[1]) score += result[1].score * 1.5;
                if (result[2]) score += result[2].score * 0.8;
                if (result[3]) score += result[3].score * 1;
                return score;
            }
        });

        return fuzzyResults.map(result => {
            let description = `${result.obj.controllerClass}.${result.obj.methodName}()`;
            if (result.obj.methodComment) {
                description += ` - ${result.obj.methodComment}`;
            }
            return {
                label: `${result.obj.method} ${result.obj.url}`,
                description: description,
                detail: `${result.obj.fileName}:${result.obj.lineNumber}`,
                type: 'endpoint' as const,
                endpoint: result.obj
            };
        });
    }

    private wildcardSearchEndpoints(searchPattern: string): CompositeQuickPickItem[] {
        let regexPattern = searchPattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/^/, '^')
            .replace(/$/, '$');

        try {
            const regex = new RegExp(regexPattern, 'i');
            const matches = this.endpoints.filter(endpoint =>
                regex.test(endpoint.url)
            );

            return matches.map(endpoint => {
                let description = `${endpoint.controllerClass}.${endpoint.methodName}()`;
                if (endpoint.methodComment) {
                    description += ` - ${endpoint.methodComment}`;
                }
                return {
                    label: `${endpoint.method} ${endpoint.url}`,
                    description: description,
                    detail: `${endpoint.fileName}:${endpoint.lineNumber}`,
                    type: 'endpoint' as const,
                    endpoint: endpoint
                };
            });
        } catch (error) {
            console.error('Error in wildcard search:', error);
            const fallbackMatches = this.endpoints.filter(endpoint =>
                endpoint.url.toLowerCase().includes(searchPattern.toLowerCase().replace(/\*/g, ''))
            );
            return fallbackMatches.map(endpoint => {
                let description = `${endpoint.controllerClass}.${endpoint.methodName}()`;
                if (endpoint.methodComment) {
                    description += ` - ${endpoint.methodComment}`;
                }
                return {
                    label: `${endpoint.method} ${endpoint.url}`,
                    description: description,
                    detail: `${endpoint.fileName}:${endpoint.lineNumber}`,
                    type: 'endpoint' as const,
                    endpoint: endpoint
                };
            });
        }
    }

    private async navigateToFile(file: FileIndexItem): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(file.fullPath);
            await vscode.window.showTextDocument(document);
            vscode.window.setStatusBarMessage(`Opened ${file.name}`, 3000);
        } catch (error) {
            console.error('Error navigating to file:', error);
            vscode.window.showErrorMessage(`Failed to open ${file.name}: ${error}`);
        }
    }

    private async navigateToEndpoint(endpoint: SpringEndpoint): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(endpoint.filePath);
            const editor = await vscode.window.showTextDocument(document);
            const line = endpoint.lineNumber - 1;
            const position = new vscode.Position(line, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );
            vscode.window.setStatusBarMessage(
                `Navigated to ${endpoint.method} ${endpoint.url} in ${endpoint.controllerClass}`,
                3000
            );
        } catch (error) {
            console.error('Error navigating to endpoint:', error);
            vscode.window.showErrorMessage(`Failed to navigate to ${endpoint.url}: ${error}`);
        }
    }

    private getExtensionIcon(extension: string): string {
        const ext = extension.toLowerCase();
        const iconMap: { [key: string]: string } = {
            // Programming Languages
            '.java': '☕', '.js': '🟨', '.ts': '🔷', '.jsx': '⚛️', '.tsx': '⚛️',
            '.py': '🐍', '.go': '🐹', '.rs': '🦀', '.php': '🐘', '.rb': '💎',
            '.swift': '🍎', '.kt': '🎯', '.scala': '🔷', '.r': '📊', '.dart': '🎯',
            '.lua': '🌙', '.pl': '🐪', '.hs': '🎯', '.elm': '🎯', '.erl': '📱',
            '.ex': '🚀', '.exs': '🚀', '.cr': '💎', '.nim': '👑',

            // C/C++/C#
            '.c': '⚙️', '.cpp': '⚙️', '.cc': '⚙️', '.cxx': '⚙️', '.h': '⚙️',
            '.hpp': '⚙️', '.hxx': '⚙️', '.cs': '⚙️', '.vb': '⚙️', '.fs': '🔷',

            // Web Technologies
            '.html': '🌐', '.htm': '🌐', '.css': '🎨', '.scss': '🎨', '.sass': '🎨',
            '.less': '🎨', '.styl': '🎨', '.vue': '💚', '.svelte': '🧩',

            // Data Formats
            '.json': '📄', '.jsonc': '📄', '.xml': '📄', '.yaml': '📄', '.yml': '📄',
            '.toml': '📄', '.ini': '⚙️', '.cfg': '⚙️', '.conf': '⚙️',
            '.properties': '⚙️', '.env': '🔐', '.dotenv': '🔐',

            // Documents
            '.md': '📝', '.markdown': '📝', '.txt': '📄', '.rst': '📝',
            '.adoc': '📝', '.tex': '📜', '.pdf': '📕', '.doc': '📘',
            '.docx': '📘', '.xls': '📗', '.xlsx': '📗', '.ppt': '📙',

            // Configuration and Build
            '.gradle': '🐘', '.pom': '📦', '.build.gradle': '🐘',
            '.maven': '📦', '.ant': '🐜', '.makefile': '🔧', '.cmake': '🔧',
            'dockerfile': '🐳', '.dockerignore': '🐳', 'compose.yml': '🐳',
            'compose.yaml': '🐳', 'docker-compose.yml': '🐳',

            // Scripts
            '.sh': '💻', '.bash': '💻', '.zsh': '💻', '.fish': '🐟',
            '.bat': '💻', '.cmd': '💻', '.ps1': '💻', '.psm1': '💻',
            '.psd1': '💻', '.ps1xml': '💻',

            // Database
            '.sql': '🗃️', '.ddl': '🗃️', '.dml': '🗃️', '.db': '🗃️',
            '.sqlite': '🗃️', '.sqlite3': '🗃️', '.db3': '🗃️',

            // Images and Media
            '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️', '.gif': '🖼️',
            '.svg': '🎨', '.ico': '🖼️', '.bmp': '🖼️', '.tiff': '🖼️',
            '.webp': '🖼️', '.mp3': '🎵', '.mp4': '🎬', '.avi': '🎬',
            '.mov': '🎬', '.wav': '🎵', '.flac': '🎵',

            // Archives
            '.zip': '📦', '.rar': '📦', '.tar': '📦', '.gz': '📦',
            '.7z': '📦', '.bz2': '📦', '.xz': '📦',

            // Fonts
            '.ttf': '🔤', '.otf': '🔤', '.woff': '🔤', '.woff2': '🔤',
            '.eot': '🔤',

            // Other
            '.lock': '🔒', '.log': '📋', '.tmp': '📄', '.bak': '💾',
            '.old': '💾', '.orig': '💾', '.swp': '💾', '.swo': '💾',

            // No extension (common files)
            'license': '📄', 'readme': '📝', 'changelog': '📝',
            'contributing': '📝', 'authors': '👥', 'makefile': '🔧',
            'rakefile': '🔧', 'gemfile': '💎', 'procfile': '🚀'
        };

        // Special handling for files without extensions or common file names
        if (!ext || ext === '') {
            const name = extension.toLowerCase();
            if (iconMap[name as keyof typeof iconMap]) {
                return iconMap[name as keyof typeof iconMap];
            }
        }

        return iconMap[ext] || '📄';
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    getEndpointCount(): number {
        return this.endpoints.length;
    }

    getFileCount(): number {
        return this.files.length;
    }
}
