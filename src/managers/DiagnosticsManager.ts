import * as vscode from 'vscode';
import { ReviewComment } from '../types';

/**
 * Class that manages VS Code diagnostics
 */
export class DiagnosticsManager {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private static instance: DiagnosticsManager;

    private constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('freeAICodeReviewer');
    }

    /**
     * Returns the singleton instance
     * @returns DiagnosticsManager instance
     */
    static getInstance(): DiagnosticsManager {
        if (!DiagnosticsManager.instance) {
            DiagnosticsManager.instance = new DiagnosticsManager();
        }
        return DiagnosticsManager.instance;
    }

    /**
     * Adds AI review comments as diagnostics for a file
     * @param uri File URI
     * @param comments Review comments
     */
    setDiagnostics(uri: vscode.Uri, comments: ReviewComment[]): void {
        const diagnostics: vscode.Diagnostic[] = comments.map(comment => {
            const range = new vscode.Range(
                new vscode.Position(comment.line, comment.column || 0),
                new vscode.Position(comment.line, Number.MAX_SAFE_INTEGER)
            );

            const diagnostic = new vscode.Diagnostic(
                range,
                comment.message,
                comment.severity
            );

            // Add source and code information
            diagnostic.source = 'Free AI Code Reviewer';
            diagnostic.code = comment.category || 'ai-review';

            // Add diagnostic tags
            diagnostic.tags = this.getDiagnosticTags(comment);

            return diagnostic;
        });

        this.diagnosticCollection.set(uri, diagnostics);
    }

    /**
     * Clears diagnostics for a specific file
     * @param uri File URI
     */
    clearDiagnostics(uri: vscode.Uri): void {
        this.diagnosticCollection.delete(uri);
    }

    /**
     * Clears all diagnostics
     */
    clearAllDiagnostics(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Gets diagnostics for a specific file
     * @param uri File URI
     * @returns List of diagnostics
     */
    getDiagnostics(uri: vscode.Uri): readonly vscode.Diagnostic[] {
        return this.diagnosticCollection.get(uri) || [];
    }

    /**
     * Gets diagnostics for all files
     * @returns List of [file URI, diagnostics] pairs
     */
    getAllDiagnostics(): [vscode.Uri, vscode.Diagnostic[]][] {
        const result: [vscode.Uri, vscode.Diagnostic[]][] = [];
        this.diagnosticCollection.forEach((uri, diagnostics) => {
            result.push([uri, Array.from(diagnostics)]);
        });
        return result;
    }

    /**
     * Gets the number of diagnostics
     * @param severity Optional severity filter
     * @returns Number of diagnostics
     */
    getDiagnosticsCount(severity?: vscode.DiagnosticSeverity): number {
        let count = 0;
        this.diagnosticCollection.forEach((uri, diagnostics) => {
            if (severity !== undefined) {
                count += diagnostics.filter(d => d.severity === severity).length;
            } else {
                count += diagnostics.length;
            }
        });
        return count;
    }

    /**
     * Disposes the diagnostic collection
     */
    dispose(): void {
        this.diagnosticCollection.dispose();
    }

    /**
     * Determines diagnostic tags based on the review comment
     * @param comment Review comment
     * @returns List of diagnostic tags
     */
    private getDiagnosticTags(comment: ReviewComment): vscode.DiagnosticTag[] {
        const tags: vscode.DiagnosticTag[] = [];

        // Tags based on category
        if (comment.category) {
            const category = comment.category.toLowerCase();

            if (category.includes('deprecated') || category.includes('obsolete')) {
                tags.push(vscode.DiagnosticTag.Deprecated);
            }

            if (category.includes('unused') || category.includes('dead')) {
                tags.push(vscode.DiagnosticTag.Unnecessary);
            }
        }

        // Tags based on message content
        const message = comment.message.toLowerCase();

        if (message.includes('deprecated') || message.includes('kullanımdan kaldırıl')) {
            tags.push(vscode.DiagnosticTag.Deprecated);
        }

        if (message.includes('unused') || message.includes('kullanılmıyor') ||
            message.includes('gereksiz') || message.includes('unnecessary')) {
            tags.push(vscode.DiagnosticTag.Unnecessary);
        }

        return tags;
    }

    /**
     * Returns the diagnostic collection (for external use)
     * @returns Diagnostic collection
     */
    getCollection(): vscode.DiagnosticCollection {
        return this.diagnosticCollection;
    }

    /**
     * Gets diagnostics at a specific line
     * @param uri File URI
     * @param line Line number
     * @returns List of diagnostics at the given line
     */
    getDiagnosticsAtLine(uri: vscode.Uri, line: number): vscode.Diagnostic[] {
        const diagnostics = this.getDiagnostics(uri);
        return Array.from(diagnostics).filter(diagnostic =>
            diagnostic.range.start.line === line || diagnostic.range.end.line === line
        );
    }

    /**
     * Returns diagnostic statistics
     * @returns Stats object
     */
    getStatistics(): {
        totalFiles: number;
        totalDiagnostics: number;
        errorCount: number;
        warningCount: number;
        infoCount: number;
        hintCount: number;
    } {
        let totalFiles = 0;
        let totalDiagnostics = 0;
        let errorCount = 0;
        let warningCount = 0;
        let infoCount = 0;
        let hintCount = 0;

        this.diagnosticCollection.forEach((uri, diagnostics) => {
            totalFiles++;
            totalDiagnostics += diagnostics.length;

            diagnostics.forEach(diagnostic => {
                switch (diagnostic.severity) {
                    case vscode.DiagnosticSeverity.Error:
                        errorCount++;
                        break;
                    case vscode.DiagnosticSeverity.Warning:
                        warningCount++;
                        break;
                    case vscode.DiagnosticSeverity.Information:
                        infoCount++;
                        break;
                    case vscode.DiagnosticSeverity.Hint:
                        hintCount++;
                        break;
                }
            });
        });

        return {
            totalFiles,
            totalDiagnostics,
            errorCount,
            warningCount,
            infoCount,
            hintCount
        };
    }
}
