import * as vscode from 'vscode';
import { CodeReviewManager } from './managers/CodeReviewManager';
import { ConfigurationManager } from './managers/ConfigurationManager';
import { DiagnosticsManager } from './managers/DiagnosticsManager';
import { CommandManager } from './commands';
import { ConfigurationTreeProvider } from './ui/ConfigurationTreeProvider';
import { StatusTreeProvider } from './ui/StatusTreeProvider';
import { QuickActionsTreeProvider } from './ui/QuickActionsTreeProvider';
import { UICommandManager } from './ui/UICommandManager';
import { ReviewedFilesTreeProvider } from './ReviewedFilesTreeProvider';

/**
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Free AI Code Reviewer extension activated');

    try {
        // Initialize managers
        const diagnosticsManager = DiagnosticsManager.getInstance();
        const codeReviewManager = new CodeReviewManager();
        const commandManager = new CommandManager(codeReviewManager);

        // Initialize UI components
        const configTreeProvider = new ConfigurationTreeProvider();
        const statusTreeProvider = new StatusTreeProvider();
        const quickActionsTreeProvider = new QuickActionsTreeProvider();
        const reviewedFilesProvider = new ReviewedFilesTreeProvider(context);
        const uiCommandManager = new UICommandManager(configTreeProvider, statusTreeProvider, quickActionsTreeProvider);

        // Register TreeViews
        const configTreeView = vscode.window.createTreeView('freeAICodeReviewer.configuration', {
            treeDataProvider: configTreeProvider,
            showCollapseAll: false
        });

        const statusTreeView = vscode.window.createTreeView('freeAICodeReviewer.status', {
            treeDataProvider: statusTreeProvider,
            showCollapseAll: false
        });

        const quickActionsTreeView = vscode.window.createTreeView('freeAICodeReviewer.quickActions', {
            treeDataProvider: quickActionsTreeProvider,
            showCollapseAll: false
        });

        const reviewedFilesTreeView = vscode.window.createTreeView('freeAICodeReviewer.reviewedFiles', {
            treeDataProvider: reviewedFilesProvider,
            showCollapseAll: false
        });

        // Register commands
        commandManager.registerCommands(context);
        uiCommandManager.registerUICommands(context);

        // Additional refresh commands
        const refreshStatusCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.refreshStatus',
            () => statusTreeProvider.refresh()
        );

        const refreshQuickActionsCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.refreshQuickActions',
            () => quickActionsTreeProvider.refresh()
        );

        // Listen to file save events
        const onSaveListener = vscode.workspace.onDidSaveTextDocument(
            (document) => codeReviewManager.onFileSaved(document)
        );

        // Listen to configuration changes
        const configChangeListener = ConfigurationManager.onConfigurationChanged(() => {
            console.log('Free AI Code Reviewer configuration changed');
            configTreeProvider.refresh();
            statusTreeProvider.refresh();
        });

        // Register reviewed files commands
        const clearReviewedFilesCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.clearReviewedFiles',
            () => {
                reviewedFilesProvider.clearReviewedFiles();
                vscode.window.showInformationMessage('Reviewed files cleared.');
            }
        );

        const refreshReviewedFilesCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.refreshReviewedFiles',
            () => reviewedFilesProvider.refresh()
        );

        const removeReviewedFileCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.removeReviewedFile',
            (item) => {
                if (item && item.fileInfo) {
                    reviewedFilesProvider.removeReviewedFile(item.fileInfo.filePath);
                }
            }
        );

        const reviewChangedFilesAndFocusCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.reviewChangedFilesAndFocus',
            async () => {
                // Review changed files first
                await vscode.commands.executeCommand('freeAICodeReviewer.reviewChangedFiles');
                // Then focus on the Reviewed Files view
                await vscode.commands.executeCommand('freeAICodeReviewer.reviewedFiles.focus');
            }
        );

        const goToLineCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.goToLine',
            async (filePath: string, lineNumber: number) => {
                try {
                    const document = await vscode.workspace.openTextDocument(filePath);
                    const editor = await vscode.window.showTextDocument(document);
                    const position = new vscode.Position(lineNumber - 1, 0); // VS Code uses 0-based line numbers
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                } catch (error) {
                    vscode.window.showErrorMessage(`Could not open file: ${error}`);
                }
            }
        );

        const clearResultsCommand = vscode.commands.registerCommand(
            'freeAICodeReviewer.clearResults',
            () => {
                codeReviewManager.clearAllReviews();
            }
        );

        // Add to context subscriptions
        // Connect reviewed files provider to CodeReviewManager
        codeReviewManager.setReviewedFilesProvider(reviewedFilesProvider);

        context.subscriptions.push(
            onSaveListener,
            configChangeListener,
            codeReviewManager,
            diagnosticsManager,
            configTreeView,
            statusTreeView,
            quickActionsTreeView,
            reviewedFilesTreeView,
            clearReviewedFilesCommand,
            refreshReviewedFilesCommand,
            removeReviewedFileCommand,
            reviewChangedFilesAndFocusCommand,
            goToLineCommand,
            clearResultsCommand,
            refreshStatusCommand,
            refreshQuickActionsCommand
        );

        // Startup message
        vscode.window.showInformationMessage(
            'Free AI Code Reviewer is ready! Open the command palette (Ctrl+Shift+P) and type "AI Code Review" to begin.',
            'Set API Key'
        ).then(selection => {
            if (selection === 'Set API Key') {
                vscode.commands.executeCommand('freeAICodeReviewer.setApiKey');
            }
        });

    } catch (error) {
        console.error('Error while activating Free AI Code Reviewer:', error);
        vscode.window.showErrorMessage(
            `An error occurred while activating Free AI Code Reviewer: ${error}`
        );
    }
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
    console.log('Free AI Code Reviewer extension deactivated');

    // Cleanup
    const diagnosticsManager = DiagnosticsManager.getInstance();
    diagnosticsManager.dispose();
}
