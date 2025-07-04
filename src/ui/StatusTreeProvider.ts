import * as vscode from 'vscode';
import { ConfigurationManager } from '../managers/ConfigurationManager';

/**
 * Durum bilgisi öğe türleri
 */
export enum StatusItemType {
    Provider = 'provider',
    Model = 'model',
    ApiKey = 'apiKey',
    CustomPrompt = 'customPrompt',
}

/**
 * Durum bilgisi öğesi
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
     * Öğe türüne göre ikon döndürür
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
 * Durum bilgisi ağaç sağlayıcısı
 */
export class StatusTreeProvider implements vscode.TreeDataProvider<StatusItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StatusItem | undefined | null | void> = new vscode.EventEmitter<StatusItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StatusItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {
        // Yapılandırma değişikliklerini dinle
        ConfigurationManager.onConfigurationChanged(() => {
            this.refresh();
        });
    }

    /**
     * Ağacı yeniler
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Ağaç öğesini döndürür
     */
    getTreeItem(element: StatusItem): vscode.TreeItem {
        return element;
    }

    /**
     * Alt öğeleri döndürür
     */
    getChildren(element?: StatusItem): Thenable<StatusItem[]> {
        if (!element) {
            return Promise.resolve(this.getStatusItems());
        }
        return Promise.resolve([]);
    }

    /**
     * Durum bilgisi öğelerini oluşturur
     */
    private getStatusItems(): StatusItem[] {
        const config = ConfigurationManager.getProviderConfig();
        const items: StatusItem[] = [];

        // Sağlayıcı durumu
        const providerStatus = config.providerId ? `✓ ${config.providerId}` : '✗ Seçilmemiş';
        items.push(new StatusItem(
            `Sağlayıcı: ${providerStatus}`,
            StatusItemType.Provider,
            vscode.TreeItemCollapsibleState.None,
            config.providerId
        ));

        // Model durumu
        const modelStatus = config.model ? `✓ ${config.model}` : '✗ Seçilmemiş';
        items.push(new StatusItem(
            `Model: ${modelStatus}`,
            StatusItemType.Model,
            vscode.TreeItemCollapsibleState.None,
            config.model
        ));

        // API Anahtarı durumu
        const hasApiKey = !!config.apiKey;
        items.push(new StatusItem(
            `API Anahtarı: ${hasApiKey ? '✓ Ayarlanmış' : '✗ Ayarlanmamış'}`,
            StatusItemType.ApiKey,
            vscode.TreeItemCollapsibleState.None,
            hasApiKey ? 'set' : ''
        ));

        // Özel Prompt girişi
        const customPrompt = ConfigurationManager.getCustomPrompt();
        items.push(new StatusItem(
            `Özel Prompt ${customPrompt ? '(Ayarlanmış)' : '(Ayarlanmamış)'}`,
            StatusItemType.CustomPrompt,
            vscode.TreeItemCollapsibleState.None,
            customPrompt,
            {
                command: 'freeAICodeReviewer.ui.editCustomPrompt',
                title: 'Özel Prompt Düzenle',
                arguments: []
            }
        ));

        return items;
    }
}