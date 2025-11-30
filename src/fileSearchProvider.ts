import * as vscode from 'vscode';
import * as fuzzysort from 'fuzzysort';
import { FileIndex, FileIndexItem } from './fileIndex';

interface FileQuickPickItem extends vscode.QuickPickItem {
    file: FileIndexItem;
}

export class FileSearchProvider {
    private fileIndex: FileIndex;
    private files: FileIndexItem[] = [];

    constructor(fileIndex: FileIndex) {
        this.fileIndex = fileIndex;
    }

    async initializeCache(): Promise<void> {
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

    async refreshFiles(showProgress: boolean = true): Promise<void> {
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
                // 后台扫描，不显示进度通知
                this.files = await this.fileIndex.scanWorkspace();
                this.fileIndex.setFiles(this.files);
                console.log(`Background file scan completed: indexed ${this.files.length} files`);
            }
        } catch (error) {
            console.error('Error refreshing files:', error);
            if (showProgress) {
                vscode.window.showErrorMessage('Failed to scan workspace files');
            }
        }
    }

    async showFileSearch(): Promise<void> {
        console.log(`[FileSearchProvider] showFileSearch called, files count: ${this.files.length}`);

        if (this.files.length === 0) {
            vscode.window.showInformationMessage('No files indexed. Scanning workspace...');
            await this.refreshFiles();
        }

        if (this.files.length === 0) {
            vscode.window.showWarningMessage('No files found in the workspace');
            return;
        }

        const quickPick = vscode.window.createQuickPick<FileQuickPickItem>();
        const locale = vscode.env.language;

        // 根据用户语言设置标题
        if (locale.startsWith('zh')) {
            quickPick.title = '文件搜索';
        } else {
            quickPick.title = 'File Search';
        }

        // 根据用户语言设置占位符
        if (locale.startsWith('zh')) {
            quickPick.placeholder = '输入文件名或路径进行搜索 (例如: exampleers, demo/Order)';
        } else {
            quickPick.placeholder = 'Enter filename or path to search (e.g., exampleers, demo/Order)';
        }
        quickPick.matchOnDescription = true;
        quickPick.matchOnDetail = true;

        const allItems = this.createQuickPickItems(this.files);
        quickPick.items = allItems;

        quickPick.onDidChangeValue(async (value: string) => {
            console.log(`[FileSearchProvider] Search input changed: "${value}"`);

            if (value.trim() === '') {
                console.log(`[FileSearchProvider] Empty search, showing all ${allItems.length} items`);
                quickPick.items = allItems;
                return;
            }

            console.log(`[FileSearchProvider] Calling fuzzySearchFiles with: "${value}"`);
            const filteredItems = this.fuzzySearchFiles(value);
            console.log(`[FileSearchProvider] fuzzySearchFiles returned ${filteredItems.length} items`);
            quickPick.items = filteredItems;
        });

        quickPick.onDidAccept(async () => {
            const selectedItem = quickPick.selectedItems[0] as FileQuickPickItem;
            if (selectedItem) {
                await this.navigateToFile(selectedItem.file);
                quickPick.hide();
            }
        });

        quickPick.onDidHide(() => {
            quickPick.dispose();
        });

        quickPick.show();
    }

    private createQuickPickItems(files: FileIndexItem[]): FileQuickPickItem[] {
        return files.map(file => ({
            label: file.name,
            description: this.getExtensionIcon(file.extension) + ' ' + this.formatFileSize(file.size),
            detail: file.relativePath,
            file: file
        }));
    }

    private fuzzySearchFiles(searchText: string): FileQuickPickItem[] {
        const normalizedSearch = searchText.toLowerCase().trim();

        console.log(`[FileSearchProvider] Search for "${searchText}", total files: ${this.files.length}`);

        // 首先尝试路径匹配（包含 / 的情况）
        if (normalizedSearch.includes('/')) {
            const searchPath = normalizedSearch;
            const searchParts = searchPath.split('/').filter((part: string) => part !== '');

            console.log(`[FileSearchProvider] Path search: "${searchPath}", parts: [${searchParts.join(', ')}]`);

            const pathMatches = this.files.filter(file => {
                const fullPath = file.relativePath.toLowerCase();
                const folderPath = file.folder.toLowerCase();
                const fileName = file.name.toLowerCase();

                // Debug for target file
                if (file.relativePath.includes('fileIndex.ts')) {
                    console.log(`[FileSearchProvider] Checking: ${file.relativePath}`);

                    const fullPathMatch = fullPath.includes(searchPath);
                    const folderPathMatch = folderPath.includes(searchPath);
                    const fileNameMatch = fileName.includes(searchPath.split('/').pop() || '');
                    const partsMatch = searchParts.every((part: string) => fullPath.includes(part));
                    const regexMatch = new RegExp(searchPath.replace(/\//g, '[\\/\\\\]'), 'i').test(fullPath);
                    const fuzzyMatch = searchParts.some((part: string) => fullPath.includes(part) && fileName.includes(part));

                    console.log(`[FileSearchProvider] - matches: full=${fullPathMatch}, folder=${folderPathMatch}, name=${fileNameMatch}, parts=${partsMatch}, regex=${regexMatch}, fuzzy=${fuzzyMatch}`);
                }

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

            console.log(`[FileSearchProvider] Path matches found: ${pathMatches.length}`);

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
                console.log(`[FileSearchProvider] Returning ${pathMatches.length} path matches`);
                return this.createQuickPickItems(pathMatches);
            }
        }

        // 尝试文件名精确匹配
        const exactMatches = this.files.filter(file =>
            file.name.toLowerCase().includes(normalizedSearch)
        );

        console.log(`[FileSearchProvider] Exact matches: ${exactMatches.length}`);

        if (exactMatches.length > 0 && exactMatches.length < 50) {
            console.log(`[FileSearchProvider] Returning ${exactMatches.length} exact matches`);
            return this.createQuickPickItems(exactMatches);
        }

        // 特殊处理：对于非常短的搜索词（1-2个字符），使用不同的策略
        if (normalizedSearch.length <= 2) {
            // 对于短搜索词，搜索文件名开头或扩展名匹配
            const shortMatches = this.files.filter(file =>
                file.name.toLowerCase().startsWith(normalizedSearch) ||
                file.extension.toLowerCase().includes(normalizedSearch)
            );

            if (shortMatches.length > 0) {
                console.log(`[FileSearchProvider] Returning ${shortMatches.length} short matches`);
                return this.createQuickPickItems(shortMatches.slice(0, 100)); // 限制结果数量
            }
        }

        // 使用模糊搜索
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

        console.log(`[FileSearchProvider] Fuzzy results: ${fuzzyResults.length}`);

        // 如果模糊搜索结果为空，返回所有文件的前100个（作为最后的备选）
        if (fuzzyResults.length === 0) {
            console.log(`[FileSearchProvider] No fuzzy results, returning first 100 files`);
            return this.createQuickPickItems(this.files.slice(0, 100));
        }

        console.log(`[FileSearchProvider] Returning ${fuzzyResults.length} fuzzy results`);
        return fuzzyResults.map(result => ({
            label: result.obj.name,
            description: this.getExtensionIcon(result.obj.extension) + ' ' + this.formatFileSize(result.obj.size),
            detail: result.obj.relativePath,
            file: result.obj
        }));
    }

    private async navigateToFile(file: FileIndexItem): Promise<void> {
        try {
            // 检查文件是否存在
            const document = await vscode.workspace.openTextDocument(file.fullPath);

            // 打开文件
            await vscode.window.showTextDocument(document);

            // 显示成功消息
            vscode.window.setStatusBarMessage(
                `Opened ${file.name}`,
                3000
            );

        } catch (error) {
            console.error('Error navigating to file:', error);
            vscode.window.showErrorMessage(`Failed to open ${file.name}: ${error}`);
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

    getFileCount(): number {
        return this.files.length;
    }
}