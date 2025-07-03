import * as vscode from 'vscode';
import { ReviewComment } from '../types';

/**
 * VS Code tanılamalarını yöneten sınıf
 */
export class DiagnosticsManager {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private static instance: DiagnosticsManager;

    private constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('freeAICodeReviewer');
    }

    /**
     * Singleton instance'ını getirir
     * @returns DiagnosticsManager instance'ı
     */
    static getInstance(): DiagnosticsManager {
        if (!DiagnosticsManager.instance) {
            DiagnosticsManager.instance = new DiagnosticsManager();
        }
        return DiagnosticsManager.instance;
    }

    /**
     * Dosya için AI inceleme yorumlarını tanılama olarak ekler
     * @param uri Dosya URI'si
     * @param comments İnceleme yorumları
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

            // Kaynak ve kod bilgilerini ekle
            diagnostic.source = 'Free AI Code Reviewer';
            diagnostic.code = comment.category || 'ai-review';

            // Etiketler ekle
            diagnostic.tags = this.getDiagnosticTags(comment);

            return diagnostic;
        });

        this.diagnosticCollection.set(uri, diagnostics);
    }

    /**
     * Belirli bir dosyanın tanılamalarını temizler
     * @param uri Dosya URI'si
     */
    clearDiagnostics(uri: vscode.Uri): void {
        this.diagnosticCollection.delete(uri);
    }

    /**
     * Tüm tanılamaları temizler
     */
    clearAllDiagnostics(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Belirli bir dosyanın tanılamalarını getirir
     * @param uri Dosya URI'si
     * @returns Tanılama listesi
     */
    getDiagnostics(uri: vscode.Uri): readonly vscode.Diagnostic[] {
        return this.diagnosticCollection.get(uri) || [];
    }

    /**
     * Tüm dosyaların tanılamalarını getirir
     * @returns Dosya URI'si ve tanılama çiftleri
     */
    getAllDiagnostics(): [vscode.Uri, vscode.Diagnostic[]][] {
        const result: [vscode.Uri, vscode.Diagnostic[]][] = [];
        this.diagnosticCollection.forEach((uri, diagnostics) => {
            result.push([uri, Array.from(diagnostics)]);
        });
        return result;
    }

    /**
     * Tanılama sayısını getirir
     * @param severity Belirli bir önem derecesi (opsiyonel)
     * @returns Tanılama sayısı
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
     * Tanılama koleksiyonunu dispose eder
     */
    dispose(): void {
        this.diagnosticCollection.dispose();
    }

    /**
     * İnceleme yorumuna göre tanılama etiketlerini belirler
     * @param comment İnceleme yorumu
     * @returns Tanılama etiketleri
     */
    private getDiagnosticTags(comment: ReviewComment): vscode.DiagnosticTag[] {
        const tags: vscode.DiagnosticTag[] = [];

        // Kategori bazında etiketler
        if (comment.category) {
            const category = comment.category.toLowerCase();

            if (category.includes('deprecated') || category.includes('obsolete')) {
                tags.push(vscode.DiagnosticTag.Deprecated);
            }

            if (category.includes('unused') || category.includes('dead')) {
                tags.push(vscode.DiagnosticTag.Unnecessary);
            }
        }

        // Mesaj içeriği bazında etiketler
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
     * Tanılama koleksiyonunu getirir (dış kullanım için)
     * @returns Tanılama koleksiyonu
     */
    getCollection(): vscode.DiagnosticCollection {
        return this.diagnosticCollection;
    }

    /**
     * Belirli bir satırdaki tanılamaları getirir
     * @param uri Dosya URI'si
     * @param line Satır numarası
     * @returns O satırdaki tanılamalar
     */
    getDiagnosticsAtLine(uri: vscode.Uri, line: number): vscode.Diagnostic[] {
        const diagnostics = this.getDiagnostics(uri);
        return Array.from(diagnostics).filter(diagnostic =>
            diagnostic.range.start.line === line || diagnostic.range.end.line === line
        );
    }

    /**
     * Tanılama istatistiklerini getirir
     * @returns İstatistik objesi
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