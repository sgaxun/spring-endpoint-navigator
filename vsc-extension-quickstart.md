# Spring Endpoint Navigator - VS Code Extension

This extension provides quick navigation to Spring Boot controller endpoints by searching for URL paths.

## Quick Start

1. Install the dependencies:
```bash
npm install
```

2. Compile the TypeScript:
```bash
npm run compile
```

3. Press F5 to run the extension in a new Extension Development Host window.

4. In the new window, use `Ctrl+Alt+E` to open the endpoint search, or search for "Search Spring Endpoint" in the command palette.

## Testing

Test with a Spring Boot project containing controllers like:

```java
@RestController
@RequestMapping("/api")
public class TestController {

    @GetMapping("/test")
    public String test() {
        return "Hello";
    }

    @PostMapping("/submit")
    public void submit() {
        // implementation
    }
}
```

The extension will index these endpoints and allow you to search for `/api/test` or `/api/submit` to navigate directly to the corresponding methods.