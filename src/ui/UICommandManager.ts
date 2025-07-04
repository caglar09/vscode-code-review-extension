import * as vscode from 'vscode';
import { ConfigurationManager } from '../managers/ConfigurationManager';
import { ProviderFactory } from '../providers/ProviderFactory';
import { ConfigurationTreeProvider } from './ConfigurationTreeProvider';
import { StatusTreeProvider } from './StatusTreeProvider';
import { QuickActionsTreeProvider } from './QuickActionsTreeProvider';
import { SettingsMenu } from './SettingsMenu';

/**
 * UI komutlarını yöneten sınıf
 */
export class UICommandManager {
    private configTreeProvider: ConfigurationTreeProvider;
    private statusTreeProvider?: StatusTreeProvider;
    private quickActionsTreeProvider?: QuickActionsTreeProvider;

    constructor(configTreeProvider: ConfigurationTreeProvider, statusTreeProvider?: StatusTreeProvider, quickActionsTreeProvider?: QuickActionsTreeProvider) {
        this.configTreeProvider = configTreeProvider;
        this.statusTreeProvider = statusTreeProvider;
        this.quickActionsTreeProvider = quickActionsTreeProvider;
    }

    /**
     * UI komutlarını kaydeder
     */
    registerUICommands(context: vscode.ExtensionContext): void {
        const commands = [
            vscode.commands.registerCommand('freeAICodeReviewer.ui.selectProvider', () => this.selectProvider()),
            vscode.commands.registerCommand('freeAICodeReviewer.ui.selectModel', () => this.selectModel()),
            vscode.commands.registerCommand('freeAICodeReviewer.ui.setApiKey', () => this.setApiKey()),
            vscode.commands.registerCommand('freeAICodeReviewer.ui.setCustomEndpoint', () => this.setCustomEndpoint()),
            vscode.commands.registerCommand('freeAICodeReviewer.ui.editCustomPrompt', () => this.editCustomPrompt()),
            vscode.commands.registerCommand('freeAICodeReviewer.ui.testConnection', () => this.testConnection()),
            vscode.commands.registerCommand('freeAICodeReviewer.ui.resetConfiguration', () => this.resetConfiguration()),
            vscode.commands.registerCommand('freeAICodeReviewer.ui.refresh', () => this.refreshAllTrees()),
            vscode.commands.registerCommand('freeAICodeReviewer.ui.openSettings', () => SettingsMenu.openSettingsMenu())
        ];

        context.subscriptions.push(...commands);
    }

    /**
     * Sağlayıcı seçimi
     */
    private async selectProvider(): Promise<void> {
        try {
            const providers = ProviderFactory.getAvailableProviders();
            const currentConfig = ConfigurationManager.getProviderConfig();

            const providerItems = providers.map(provider => ({
                label: provider,
                description: provider === currentConfig.providerId ? '(Mevcut)' : '',
                value: provider
            }));

            const selectedProvider = await vscode.window.showQuickPick(providerItems, {
                placeHolder: 'AI sağlayıcısını seçin',
                title: 'Sağlayıcı Seçimi'
            });

            if (!selectedProvider) {
                return;
            }

            await ConfigurationManager.updateProviderConfig({
                providerId: selectedProvider.value,
                model: '' // Sağlayıcı değiştiğinde modeli sıfırla
            });

            vscode.window.showInformationMessage(`Sağlayıcı '${selectedProvider.value}' olarak ayarlandı.`);
            this.refreshAllTrees();

        } catch (error) {
            vscode.window.showErrorMessage(`Sağlayıcı seçilirken hata: ${error}`);
        }
    }

