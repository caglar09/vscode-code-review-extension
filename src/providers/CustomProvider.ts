import axios from 'axios';
import { IAgentProvider, ReviewComment } from '../types';
import { PromptManager } from '../managers/PromptManager';
import * as vscode from 'vscode';

/**
 * Custom AI provider - for user-defined endpoints
 */
export class CustomProvider implements IAgentProvider {
    private endpoint: string;
    private headers: Record<string, string>;

    constructor(endpoint: string, headers: Record<string, string> = {}) {
        this.endpoint = endpoint;
        this.headers = headers;
    }

    getProviderId(): string {
        return 'custom';
    }

    async getModels(apiKey: string): Promise<string[]> {
        try {
            // Try to fetch the model list from the custom endpoint
            const modelsEndpoint = `${this.endpoint}/models`;
            const response = await axios.get(modelsEndpoint, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    ...this.headers
                }
            });

            // Support different API response formats
            const models = response.data.models || response.data.data || response.data;
            if (Array.isArray(models)) {
                return models.map(model =>
                    typeof model === 'string' ? model : (model.id || model.name || 'unknown')
                );
            }

            // If no model list is returned, fallback to default models
            return ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet'];
        } catch (error) {
            console.error('Custom provider models fetch error:', error);
            // Return default models in case of an error
            return ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet'];
        }
    }

    async performReview(
        apiKey: string,
        model: string,
        diff: string,
        languageId: string
    ): Promise<ReviewComment[]> {
        try {
            const prompt = PromptManager.createReviewPrompt(diff, languageId);

            // Use OpenAI-compatible format
            const requestBody = {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: PromptManager.getSystemMessage()
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000
            };

            const response = await axios.post(this.endpoint, requestBody, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    ...this.headers
                }
            });

            // Support different response formats
            let aiResponse: string;
            if (response.data.choices && response.data.choices[0]) {
                // OpenAI format
                aiResponse = response.data.choices[0].message?.content || response.data.choices[0].text;
            } else if (response.data.content) {
                // Direct content
                aiResponse = response.data.content;
            } else if (response.data.response) {
                // Response field
                aiResponse = response.data.response;
            } else {
                throw new Error('Unexpected response format');
            }

            return this.parseAIResponse(aiResponse);
        } catch (error) {
            console.error('Custom provider review error:', error);
            throw new Error('An error occurred during code review with the custom provider.');
        }
    }

    private parseAIResponse(response: string): ReviewComment[] {
        try {
            // Clean and parse the JSON
            const cleanedResponse = response.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanedResponse);

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
            return [{
                message: 'An error occurred while processing the AI response.',
                line: 0,
                severity: vscode.DiagnosticSeverity.Information
            }];
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
