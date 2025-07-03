import axios from 'axios';
import { IAgentProvider, ReviewComment } from '../types';
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
            const prompt = this.createReviewPrompt(diff, languageId);
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

    private createReviewPrompt(diff: string, languageId: string): string {
        return `
Sen uzman bir kod gözden geçiricisisin. Lütfen aşağıdaki ${languageId} kod değişikliklerini incele ve geri bildirimlerini JSON formatında ver.

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
Kod kalitesi, güvenlik, performans ve en iyi pratikler açısından değerlendir.
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