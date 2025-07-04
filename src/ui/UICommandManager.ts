import * as vscode from 'vscode';
import { ConfigurationManager } from '../managers/ConfigurationManager';
import { ProviderFactory } from '../providers/ProviderFactory';
import { ConfigurationTreeProvider } from './ConfigurationTreeProvider';
import { StatusTreeProvider } from './StatusTreeProvider';
import { QuickActionsTreeProvider } from './QuickActionsTreeProvider';
import { SettingsMenu } from './SettingsMenu';

/**
 * Class that manages UI commands
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
     * Registers UI commands
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
     * Provider selection
     */
    private async selectProvider(): Promise<void> {
        try {
            const providers = ProviderFactory.getAvailableProviders();
            const currentConfig = ConfigurationManager.getProviderConfig();

            const providerItems = providers.map(provider => ({
                label: provider,
                description: provider === currentConfig.providerId ? '(Current)' : '',
                value: provider
            }));

            const selectedProvider = await vscode.window.showQuickPick(providerItems, {
                placeHolder: 'Select AI provider',
                title: 'Provider Selection'
            });

            if (!selectedProvider) {
                return;
            }

            await ConfigurationManager.updateProviderConfig({
                providerId: selectedProvider.value,
                model: '' // Reset model when provider changes
            });

            vscode.window.showInformationMessage(`Provider set to '${selectedProvider.value}'.`);
            this.refreshAllTrees();

        } catch (error) {
            vscode.window.showErrorMessage(`Error selecting provider: ${error}`);
        }
    }

    /**
     * Model selection
     */
    private async selectModel(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();

            if (!config.providerId) {
                vscode.window.showWarningMessage('Please select a provider first.');
                return;
            }

            if (!config.apiKey) {
                vscode.window.showWarningMessage('Please set the API key first.')
                return;
            }

            // Show loading
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Loading models...',
                cancellable: false
            }, async () => {
                try {
                    const models = await ConfigurationManager.getAvailableModels();

                    if (models.length === 0) {
                        vscode.window.showWarningMessage('No models found for this provider.');
                        return;
                    }

                    const modelItems = models.map(model => ({
                        label: model,
                        description: model === config.model ? '(Current)' : '',
                        value: model
                    }));

                    const selectedModel = await vscode.window.showQuickPick(modelItems, {
                        placeHolder: 'Select model',
                        title: 'Model Selection'
                    });

                    if (!selectedModel) {
                        return;
                    }

                    await ConfigurationManager.updateProviderConfig({
                        model: selectedModel.value
                    });

                    vscode.window.showInformationMessage(`Model set to '${selectedModel.value}'.`);
                    this.refreshAllTrees();

                } catch (error) {
                    vscode.window.showErrorMessage(`Error loading models: ${error}`);
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error selecting model: ${error}`);
        }
    }

    /**
     * API key setup
     */
    private async setApiKey(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();

            if (!config.providerId) {
                vscode.window.showWarningMessage('Please select a provider first.');
                return;
            }

            const apiKey = await vscode.window.showInputBox({
                prompt: `Enter your API key for ${config.providerId}`,
                password: true,
                value: config.apiKey,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'API key cannot be empty';
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

            vscode.window.showInformationMessage('API key successfully set.');
            this.refreshAllTrees();

        } catch (error) {
            vscode.window.showErrorMessage(`Error setting API key: ${error}`);
        }
    }

    /**
     * Custom prompt editing
     */
    private async editCustomPrompt(): Promise<void> {
        try {
            const currentPrompt = ConfigurationManager.getCustomPrompt();

            const customPrompt = await vscode.window.showInputBox({
                prompt: 'Enter your custom prompt',
                value: currentPrompt,
                placeHolder: 'Write your custom instructions for code review...'
            });

            if (customPrompt === undefined) {
                return;
            }

            await ConfigurationManager.setCustomPrompt(customPrompt);
            vscode.window.showInformationMessage('Custom prompt successfully set.');
            this.refreshAllTrees();

        } catch (error) {
            vscode.window.showErrorMessage(`Error setting custom prompt: ${error}`);
        }
    }

    /**
     * Custom endpoint setup
     */
    private async setCustomEndpoint(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();

            if (config.providerId !== 'custom') {
                vscode.window.showWarningMessage('This feature is only available for custom provider.');
                return;
            }

            const endpoint = await vscode.window.showInputBox({
                prompt: 'Enter API endpoint URL',
                value: config.customEndpoint,
                placeHolder: 'https://api.example.com/v1/chat/completions',
                validateInput: (value) => {
                    if (!value || !value.startsWith('http')) {
                        return 'Enter a valid URL';
                    }
                    return null;
                }
            });

            if (endpoint === undefined) {
                return;
            }

            // Custom headers (optional)
            const headersInput = await vscode.window.showInputBox({
                prompt: 'Custom headers (JSON format, optional)',
                value: JSON.stringify(config.customHeaders || {}),
                placeHolder: '{"X-Custom-Header": "value"}'
            });

            let customHeaders: Record<string, string> = {};
            if (headersInput && headersInput.trim()) {
                try {
                    customHeaders = JSON.parse(headersInput);
                } catch (error) {
                    vscode.window.showErrorMessage('Invalid JSON format');
                    return;
                }
            }

            await ConfigurationManager.updateProviderConfig({
                customEndpoint: endpoint,
                customHeaders: customHeaders
            });

            vscode.window.showInformationMessage('Custom endpoint successfully set.');
            this.refreshAllTrees();

        } catch (error) {
            vscode.window.showErrorMessage(`Error setting endpoint: ${error}`);
        }
    }

    /**
     * Test connection
     */
    private async testConnection(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();
            const validation = ConfigurationManager.validateConfig(config);

            if (!validation.isValid) {
                vscode.window.showErrorMessage(`Configuration error: ${validation.error}`);
                return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Testing connection...',
                cancellable: false
            }, async () => {
                try {
                    // Test connection by getting model list
                    const models = await ConfigurationManager.getAvailableModels();

                    if (models.length > 0) {
                        vscode.window.showInformationMessage(
                            `✓ Connection successful! ${models.length} models found.`
                        );
                    } else {
                        vscode.window.showWarningMessage('Connection established but no models found.');
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Connection test failed: ${error}`);
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error testing connection: ${error}`);
        }
    }

    /**
     * Reset configuration
     */
    private async resetConfiguration(): Promise<void> {
        try {
            const confirmation = await vscode.window.showWarningMessage(
                'All configuration settings will be reset. Do you want to continue?',
                { modal: true },
                'Yes',
                'No'
            );

            if (confirmation !== 'Yes') {
                return;
            }

            await ConfigurationManager.resetToDefaults();
            vscode.window.showInformationMessage('Configuration successfully reset.');
            this.refreshAllTrees();

        } catch (error) {
            vscode.window.showErrorMessage(`Error resetting configuration: ${error}`);
        }
    }

    /**
     * Refreshes all tree providers
     */
    private refreshAllTrees(): void {
        this.configTreeProvider.refresh();
        this.statusTreeProvider?.refresh();
        this.quickActionsTreeProvider?.refresh();
    }
}