import * as vscode from 'vscode';
import { CodeReviewManager } from './managers/CodeReviewManager';
import { ConfigurationManager } from './managers/ConfigurationManager';
import { DiagnosticsManager } from './managers/DiagnosticsManager';
import { CommandManager } from './commands';

/**
 * Eklenti aktifleştirildiğinde çağrılır
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Free AI Code Reviewer eklentisi aktifleştirildi');

    try {
        // Yöneticileri başlat
        const codeReviewManager = new CodeReviewManager();
        const diagnosticsManager = DiagnosticsManager.getInstance();
        const commandManager = new CommandManager(codeReviewManager);

        // Komutları kaydet
        commandManager.registerCommands(context);

        // Dosya kaydetme olayını dinle
        const onSaveListener = vscode.workspace.onDidSaveTextDocument(
            (document) => codeReviewManager.onFileSaved(document)
        );

        // Yapılandırma değişikliklerini dinle
        const configChangeListener = ConfigurationManager.onConfigurationChanged(() => {
            console.log('Free AI Code Reviewer yapılandırması değişti');
        });

        // Context'e ekle
        context.subscriptions.push(
            onSaveListener,
            configChangeListener,
            codeReviewManager,
            diagnosticsManager
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