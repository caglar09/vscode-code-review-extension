import * as vscode from 'vscode';
import { ConfigurationManager } from '../managers/ConfigurationManager';
import { CodeReviewManager } from '../managers/CodeReviewManager';
import { ProviderFactory } from '../providers/ProviderFactory';

/**
 * Eklenti komutlarını yöneten sınıf
 */
export class CommandManager {
    private codeReviewManager: CodeReviewManager;

    constructor(codeReviewManager: CodeReviewManager) {
        this.codeReviewManager = codeReviewManager;
    }

    /**
     * Tüm komutları kaydeder
     * @param context Eklenti bağlamı
     */
    registerCommands(context: vscode.ExtensionContext): void {
        // API anahtarı ayarlama komutu
        const setApiKeyCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.setApiKey',
            () => this.setApiKey()
        );

        // Mevcut dosyayı inceleme komutu
        const reviewCurrentFileCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.reviewCurrentFile',
            () => this.reviewCurrentFile()
        );

        // Seçili dosyaları inceleme komutu
        const reviewSelectedFilesCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.reviewSelectedFiles',
            (uri: vscode.Uri, uris: vscode.Uri[]) => this.reviewSelectedFiles(uri, uris)
        );

        // Değişen dosyaları inceleme komutu
        const reviewChangedFilesCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.reviewChangedFiles',
            () => this.reviewChangedFiles()
        );

        // Sonuçları temizleme komutu
        const clearDiagnosticsCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.clearDiagnostics',
            () => this.clearDiagnostics()
        );

        // Sağlayıcı yapılandırma komutu
        const configureProviderCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.configureProvider',
            () => this.configureProvider()
        );

        // Model seçme komutu
        const selectModelCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.selectModel',
            () => this.selectModel()
        );

        // İstatistikleri gösterme komutu
        const showStatisticsCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.showStatistics',
            () => this.showStatistics()
        );

        // Komutları context'e ekle
        context.subscriptions.push(
            setApiKeyCommand,
            reviewCurrentFileCommand,
            reviewSelectedFilesCommand,
            reviewChangedFilesCommand,
            clearDiagnosticsCommand,
            configureProviderCommand,
            selectModelCommand,
            showStatisticsCommand
        );
    }

    /**
     * API anahtarı ayarlama komutu
     */
    private async setApiKey(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();
            const providers = ProviderFactory.getAvailableProviders();

            // Sağlayıcı seçimi
            const selectedProvider = await vscode.window.showQuickPick(
                providers.map(p => ({ label: p, value: p })),
                {
                    placeHolder: 'AI sağlayıcısını seçin',
                    title: 'Sağlayıcı Seçimi'
                }
            );

            if (!selectedProvider) {
                return;
            }

            // API anahtarı girişi
            const apiKey = await vscode.window.showInputBox({
                prompt: `${selectedProvider.value} için API anahtarınızı girin`,
                password: true,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'API anahtarı boş olamaz';
                    }
                    return null;
                }
            });

            if (!apiKey) {
                return;
            }

            // Özel sağlayıcı için ek bilgiler
            let customEndpoint = '';
            let customHeaders: Record<string, string> = {};

            if (selectedProvider.value === 'custom') {
                customEndpoint = await vscode.window.showInputBox({
                    prompt: 'API endpoint URL\'sini girin',
                    placeHolder: 'https://api.example.com/v1/chat/completions',
                    validateInput: (value) => {
                        if (!value || !value.startsWith('http')) {
                            return 'Geçerli bir URL girin';
                        }
                        return null;
                    }
                }) || '';

                if (!customEndpoint) {
                    return;
                }

                // Özel başlıklar (opsiyonel)
                const headersInput = await vscode.window.showInputBox({
                    prompt: 'Özel başlıklar (JSON formatında, opsiyonel)',
                    placeHolder: '{"X-Custom-Header": "value"}'
                });

                if (headersInput && headersInput.trim()) {
                    try {
                        customHeaders = JSON.parse(headersInput);
                    } catch (error) {
                        vscode.window.showErrorMessage('Geçersiz JSON formatı');
                        return;
                    }
                }
            }

            // Yapılandırmayı güncelle
            await ConfigurationManager.updateProviderConfig({
                providerId: selectedProvider.value,
                apiKey,
                customEndpoint,
                customHeaders
            });

            vscode.window.showInformationMessage(
                `${selectedProvider.value} sağlayıcısı için API anahtarı başarıyla ayarlandı.`
            );

        } catch (error) {
            vscode.window.showErrorMessage(`API anahtarı ayarlanırken hata: ${error}`);
        }
    }

    /**
     * Mevcut dosyayı inceleme komutu
     */
    private async reviewCurrentFile(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('Aktif bir dosya bulunamadı.');
            return;
        }

        await this.codeReviewManager.reviewCurrentFile(activeEditor.document);
    }

    /**
     * Seçili dosyaları inceleme komutu
     */
    private async reviewSelectedFiles(uri: vscode.Uri, uris: vscode.Uri[]): Promise<void> {
        const filesToReview = uris && uris.length > 0 ? uris : [uri];
        await this.codeReviewManager.reviewMultipleFiles(filesToReview);
    }

    /**
     * Değişen dosyaları inceleme komutu
     */
    private async reviewChangedFiles(): Promise<void> {
        await this.codeReviewManager.reviewChangedFiles();
    }

    /**
     * Tanılamaları temizleme komutu
     */
    private clearDiagnostics(): void {
        this.codeReviewManager.clearAllReviews();
    }

    /**
     * Sağlayıcı yapılandırma komutu
     */
    private async configureProvider(): Promise<void> {
        try {
            console.log('configureProvider başlatıldı');
            
            const providers = ProviderFactory.getAvailableProviders();
            console.log('Mevcut sağlayıcılar:', providers);
            
            const currentConfig = ConfigurationManager.getProviderConfig();
            console.log('Mevcut yapılandırma:', currentConfig);

            const selectedProvider = await vscode.window.showQuickPick(
                providers.map(p => ({
                    label: p,
                    description: p === currentConfig.providerId ? '(Mevcut)' : '',
                    value: p
                })),
                {
                    placeHolder: 'AI sağlayıcısını seçin',
                    title: 'Sağlayıcı Yapılandırması'
                }
            );

            if (!selectedProvider) {
                console.log('Kullanıcı sağlayıcı seçmedi');
                return;
            }

            console.log('Seçilen sağlayıcı:', selectedProvider.value);
            
            await ConfigurationManager.updateProviderConfig({
                providerId: selectedProvider.value
            });

            vscode.window.showInformationMessage(
                `Sağlayıcı ${selectedProvider.value} olarak ayarlandı. Model seçmeyi unutmayın.`
            );
            
            console.log('configureProvider başarıyla tamamlandı');
            
        } catch (error) {
            console.error('configureProvider hatası:', error);
            vscode.window.showErrorMessage(`Sağlayıcı yapılandırılırken hata: ${error}`);
        }
    }

    /**
     * Model seçme komutu
     */
    private async selectModel(): Promise<void> {
        try {
            const models = await ConfigurationManager.getAvailableModels();
            
            if (models.length === 0) {
                vscode.window.showWarningMessage('Kullanılabilir model bulunamadı. API anahtarınızı kontrol edin.');
                return;
            }

            const currentConfig = ConfigurationManager.getProviderConfig();
            const selectedModel = await vscode.window.showQuickPick(
                models.map(model => ({
                    label: model,
                    description: model === currentConfig.model ? '(Mevcut)' : '',
                    value: model
                })),
                {
                    placeHolder: 'AI modelini seçin',
                    title: 'Model Seçimi'
                }
            );

            if (!selectedModel) {
                return;
            }

            await ConfigurationManager.updateProviderConfig({
                model: selectedModel.value
            });

            vscode.window.showInformationMessage(
                `Model ${selectedModel.value} olarak ayarlandı.`
            );

        } catch (error) {
            vscode.window.showErrorMessage(`Model listesi alınırken hata: ${error}`);
        }
    }

    /**
     * İstatistikleri gösterme komutu
     */
    private showStatistics(): void {
        this.codeReviewManager.showReviewStatistics();
    }
}