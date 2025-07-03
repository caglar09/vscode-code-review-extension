import axios from 'axios';
import { IAgentProvider, ReviewComment, AIModel } from '../types';
import * as vscode from 'vscode';

/**
 * OpenRouter AI sağlayıcısı
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
            throw new Error('OpenRouter modellerini getirirken hata oluştu. API anahtarınızı kontrol edin.');
        }
    }

    async performReview(
        apiKey: string,
        model: string,
        diff: string,
        languageId: string
    ): Promise<ReviewComment[]> {
        try {
            const prompt = this.createReviewPrompt(diff, languageId);
            
            const response = await axios.post(this.chatEndpoint, {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'Sen uzman bir kod gözden geçiricisisin. Kod değişikliklerini analiz et ve yapılandırılmış JSON formatında geri bildirim ver.'
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
            throw new Error('OpenRouter ile kod incelemesi yapılırken hata oluştu.');
        }
    }

    private createReviewPrompt(diff: string, languageId: string): string {
        return `
Lütfen aşağıdaki ${languageId} kod değişikliklerini incele ve geri bildirimlerini JSON formatında ver.

Kod değişiklikleri:
\`\`\`diff
${diff}
\`\`\`

Geri bildirimini şu JSON formatında ver:
{
  "comments": [
    {
      "message": "Yorum metni",
      "line": satır_numarası,
      "severity": "error|warning|info",
      "category": "kategori (opsiyonel)"
    }
  ]
}

Sadece JSON yanıtı ver, başka açıklama ekleme. Eğer sorun yoksa boş comments dizisi döndür.
`;
    }

    private parseAIResponse(response: string): ReviewComment[] {
        try {
            // JSON'u temizle ve parse et
            const cleanedResponse = response.replace(/```json|```/g, '').trim();
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
            return [{
                message: 'AI yanıtı işlenirken hata oluştu.',
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