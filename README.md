# Spring Endpoint Navigator

**English** | [简体中文](./README.zh-CN.md)

A powerful VS Code extension that provides comprehensive search and navigation for Spring Boot endpoints and files.

## Features

### 🔍 Composite Search (NEW)
- **Multi-tab Interface**: Three tabs for mixed search, file search, and endpoint search
- **Unified Search Experience**: Search both files and endpoints simultaneously
- **Quick Mode Switching**: Toggle between search modes using top buttons

### 📁 File Search (NEW)
- **Fuzzy Search**: Smart file name matching (e.g., `exampleers` finds `ExampleController.java`)
- **Path-based Search**: Navigate through folder structures (e.g., `demo/Order` finds `OrderController.java`)
- **File Type Icons**: Visual indicators for different file types
- **File Information**: Display file size and relative path

### 🌐 Endpoint Search
- **Quick Search**: Use `Ctrl+Alt+E` (or `Cmd+Alt+E` on Mac) to bring up the search interface
- **Fuzzy Matching**: Enter a URL path and see matching endpoints with intelligent ranking
- **Wildcard Search**: Use `*` wildcards to match multiple endpoints at once (e.g., `/example/*/list`)
- **Smart Caching**: Controllers are scanned once and cached for fast subsequent searches
- **Instant Navigation**: Press Enter to jump directly to the controller method
- **Supports All HTTP Methods**: Works with GET, POST, PUT, DELETE, PATCH, and custom mappings
- **Class and Method Level Mappings**: Understands both `@RequestMapping` on classes and methods
- **JavaDoc Integration**: Display method comments for better context

### ⚡ Performance Optimizations
- **Intelligent Caching**: File index and endpoint caching for instant startup
- **Background Updates**: Automatic cache updates when files change
- **Quiet Incremental Refresh**: Workspace watcher ignores build/temp outputs (e.g., `target/`, `.class`, logs) and batches updates to avoid console spam and CPU spikes
- **Save-to-Refresh**: When the active `*Controller.java` file is saved, its endpoints are re-parsed and merged into the cache instantly
- **Fast Startup**: Uses `onStartupFinished` event for immediate activation

## Usage

### Quick Start
- **Composite Search**: Press `Ctrl+Alt+E` (or `Cmd+Alt+E` on Mac) - Selected text is automatically filled in the search box
- **Command Palette**: Use `Ctrl+Shift+P` and search for Spring Endpoint Navigator commands

### Search Examples

#### File Search
- `exampleers` → Find `ExampleController.java`
- `demo/Order` → Find `OrderController.java`
- `service` → Find all service class files
- `UserCon` → Find `UserController.java`

#### Endpoint Search
- `/api/users` - Exact match for `/api/users` endpoint
- `/api/*/list` - Wildcard search, matches `/api/users/list`, `/api/orders/list`, etc.
- `getUser` - Fuzzy search for methods containing `getUser`
- `/example/users/*` - All endpoints under `/example/users/`

#### Composite Search
- Type any query to search both files and endpoints simultaneously
- Use top buttons to switch between search modes
- Endpoints are prioritized in mixed results

### Commands
- `Spring Endpoint Navigator: Composite Search (Files & Endpoints)` - Main search interface
- `Spring Endpoint Navigator: Search Files` - File-only search
- `Spring Endpoint Navigator: Search Spring Endpoint` - Endpoint-only search
- `Spring Endpoint Navigator: Clear Cache and Rescan` - Clear cache and rescan workspace
- `Spring Endpoint Navigator: Refresh Cache` - Manually trigger a rescan when needed

## Wildcard Search

The extension supports powerful wildcard patterns for advanced endpoint discovery:

### Wildcard Patterns
- `*` matches any character sequence (including `/`)
- Multiple wildcards are supported
- Case-insensitive matching

### Examples
- `/example/*/list` - Matches `/example/users/list`, `/example/products/list`, `/example/orders/list`
- `/api/*/detail/*` - Matches `/api/users/detail/{id}`, `/api/products/detail/{id}`
- `*/list` - Matches all endpoints ending with `/list`
- `/example/users/*` - Matches all endpoints under `/example/users/`
- `/example/*/*` - Matches all two-level paths under `/example/`

### Usage Tips
- Start with `/` for exact path matching
- Use wildcards for flexible pattern matching
- Combine with fuzzy search for broader results

## Supported Annotations

The extension recognizes the following Spring annotations:

- `@RestController` and `@Controller`
- `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`
- `@RequestMapping` (both class and method level)

## Configuration

You can configure the extension through VS Code settings:

- `springEndpointNavigator.cacheTimeout`: Cache timeout in milliseconds (default: 300000 = 5 minutes)
- `springEndpointNavigator.includeFiles`: Glob patterns to include in Spring controller search (default: `["**/*.java"]`)
- `springEndpointNavigator.excludeFiles`: Glob patterns to exclude from search (default: `["**/node_modules/**", "**/target/**", "**/build/**"]`)

## Example

Given the following Spring controller:

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @GetMapping
    public List<User> getAllUsers() { ... }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) { ... }

    @PostMapping
    public User createUser(@RequestBody User user) { ... }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) { ... }
}
```

The extension will index these endpoints:
- `GET /api/v1/users`
- `GET /api/v1/users/{id}`
- `POST /api/v1/users`
- `DELETE /api/v1/users/{id}`

## Installation

1. Download the extension package
2. Open VS Code
3. Go to Extensions (Ctrl+Shift+X)
4. Click the "..." menu and select "Install from VSIX..."
5. Choose the downloaded extension file

## Development

To build the extension:

```bash
npm install
npm run compile
```

To run in development mode:

```bash
npm run watch
```

Then press F5 in VS Code to launch a new Extension Development Host window.

## Requirements

- VS Code 1.74.0 or higher
- A Spring Boot project with Java files

## License

MIT License

## Issues

If you encounter any issues or have feature requests, please file an issue in the repository.
