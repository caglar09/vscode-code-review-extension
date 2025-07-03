import * as vscode from 'vscode';
import { ConfigurationManager } from '../managers/ConfigurationManager';
import { ProviderFactory } from '../providers/ProviderFactory';

/**
 * Yapılandırma ağacı öğesi türleri
 */
export enum ConfigItemType {
    Provider = 'provider',
    Model = 'model',
    ApiKey = 'apiKey',
    CustomEndpoint = 'customEndpoint',
    Actions = 'actions'
}

/**
 * Yapılandırma ağacı öğesi
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
                return `Mevcut AI sağlayıcısı: ${this.value || 'Seçilmemiş'}`;
            case ConfigItemType.Model:
                return `Mevcut model: ${this.value || 'Seçilmemiş'}`;
            case ConfigItemType.ApiKey:
                return this.value ? 'API anahtarı ayarlanmış' : 'API anahtarı ayarlanmamış';
            case ConfigItemType.CustomEndpoint:
                return `Özel endpoint: ${this.value || 'Ayarlanmamış'}`;
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
            case ConfigItemType.Actions:
                return new vscode.ThemeIcon('tools');
            default:
                return new vscode.ThemeIcon('circle-outline');
        }
    }
}

/**
 * VS Code TreeView için yapılandırma sağlayıcısı
 */
export class ConfigurationTreeProvider implements vscode.TreeDataProvider<ConfigurationItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConfigurationItem | undefined | null | void> = new vscode.EventEmitter<ConfigurationItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ConfigurationItem | undefined | null | void> = this._onDidChangeTreeData.event;

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
     * Ağaç öğesini getirir
     */
    getTreeItem(element: ConfigurationItem): vscode.TreeItem {
        return element;
    }

    /**
     * Alt öğeleri getirir
     */
    getChildren(element?: ConfigurationItem): Thenable<ConfigurationItem[]> {
        if (!element) {
            return Promise.resolve(this.getRootItems());
        }
        return Promise.resolve([]);
    }

    /**
     * Kök öğeleri oluşturur
     */
    private getRootItems(): ConfigurationItem[] {
        const config = ConfigurationManager.getProviderConfig();
        const items: ConfigurationItem[] = [];

        // Sağlayıcı
        items.push(new ConfigurationItem(
            `Sağlayıcı: ${config.providerId || 'Seçilmemiş'}`,
            ConfigItemType.Provider,
            vscode.TreeItemCollapsibleState.None,
            config.providerId,
            {
                command: 'freeAICodeReviewer.ui.selectProvider',
                title: 'Sağlayıcı Seç',
                arguments: []
            }
        ));

        // Model
        items.push(new ConfigurationItem(
            `Model: ${config.model || 'Seçilmemiş'}`,
            ConfigItemType.Model,
            vscode.TreeItemCollapsibleState.None,
            config.model,
            {
                command: 'freeAICodeReviewer.ui.selectModel',
                title: 'Model Seç',
                arguments: []
            }
        ));

        // API Anahtarı
        const hasApiKey = !!config.apiKey;
        items.push(new ConfigurationItem(
            `API Anahtarı: ${hasApiKey ? '✓ Ayarlanmış' : '✗ Ayarlanmamış'}`,
            ConfigItemType.ApiKey,
            vscode.TreeItemCollapsibleState.None,
            hasApiKey ? 'set' : '',
            {
                command: 'freeAICodeReviewer.ui.setApiKey',
                title: 'API Anahtarı Ayarla',
                arguments: []
            }
        ));

        // Özel endpoint (sadece custom sağlayıcı için)
        if (config.providerId === 'custom') {
            items.push(new ConfigurationItem(
                `Endpoint: ${config.customEndpoint || 'Ayarlanmamış'}`,
                ConfigItemType.CustomEndpoint,
                vscode.TreeItemCollapsibleState.None,
                config.customEndpoint,
                {
                    command: 'freeAICodeReviewer.ui.setCustomEndpoint',
                    title: 'Endpoint Ayarla',
                    arguments: []
                }
            ));
        }

        // Eylemler bölümü
        items.push(new ConfigurationItem(
            '── Eylemler ──',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None
        ));

        // Test bağlantısı
        items.push(new ConfigurationItem(
            'Bağlantıyı Test Et',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.ui.testConnection',
                title: 'Bağlantıyı Test Et',
                arguments: []
            }
        ));

        // Yapılandırmayı sıfırla
        items.push(new ConfigurationItem(
            'Yapılandırmayı Sıfırla',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.ui.resetConfiguration',
                title: 'Yapılandırmayı Sıfırla',
                arguments: []
            }
        ));

        // İstatistikleri göster
        items.push(new ConfigurationItem(
            'İstatistikleri Göster',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.showStatistics',
                title: 'İstatistikleri Göster',
                arguments: []
            }
        ));

        // İnceleme sonuçlarını temizle
        items.push(new ConfigurationItem(
            'İnceleme Sonuçlarını Temizle',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.clearReviewResults',
                title: 'İnceleme Sonuçlarını Temizle',
                arguments: []
            }
        ));

        // Değişen dosyaları incele
        items.push(new ConfigurationItem(
            'Değişen Dosyaları İncele',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewChangedFiles',
                title: 'Değişen Dosyaları İncele',
                arguments: []
            }
        ));

        // Mevcut dosyayı incele
        items.push(new ConfigurationItem(
            'Mevcut Dosyayı İncele',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewCurrentFile',
                title: 'Mevcut Dosyayı İncele',
                arguments: []
            }
        ));

        // Seçili dosyaları incele
        items.push(new ConfigurationItem(
            'Seçili Dosyaları İncele',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewSelectedFiles',
                title: 'Seçili Dosyaları İncele',
                arguments: []
            }
        ));

        return items;
    }
}