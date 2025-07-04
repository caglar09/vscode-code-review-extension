import * as vscode from 'vscode';
import { ConfigurationManager } from '../managers/ConfigurationManager';
import { ProviderFactory } from '../providers/ProviderFactory';

/**
 * Configuration tree item types
 */
export enum ConfigItemType {
    Provider = 'provider',
    Model = 'model',
    ApiKey = 'apiKey',
    CustomEndpoint = 'customEndpoint',
    ParallelReviewCount = 'parallelReviewCount',
    CustomPrompt = 'customPrompt',
    Actions = 'actions',
    Settings = 'settings',
    Status = 'status',
    Divider = 'divider'
}

/**
 * Configuration tree item
 */
export class ConfigurationItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: ConfigItemType,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly value?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = this.getTooltip();
        this.contextValue = type;
        this.iconPath = this.getIcon();
    }

    private getTooltip(): string {
        switch (this.type) {
            case ConfigItemType.Provider:
                return `Current AI provider: ${this.value || 'Not Selected'}`;
            case ConfigItemType.Model:
                return `Current model: ${this.value || 'Not Selected'}`;
            case ConfigItemType.ApiKey:
                return this.value ? 'API key is set' : 'API key is not set';
            case ConfigItemType.CustomEndpoint:
                return `Custom endpoint: ${this.value || 'Not Set'}`;
            case ConfigItemType.ParallelReviewCount:
                return `Parallel review count: ${this.value || '3'} files`;
            case ConfigItemType.CustomPrompt:
                return `Custom prompt: ${this.value || 'Not Set'}`;
            default:
                return this.label;
        }
    }

    private getIcon(): vscode.ThemeIcon {
        switch (this.type) {
            case ConfigItemType.Provider:
                return new vscode.ThemeIcon('cloud');
            case ConfigItemType.Model:
                return new vscode.ThemeIcon('gear');
            case ConfigItemType.ApiKey:
                return new vscode.ThemeIcon(this.value ? 'key' : 'warning');
            case ConfigItemType.CustomEndpoint:
                return new vscode.ThemeIcon('link');
            case ConfigItemType.ParallelReviewCount:
                return new vscode.ThemeIcon('layers');
            case ConfigItemType.CustomPrompt:
                return new vscode.ThemeIcon('edit');
            case ConfigItemType.Actions:
                return new vscode.ThemeIcon('play');
            case ConfigItemType.Settings:
                return new vscode.ThemeIcon('settings-gear');
            case ConfigItemType.Status:
                return new vscode.ThemeIcon('info');
            case ConfigItemType.Divider:
                return new vscode.ThemeIcon('dash');
            default:
                return new vscode.ThemeIcon('circle-outline');
        }
    }
}

/**
 * Configuration provider for VS Code TreeView
 */
export class ConfigurationTreeProvider implements vscode.TreeDataProvider<ConfigurationItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConfigurationItem | undefined | null | void> = new vscode.EventEmitter<ConfigurationItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ConfigurationItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {
        // Listen for configuration changes
        ConfigurationManager.onConfigurationChanged(() => {
            this.refresh();
        });
    }

    /**
     * Refreshes the tree
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Gets tree item
     */
    getTreeItem(element: ConfigurationItem): vscode.TreeItem {
        return element;
    }

    /**
     * Gets children
     */
    getChildren(element?: ConfigurationItem): Thenable<ConfigurationItem[]> {
        if (!element) {
            return Promise.resolve(this.getRootItems());
        }
        return Promise.resolve([]);
    }

    /**
     * Creates root items
     */
    private getRootItems(): ConfigurationItem[] {
        const items: ConfigurationItem[] = [];

        // Configuration items
        items.push(...this.getConfigurationItems());

        // Settings Button
        items.push(new ConfigurationItem(
            'Open Settings',
            ConfigItemType.Settings,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.ui.openSettings',
                title: 'Open Settings',
                arguments: []
            }
        ));

        return items;
    }

    /**
     * Creates configuration items
     */
    private getConfigurationItems(): ConfigurationItem[] {
        const items: ConfigurationItem[] = [];
        const customPrompt = ConfigurationManager.getCustomPrompt();

        // Custom Prompt entry
        items.push(new ConfigurationItem(
            `Custom Prompt ${customPrompt ? '(Set)' : '(Not Set)'}`,
            ConfigItemType.CustomPrompt,
            vscode.TreeItemCollapsibleState.None,
            customPrompt,
            {
                command: 'freeAICodeReviewer.ui.editCustomPrompt',
                title: 'Edit Custom Prompt',
                arguments: []
            }
        ));

        return items;
    }

    /**
     * Creates quick action items
     */
    private getQuickActionItems(): ConfigurationItem[] {
        const items: ConfigurationItem[] = [];

        // Review changed files
        items.push(new ConfigurationItem(
            '📝 Review Changed Files',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewChangedFiles',
                title: 'Review Changed Files',
                arguments: []
            }
        ));

        // Review current file
        items.push(new ConfigurationItem(
            '📄 Review Current File',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewCurrentFile',
                title: 'Review Current File',
                arguments: []
            }
        ));

        // Review selected files
        items.push(new ConfigurationItem(
            '📁 Review Selected Files',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewSelectedFiles',
                title: 'Review Selected Files',
                arguments: []
            }
        ));

        // Clear review results
        items.push(new ConfigurationItem(
            '🧹 Clear Results',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.clearReviewResults',
                title: 'Clear Review Results',
                arguments: []
            }
        ));

        // Show statistics
        items.push(new ConfigurationItem(
            '📈 Show Statistics',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.showStatistics',
                title: 'Show Statistics',
                arguments: []
            }
        ));

        return items;
    }
}