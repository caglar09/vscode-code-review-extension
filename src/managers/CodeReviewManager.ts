import * as vscode from 'vscode';
import * as simpleGit from 'simple-git';
import { ProviderFactory } from '../providers/ProviderFactory';
import { ConfigurationManager } from './ConfigurationManager';
import { DiagnosticsManager } from './DiagnosticsManager';
import { ReviewComment } from '../types';
import { ReviewedFilesTreeProvider, ReviewIssue } from '../ReviewedFilesTreeProvider';

/**
 * Kod inceleme süreçlerini yöneten ana sınıf
 */
export class CodeReviewManager {
    private git: simpleGit.SimpleGit;
    private diagnosticsManager: DiagnosticsManager;
    private outputChannel: vscode.OutputChannel;
    private reviewedFilesProvider?: ReviewedFilesTreeProvider;

    constructor() {
        // Workspace root dizinini al ve Git'i o dizinde başlat
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        console.log("workspaceRoot", workspaceRoot);

        this.git = workspaceRoot ? simpleGit.simpleGit(workspaceRoot) : simpleGit.simpleGit();
        console.log(this.git.getRemotes());

        this.diagnosticsManager = DiagnosticsManager.getInstance();
        this.outputChannel = vscode.window.createOutputChannel('Free AI Code Reviewer');
    }

    /**
     * Workspace'in Git repository olup olmadığını kontrol eder
     * @returns Git repository durumu
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
     * Mevcut dosyayı AI ile inceler
     * @param document İncelenecek doküman
     */
    async reviewCurrentFile(document: vscode.TextDocument): Promise<void> {
        try {
            this.outputChannel.appendLine(`İnceleme başlatılıyor: ${document.fileName}`);

            // Yapılandırmayı kontrol et
            const config = ConfigurationManager.getProviderConfig();
            const validation = ConfigurationManager.validateConfig(config);

            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            // İlerleme göstergesi ile işlemi gerçekleştir
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'AI Kod İncelemesi',
                cancellable: true
            }, async (progress, token) => {
                progress.report({ message: 'Değişiklikler alınıyor...' });
                
                // Git diff'ini al
                const diff = await this.getFileDiff(document.uri.fsPath);
                if (!diff || diff.trim().length === 0) {
                    vscode.window.showInformationMessage('Bu dosyada değişiklik bulunamadı.');
                    return;
                }

                progress.report({ message: 'AI incelemesi yapılıyor...' });
                
                // AI sağlayıcısını oluştur ve inceleme yap
                const provider = ProviderFactory.createProvider(config);
                const comments = await provider.performReview(
                    config.apiKey,
                    config.model,
                    diff,
                    document.languageId
                );

                progress.report({ message: 'Sonuçlar işleniyor...' });
                
                // Sonuçları işle
                this.procesReviewResults(document.uri, comments);

                this.outputChannel.appendLine(`İnceleme tamamlandı: ${comments.length} yorum bulundu`);

                if (comments.length > 0) {
                    vscode.window.showInformationMessage(
                        `AI kod incelemesi tamamlandı. ${comments.length} öneri bulundu.`,
                        'Sonuçları Göster'
                    ).then(selection => {
                        if (selection === 'Sonuçları Göster') {
                            vscode.commands.executeCommand('workbench.panel.markers.view.focus');
                        }
                    });
                } else {
                    vscode.window.showInformationMessage('Harika! AI herhangi bir sorun bulamadı.');
                }
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            this.outputChannel.appendLine(`Hata: ${errorMessage}`);
            vscode.window.showErrorMessage(`Kod incelemesi sırasında hata: ${errorMessage}`);
        }
    }

    /**
     * Seçili dosyaları toplu olarak inceler
     * @param uris İncelenecek dosya URI'leri
     */
    async reviewMultipleFiles(uris: vscode.Uri[]): Promise<void> {
        const parallelCount = ConfigurationManager.getParallelReviewCount();
        
        const progress = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `AI Kod İncelemesi (${parallelCount} paralel)`,
            cancellable: true
        }, async (progress, token) => {
            const totalFiles = uris.length;
            let processedFiles = 0;
            let errorCount = 0;

            // Dosyaları paralel gruplar halinde işle
            for (let i = 0; i < uris.length; i += parallelCount) {
                if (token.isCancellationRequested) {
                    break;
                }

                // Mevcut batch'i al
                const batch = uris.slice(i, i + parallelCount);
                
                // Batch'teki dosyaları paralel olarak işle
                const batchPromises = batch.map(async (uri) => {
                    try {
                        const document = await vscode.workspace.openTextDocument(uri);
                        await this.reviewCurrentFile(document);
                        return { success: true, uri };
                    } catch (error) {
                        this.outputChannel.appendLine(`Dosya işlenirken hata (${uri.fsPath}): ${error}`);
                        return { success: false, uri, error };
                    }
                });

                // Batch'in tamamlanmasını bekle
                const batchResults = await Promise.all(batchPromises);
                
                // Sonuçları say
                const batchSuccessCount = batchResults.filter(r => r.success).length;
                const batchErrorCount = batchResults.filter(r => !r.success).length;
                
                processedFiles += batchSuccessCount;
                errorCount += batchErrorCount;

                // İlerleme durumunu güncelle
                const completedFiles = i + batch.length;
                progress.report({
                    increment: (batch.length / totalFiles) * 100,
                    message: `${Math.min(completedFiles, totalFiles)}/${totalFiles} dosya işlendi (${errorCount} hata)`
                });

                // Kısa bir bekleme süresi ekle (API rate limiting için)
                if (i + parallelCount < uris.length && !token.isCancellationRequested) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            return { processedFiles, errorCount };
        });

        const message = progress.errorCount > 0 
            ? `Toplu inceleme tamamlandı: ${progress.processedFiles} dosya başarılı, ${progress.errorCount} hata`
            : `Toplu inceleme tamamlandı: ${progress.processedFiles} dosya işlendi.`;
        
        if (progress.errorCount > 0) {
            vscode.window.showWarningMessage(message);
        } else {
            vscode.window.showInformationMessage(message);
        }
    }

    /**
     * Workspace'deki değişen dosyaları inceler
     */
    async reviewChangedFiles(): Promise<void> {
        try {
            // Git repository kontrolü
            const isGitRepo = await this.isGitRepository();
            if (!isGitRepo) {
                vscode.window.showErrorMessage(
                    'Bu özellik Git repository\'si gerektirir. Lütfen workspace\'inizi Git ile başlatın (git init) veya mevcut bir Git repository\'sinde çalışın.',
                    'Git Nasıl Başlatılır?'
                ).then(selection => {
                    if (selection === 'Git Nasıl Başlatılır?') {
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