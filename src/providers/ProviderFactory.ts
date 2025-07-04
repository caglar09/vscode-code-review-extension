import { IAgentProvider, ProviderConfig } from '../types';
import { OpenRouterProvider } from './OpenRouterProvider';
import { GeminiProvider } from './GeminiProvider';
import { CustomProvider } from './CustomProvider';

/**
 * Factory class for AI providers
 * Strategy Pattern implementation
 */
export class ProviderFactory {
    private static providers: Map<string, () => IAgentProvider> = new Map<string, () => IAgentProvider>([
        ['openrouter', () => new OpenRouterProvider()],
        ['gemini', () => new GeminiProvider()]
    ]);

    /**
     * Creates the appropriate provider based on the configuration
     * @param config Provider configuration
     * @returns Instance of the AI provider
     */
    static createProvider(config: ProviderConfig): IAgentProvider {
        const { providerId, customEndpoint, customHeaders } = config;

        // For custom provider
        if (providerId === 'custom') {
            if (!customEndpoint) {
                throw new Error('Endpoint is required for custom provider.');
            }
            return new CustomProvider(customEndpoint, customHeaders || {});
        }

        // For registered providers
        const providerFactory = this.providers.get(providerId);
        if (!providerFactory) {
            throw new Error(`Unsupported provider: ${providerId}`);
        }

        return providerFactory();
    }

    /**
     * Returns a list of available provider IDs
     * @returns Provider IDs
     */
    static getAvailableProviders(): string[] {
        return Array.from(this.providers.keys()).concat(['custom']);
    }

    /**
     * Registers a new provider
     * @param providerId Provider ID
     * @param factory Provider factory function
     */
    static registerProvider(providerId: string, factory: () => IAgentProvider): void {
        this.providers.set(providerId, factory);
    }

    /**
     * Checks if the provider is supported
     * @param providerId Provider ID
     * @returns Support status
     */
    static isProviderSupported(providerId: string): boolean {
        return this.providers.has(providerId) || providerId === 'custom';
    }
}