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
    ParallelReviewCount = 'parallelReviewCount',
    CustomPrompt = 'customPrompt',
    Actions = 'actions',
    Settings = 'settings',
    Status = 'status',
    Divider = 'divider'
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
            case ConfigItemType.ParallelReviewCount:
                return `Paralel inceleme sayısı: ${this.value || '3'} dosya`;
            case ConfigItemType.CustomPrompt:
                return `Özel prompt: ${this.value || 'Ayarlanmamış'}`;
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
        const items: ConfigurationItem[] = [];

        // Configuration öğeleri
        items.push(...this.getConfigurationItems());

        // Ayarlar Butonu
        items.push(new ConfigurationItem(
            'Ayarları Aç',
            ConfigItemType.Settings,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.ui.openSettings',
                title: 'Ayarları Aç',
                arguments: []
            }
        ));

        return items;
    }

    /**
     * Yapılandırma öğelerini oluşturur
     */
    private getConfigurationItems(): ConfigurationItem[] {
        const items: ConfigurationItem[] = [];
        const customPrompt = ConfigurationManager.getCustomPrompt();

        // Özel Prompt girişi
        items.push(new ConfigurationItem(
            `Özel Prompt ${customPrompt ? '(Ayarlanmış)' : '(Ayarlanmamış)'}`,
            ConfigItemType.CustomPrompt,
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

    /**
     * Hızlı eylem öğelerini oluşturur
     */
    private getQuickActionItems(): ConfigurationItem[] {
        const items: ConfigurationItem[] = [];

        // Değişen dosyaları incele
        items.push(new ConfigurationItem(
            '📝 Değişen Dosyaları İncele',
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
            '📄 Mevcut Dosyayı İncele',
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
            '📁 Seçili Dosyaları İncele',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewSelectedFiles',
                title: 'Seçili Dosyaları İncele',
                arguments: []
            }
        ));

        // İnceleme sonuçlarını temizle
        items.push(new ConfigurationItem(
            '🧹 Sonuçları Temizle',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.clearReviewResults',
                title: 'İnceleme Sonuçlarını Temizle',
                arguments: []
            }
        ));

        // İstatistikleri göster
        items.push(new ConfigurationItem(
            '📈 İstatistikleri Göster',
            ConfigItemType.Actions,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.showStatistics',
                title: 'İstatistikleri Göster',
                arguments: []
            }
        ));

        return items;
    }
}