import axios from 'axios';
import { IAgentProvider, ReviewComment } from '../types';
import { PromptManager } from '../managers/PromptManager';
import * as vscode from 'vscode';

/**
 * Google Gemini AI sağlayıcısı
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
            throw new Error('Gemini modellerini getirirken hata oluştu. API anahtarınızı kontrol edin.');
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
            throw new Error('Gemini ile kod incelemesi yapılırken hata oluştu.');
        }
    }



    private parseAIResponse(response: string): ReviewComment[] {
        try {
            if (!response || typeof response !== 'string') {
                console.warn('Empty or invalid AI response received');
                return [];
            }

            // Önce NO_COMMENT kontrolü yap
            if (response.trim() === 'NO_COMMENT') {
                return [];
            }

            // JSON'u temizle - daha kapsamlı temizlik
            let cleanedResponse = response
                .replace(/```json|```/g, '') // Markdown kod bloklarını kaldır
                .replace(/^[^{]*/, '') // JSON'dan önce gelen metni kaldır
                .replace(/[^}]*$/, '') // JSON'dan sonra gelen metni kaldır
                .trim();

            // Eğer hala JSON bulunamazsa, JSON'u bulmaya çalış
            if (!cleanedResponse.startsWith('{')) {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    cleanedResponse = jsonMatch[0];
                } else {
                    console.warn('No valid JSON found in AI response:', response);
                    return [{
                        message: 'AI yanıtında geçerli JSON formatı bulunamadı.',
                        line: 0,
                        severity: vscode.DiagnosticSeverity.Information
                    }];
                }
            }

            // JSON'daki kaçırılmamış tırnak işaretlerini düzelt
            cleanedResponse = this.fixUnescapedQuotes(cleanedResponse);

            const parsed = JSON.parse(cleanedResponse);

            if (!parsed.comments || !Array.isArray(parsed.comments)) {
                return [];
            }

            return parsed.comments.map((comment: any) => ({
                message: comment.message || 'Bilinmeyen yorum',
                line: Math.max(0, (comment.line || 1) - 1), // 0-indexed'e çevir
                column: comment.column || 0,
                severity: this.mapSeverity(comment.severity),
                category: comment.category
            }));
        } catch (error) {
            console.error('AI response parsing error:', error);
            console.error('Original response:', response);
            return [{
                message: 'AI yanıtı işlenirken hata oluştu. Lütfen tekrar deneyin.',
                line: 0,
                severity: vscode.DiagnosticSeverity.Information
            }];
        }
    }

    /**
     * JSON içindeki kaçırılmamış tırnak işaretlerini düzeltir
     */
    private fixUnescapedQuotes(jsonString: string): string {
        try {
            // message alanındaki kaçırılmamış tırnak işaretlerini düzelt
            return jsonString.replace(
                /"message"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/g,
                (match, content) => {
                    // İçerikte kaçırılmamış tırnak işaretlerini kaçır
                    const escapedContent = content.replace(/(?<!\\)"/g, '\\"');
                    return `"message": "${escapedContent}"`;
                }
            );
        } catch (error) {
            console.warn('Quote fixing failed, returning original:', error);
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