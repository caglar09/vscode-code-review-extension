import * as vscode from 'vscode';
import { CodeReviewManager } from './managers/CodeReviewManager';
import { ConfigurationManager } from './managers/ConfigurationManager';
import { DiagnosticsManager } from './managers/DiagnosticsManager';
import { CommandManager } from './commands';
import { ConfigurationTreeProvider } from './ui/ConfigurationTreeProvider';
import { UICommandManager } from './ui/UICommandManager';
import { ReviewedFilesTreeProvider } from './ReviewedFilesTreeProvider';

/**
 * Eklenti aktifleştirildiğinde çağrılır
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Free AI Code Reviewer eklentisi aktifleştirildi');

    try {
        // Yöneticileri başlat
        const diagnosticsManager = DiagnosticsManager.getInstance();
        const codeReviewManager = new CodeReviewManager();
        const commandManager = new CommandManager(codeReviewManager);

        // UI bileşenlerini başlat
        const treeProvider = new ConfigurationTreeProvider();
        const reviewedFilesProvider = new ReviewedFilesTreeProvider();
        const uiCommandManager = new UICommandManager(treeProvider);

        // TreeView'ları kaydet
        const configTreeView = vscode.window.createTreeView('freeAICodeReviewer.configuration', {
            treeDataProvider: treeProvider,
            showCollapseAll: false
        });
        
        const reviewedFilesTreeView = vscode.window.createTreeView('freeAICodeReviewer.reviewedFiles', {
            treeDataProvider: reviewedFilesProvider,
            showCollapseAll: false
        });

        // Komutları kaydet
        commandManager.registerCommands(context);
        uiCommandManager.registerUICommands(context);

        // Dosya kaydetme olayını dinle
        const onSaveListener = vscode.workspace.onDidSaveTextDocument(
            (document) => codeReviewManager.onFileSaved(document)
        );

        // Yapılandırma değişikliklerini dinle
        const configChangeListener = ConfigurationManager.onConfigurationChanged(() => {
            console.log('Free AI Code Reviewer yapılandırması değişti');
            treeProvider.refresh();
        });

        // Reviewed files komutlarını kaydet
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
                // Önce değişen dosyaları incele
                await vscode.commands.executeCommand('freeAICodeReviewer.reviewChangedFiles');
                // Sonra Reviewed Files görünümüne odaklan
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

        // Context'e ekle
        // CodeReviewManager'a reviewed files provider'ı bağla
        codeReviewManager.setReviewedFilesProvider(reviewedFilesProvider);

        context.subscriptions.push(
            onSaveListener,
            configChangeListener,
            codeReviewManager,
            diagnosticsManager,
            configTreeView,
            reviewedFilesTreeView,
            clearReviewedFilesCommand,
            refreshReviewedFilesCommand,
            removeReviewedFileCommand,
            reviewChangedFilesAndFocusCommand,
            goToLineCommand
        );

        // Başlangıç mesajı
        vscode.window.showInformationMessage(
            'Free AI Code Reviewer hazır! Komut paletinden (Ctrl+Shift+P) "AI Code Review" yazarak başlayın.',
            'API Anahtarı Ayarla'
        ).then(selection => {
            if (selection === 'API Anahtarı Ayarla') {
                vscode.commands.executeCommand('freeAICodeReviewer.setApiKey');
            }
        });

    } catch (error) {
        console.error('Free AI Code Reviewer başlatılırken hata:', error);
        vscode.window.showErrorMessage(
            `Free AI Code Reviewer başlatılırken hata oluştu: ${error}`
        );
    }
}

/**
 * Eklenti deaktifleştirildiğinde çağrılır
 */
export function deactivate() {
    console.log('Free AI Code Reviewer eklentisi deaktifleştirildi');
    
    // Cleanup işlemleri
    const diagnosticsManager = DiagnosticsManager.getInstance();
    diagnosticsManager.dispose();
}