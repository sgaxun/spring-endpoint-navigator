import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface SpringEndpoint {
    url: string;
    method: string;
    controllerClass: string;
    methodName: string;
    lineNumber: number;
    fileName: string;
    filePath: string;
    methodComment: string;
}

export class SpringControllerParser {

    async scanControllers(): Promise<SpringEndpoint[]> {
        const config = vscode.workspace.getConfiguration('springEndpointNavigator');
        const includePatterns = config.get<string[]>('includeFiles', ['**/*.java']);
        const excludePatterns = config.get<string[]>('excludeFiles', ['**/node_modules/**', '**/target/**', '**/build/**']);

        const endpoints: SpringEndpoint[] = [];

        for (const pattern of includePatterns) {
            const files = await vscode.workspace.findFiles(pattern, `{${excludePatterns.join(',')}}`);

            for (const file of files) {
                const fileEndpoints = await this.parseControllerFile(file.fsPath);
                endpoints.push(...fileEndpoints);
            }
        }

        return endpoints;
    }

    private async parseControllerFile(filePath: string): Promise<SpringEndpoint[]> {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        const endpoints: SpringEndpoint[] = [];
        let currentControllerPath = '';
        let currentControllerClass = '';

        // Find controller class and base path
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check for @RestController or @Controller annotation
            const restControllerMatch = line.match(/@(RestController|Controller)(?:\(.*?\))?/);
            if (restControllerMatch) {
                currentControllerClass = this.extractClassName(lines, i);
            }

            // Check for @RequestMapping on class level
            const classRequestMappingMatch = line.match(/@RequestMapping\s*\(\s*["']([^"']+)["']/);
            if (classRequestMappingMatch && currentControllerClass) {
                currentControllerPath = classRequestMappingMatch[1];
            }
        }

        // Find method-level mappings
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (currentControllerClass) {
                const methodMapping = this.parseMethodMapping(line, lines, i);
                if (methodMapping) {
                    const fullUrl = this.combinePaths(currentControllerPath, methodMapping.path);
                    const methodComment = this.extractMethodComment(lines, i);

                    console.log(`[DEBUG] Found endpoint: ${methodMapping.method} ${fullUrl}, method: ${methodMapping.methodName}, comment: "${methodComment}"`);

                    endpoints.push({
                        url: fullUrl,
                        method: methodMapping.method,
                        controllerClass: currentControllerClass,
                        methodName: methodMapping.methodName,
                        lineNumber: this.findMethodLineNumber(lines, i) + 1, // Find actual method line
                        fileName: path.basename(filePath),
                        filePath: filePath,
                        methodComment: methodComment
                    });
                }
            }
        }

