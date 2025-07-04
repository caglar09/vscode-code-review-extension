import * as vscode from 'vscode';

/**
 * Quick action item types
 */
export enum QuickActionItemType {
    ReviewChanged = 'reviewChanged',
    ReviewCurrent = 'reviewCurrent',
    ReviewSelected = 'reviewSelected',
    ClearResults = 'clearResults',
    ShowStatistics = 'showStatistics'
}

/**
 * Quick action item
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
     * Returns icon based on item type
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
 * Quick actions tree provider
 */
export class QuickActionsTreeProvider implements vscode.TreeDataProvider<QuickActionItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<QuickActionItem | undefined | null | void> = new vscode.EventEmitter<QuickActionItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<QuickActionItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    /**
     * Refreshes the tree
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Returns tree item
     */
    getTreeItem(element: QuickActionItem): vscode.TreeItem {
        return element;
    }

    /**
     * Returns child elements
     */
    getChildren(element?: QuickActionItem): Thenable<QuickActionItem[]> {
        if (!element) {
            return Promise.resolve(this.getQuickActionItems());
        }
        return Promise.resolve([]);
    }

    /**
     * Creates quick action items
     */
    private getQuickActionItems(): QuickActionItem[] {
        const items: QuickActionItem[] = [];

        // Review changed files
        items.push(new QuickActionItem(
            'Review Changed Files',
            QuickActionItemType.ReviewChanged,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewChangedFiles',
                title: 'Review Changed Files',
                arguments: []
            }
        ));

        // Review current file
        items.push(new QuickActionItem(
            'Review Current File',
            QuickActionItemType.ReviewCurrent,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewCurrentFile',
                title: 'Review Current File',
                arguments: []
            }
        ));

        // Review selected files
        items.push(new QuickActionItem(
            'Review Selected Files',
            QuickActionItemType.ReviewSelected,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.reviewSelectedFiles',
                title: 'Review Selected Files',
                arguments: []
            }
        ));

        // Clear review results
        items.push(new QuickActionItem(
            'Clear Results',
            QuickActionItemType.ClearResults,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            {
                command: 'freeAICodeReviewer.clearResults',
                title: 'Clear Review Results',
                arguments: []
            }
        ));

        // Show statistics
        items.push(new QuickActionItem(
            'Show Statistics',
            QuickActionItemType.ShowStatistics,
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