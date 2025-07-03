import * as vscode from 'vscode';
import * as path from 'path';

export interface ReviewedFileInfo {
    filePath: string;
    reviewDate: Date;
    issuesCount: number;
    status: 'reviewed' | 'has-issues' | 'clean';
    issues?: ReviewIssue[];
}

export interface ReviewIssue {
    line: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

export class ReviewedFileItem extends vscode.TreeItem {
    constructor(
        public readonly fileInfo: ReviewedFileInfo,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(path.basename(fileInfo.filePath), collapsibleState);
        
        this.tooltip = `${fileInfo.filePath}\nReviewed: ${fileInfo.reviewDate.toLocaleString()}\nIssues: ${fileInfo.issuesCount}`;
        this.description = `${fileInfo.issuesCount} issues`;
        this.contextValue = 'reviewedFile';
        
        // Set icon based on status
        switch (fileInfo.status) {
            case 'clean':
                this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
                break;
            case 'has-issues':
                this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('testing.iconFailed'));
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('file-code');
        }
        
        // Add command to open file
        this.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [vscode.Uri.file(fileInfo.filePath)]
        };
    }
}

export class ReviewIssueItem extends vscode.TreeItem {
    constructor(
        public readonly issue: ReviewIssue,
        public readonly filePath: string
    ) {
        super(`Line ${issue.line}: ${issue.message}`, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = `${issue.message}\nLine: ${issue.line}\nSeverity: ${issue.severity}`;
        this.contextValue = 'reviewIssue';
        
        // Set icon based on severity
        switch (issue.severity) {
            case 'error':
                this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
                break;
            case 'warning':
                this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
                break;
            case 'info':
                this.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('editorInfo.foreground'));
                break;
        }
        
        // Add command to go to specific line
        this.command = {
            command: 'freeAICodeReviewer.goToLine',
            title: 'Go to Line',
            arguments: [filePath, issue.line]
        };
    }
}

export class ReviewedFilesTreeProvider implements vscode.TreeDataProvider<ReviewedFileItem | ReviewIssueItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ReviewedFileItem | undefined | null | void> = new vscode.EventEmitter<ReviewedFileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ReviewedFileItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    private reviewedFiles: ReviewedFileInfo[] = [];
    private context: vscode.ExtensionContext;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        // Load reviewed files from workspace state if available
        this.loadReviewedFiles();
    }
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    
    getTreeItem(element: ReviewedFileItem | ReviewIssueItem): vscode.TreeItem {
        return element;
    }
    
    getChildren(element?: ReviewedFileItem | ReviewIssueItem): Thenable<(ReviewedFileItem | ReviewIssueItem)[]> {
        if (!element) {
            // Return root items (reviewed files)
            return Promise.resolve(this.reviewedFiles.map(fileInfo => {
                const hasIssues = fileInfo.issues && fileInfo.issues.length > 0;
                const collapsibleState = hasIssues ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
                return new ReviewedFileItem(fileInfo, collapsibleState);
            }));
        }
        
        if (element instanceof ReviewedFileItem && element.fileInfo.issues) {
            // Return issues for the selected file
            return Promise.resolve(element.fileInfo.issues.map(issue => 
                new ReviewIssueItem(issue, element.fileInfo.filePath)
            ));
        }
        
        return Promise.resolve([]);
    }
    
    addReviewedFile(filePath: string, issuesCount: number, issues?: ReviewIssue[]): void {
        console.log(`[ReviewedFilesTreeProvider] Adding file: ${filePath} with ${issuesCount} issues`);
        
        const existingIndex = this.reviewedFiles.findIndex(f => f.filePath === filePath);
        const status: 'reviewed' | 'has-issues' | 'clean' = issuesCount === 0 ? 'clean' : 'has-issues';
        
        const fileInfo: ReviewedFileInfo = {
            filePath,
            reviewDate: new Date(),
            issuesCount,
            status,
            issues: issues || []
        };
        
        if (existingIndex >= 0) {
            // Update existing file
            this.reviewedFiles[existingIndex] = fileInfo;
            console.log(`[ReviewedFilesTreeProvider] Updated existing file at index ${existingIndex}`);
        } else {
            // Add new file
            this.reviewedFiles.unshift(fileInfo); // Add to beginning
            console.log(`[ReviewedFilesTreeProvider] Added new file. Total files: ${this.reviewedFiles.length}`);
        }
        
        // Keep only last 50 reviewed files
        if (this.reviewedFiles.length > 50) {
            this.reviewedFiles = this.reviewedFiles.slice(0, 50);
        }
        
        this.saveReviewedFiles();
        this.refresh();
        console.log(`[ReviewedFilesTreeProvider] File added and refreshed`);
    }
    
    clearReviewedFiles(): void {
        this.reviewedFiles = [];
        this.saveReviewedFiles();
        this.refresh();
    }
    
    removeReviewedFile(filePath: string): void {
        this.reviewedFiles = this.reviewedFiles.filter(f => f.filePath !== filePath);
        this.saveReviewedFiles();
        this.refresh();
    }
    
    private loadReviewedFiles(): void {
        const savedFiles = this.context.workspaceState.get<ReviewedFileInfo[]>('reviewedFiles', []);
        
        // Convert date strings back to Date objects
        this.reviewedFiles = savedFiles.map(file => ({
            ...file,
            reviewDate: new Date(file.reviewDate)
        }));
    }
    
    private saveReviewedFiles(): void {
        this.context.workspaceState.update('reviewedFiles', this.reviewedFiles);
    }
    
    getReviewedFiles(): ReviewedFileInfo[] {
        return [...this.reviewedFiles];
    }
}