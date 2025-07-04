import * as vscode from 'vscode';
import { CodeReviewManager } from '../managers/CodeReviewManager';
import { ConfigurationManager } from '../managers/ConfigurationManager';
import { ProviderFactory } from '../providers/ProviderFactory';
import { ProviderConfig } from '../types';

/**
 * Class that manages extension commands
 */
export class CommandManager {
    private codeReviewManager: CodeReviewManager;

    constructor(codeReviewManager: CodeReviewManager) {
        this.codeReviewManager = codeReviewManager;
    }

    /**
     * Registers all commands
     * @param context Extension context
     */
    registerCommands(context: vscode.ExtensionContext): void {
        // Command to set API key
        const setApiKeyCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.setApiKey',
            () => this.setApiKey()
        );

        // Command to review current file
        const reviewCurrentFileCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.reviewCurrentFile',
            () => this.reviewCurrentFile()
        );

        // Command to review selected files
        const reviewSelectedFilesCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.reviewSelectedFiles',
            (uri: vscode.Uri, uris: vscode.Uri[]) => this.reviewSelectedFiles(uri, uris)
        );

        // Command to review changed files
        const reviewChangedFilesCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.reviewChangedFiles',
            () => this.reviewChangedFiles()
        );

        // Command to clear diagnostics
        const clearDiagnosticsCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.clearDiagnostics',
            () => this.clearDiagnostics()
        );

        // Command to configure provider
        const configureProviderCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.configureProvider',
            () => this.configureProvider()
        );

        // Command to select model
        const selectModelCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.selectModel',
            () => this.selectModel()
        );

        // Command to show statistics
        const showStatisticsCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.showStatistics',
            () => this.showStatistics()
        );

        // UI commands are registered in UICommandManager, so they are removed from here

        const clearReviewResultsCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.clearReviewResults',
            () => this.clearDiagnostics()
        );

        // Add commands to the context
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
     * Command to set the API key
     */
    private async setApiKey(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();
            const providers = ProviderFactory.getAvailableProviders();

            // Provider selection
            const selectedProvider = await vscode.window.showQuickPick(
                providers.map(p => ({ label: p, value: p })),
                {
                    placeHolder: 'Select AI provider',
                    title: 'Provider Selection'
                }
            );

            if (!selectedProvider) {
                return;
            }

            // API key input
            const apiKey = await vscode.window.showInputBox({
                prompt: `Enter your API key for ${selectedProvider.value}`,
                password: true,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'API key cannot be empty';
                    }
                    return null;
                }
            });

            if (!apiKey) {
                return;
            }

            // Additional information for custom provider
            let customEndpoint = '';
            let customHeaders: Record<string, string> = {};

            if (selectedProvider.value === 'custom') {
                customEndpoint = await vscode.window.showInputBox({
                    prompt: 'Enter the API endpoint URL',
                    placeHolder: 'https://api.example.com/v1/chat/completions',
                    validateInput: (value) => {
                        if (!value || !value.startsWith('http')) {
                            return 'Enter a valid URL';
                        }
                        return null;
                    }
                }) || '';

                if (!customEndpoint) {
                    return;
                }

                // Custom headers (optional)
                const headersInput = await vscode.window.showInputBox({
                    prompt: 'Custom headers (in JSON format, optional)',
                    placeHolder: '{"X-Custom-Header": "value"}'
                });

                if (headersInput && headersInput.trim()) {
                    try {
                        customHeaders = JSON.parse(headersInput);
                    } catch (error) {
                        vscode.window.showErrorMessage('Invalid JSON format');
                        return;
                    }
                }
            }

            // Update configuration
            await ConfigurationManager.updateProviderConfig({
                providerId: selectedProvider.value,
                apiKey,
                customEndpoint,
                customHeaders
            });

            vscode.window.showInformationMessage(
                `API key for ${selectedProvider.value} provider has been set successfully.`
            );

        } catch (error) {
            vscode.window.showErrorMessage(`Error setting API key: ${error}`);
        }
    }

    /**
     * Command to review the current file
     */
    private async reviewCurrentFile(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('No active file found.');
            return;
        }

        await this.codeReviewManager.reviewCurrentFile(activeEditor.document);
    }

    /**
     * Command to review selected files
     */
    private async reviewSelectedFiles(uri: vscode.Uri, uris: vscode.Uri[]): Promise<void> {
        const filesToReview = uris && uris.length > 0 ? uris : [uri];
        await this.codeReviewManager.reviewMultipleFiles(filesToReview);
    }

    /**
     * Command to review changed files
     */
    private async reviewChangedFiles(): Promise<void> {
        await this.codeReviewManager.reviewChangedFiles();
    }

    /**
     * Command to clear diagnostics
     */
    private clearDiagnostics(): void {
        this.codeReviewManager.clearAllReviews();
    }

    /**
     * Command to configure the provider
     */
    private async configureProvider(): Promise<void> {
        try {
            console.log('configureProvider started');
            
            const providers = ProviderFactory.getAvailableProviders();
            console.log('Available providers:', providers);
            
            const currentConfig = ConfigurationManager.getProviderConfig();
            console.log('Current configuration:', currentConfig);

            const selectedProvider = await vscode.window.showQuickPick(
                providers.map(p => ({
                    label: p,
                    description: p === currentConfig.providerId ? '(Current)' : '',
                    value: p
                })),
                {
                    placeHolder: 'Select AI provider',
                    title: 'Provider Configuration'
                }
            );

            if (!selectedProvider) {
                console.log('User did not select a provider');
                return;
            }

            console.log('Selected provider:', selectedProvider.value);
            
            await ConfigurationManager.updateProviderConfig({
                providerId: selectedProvider.value
            });

            vscode.window.showInformationMessage(
                `Provider set to ${selectedProvider.value}. Do not forget to select a model.`
            );
            
            console.log('configureProvider completed successfully');
            
        } catch (error) {
            console.error('configureProvider error:', error);
            vscode.window.showErrorMessage(`Error configuring provider: ${error}`);
        }
    }

    /**
     * Command to select a model
     */
    private async selectModel(): Promise<void> {
        try {
            const models = await ConfigurationManager.getAvailableModels();
            
            if (models.length === 0) {
                vscode.window.showWarningMessage('No available models found. Please check your API key.');
                return;
            }

            const currentConfig = ConfigurationManager.getProviderConfig();
            const selectedModel = await vscode.window.showQuickPick(
                models.map(model => ({
                    label: model,
                    description: model === currentConfig.model ? '(Current)' : '',
                    value: model
                })),
                {
                    placeHolder: 'Select the AI model',
                    title: 'Model Selection'
                }
            );

            if (!selectedModel) {
                return;
            }

            await ConfigurationManager.updateProviderConfig({
                model: selectedModel.value
            });

            vscode.window.showInformationMessage(
                `Model set to ${selectedModel.value}.`
            );

        } catch (error) {
            vscode.window.showErrorMessage(`Error getting model list: ${error}`);
        }
    }

    /**
     * Command to show statistics
     */
    private showStatistics(): void {
        this.codeReviewManager.showReviewStatistics();
    }

    /**
     * Command to set custom endpoint
     */
    private async setCustomEndpoint(): Promise<void> {
        try {
            const currentConfig = ConfigurationManager.getProviderConfig();
            
            const customEndpoint = await vscode.window.showInputBox({
                prompt: 'Enter API endpoint URL',
                placeHolder: 'https://api.example.com/v1/chat/completions',
                value: currentConfig.customEndpoint || '',
                validateInput: (value) => {
                    if (!value || !value.startsWith('http')) {
                        return 'Enter a valid URL';
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

            vscode.window.showInformationMessage('Custom endpoint set successfully.');

        } catch (error) {
            vscode.window.showErrorMessage(`Error setting endpoint: ${error}`);
        }
    }

    /**
     * Command to set parallel review count
     */
    private async setParallelReviewCount(): Promise<void> {
        try {
            const currentCount = ConfigurationManager.getParallelReviewCount();
            
            const countOptions = [];
            for (let i = 1; i <= 10; i++) {
                countOptions.push({
                    label: `${i} files`,
                    description: i === currentCount ? '(Current)' : '',
                    value: i
                });
            }

            const selectedCount = await vscode.window.showQuickPick(countOptions, {
                placeHolder: 'Select parallel review count',
                title: 'Parallel Review Count'
            });

            if (!selectedCount) {
                return;
            }

            await ConfigurationManager.updateParallelReviewCount(selectedCount.value);

            vscode.window.showInformationMessage(
                `Parallel review count set to ${selectedCount.value}.`
            );

        } catch (error) {
            vscode.window.showErrorMessage(`Error setting parallel review count: ${error}`);
        }
    }

    /**
     * Command to test connection
     */
    private async testConnection(): Promise<void> {
        try {
            const config = ConfigurationManager.getProviderConfig();
            
            if (!config.providerId || !config.apiKey || !config.model) {
                vscode.window.showWarningMessage('Please configure provider, API key and model settings first.');
                return;
            }

            vscode.window.showInformationMessage('Testing connection...');

            // Send a simple test request
            const provider = ProviderFactory.createProvider(config);
            await provider.performReview(config.apiKey, config.model, '// Test code\nconsole.log("test");', 'javascript');

            vscode.window.showInformationMessage('Connection successful!');

        } catch (error) {
            vscode.window.showErrorMessage(`Connection test failed: ${error}`);
        }
    }

    /**
     * Command to reset configuration
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
            vscode.window.showInformationMessage('Configuration reset successfully.');

        } catch (error) {
            vscode.window.showErrorMessage(`Error resetting configuration: ${error}`);
        }
    }
}