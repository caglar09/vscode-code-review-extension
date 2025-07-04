import axios from 'axios';
import { IAgentProvider, ReviewComment, AIModel } from '../types';
import { PromptManager } from '../managers/PromptManager';
import * as vscode from 'vscode';

/**
 * OpenRouter AI provider
 */
export class OpenRouterProvider implements IAgentProvider {
    private readonly baseUrl = 'https://openrouter.ai/api/v1';
    private readonly modelsEndpoint = `${this.baseUrl}/models`;
    private readonly chatEndpoint = `${this.baseUrl}/chat/completions`;

    getProviderId(): string {
        return 'openrouter';
    }

    async getModels(apiKey: string): Promise<string[]> {
        try {
            const response = await axios.get(this.modelsEndpoint, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const models: AIModel[] = response.data.data || [];
            return models.map(model => model.id);
        } catch (error) {
            console.error('OpenRouter models fetch error:', error);
            throw new Error('An error occurred while fetching OpenRouter models. Please check your API key.');
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

            const response = await axios.post(this.chatEndpoint, {
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
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const aiResponse = response.data.choices[0]?.message?.content;
            return this.parseAIResponse(aiResponse);
        } catch (error) {
            console.error('OpenRouter review error:', error);
            throw new Error('An error occurred while performing code review with OpenRouter.');
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
