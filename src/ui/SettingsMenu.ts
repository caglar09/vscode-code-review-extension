import * as vscode from 'vscode';
import { ConfigurationManager } from '../managers/ConfigurationManager';

/**
 * Options for settings menu
 */
interface SettingsOption {
    label: string;
    description: string;
    command: string;
    icon?: string;
}

/**
 * Class that manages the settings menu
 */
export class SettingsMenu {
    /**
     * Opens the settings menu
     */
    public static async openSettingsMenu(): Promise<void> {
        const options = this.getSettingsOptions();
        
        const quickPick = vscode.window.createQuickPick<SettingsOption>();
        quickPick.title = '⚙️ AI Code Reviewer Settings';
        quickPick.placeholder = 'Select a setting...';
        quickPick.items = options;
        quickPick.matchOnDescription = true;
        
        quickPick.onDidChangeSelection(async (selection) => {
            if (selection[0]) {
                quickPick.hide();
                await vscode.commands.executeCommand(selection[0].command);
            }
        });
        
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    }
    
    /**
     * Returns setting options
     */
    private static getSettingsOptions(): SettingsOption[] {
        const config = ConfigurationManager.getProviderConfig();
        
        const options: SettingsOption[] = [
            {
                label: '$(cloud) Select Provider',
                description: `Current: ${config.providerId || 'Not Selected'}`,
                command: 'freeAICodeReviewer.ui.selectProvider',
                icon: 'cloud'
            },
            {
                label: '$(gear) Select Model',
                description: `Current: ${config.model || 'Not Selected'}`,
                command: 'freeAICodeReviewer.ui.selectModel',
                icon: 'gear'
            },
            {
                label: '$(key) Set API Key',
                description: config.apiKey ? 'Set' : 'Not Set',
                command: 'freeAICodeReviewer.ui.setApiKey',
                icon: 'key'
            }
        ];
        
        // Endpoint setting for custom provider
        if (config.providerId === 'custom') {
            options.push({
                label: '$(link) Set Custom Endpoint',
                description: config.customEndpoint || 'Not Set',
                command: 'freeAICodeReviewer.ui.setCustomEndpoint',
                icon: 'link'
            });
        }
        
        // Parallel review count
        const parallelCount = ConfigurationManager.getParallelReviewCount();
        options.push({
            label: '$(list-ordered) Parallel Review Count',
            description: `Current: ${parallelCount} files`,
            command: 'freeAICodeReviewer.ui.setParallelReviewCount',
            icon: 'list-ordered'
        });
        
        // Separator
        options.push({
            label: '$(dash) ────────────────────',
            description: 'Test and Maintenance',
            command: '',
            icon: 'dash'
        });
        
        // Test and maintenance options
        options.push(
            {
                label: '$(plug) Test Connection',
                description: 'Check API connection',
                command: 'freeAICodeReviewer.ui.testConnection',
                icon: 'plug'
            },
            {
                label: '$(refresh) Reset Configuration',
                description: 'Reset all settings to default',
                command: 'freeAICodeReviewer.ui.resetConfiguration',
                icon: 'refresh'
            }
        );
        
        return options.filter(option => option.command !== ''); // Filter separators
    }
}