    /**
     * Model seçimi
     */
    private async selectModel(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();

            if (!config.providerId) {
                vscode.window.showWarningMessage('Önce bir sağlayıcı seçin.');
                return;
            }

            if (!config.apiKey) {
                vscode.window.showWarningMessage('Önce API anahtarını ayarlayın.');
                return;
            }

            // Loading göster
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Modeller yükleniyor...',
                cancellable: false
            }, async () => {
                try {
                    const models = await ConfigurationManager.getAvailableModels();

                    if (models.length === 0) {
                        vscode.window.showWarningMessage('Bu sağlayıcı için model bulunamadı.');
                        return;
                    }

                    const modelItems = models.map(model => ({
                        label: model,
                        description: model === config.model ? '(Mevcut)' : '',
                        value: model
                    }));

                    const selectedModel = await vscode.window.showQuickPick(modelItems, {
                        placeHolder: 'Model seçin',
                        title: 'Model Seçimi'
                    });

                    if (!selectedModel) {
                        return;
                    }

                    await ConfigurationManager.updateProviderConfig({
                        model: selectedModel.value
                    });

                    vscode.window.showInformationMessage(`Model '${selectedModel.value}' olarak ayarlandı.`);
                    this.refreshAllTrees();

                } catch (error) {
                    vscode.window.showErrorMessage(`Modeller yüklenirken hata: ${error}`);
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Model seçilirken hata: ${error}`);
        }
    }

    /**
     * API anahtarı ayarlama
     */
    private async setApiKey(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();

            if (!config.providerId) {
                vscode.window.showWarningMessage('Önce bir sağlayıcı seçin.');
                return;
            }

            const apiKey = await vscode.window.showInputBox({
                prompt: `${config.providerId} için API anahtarınızı girin`,
                password: true,
                value: config.apiKey,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'API anahtarı boş olamaz';
                    }
                    return null;
                }
            });

            if (apiKey === undefined) {
                return;
            }

            await ConfigurationManager.updateProviderConfig({
                apiKey: apiKey
            });

            vscode.window.showInformationMessage('API anahtarı başarıyla ayarlandı.');
            this.refreshAllTrees();

        } catch (error) {
            vscode.window.showErrorMessage(`API anahtarı ayarlanırken hata: ${error}`);
        }
    }

    /**
     * Özel prompt düzenleme
     */
    private async editCustomPrompt(): Promise<void> {
        try {
            const currentPrompt = ConfigurationManager.getCustomPrompt();

            const customPrompt = await vscode.window.showInputBox({
                prompt: 'Özel prompt\'unuzu girin',
                value: currentPrompt,
                placeHolder: 'Kod incelemesi için özel talimatlarınızı yazın...'
            });

            if (customPrompt === undefined) {
                return;
            }

            await ConfigurationManager.setCustomPrompt(customPrompt);
            vscode.window.showInformationMessage('Özel prompt başarıyla ayarlandı.');
            this.refreshAllTrees();

        } catch (error) {
            vscode.window.showErrorMessage(`Özel prompt ayarlanırken hata: ${error}`);
        }
    }

    /**
     * Özel endpoint ayarlama
     */
    private async setCustomEndpoint(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();

            if (config.providerId !== 'custom') {
                vscode.window.showWarningMessage('Bu özellik sadece özel sağlayıcı için kullanılabilir.');
                return;
            }

            const endpoint = await vscode.window.showInputBox({
                prompt: 'API endpoint URL\'sini girin',
                value: config.customEndpoint,
                placeHolder: 'https://api.example.com/v1/chat/completions',
                validateInput: (value) => {
                    if (!value || !value.startsWith('http')) {
                        return 'Geçerli bir URL girin';
                    }
                    return null;
                }
            });

            if (endpoint === undefined) {
                return;
            }

            // Özel başlıklar (opsiyonel)
            const headersInput = await vscode.window.showInputBox({
                prompt: 'Özel başlıklar (JSON formatında, opsiyonel)',
                value: JSON.stringify(config.customHeaders || {}),
                placeHolder: '{"X-Custom-Header": "value"}'
            });

            let customHeaders: Record<string, string> = {};
            if (headersInput && headersInput.trim()) {
                try {
                    customHeaders = JSON.parse(headersInput);
                } catch (error) {
                    vscode.window.showErrorMessage('Geçersiz JSON formatı');
                    return;
                }
            }

            await ConfigurationManager.updateProviderConfig({
                customEndpoint: endpoint,
                customHeaders: customHeaders
            });

            vscode.window.showInformationMessage('Özel endpoint başarıyla ayarlandı.');
            this.refreshAllTrees();

        } catch (error) {
            vscode.window.showErrorMessage(`Endpoint ayarlanırken hata: ${error}`);
        }
    }

    /**
     * Bağlantıyı test etme
     */
    private async testConnection(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();
            const validation = ConfigurationManager.validateConfig(config);

            if (!validation.isValid) {
                vscode.window.showErrorMessage(`Yapılandırma hatası: ${validation.error}`);
                return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Bağlantı test ediliyor...',
                cancellable: false
            }, async () => {
                try {
                    // Model listesi alarak bağlantıyı test et
                    const models = await ConfigurationManager.getAvailableModels();
                    
                    if (models.length > 0) {
                        vscode.window.showInformationMessage(
                            `✓ Bağlantı başarılı! ${models.length} model bulundu.`
                        );
                    } else {
                        vscode.window.showWarningMessage('Bağlantı kuruldu ancak model bulunamadı.');
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Bağlantı testi başarısız: ${error}`);
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Bağlantı test edilirken hata: ${error}`);
        }
    }

    /**
     * Yapılandırmayı sıfırlama
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
            this.refreshAllTrees();

        } catch (error) {
            vscode.window.showErrorMessage(`Yapılandırma sıfırlanırken hata: ${error}`);
        }
    }

    /**
     * Tüm tree provider'ları yeniler
     */
    private refreshAllTrees(): void {
        this.configTreeProvider.refresh();
        this.statusTreeProvider?.refresh();
        this.quickActionsTreeProvider?.refresh();
    }
}