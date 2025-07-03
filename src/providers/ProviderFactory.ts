import { IAgentProvider, ProviderConfig } from '../types';
import { OpenRouterProvider } from './OpenRouterProvider';
import { GeminiProvider } from './GeminiProvider';
import { CustomProvider } from './CustomProvider';

/**
 * AI sağlayıcıları için fabrika sınıfı
 * Strategy Pattern implementasyonu
 */
export class ProviderFactory {
    private static providers: Map<string, () => IAgentProvider> = new Map<string, () => IAgentProvider>([
        ['openrouter', () => new OpenRouterProvider()],
        ['gemini', () => new GeminiProvider()]
    ]);

    /**
     * Yapılandırmaya göre uygun sağlayıcıyı oluşturur
     * @param config Sağlayıcı yapılandırması
     * @returns AI sağlayıcısı instance'ı
     */
    static createProvider(config: ProviderConfig): IAgentProvider {
        const { providerId, customEndpoint, customHeaders } = config;

        // Özel sağlayıcı için
        if (providerId === 'custom') {
            if (!customEndpoint) {
                throw new Error('Özel sağlayıcı için endpoint gereklidir.');
            }
            return new CustomProvider(customEndpoint, customHeaders || {});
        }

        // Kayıtlı sağlayıcılar için
        const providerFactory = this.providers.get(providerId);
        if (!providerFactory) {
            throw new Error(`Desteklenmeyen sağlayıcı: ${providerId}`);
        }

        return providerFactory();
    }

    /**
     * Mevcut sağlayıcıların listesini döndürür
     * @returns Sağlayıcı ID'leri
     */
    static getAvailableProviders(): string[] {
        return Array.from(this.providers.keys()).concat(['custom']);
    }

    /**
     * Yeni bir sağlayıcı kaydeder
     * @param providerId Sağlayıcı ID'si
     * @param factory Sağlayıcı fabrika fonksiyonu
     */
    static registerProvider(providerId: string, factory: () => IAgentProvider): void {
        this.providers.set(providerId, factory);
    }

    /**
     * Sağlayıcının desteklenip desteklenmediğini kontrol eder
     * @param providerId Sağlayıcı ID'si
     * @returns Desteklenme durumu
     */
    static isProviderSupported(providerId: string): boolean {
        return this.providers.has(providerId) || providerId === 'custom';
    }
}