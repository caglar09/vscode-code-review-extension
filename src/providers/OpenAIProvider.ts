import axios from 'axios';
import { IAgentProvider, ReviewComment, AIModel } from '../types';
import { PromptManager } from '../managers/PromptManager';
import * as vscode from 'vscode';

/**
 * OpenAI provider
 */
export class OpenAIProvider implements IAgentProvider {
    private readonly baseUrl = 'https://api.openai.com/v1';
    private readonly modelsEndpoint = `${this.baseUrl}/models`;
    private readonly chatEndpoint = `${this.baseUrl}/chat/completions`;

    getProviderId(): string {
        return 'openai';
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
            // Filter to only include chat completion models
            const chatModels = models.filter(model => 
                model.id.includes('gpt') || 
                model.id.includes('o1') ||
                model.id.includes('chatgpt')
            );
            return chatModels.map(model => model.id);
        } catch (error) {
            console.error('OpenAI models fetch error:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    throw new Error('Invalid or unauthorized OpenAI API key. Please check your API key and ensure it has the necessary permissions.');
                } else if (error.response?.status === 429) {
                    throw new Error('OpenAI API rate limit exceeded. Please try again later.');
                }
            }
            throw new Error('An error occurred while fetching OpenAI models. Please check your API key and internet connection.');
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

            const requestBody: any = {
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

            // Handle o1 models which don't support system messages and temperature
            if (model.startsWith('o1')) {
                requestBody.messages = [
                    {
                        role: 'user',
                        content: `${PromptManager.getSystemMessage()}\n\n${prompt}`
                    }
                ];
                delete requestBody.temperature;
            }

            const response = await axios.post(this.chatEndpoint, requestBody, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const aiResponse = response.data.choices[0]?.message?.content;
            return this.parseAIResponse(aiResponse);
        } catch (error) {
            console.error('OpenAI review error:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    throw new Error('Invalid or unauthorized OpenAI API key. Please check your API key and ensure it has the necessary permissions.');
                } else if (error.response?.status === 429) {
                    throw new Error('OpenAI API rate limit exceeded. Please try again later.');
                } else if (error.response?.status === 400) {
                    throw new Error('Invalid request to OpenAI API. Please check your model selection.');
                }
            }
            throw new Error('An error occurred while performing code review with OpenAI.');
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