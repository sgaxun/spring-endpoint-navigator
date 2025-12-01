# Repository Guidelines

## 项目结构与模块
- `src/extension.ts`：扩展入口，注册命令并初始化缓存/索引。
- `src/endpointCache.ts`、`springControllerParser.ts`：解析 Spring 控制器并缓存端点元数据。
- `src/fileIndex.ts`、`fileSearchProvider.ts`、`compositeSearchProvider.ts`：维护文件索引与搜索提供器，驱动复合搜索界面。
- `out/`：TypeScript 编译产物，勿直接修改。
- `test-spring-project/`：示例 Spring 项目，用于手动验证，尽量保持精简以免增大 VSIX。

## 构建、测试与开发命令
- `npm install`：安装依赖。
- `npm run compile`：严格 TypeScript 编译，输出到 `out/`。
- `npm run watch`：增量编译，F5 启动 VS Code Extension Host 进行调试。
- `npm run package`：使用 `vsce` 生成 `.vsix`（缺失时需全局安装 `vsce`）。
- `npm run publish` / `npm run publish:open-vsx`：发布到对应市场（需配置 token）。

## 代码风格与命名
- 语言：TypeScript，目标 ES2020，CommonJS，`strict` 开启。
- 格式：4 空格缩进；优先使用 `async/await`；日志仅限生命周期必要信息。
- 命名：类用 PascalCase（如 `EndpointCache`），变量/函数用 camelCase，命令 ID 统一前缀 `spring-endpoint-navigator.`。
- 结构：平台接入放在 `extension.ts`；解析、索引、UI 逻辑分层，避免耦合。

## 测试指引
- 当前无自动测试；用 `npm run compile` 捕获类型/语法问题。
- 手动验证：运行 `npm run watch`，按 F5 打开 Extension Host，依次测试命令（复合搜索、文件搜索、端点搜索、清理缓存），针对 `test-spring-project` 修改控制器确认端点/文件计数刷新。
- 发布前确认：缓存预热提示正常，搜索结果能跳转到控制器方法。

## 提交与 PR 规范
- 提交信息偏好简短现在时（中英文均可），示例：“优化启动时后台扫描”；尽量控制在 ~72 字符内。
- PR 需包含：改动概要、测试步骤或示例查询、UI 变更的截图/GIF；若调整默认配置（如缓存时长、include/exclude globs），在描述中说明，并关联相关 issue（如有）。

## Communication Style
- 回复尽量以中文进行，除非有特定要求需要使用英文。

## Code Compatibility
- 若无明确需求，避免为旧环境添加兼容代码，优先保持当前目标版本与配置的简洁性。
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Compile TypeScript to JavaScript for development
npm run compile

# Run TypeScript compiler in watch mode for development
npm run watch

# Package the extension into a VSIX file
npm run package

# Publish to VSCode Marketplace
npm run publish

# Publish to Open VSX Registry
npm run publish:open-vsx
```

## Architecture Overview

This Spring Endpoint Navigator VSCode extension follows a modular architecture with four main components that work together:

### Core Components

1. **Extension Entry Point** (`src/extension.ts`)
   - Composition root that orchestrates all components
   - Handles VSCode extension activation lifecycle
   - Registers commands (`spring-endpoint-navigator.searchEndpoint`, `spring-endpoint-navigator.clearCache`)
   - Implements intelligent background scanning with progress feedback
   - Uses `Ctrl+Alt+E` / `Cmd+Alt+E` keybinding for search

2. **Spring Controller Parser** (`src/springControllerParser.ts`)
   - Scans and parses Java Spring controller files using regex-based parsing
   - Extracts endpoint metadata from Spring annotations (`@GetMapping`, `@PostMapping`, etc.)
   - Handles both class-level and method-level `@RequestMapping` annotations
   - Extracts JavaDoc comments for better search descriptions
   - Returns `SpringEndpoint` objects with complete metadata

3. **Endpoint Cache** (`src/endpointCache.ts`)
   - Implements intelligent caching using VSCode's global state storage
   - Provides cache invalidation based on workspace changes and timeout (default 5 minutes)
   - Ensures fast subsequent searches by avoiding repeated file scanning
   - Monitors file system changes for automatic cache updates

4. **Endpoint Search Provider** (`src/endpointSearchProvider.ts`)
   - Manages the search UI using VSCode QuickPick
   - Implements weighted fuzzy search with custom scoring (URL highest weight)
   - Supports wildcard search with regex pattern matching (e.g., `/api/*/list`)
   - Provides internationalized UI (English/Chinese)
   - Handles navigation to selected endpoints in the code editor

### Data Flow

1. **Extension Activation** → Initialize components → Start background scan
2. **Background Scan** → Try cache first → Refresh if needed → Update cache
3. **Search Triggered** → Show QuickPick UI → Filter endpoints → Navigate on selection
4. **Cache Strategy** → Check validity → Load from cache → Background refresh

## Key Data Models

### `SpringEndpoint` Interface
```typescript
interface SpringEndpoint {
    url: string;           // e.g., "/api/users"
    method: string;        // e.g., "GET", "POST"
    controllerClass: string;
    methodName: string;
    methodComment?: string; // Extracted JavaDoc
    fileName: string;
    filePath: string;
    lineNumber: number;
}
```

## Configuration

The extension uses VSCode settings under `springEndpointNavigator.*`:
- `cacheTimeout`: Cache timeout in milliseconds (default: 300000)
- `includeFiles`: Glob patterns for Java files to scan (default: `["**/*.java"]`)
- `excludeFiles`: Glob patterns to exclude (default: `["**/node_modules/**", "**/target/**", "**/build/**"]`)

## Search Features

- **Fuzzy Search**: Multi-key search across URL, method name, class name, and comments
- **Wildcard Search**: Support for `*` patterns converted to regex
- **Exact Matching**: Prioritizes exact URL matches
- **Weighted Scoring**: URL has highest weight, followed by method name, class name, and comments

## Performance Optimizations

- **Cache-first approach**: Loads cached endpoints immediately for fast startup
- **Background scanning**: Non-blocking workspace scanning with progress feedback
- **Intelligent cache invalidation**: Time-based + workspace change detection
- **Efficient parsing**: Regex-based parsing for performance

## Error Handling

- Graceful degradation when parsing fails
- Fallback search strategies (exact → fuzzy)
- User-friendly error messages and progress feedback
- Cache recovery on corruption or parsing errors

## Internationalization

- Dynamic UI text based on `vscode.env.language`
- Supports Chinese (`zh*`) and English locales
- Localized search placeholders and titles

## Communication Style
- 回复尽量以中文进行，除非有特要求需要使用英文