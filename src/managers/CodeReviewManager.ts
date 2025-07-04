import * as vscode from 'vscode';
import * as simpleGit from 'simple-git';
import { ProviderFactory } from '../providers/ProviderFactory';
import { ConfigurationManager } from './ConfigurationManager';
import { DiagnosticsManager } from './DiagnosticsManager';
import { ReviewComment } from '../types';
import { ReviewedFilesTreeProvider, ReviewIssue } from '../ReviewedFilesTreeProvider';

/**
 * Main class that manages code review processes
 */
export class CodeReviewManager {
    private git: simpleGit.SimpleGit;
    private diagnosticsManager: DiagnosticsManager;
    private outputChannel: vscode.OutputChannel;
    private reviewedFilesProvider?: ReviewedFilesTreeProvider;

    constructor() {
        // Get workspace root directory and initialize Git in that directory
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        console.log("workspaceRoot", workspaceRoot);

        this.git = workspaceRoot ? simpleGit.simpleGit(workspaceRoot) : simpleGit.simpleGit();
        console.log(this.git.getRemotes());

        this.diagnosticsManager = DiagnosticsManager.getInstance();
        this.outputChannel = vscode.window.createOutputChannel('Free AI Code Reviewer');
    }

    /**
     * Checks if the workspace is a Git repository
     * @returns Git repository status
     */
    private async isGitRepository(): Promise<boolean> {
        try {
            await this.git.status();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Reviews the current file with AI
     * @param document Document to be reviewed
     */
    async reviewCurrentFile(document: vscode.TextDocument): Promise<void> {
        try {
            this.outputChannel.appendLine(`Starting review: ${document.fileName}`);

            // Check configuration
            const config = ConfigurationManager.getProviderConfig();
            const validation = ConfigurationManager.validateConfig(config);

            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            // Perform operation with progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'AI Code Review',
                cancellable: true
            }, async (progress, token) => {
                progress.report({ message: 'Getting changes...' });
                
                // Get Git diff
                const diff = await this.getFileDiff(document.uri.fsPath);
                if (!diff || diff.trim().length === 0) {
                    vscode.window.showInformationMessage('No changes found in this file.');
                    return;
                }

                progress.report({ message: 'AI review in progress...' });
                
                // Create AI provider and perform review
                const provider = ProviderFactory.createProvider(config);
                const comments = await provider.performReview(
                    config.apiKey,
                    config.model,
                    diff,
                    document.languageId
                );

                progress.report({ message: 'Processing results...' });
                
                // Process results
                this.procesReviewResults(document.uri, comments);

                this.outputChannel.appendLine(`Review completed: ${comments.length} comments found`);

                if (comments.length > 0) {
                    vscode.window.showInformationMessage(
                        `AI code review completed. ${comments.length} suggestions found.`,
                        'Show Results'
                    ).then(selection => {
                        if (selection === 'Show Results') {
                            vscode.commands.executeCommand('workbench.panel.markers.view.focus');
                        }
                    });
                } else {
                    vscode.window.showInformationMessage('Great! AI found no issues.');
                }
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.outputChannel.appendLine(`Error: ${errorMessage}`);
            vscode.window.showErrorMessage(`Error during code review: ${errorMessage}`);
        }
    }

    /**
     * Reviews selected files in batch
     * @param uris File URIs to be reviewed
     */
    async reviewMultipleFiles(uris: vscode.Uri[]): Promise<void> {
        const parallelCount = ConfigurationManager.getParallelReviewCount();
        
        const progress = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `AI Code Review (${parallelCount} parallel)`,
            cancellable: true
        }, async (progress, token) => {
            const totalFiles = uris.length;
            let processedFiles = 0;
            let errorCount = 0;

            // Process files in parallel groups
            for (let i = 0; i < uris.length; i += parallelCount) {
                if (token.isCancellationRequested) {
                    break;
                }

                // Get current batch
                const batch = uris.slice(i, i + parallelCount);
                
                // Process files in batch in parallel
                const batchPromises = batch.map(async (uri) => {
                    try {
                        const document = await vscode.workspace.openTextDocument(uri);
                        await this.reviewCurrentFile(document);
                        return { success: true, uri };
                    } catch (error) {
                        this.outputChannel.appendLine(`Error processing file (${uri.fsPath}): ${error}`);
                        return { success: false, uri, error };
                    }
                });

                // Wait for batch completion
                const batchResults = await Promise.all(batchPromises);
                
                // Count results
                const batchSuccessCount = batchResults.filter(r => r.success).length;
                const batchErrorCount = batchResults.filter(r => !r.success).length;
                
                processedFiles += batchSuccessCount;
                errorCount += batchErrorCount;

                // Update progress status
                const completedFiles = i + batch.length;
                progress.report({
                    increment: (batch.length / totalFiles) * 100,
                    message: `${Math.min(completedFiles, totalFiles)}/${totalFiles} files processed (${errorCount} errors)`
                });

                // Add short wait time (for API rate limiting)
                if (i + parallelCount < uris.length && !token.isCancellationRequested) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            return { processedFiles, errorCount };
        });

        const message = progress.errorCount > 0 
            ? `Batch review completed: ${progress.processedFiles} files successful, ${progress.errorCount} errors`
            : `Batch review completed: ${progress.processedFiles} files processed.`;
        
        if (progress.errorCount > 0) {
            vscode.window.showWarningMessage(message);
        } else {
            vscode.window.showInformationMessage(message);
        }
    }

    /**
     * Reviews changed files in workspace
     */
    async reviewChangedFiles(): Promise<void> {
        try {
            // Git repository check
            const isGitRepo = await this.isGitRepository();
            if (!isGitRepo) {
                vscode.window.showErrorMessage(
                'This feature requires a Git repository. Please initialize your workspace with Git (git init) or work in an existing Git repository.',
                'How to Initialize Git?'
            ).then(selection => {
                    if (selection === 'How to Initialize Git?') {
                        vscode.env.openExternal(vscode.Uri.parse('https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository'));
                    }
                });
                return;
            }

            const changedFiles = await this.getChangedFiles();

            if (changedFiles.length === 0) {
                vscode.window.showInformationMessage('Değişen dosya bulunamadı.');
                return;
            }

            const uris = changedFiles.map(file => vscode.Uri.file(file));
            await this.reviewMultipleFiles(uris);
        } catch (error) {
            vscode.window.showErrorMessage(`Değişen dosyalar alınırken hata: ${error}`);
        }
    }

    /**
     * Dosya kaydedildiğinde otomatik inceleme yapar
     * @param document Kaydedilen doküman
     */
    async onFileSaved(document: vscode.TextDocument): Promise<void> {
        const config = vscode.workspace.getConfiguration('freeAICodeReviewer');
        const autoReview = config.get<boolean>('autoReviewOnSave', false);

        if (autoReview && this.shouldReviewFile(document)) {
            await this.reviewCurrentFile(document);
        }
    }

    /**
     * Tüm AI inceleme sonuçlarını temizler
     */
    clearAllReviews(): void {
        this.diagnosticsManager.clearAllDiagnostics();
        
        // Reviewed files provider'ı da temizle
        if (this.reviewedFilesProvider) {
            this.reviewedFilesProvider.clearReviewedFiles();
        }
        
        this.outputChannel.appendLine('Tüm AI inceleme sonuçları temizlendi.');
        vscode.window.showInformationMessage('AI inceleme sonuçları temizlendi.');
    }

    /**
     * Belirli dosyanın inceleme sonuçlarını temizler
     * @param uri Dosya URI'si
     */
    clearFileReview(uri: vscode.Uri): void {
        this.diagnosticsManager.clearDiagnostics(uri);
        this.outputChannel.appendLine(`İnceleme sonuçları temizlendi: ${uri.fsPath}`);
    }

    /**
     * İnceleme istatistiklerini gösterir
     */
    showReviewStatistics(): void {
        const stats = this.diagnosticsManager.getStatistics();
        const message = `
AI Kod İncelemesi İstatistikleri:
• İncelenen dosya sayısı: ${stats.totalFiles}
• Toplam öneri: ${stats.totalDiagnostics}
• Hata: ${stats.errorCount}
• Uyarı: ${stats.warningCount}
• Bilgi: ${stats.infoCount}
• İpucu: ${stats.hintCount}`;

        this.outputChannel.appendLine(message);
        this.outputChannel.show();
    }

    /**
     * Dosya için Git diff'ini alır
     * @param filePath Dosya yolu
     * @returns Diff içeriği
     */
    private async getFileDiff(filePath: string): Promise<string> {
        try {
            // Git repository kontrolü
            const isGitRepo = await this.isGitRepository();
            if (!isGitRepo) {
                // Git repository değilse dosyanın tamamını döndür
                const document = await vscode.workspace.openTextDocument(filePath);
                return `+++ ${filePath}\n${document.getText().split('\n').map(line => `+${line}`).join('\n')}`;
            }

            // Staged değişiklikler varsa onları al
            const stagedDiff = await this.git.diff(['--cached', filePath]);
            if (stagedDiff && stagedDiff.trim().length > 0) {
                return stagedDiff;
            }

            // Working directory değişikliklerini al
            const workingDiff = await this.git.diff([filePath]);
            if (workingDiff && workingDiff.trim().length > 0) {
                return workingDiff;
            }

            // Son commit'e göre diff al
            return await this.git.diff(['HEAD~1', 'HEAD', filePath]);
        } catch (error) {
            this.outputChannel.appendLine(`Git diff alınırken hata: ${error}`);
            // Git hatası durumunda dosyanın tamamını döndür
            const document = await vscode.workspace.openTextDocument(filePath);
            return `+++ ${filePath}\n${document.getText().split('\n').map(line => `+${line}`).join('\n')}`;
        }
    }

    /**
     * Değişen dosyaların listesini alır
     * @returns Değişen dosya yolları
     */
    private async getChangedFiles(): Promise<string[]> {
        try {
            const status = await this.git.status();
            const changedFiles: string[] = [];

            // Modified, added, renamed dosyaları ekle
            changedFiles.push(...status.modified);
            changedFiles.push(...status.created);
            changedFiles.push(...status.renamed.map(r => r.to));

            // Tam yol olarak döndür
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
            return changedFiles.map(file => `${workspaceRoot}/${file}`);
        } catch (error) {
            throw new Error(`Git status alınırken hata: ${error}`);
        }
    }

    /**
     * ReviewedFilesTreeProvider'ı ayarlar
     * @param provider ReviewedFilesTreeProvider instance
     */
    setReviewedFilesProvider(provider: ReviewedFilesTreeProvider): void {
        this.reviewedFilesProvider = provider;
    }

    /**
     * İnceleme sonuçlarını işler ve gösterir
     * @param uri Dosya URI'si
     * @param comments İnceleme yorumları
     */
    private procesReviewResults(uri: vscode.Uri, comments: ReviewComment[]): void {
        // Önceki sonuçları temizle
        this.diagnosticsManager.clearDiagnostics(uri);

        // Yeni sonuçları ekle
        if (comments.length > 0) {
            this.diagnosticsManager.setDiagnostics(uri, comments);
        }

        // ReviewComment'leri ReviewIssue'ya dönüştür
        const issues: ReviewIssue[] = comments.map(comment => ({
            line: comment.line + 1, // VS Code 0-based, UI'da 1-based göstermek için +1
            message: comment.message,
            severity: this.mapSeverityToIssue(comment.severity)
        }));

        // Reviewed files provider'a dosyayı ve problemleri ekle
        if (this.reviewedFilesProvider) {
            console.log(`[CodeReviewManager] Adding ${uri.fsPath} to reviewed files with ${comments.length} issues`);
            this.reviewedFilesProvider.addReviewedFile(uri.fsPath, comments.length, issues);
        } else {
            console.log(`[CodeReviewManager] reviewedFilesProvider is not set!`);
        }

        // Detaylı log
        this.outputChannel.appendLine(`\n=== ${uri.fsPath} İnceleme Sonuçları ===`);
        comments.forEach((comment, index) => {
            this.outputChannel.appendLine(`${index + 1}. Satır ${comment.line + 1}: ${comment.message}`);
        });
    }

    /**
     * DiagnosticSeverity'yi ReviewIssue severity'ye dönüştürür
     * @param severity VS Code DiagnosticSeverity
     * @returns ReviewIssue severity
     */
    private mapSeverityToIssue(severity: vscode.DiagnosticSeverity): 'error' | 'warning' | 'info' {
        switch (severity) {
            case vscode.DiagnosticSeverity.Error:
                return 'error';
            case vscode.DiagnosticSeverity.Warning:
                return 'warning';
            case vscode.DiagnosticSeverity.Information:
            case vscode.DiagnosticSeverity.Hint:
            default:
                return 'info';
        }
    }

    /**
     * Dosyanın incelenmesi gerekip gerekmediğini kontrol eder
     * @param document Doküman
     * @returns İnceleme gereksinimi
     */
    private shouldReviewFile(document: vscode.TextDocument): boolean {
        // Desteklenen dosya türleri
        const supportedLanguages = [
            'javascript', 'typescript', 'python', 'java', 'csharp',
            'cpp', 'c', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin'
        ];

        return supportedLanguages.includes(document.languageId) &&
            !document.uri.fsPath.includes('node_modules') &&
            !document.uri.fsPath.includes('.git');
    }

    /**
     * Kaynakları temizler
     */
    dispose(): void {
        this.outputChannel.dispose();
    }
}