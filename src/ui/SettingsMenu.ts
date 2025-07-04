import * as vscode from 'vscode';
import { ConfigurationManager } from '../managers/ConfigurationManager';

/**
 * Ayarlar menüsü için seçenekler
 */
interface SettingsOption {
    label: string;
    description: string;
    command: string;
    icon?: string;
}

/**
 * Ayarlar menüsünü yöneten sınıf
 */
export class SettingsMenu {
    /**
     * Ayarlar menüsünü açar
     */
    public static async openSettingsMenu(): Promise<void> {
        const options = this.getSettingsOptions();
        
        const quickPick = vscode.window.createQuickPick<SettingsOption>();
        quickPick.title = '⚙️ AI Code Reviewer Ayarları';
        quickPick.placeholder = 'Bir ayar seçin...';
        quickPick.items = options;
        quickPick.matchOnDescription = true;
        
        quickPick.onDidChangeSelection(async (selection) => {
            if (selection[0]) {
                quickPick.hide();
                await vscode.commands.executeCommand(selection[0].command);
            }
        });
        
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    }
    
    /**
     * Ayar seçeneklerini döndürür
     */
    private static getSettingsOptions(): SettingsOption[] {
        const config = ConfigurationManager.getProviderConfig();
        
        const options: SettingsOption[] = [
            {
                label: '$(cloud) Sağlayıcı Seç',
                description: `Mevcut: ${config.providerId || 'Seçilmemiş'}`,
                command: 'freeAICodeReviewer.ui.selectProvider',
                icon: 'cloud'
            },
            {
                label: '$(gear) Model Seç',
                description: `Mevcut: ${config.model || 'Seçilmemiş'}`,
                command: 'freeAICodeReviewer.ui.selectModel',
                icon: 'gear'
            },
            {
                label: '$(key) API Anahtarı Ayarla',
                description: config.apiKey ? 'Ayarlanmış' : 'Ayarlanmamış',
                command: 'freeAICodeReviewer.ui.setApiKey',
                icon: 'key'
            }
        ];
        
        // Özel sağlayıcı için endpoint ayarı
        if (config.providerId === 'custom') {
            options.push({
                label: '$(link) Özel Endpoint Ayarla',
                description: config.customEndpoint || 'Ayarlanmamış',
                command: 'freeAICodeReviewer.ui.setCustomEndpoint',
                icon: 'link'
            });
        }
        
        // Paralel inceleme sayısı
        const parallelCount = ConfigurationManager.getParallelReviewCount();
        options.push({
            label: '$(list-ordered) Paralel İnceleme Sayısı',
            description: `Mevcut: ${parallelCount} dosya`,
            command: 'freeAICodeReviewer.ui.setParallelReviewCount',
            icon: 'list-ordered'
        });
        
        // Ayırıcı
        options.push({
            label: '$(dash) ────────────────────',
            description: 'Test ve Bakım',
            command: '',
            icon: 'dash'
        });
        
        // Test ve bakım seçenekleri
        options.push(
            {
                label: '$(plug) Bağlantıyı Test Et',
                description: 'API bağlantısını kontrol et',
                command: 'freeAICodeReviewer.ui.testConnection',
                icon: 'plug'
            },
            {
                label: '$(refresh) Yapılandırmayı Sıfırla',
                description: 'Tüm ayarları varsayılana döndür',
                command: 'freeAICodeReviewer.ui.resetConfiguration',
                icon: 'refresh'
            }
        );
        
        return options.filter(option => option.command !== ''); // Ayırıcıları filtrele
    }
}