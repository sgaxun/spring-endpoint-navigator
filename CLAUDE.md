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

## Code Compatibility

- 如果没有最性要求，尽量不要写兼容代码