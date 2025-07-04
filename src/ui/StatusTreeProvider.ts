import * as vscode from 'vscode';
import { ConfigurationManager } from '../managers/ConfigurationManager';

/**
 * Status item types
 */
export enum StatusItemType {
    Provider = 'provider',
    Model = 'model',
    ApiKey = 'apiKey',
    CustomPrompt = 'customPrompt',
}

/**
 * Status item
 */
export class StatusItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: StatusItemType,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly value?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
        this.contextValue = this.type;
        this.iconPath = this.getIcon();
    }

    /**
     * Returns icon based on item type
     */
    private getIcon(): vscode.ThemeIcon {
        switch (this.type) {
            case StatusItemType.Provider:
                return new vscode.ThemeIcon('server');
            case StatusItemType.Model:
                return new vscode.ThemeIcon('brain');
            case StatusItemType.ApiKey:
                return new vscode.ThemeIcon('key');
            default:
                return new vscode.ThemeIcon('info');
        }
    }
}

/**
 * Status tree provider
 */
export class StatusTreeProvider implements vscode.TreeDataProvider<StatusItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StatusItem | undefined | null | void> = new vscode.EventEmitter<StatusItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StatusItem | undefined | null | void> = this._onDidChangeTreeData.event;

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
     * Returns tree item
     */
    getTreeItem(element: StatusItem): vscode.TreeItem {
        return element;
    }

    /**
     * Returns child elements
     */
    getChildren(element?: StatusItem): Thenable<StatusItem[]> {
        if (!element) {
            return Promise.resolve(this.getStatusItems());
        }
        return Promise.resolve([]);
    }

    /**
     * Creates status items
     */
    private getStatusItems(): StatusItem[] {
        const config = ConfigurationManager.getProviderConfig();
        const items: StatusItem[] = [];

        // Provider status
        const providerStatus = config.providerId ? `✓ ${config.providerId}` : '✗ Not Selected';
        items.push(new StatusItem(
            `Provider: ${providerStatus}`,
            StatusItemType.Provider,
            vscode.TreeItemCollapsibleState.None,
            config.providerId
        ));

        // Model status
        const modelStatus = config.model ? `✓ ${config.model}` : '✗ Not Selected';
        items.push(new StatusItem(
            `Model: ${modelStatus}`,
            StatusItemType.Model,
            vscode.TreeItemCollapsibleState.None,
            config.model
        ));

        // API Key status
        const hasApiKey = !!config.apiKey;
        items.push(new StatusItem(
            `API Key: ${hasApiKey ? '✓ Set' : '✗ Not Set'}`,
            StatusItemType.ApiKey,
            vscode.TreeItemCollapsibleState.None,
            hasApiKey ? 'set' : ''
        ));

        // Custom Prompt entry
        const customPrompt = ConfigurationManager.getCustomPrompt();
        items.push(new StatusItem(
            `Custom Prompt ${customPrompt ? '(Set)' : '(Not Set)'}`,
            StatusItemType.CustomPrompt,
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
}