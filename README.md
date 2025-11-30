# Spring Endpoint Navigator

A VS Code extension that helps you quickly search and navigate to Spring Boot controller endpoints by URL path.

## Features

- **Quick Search**: Use `Ctrl+Alt+E` (or `Cmd+Alt+E` on Mac) to bring up the search interface
- **Fuzzy Matching**: Enter a URL path and see matching endpoints with intelligent ranking
- **Smart Caching**: Controllers are scanned once and cached for fast subsequent searches
- **Instant Navigation**: Press Enter to jump directly to the controller method
- **Supports All HTTP Methods**: Works with GET, POST, PUT, DELETE, PATCH, and custom mappings
- **Class and Method Level Mappings**: Understands both `@RequestMapping` on classes and methods

## Usage

1. **Open the Search**: Press `Ctrl+Alt+E` (or `Cmd+Alt+E` on Mac) or use the command palette (`Ctrl+Shift+P`) and search for "Search Spring Endpoint"

2. **Enter URL**: Type the URL path you're looking for, for example:
   - `/jst/bom/list` - Will match endpoints with this exact path
   - `bom/list` - Will also match `/jst/bom/list` and similar paths
   - `bom` - Will fuzzy match any endpoints containing "bom"

3. **Select and Navigate**: Use arrow keys to browse results and press Enter to navigate to the selected endpoint

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