        return endpoints;
    }

    private parseMethodMapping(line: string, lines: string[], currentIndex: number): { path: string, method: string, methodName: string } | null {
        const annotations = [
            '@GetMapping',
            '@PostMapping',
            '@PutMapping',
            '@DeleteMapping',
            '@PatchMapping',
            '@RequestMapping'
        ];

        for (const annotation of annotations) {
            const match = line.match(new RegExp(`${annotation}\\s*\\(\\s*["']([^"']+)["']`));
            if (match) {
                const methodName = this.extractMethodName(lines, currentIndex);
                let method = this.extractHttpMethod(annotation, line);

                return {
                    path: match[1],
                    method: method,
                    methodName: methodName
                };
            }
        }

        return null;
    }

    private extractHttpMethod(annotation: string, line: string): string {
        switch (annotation) {
            case '@GetMapping': return 'GET';
            case '@PostMapping': return 'POST';
            case '@PutMapping': return 'PUT';
            case '@DeleteMapping': return 'DELETE';
            case '@PatchMapping': return 'PATCH';
            case '@RequestMapping':
                // Check for method attribute in @RequestMapping
                const methodMatch = line.match(/method\s*=\s*[^{]*?\{([^}]+)\}/);
                if (methodMatch) {
                    const methods = methodMatch[1].split(',').map(m => m.trim().replace(/.*\./, '').toUpperCase());
                    return methods[0] || 'GET';
                }
                return 'GET';
            default: return 'GET';
        }
    }

    private extractClassName(lines: string[], startIndex: number): string {
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(/(?:public\s+)?class\s+(\w+)/);
            if (match) {
                return match[1];
            }
        }
        return '';
    }

    private extractMethodName(lines: string[], startIndex: number): string {
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(/(?:public|private|protected)?\s*(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\(/);
            if (match) {
                return match[1];
            }
        }
        return '';
    }

    private findMethodLineNumber(lines: string[], annotationIndex: number): number {
        // Find the method declaration after the last annotation
        for (let i = annotationIndex; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip annotations and empty lines
            if (line.startsWith('@') || !line) {
                continue;
            }

            // Look for method declaration
            const match = line.match(/(?:public|private|protected)?\s*(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\(/);
            if (match) {
                console.log(`[DEBUG] Found method ${match[1]} at line ${i + 1}`);
                return i;
            }
        }
        return annotationIndex; // Fallback to annotation line
    }

    private extractMethodComment(lines: string[], annotationLineIndex: number): string {
        console.log(`[DEBUG] Extracting comment for annotation at line ${annotationLineIndex + 1}`);
        console.log(`[DEBUG] Annotation line content: "${lines[annotationLineIndex].trim()}"`);

        // Look backwards from the annotation line to find the start of comment block
        let commentStartIndex = -1;
        let commentEndIndex = -1;

        // First, skip all annotations (going backwards)
        let i = annotationLineIndex - 1;
        while (i >= 0) {
            const line = lines[i].trim();

            if (line.startsWith('@')) {
                console.log(`[DEBUG] Skipping annotation at line ${i + 1}: "${line}"`);
                i--;
                continue;
            }

            // Found non-annotation line, this could be the end of comment block or something else
            break;
        }

        // Now look for comment block
        while (i >= 0) {
            const originalLine = lines[i];
            const line = originalLine.trim();

            console.log(`[DEBUG] Checking line ${i + 1}: "${line}"`);

            // Skip empty lines
            if (!line) {
                i--;
                continue;
            }

            // Check if this is the end of a comment block
            if (line.endsWith('*/') && (line.startsWith('*') || line.includes('*/'))) {
                commentEndIndex = i;
                console.log(`[DEBUG] Found comment end at line ${i + 1}: "${line}"`);
                i--;
                break;
            }

            // If we hit something that's not a comment or empty, stop
            if (!line.startsWith('*') && !line.startsWith('/**')) {
                console.log(`[DEBUG] Hit non-comment content at line ${i + 1}, stopping`);
                return "";
            }

            i--;
        }

        // If we found comment end, find the start
        if (commentEndIndex !== -1) {
            while (i >= 0) {
                const line = lines[i].trim();
                console.log(`[DEBUG] Looking for comment start, line ${i + 1}: "${line}"`);

                if (line.startsWith('/**')) {
                    commentStartIndex = i;
                    console.log(`[DEBUG] Found comment start at line ${i + 1}: "${line}"`);
                    break;
                }

                // Skip comment content lines
                if (line.startsWith('*')) {
                    i--;
                    continue;
                }

                // If we find something else before finding /**, something is wrong
                console.log(`[DEBUG] Found unexpected content before comment start at line ${i + 1}`);
                break;
            }
        }

        // Extract comment if we found both start and end
        if (commentStartIndex !== -1 && commentEndIndex !== -1) {
            const commentLines: string[] = [];

            for (let j = commentStartIndex; j <= commentEndIndex; j++) {
                const line = lines[j].trim();

                // Remove comment markers and clean up
                let cleanLine = line
                    .replace(/^\/\*\*/, '')      // Remove /**
                    .replace(/^\*/, '')          // Remove leading *
                    .replace(/\*\/$/, '')         // Remove */
                    .trim();

                if (cleanLine) {
                    commentLines.push(cleanLine);
                    console.log(`[DEBUG] Extracted comment line: "${cleanLine}"`);
                }
            }

            // Join comment lines with proper spacing
            let comment = commentLines.join(' ');

            // Remove common JavaDoc tags like @param, @return, etc.
            comment = comment.replace(/@param\s+\w+\s+[^@]*$/g, '').trim();
            comment = comment.replace(/@return\s+[^@]*$/g, '').trim();
            comment = comment.replace(/@throws\s+\w+\s+[^@]*$/g, '').trim();
            comment = comment.replace(/@see\s+[^@]*$/g, '').trim();
            comment = comment.replace(/@\w+\s+[^@]*$/g, '').trim();

            // Clean up extra spaces
            comment = comment.replace(/\s+/g, ' ').trim();

            console.log(`[DEBUG] Final extracted comment: "${comment}"`);

            // Truncate if too long
            if (comment.length > 150) {
                comment = comment.substring(0, 150) + '...';
            }

            return comment;
        }

        console.log(`[DEBUG] No comment found`);
        return "";
    }

    private combinePaths(basePath: string, methodPath: string): string {
        if (!basePath) return methodPath;
        if (!methodPath) return basePath;

        const cleanBase = basePath.startsWith('/') ? basePath : '/' + basePath;
        const cleanMethod = methodPath.startsWith('/') ? methodPath : '/' + methodPath;

        return (cleanBase + cleanMethod).replace(/\/+/g, '/');
    }
}