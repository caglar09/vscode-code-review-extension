import axios from 'axios';
import { IAgentProvider, ReviewComment } from '../types';
import { PromptManager } from '../managers/PromptManager';
import * as vscode from 'vscode';

/**
 * Google Gemini AI provider
 */
export class GeminiProvider implements IAgentProvider {
    private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    getProviderId(): string {
        return 'gemini';
    }

    async getModels(apiKey: string): Promise<string[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/models?key=${apiKey}`);

            const models = response.data.models || [];
            return models
                .filter((model: any) => model.name.includes('gemini'))
                .map((model: any) => model.name.replace('models/', ''));
        } catch (error) {
            console.error('Gemini models fetch error:', error);
            throw new Error('An error occurred while fetching Gemini models. Please check your API key.');
        }
    }

    async performReview(
        apiKey: string,
        model: string,
        diff: string,
        languageId: string
    ): Promise<ReviewComment[]> {
        try {
            const prompt = PromptManager.createGeminiReviewPrompt(diff, languageId);
            const endpoint = `${this.baseUrl}/models/${model}:generateContent?key=${apiKey}`;

            const response = await axios.post(endpoint, {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2000
                }
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
            return this.parseAIResponse(aiResponse);
        } catch (error) {
            console.error('Gemini review error:', error);
            throw new Error('An error occurred during code review with Gemini.');
        }
    }

    private parseAIResponse(response: string): ReviewComment[] {
        try {
            if (!response || typeof response !== 'string') {
                console.warn('Empty or invalid AI response received');
                return [];
            }

            // Check for NO_COMMENT first
            if (response.trim() === 'NO_COMMENT') {
                return [];
            }

            console.log('Raw AI response:', response);

            // Clean the JSON - more extensive cleaning
            let cleanedResponse = response
                .replace(/```json|```/g, '') // Remove markdown code blocks
                .replace(/^[^{\[]*/, '')     // Remove text before JSON
                .replace(/[^}\]]*$/, '')     // Remove text after JSON
                .trim();

            console.log('Cleaned response:', cleanedResponse);

            // If it still doesn't look like JSON, try to extract a JSON block
            if (!cleanedResponse.startsWith('{') && !cleanedResponse.startsWith('[')) {
                const jsonMatch = response.match(/[\{\[][\s\S]*[\}\]]/);
                if (jsonMatch) {
                    cleanedResponse = jsonMatch[0];
                } else {
                    console.warn('No valid JSON found in AI response:', response);
                    return [{
                        message: 'No valid JSON format found in AI response.',
                        line: 0,
                        severity: vscode.DiagnosticSeverity.Information
                    }];
                }
            }

            // Fix unescaped quotes inside JSON
            cleanedResponse = this.fixUnescapedQuotes(cleanedResponse);

            // Final check: sanitize invalid characters
            cleanedResponse = this.sanitizeJson(cleanedResponse);

            console.log('Final cleaned response:', cleanedResponse);

            const parsed = JSON.parse(cleanedResponse);

            // If the result is an array
            if (Array.isArray(parsed)) {
                return parsed.map((comment: any) => ({
                    message: comment.message || 'Unknown comment',
                    line: Math.max(0, (comment.line || 1) - 1), // Convert to 0-indexed
                    column: comment.column || 0,
                    severity: this.mapSeverity(comment.severity),
                    category: comment.category
                }));
            }

            // If it's an object with a comments property
            if (!parsed.comments || !Array.isArray(parsed.comments)) {
                return [];
            }

            return parsed.comments.map((comment: any) => ({
                message: comment.message || 'Unknown comment',
                line: Math.max(0, (comment.line || 1) - 1), // Convert to 0-indexed
                column: comment.column || 0,
                severity: this.mapSeverity(comment.severity),
                category: comment.category
            }));
        } catch (error) {
            console.error('AI response parsing error:', error);
            console.error('Original response:', response);
            return [{
                message: 'An error occurred while processing the AI response. Please try again.',
                line: 0,
                severity: vscode.DiagnosticSeverity.Information
            }];
        }
    }

    /**
     * Fixes unescaped quotes in the JSON message fields
     */
    private fixUnescapedQuotes(jsonString: string): string {
        try {
            return jsonString.replace(
                /"message"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g,
                (match, content) => {
                    const escapedContent = content.replace(/(?<!\\)"/g, '\\"');
                    return `"message": "${escapedContent}"`;
                }
            );
        } catch (error) {
            console.warn('Quote fixing failed, returning original:', error);
            return jsonString;
        }
    }

    /**
     * Sanitizes the JSON string by removing invalid characters
     */
    private sanitizeJson(jsonString: string): string {
        try {
            // Remove control characters
            let sanitized = jsonString.replace(/[\x00-\x1F\x7F]/g, '');

            // Remove trailing commas
            sanitized = sanitized.replace(/,\s*([}\]])/g, '$1');

            // Replace double commas with single comma
            sanitized = sanitized.replace(/,,+/g, ',');

            return sanitized;
        } catch (error) {
            console.warn('JSON sanitization failed, returning original:', error);
            return jsonString;
        }
    }

    private mapSeverity(severity: string): vscode.DiagnosticSeverity {
        switch (severity?.toLowerCase()) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'info':
            default:
                return vscode.DiagnosticSeverity.Information;
        }
    }
}
