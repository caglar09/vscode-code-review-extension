import * as vscode from 'vscode';

/**
 * Hızlı eylem öğe türleri
 */
export enum QuickActionItemType {
    ReviewChanged = 'reviewChanged',
    ReviewCurrent = 'reviewCurrent',
    ReviewSelected = 'reviewSelected',
    ClearResults = 'clearResults',
    ShowStatistics = 'showStatistics'
}

/**
 * Hızlı eylem öğesi
 */
export class QuickActionItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly type: QuickActionItemType,
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
            case QuickActionItemType.ReviewChanged:
                return new vscode.ThemeIcon('git-commit');
            case QuickActionItemType.ReviewCurrent:
                return new vscode.ThemeIcon('file');
            case QuickActionItemType.ReviewSelected:
                return new vscode.ThemeIcon('files');
            case QuickActionItemType.ClearResults:
                return new vscode.ThemeIcon('trash');
            case QuickActionItemType.ShowStatistics:
                return new vscode.ThemeIcon('graph');
            default:
                return new vscode.ThemeIcon('play');
        }
    }
}

/**
 * Hızlı eylemler ağaç sağlayıcısı
 */
export class QuickActionsTreeProvider implements vscode.TreeDataProvider<QuickActionItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<QuickActionItem | undefined | null | void> = new vscode.EventEmitter<QuickActionItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<QuickActionItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    /**
     * Ağacı yeniler
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Ağaç öğesini döndürür
     */
    getTreeItem(element: QuickActionItem): vscode.TreeItem {
        return element;
    }

    /**
     * Alt öğeleri döndürür
     */
    getChildren(element?: QuickActionItem): Thenable<QuickActionItem[]> {
        if (!element) {
            return Promise.resolve(this.getQuickActionItems());
        }
        return Promise.resolve([]);
    }

    /**
     * Hızlı eylem öğelerini oluşturur
     */
    private getQuickActionItems(): QuickActionItem[] {
        const items: QuickActionItem[] = [];

        // Değişen dosyaları incele
        items.push(new QuickActionItem(
            'Değişen Dosyaları İncele',
            QuickActionItemType.ReviewChanged,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewChangedFiles',
                title: 'Değişen Dosyaları İncele',
                arguments: []
            }
        ));

        // Mevcut dosyayı incele
        items.push(new QuickActionItem(
            'Mevcut Dosyayı İncele',
            QuickActionItemType.ReviewCurrent,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewCurrentFile',
                title: 'Mevcut Dosyayı İncele',
                arguments: []
            }
        ));

        // Seçili dosyaları incele
        items.push(new QuickActionItem(
            'Seçili Dosyaları İncele',
            QuickActionItemType.ReviewSelected,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewSelectedFiles',
                title: 'Seçili Dosyaları İncele',
                arguments: []
            }
        ));

        // İnceleme sonuçlarını temizle
        items.push(new QuickActionItem(
            'Sonuçları Temizle',
            QuickActionItemType.ClearResults,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.clearResults',
                title: 'İnceleme Sonuçlarını Temizle',
                arguments: []
            }
        ));

        // İstatistikleri göster
        items.push(new QuickActionItem(
            'İstatistikleri Göster',
            QuickActionItemType.ShowStatistics,
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