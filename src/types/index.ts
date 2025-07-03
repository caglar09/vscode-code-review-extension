import * as vscode from 'vscode';

/**
 * AI sağlayıcıları için temel arayüz
 */
export interface IAgentProvider {
    /**
     * Sağlayıcının benzersiz kimliğini döndürür
     */
    getProviderId(): string;

    /**
     * Mevcut AI modellerinin listesini getirir
     * @param apiKey API anahtarı
     */
    getModels(apiKey: string): Promise<string[]>;

    /**
     * Kod incelemesi gerçekleştirir
     * @param apiKey API anahtarı
     * @param model Kullanılacak AI modeli
     * @param diff Kod değişiklikleri
     * @param languageId Programlama dili
     */
    performReview(
        apiKey: string,
        model: string,
        diff: string,
        languageId: string
    ): Promise<ReviewComment[]>;
}

/**
 * İnceleme yorumu
 */
export interface ReviewComment {
    /** Yorum metni */
    message: string;
    /** Satır numarası (0-indexed) */
    line: number;
    /** Sütun numarası (0-indexed, opsiyonel) */
    column?: number;
    /** Yorum türü */
    severity: vscode.DiagnosticSeverity;
    /** Kategori (opsiyonel) */
    category?: string;
}

/**
 * Sağlayıcı yapılandırması
 */
export interface ProviderConfig {
    /** Sağlayıcı kimliği */
    providerId: string;
    /** Seçili model */
    model: string;
    /** API anahtarı */
    apiKey: string;
    /** Özel endpoint (custom provider için) */
    customEndpoint?: string;
    /** Özel başlıklar (custom provider için) */
    customHeaders?: Record<string, string>;
}

/**
 * AI model bilgisi
 */
export interface AIModel {
    /** Model kimliği */
    id: string;
    /** Model adı */
    name: string;
    /** Açıklama (opsiyonel) */
    description?: string;
}