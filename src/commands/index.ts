import * as vscode from 'vscode';
import { CodeReviewManager } from '../managers/CodeReviewManager';
import { ConfigurationManager } from '../managers/ConfigurationManager';
import { ProviderFactory } from '../providers/ProviderFactory';
import { ProviderConfig } from '../types';

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

        // UI komutları UICommandManager'da kayıtlı olduğu için burada kaldırıldı

        const clearReviewResultsCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.clearReviewResults',
            () => this.clearDiagnostics()
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
            showStatisticsCommand,
            clearReviewResultsCommand
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

    /**
     * Özel endpoint ayarlama komutu
     */
    private async setCustomEndpoint(): Promise<void> {
        try {
            const currentConfig = ConfigurationManager.getProviderConfig();
            
            const customEndpoint = await vscode.window.showInputBox({
                prompt: 'API endpoint URL\'sini girin',
                placeHolder: 'https://api.example.com/v1/chat/completions',
                value: currentConfig.customEndpoint || '',
                validateInput: (value) => {
                    if (!value || !value.startsWith('http')) {
                        return 'Geçerli bir URL girin';
                    }
                    return null;
                }
            });

            if (customEndpoint === undefined) {
                return;
            }

            await ConfigurationManager.updateProviderConfig({
                customEndpoint
            });

            vscode.window.showInformationMessage('Özel endpoint başarıyla ayarlandı.');

        } catch (error) {
            vscode.window.showErrorMessage(`Endpoint ayarlanırken hata: ${error}`);
        }
    }

    /**
     * Paralel inceleme sayısını ayarlama komutu
     */
    private async setParallelReviewCount(): Promise<void> {
        try {
            const currentCount = ConfigurationManager.getParallelReviewCount();
            
            const countOptions = [];
            for (let i = 1; i <= 10; i++) {
                countOptions.push({
                    label: `${i} dosya`,
                    description: i === currentCount ? '(Mevcut)' : '',
                    value: i
                });
            }

            const selectedCount = await vscode.window.showQuickPick(countOptions, {
                placeHolder: 'Paralel inceleme sayısını seçin',
                title: 'Paralel İnceleme Sayısı'
            });

            if (!selectedCount) {
                return;
            }

            await ConfigurationManager.updateParallelReviewCount(selectedCount.value);

            vscode.window.showInformationMessage(
                `Paralel inceleme sayısı ${selectedCount.value} olarak ayarlandı.`
            );

        } catch (error) {
            vscode.window.showErrorMessage(`Paralel inceleme sayısı ayarlanırken hata: ${error}`);
        }
    }

    /**
     * Bağlantı testi komutu
     */
    private async testConnection(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();
            
            if (!config.providerId || !config.apiKey || !config.model) {
                vscode.window.showWarningMessage('Önce sağlayıcı, API anahtarı ve model ayarlarını yapın.');
                return;
            }

            vscode.window.showInformationMessage('Bağlantı test ediliyor...');

            // Basit bir test isteği gönder
            const provider = ProviderFactory.createProvider(config);
            await provider.performReview(config.apiKey, config.model, '// Test kodu\nconsole.log("test");', 'javascript');

            vscode.window.showInformationMessage('Bağlantı başarılı!');

        } catch (error) {
            vscode.window.showErrorMessage(`Bağlantı testi başarısız: ${error}`);
        }
    }

    /**
     * Yapılandırmayı sıfırlama komutu
     */
    private async resetConfiguration(): Promise<void> {
        try {
            const confirmation = await vscode.window.showWarningMessage(
                'Tüm yapılandırma ayarları sıfırlanacak. Devam etmek istiyor musunuz?',
                { modal: true },
                'Evet',
                'Hayır'
            );

            if (confirmation !== 'Evet') {
                return;
            }

            await ConfigurationManager.resetToDefaults();
            vscode.window.showInformationMessage('Yapılandırma başarıyla sıfırlandı.');

        } catch (error) {
            vscode.window.showErrorMessage(`Yapılandırma sıfırlanırken hata: ${error}`);
        }
    }
}