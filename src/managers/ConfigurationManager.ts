import * as vscode from 'vscode';
import { ProviderConfig } from '../types';
import { ProviderFactory } from '../providers/ProviderFactory';

/**
 * Eklenti yapılandırmasını yöneten sınıf
 */
export class ConfigurationManager {
    private static readonly EXTENSION_ID = 'freeAICodeReviewer';
    private static readonly API_KEY_PREFIX = 'apiKey';

    /**
     * Mevcut sağlayıcı yapılandırmasını getirir
     * @returns Sağlayıcı yapılandırması
     */
    static getProviderConfig(): ProviderConfig {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);

        const providerId = config.get<string>('provider', 'openrouter');
        const model = config.get<string>('model', '');
        const customEndpoint = config.get<string>('customEndpoint', '');
        const customHeaders = config.get<Record<string, string>>('customHeaders', {});

        // API anahtarını güvenli depolamadan al
        const apiKey = this.getApiKey(providerId);

        return {
            providerId,
            model,
            apiKey,
            customEndpoint,
            customHeaders
        };
    }

    /**
     * Sağlayıcı yapılandırmasını günceller
     * @param config Yeni yapılandırma
     */
    static async updateProviderConfig(config: Partial<ProviderConfig>): Promise<void> {
        const workspaceConfig = vscode.workspace.getConfiguration(this.EXTENSION_ID);

        if (config.providerId !== undefined) {
            await workspaceConfig.update('provider', config.providerId, vscode.ConfigurationTarget.Global);
        }

        if (config.model !== undefined) {
            await workspaceConfig.update('model', config.model, vscode.ConfigurationTarget.Global);
        }

        if (config.customEndpoint !== undefined) {
            await workspaceConfig.update('customEndpoint', config.customEndpoint, vscode.ConfigurationTarget.Global);
        }

        if (config.customHeaders !== undefined) {
            await workspaceConfig.update('customHeaders', config.customHeaders, vscode.ConfigurationTarget.Global);
        }

        if (config.apiKey !== undefined) {
            await this.setApiKey(config.providerId || this.getProviderConfig().providerId, config.apiKey);
        }
    }

    /**
     * API anahtarını güvenli depolamadan getirir
     * @param providerId Sağlayıcı ID'si
     * @returns API anahtarı
     */
    static getApiKey(providerId: string): string {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        return config.get<string>(`${this.API_KEY_PREFIX}.${providerId}`, '');
    }

    /**
     * API anahtarını güvenli depolamaya kaydeder
     * @param providerId Sağlayıcı ID'si
     * @param apiKey API anahtarı
     */
    static async setApiKey(providerId: string, apiKey: string): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        await config.update(`${this.API_KEY_PREFIX}.${providerId}`, apiKey, vscode.ConfigurationTarget.Global);
    }

    /**
     * Yapılandırmanın geçerli olup olmadığını kontrol eder
     * @param config Kontrol edilecek yapılandırma
     * @returns Geçerlilik durumu ve hata mesajı
     */
    static validateConfig(config: ProviderConfig): { isValid: boolean; error?: string } {
        if (!config.providerId) {
            return { isValid: false, error: 'Sağlayıcı seçilmemiş.' };
        }

        if (!ProviderFactory.isProviderSupported(config.providerId)) {
            return { isValid: false, error: `Desteklenmeyen sağlayıcı: ${config.providerId}` };
        }

        if (!config.apiKey) {
            return { isValid: false, error: 'API anahtarı girilmemiş.' };
        }

        if (!config.model) {
            return { isValid: false, error: 'Model seçilmemiş.' };
        }

        if (config.providerId === 'custom' && !config.customEndpoint) {
            return { isValid: false, error: 'Özel sağlayıcı için endpoint gereklidir.' };
        }

        return { isValid: true };
    }

    /**
     * Mevcut sağlayıcı için kullanılabilir modelleri getirir
     * @returns Model listesi
     */
    static async getAvailableModels(): Promise<string[]> {
        try {
            const config = this.getProviderConfig();

            // Model listesi almak için sadece sağlayıcı ve API anahtarı kontrolü yap
            if (!config.providerId) {
                throw new Error('Sağlayıcı seçilmemiş.');
            }

            if (!ProviderFactory.isProviderSupported(config.providerId)) {
                throw new Error(`Desteklenmeyen sağlayıcı: ${config.providerId}`);
            }

            if (!config.apiKey) {
                throw new Error('API anahtarı girilmemiş.');
            }

            if (config.providerId === 'custom' && !config.customEndpoint) {
                throw new Error('Özel sağlayıcı için endpoint gereklidir.');
            }

            const provider = ProviderFactory.createProvider(config);
            return await provider.getModels(config.apiKey);
        } catch (error) {
            console.error('Model listesi alınırken hata:', error);
            throw error;
        }
    }

    /**
     * Yapılandırma değişikliklerini dinler
     * @param callback Değişiklik callback'i
     * @returns Disposable
     */
    static onConfigurationChanged(callback: () => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration(this.EXTENSION_ID)) {
                callback();
            }
        });
    }

    /**
     * Varsayılan yapılandırmayı sıfırlar
     */
    static async resetToDefaults(): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);

        await config.update('provider', 'openrouter', vscode.ConfigurationTarget.Global);
        await config.update('model', '', vscode.ConfigurationTarget.Global);
        await config.update('customEndpoint', '', vscode.ConfigurationTarget.Global);
        await config.update('customHeaders', {}, vscode.ConfigurationTarget.Global);

        // API anahtarlarını temizle
        const providers = ProviderFactory.getAvailableProviders();
        for (const providerId of providers) {
            await config.update(`${this.API_KEY_PREFIX}.${providerId}`, '', vscode.ConfigurationTarget.Global);
        }
    }
}