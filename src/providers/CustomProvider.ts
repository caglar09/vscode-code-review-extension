import axios from 'axios';
import { IAgentProvider, ReviewComment } from '../types';
import * as vscode from 'vscode';

/**
 * Özel AI sağlayıcısı - kullanıcı tanımlı endpoint'ler için
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
            // Özel endpoint'ler için model listesi almaya çalış
            const modelsEndpoint = `${this.endpoint}/models`;
            const response = await axios.get(modelsEndpoint, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    ...this.headers
                }
            });

            // Farklı API formatlarını destekle
            const models = response.data.models || response.data.data || response.data;
            if (Array.isArray(models)) {
                return models.map(model => 
                    typeof model === 'string' ? model : (model.id || model.name || 'unknown')
                );
            }

            // Eğer model listesi alınamazsa varsayılan modeller döndür
            return ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet'];
        } catch (error) {
            console.error('Custom provider models fetch error:', error);
            // Hata durumunda varsayılan modeller döndür
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
            const prompt = this.createReviewPrompt(diff, languageId);
            
            // OpenAI uyumlu format kullan
            const requestBody = {
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
            };

            const response = await axios.post(this.endpoint, requestBody, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    ...this.headers
                }
            });

            // Farklı yanıt formatlarını destekle
            let aiResponse: string;
            if (response.data.choices && response.data.choices[0]) {
                // OpenAI formatı
                aiResponse = response.data.choices[0].message?.content || response.data.choices[0].text;
            } else if (response.data.content) {
                // Direk content
                aiResponse = response.data.content;
            } else if (response.data.response) {
                // Response field
                aiResponse = response.data.response;
            } else {
                throw new Error('Beklenmeyen yanıt formatı');
            }

            return this.parseAIResponse(aiResponse);
        } catch (error) {
            console.error('Custom provider review error:', error);
            throw new Error('Özel sağlayıcı ile kod incelemesi yapılırken hata oluştu.');
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