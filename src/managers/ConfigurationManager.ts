import * as vscode from 'vscode';
import { ProviderConfig } from '../types';
import { ProviderFactory } from '../providers/ProviderFactory';

/**
 * Class that manages extension configuration
 */
export class ConfigurationManager {
    private static readonly EXTENSION_ID = 'freeAICodeReviewer';
    private static readonly API_KEY_PREFIX = 'apiKey';

    /**
     * Returns the current provider configuration
     * @returns Provider configuration
     */
    static getProviderConfig(): ProviderConfig {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);

        const providerId = config.get<string>('provider', 'openrouter');
        const model = config.get<string>('model', '');
        const customEndpoint = config.get<string>('customEndpoint', '');
        const customHeaders = config.get<Record<string, string>>('customHeaders', {});

        // Retrieve the API key from secure storage
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
     * Returns the custom prompt setting
     * @returns Custom prompt text
     */
    static getCustomPrompt(): string {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        return config.get<string>('customPrompt', '');
    }

    /**
     * Updates the custom prompt setting
     * @param customPrompt New custom prompt text
     */
    static async setCustomPrompt(customPrompt: string): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        await config.update('customPrompt', customPrompt, vscode.ConfigurationTarget.Global);
    }

    /**
     * Updates the provider configuration
     * @param config New configuration
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
     * Retrieves the API key from secure storage
     * @param providerId Provider ID
     * @returns API key
     */
    static getApiKey(providerId: string): string {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        return config.get<string>(`${this.API_KEY_PREFIX}.${providerId}`, '');
    }

    /**
     * Stores the API key in secure storage
     * @param providerId Provider ID
     * @param apiKey API key
     */
    static async setApiKey(providerId: string, apiKey: string): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        await config.update(`${this.API_KEY_PREFIX}.${providerId}`, apiKey, vscode.ConfigurationTarget.Global);
    }

    /**
     * Validates the configuration
     * @param config Configuration to validate
     * @returns Validation status and error message (if any)
     */
    static validateConfig(config: ProviderConfig): { isValid: boolean; error?: string } {
        if (!config.providerId) {
            return { isValid: false, error: 'No provider selected.' };
        }

        if (!ProviderFactory.isProviderSupported(config.providerId)) {
            return { isValid: false, error: `Unsupported provider: ${config.providerId}` };
        }

        if (!config.apiKey) {
            return { isValid: false, error: 'API key is missing.' };
        }

        if (!config.model) {
            return { isValid: false, error: 'No model selected.' };
        }

        if (config.providerId === 'custom' && !config.customEndpoint) {
            return { isValid: false, error: 'Endpoint is required for custom provider.' };
        }

        return { isValid: true };
    }

    /**
     * Fetches available models for the current provider
     * @returns List of models
     */
    static async getAvailableModels(): Promise<string[]> {
        try {
            const config = this.getProviderConfig();

            // Only check provider and API key to fetch models
            if (!config.providerId) {
                throw new Error('No provider selected.');
            }

            if (!ProviderFactory.isProviderSupported(config.providerId)) {
                throw new Error(`Unsupported provider: ${config.providerId}`);
            }

            if (!config.apiKey) {
                throw new Error('API key is missing.');
            }

            if (config.providerId === 'custom' && !config.customEndpoint) {
                throw new Error('Endpoint is required for custom provider.');
            }

            const provider = ProviderFactory.createProvider(config);
            return await provider.getModels(config.apiKey);
        } catch (error) {
            console.error('Error fetching model list:', error);
            throw error;
        }
    }

    /**
     * Watches for configuration changes
     * @param callback Change handler callback
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
     * Returns the parallel review count
     * @returns Number of parallel reviews (between 1 and 10)
     */
    static getParallelReviewCount(): number {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        const count = config.get<number>('parallelReviewCount', 3);

        // Safety check: must be between 1 and 10
        return Math.max(1, Math.min(10, count));
    }

    /**
     * Updates the parallel review count
     * @param count New parallel review count (between 1 and 10)
     */
    static async updateParallelReviewCount(count: number): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        const validCount = Math.max(1, Math.min(10, count));
        await config.update('parallelReviewCount', validCount, vscode.ConfigurationTarget.Global);
    }

    /**
     * Resets all settings to default values
     */
    static async resetToDefaults(): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);

        await config.update('provider', 'openrouter', vscode.ConfigurationTarget.Global);
        await config.update('model', '', vscode.ConfigurationTarget.Global);
        await config.update('customEndpoint', '', vscode.ConfigurationTarget.Global);
        await config.update('customHeaders', {}, vscode.ConfigurationTarget.Global);
        await config.update('parallelReviewCount', 3, vscode.ConfigurationTarget.Global);
        await config.update('customPrompt', '', vscode.ConfigurationTarget.Global);

        // Clear all API keys
        const providers = ProviderFactory.getAvailableProviders();
        for (const providerId of providers) {
            await config.update(`${this.API_KEY_PREFIX}.${providerId}`, '', vscode.ConfigurationTarget.Global);
        }
    }
}