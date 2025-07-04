import * as vscode from 'vscode';

/**
 * Base interface for AI providers
 */
export interface IAgentProvider {
    /**
     * Returns the unique identifier of the provider
     */
    getProviderId(): string;

    /**
     * Retrieves the list of available AI models
     * @param apiKey API key
     */
    getModels(apiKey: string): Promise<string[]>;

    /**
     * Performs code review
     * @param apiKey API key
     * @param model AI model to use
     * @param diff Code changes
     * @param languageId Programming language
     */
    performReview(
        apiKey: string,
        model: string,
        diff: string,
        languageId: string
    ): Promise<ReviewComment[]>;
}

/**
 * Review comment
 */
export interface ReviewComment {
    /** Comment message */
    message: string;
    /** Line number (0-indexed) */
    line: number;
    /** Column number (0-indexed, optional) */
    column?: number;
    /** Type of comment */
    severity: vscode.DiagnosticSeverity;
    /** Category (optional) */
    category?: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
    /** Provider ID */
    providerId: string;
    /** Selected model */
    model: string;
    /** API key */
    apiKey: string;
    /** Custom endpoint (for custom provider) */
    customEndpoint?: string;
    /** Custom headers (for custom provider) */
    customHeaders?: Record<string, string>;
}

/**
 * AI model information
 */
export interface AIModel {
    /** Model ID */
    id: string;
    /** Model name */
    name: string;
    /** Description (optional) */
    description?: string;
}
