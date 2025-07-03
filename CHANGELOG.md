# Change Log

Tüm önemli değişiklikler bu dosyada belgelenecektir.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanmaktadır,
ve bu proje [Semantic Versioning](https://semver.org/spec/v2.0.0.html) kullanmaktadır.

## [Unreleased]

### Added
- İlk sürüm hazırlıkları
- Temel proje yapısı

## [1.0.0] - 2024-01-XX

### Added
- VS Code eklentisi temel yapısı
- OpenRouter AI sağlayıcı desteği
- Google Gemini AI sağlayıcı desteği
- Özel AI endpoint desteği
- Kod inceleme komutları
- Git entegrasyonu
- Tanılama yönetimi
- Yapılandırma yönetimi
- Çoklu dosya inceleme desteği
- Otomatik dosya kaydetme incelemesi
- İstatistik görüntüleme
- API anahtarı yönetimi
- Model seçimi
- Sağlayıcı yapılandırması

### Features
- **Çoklu AI Sağlayıcı**: OpenRouter, Gemini ve özel endpoint'ler
- **Akıllı İnceleme**: AI destekli kod kalitesi analizi
- **Git Entegrasyonu**: Değişen dosyaları otomatik tespit
- **Gerçek Zamanlı Geri Bildirim**: VS Code Problems panelinde sonuçlar
- **Toplu İnceleme**: Birden fazla dosyayı aynı anda inceleme
- **Özelleştirilebilir**: Kendi AI endpoint'inizi kullanın

### Supported Languages
- JavaScript/TypeScript
- Python
- Java
- C#
- C/C++
- Go
- Rust
- PHP
- Ruby
- Swift
- Kotlin

### Commands
- `freeAICodeReviewer.setApiKey` - API anahtarı ayarlama
- `freeAICodeReviewer.reviewCurrentFile` - Mevcut dosyayı inceleme
- `freeAICodeReviewer.reviewSelectedFiles` - Seçili dosyaları inceleme
- `freeAICodeReviewer.reviewChangedFiles` - Değişen dosyaları inceleme
- `freeAICodeReviewer.clearDiagnostics` - İnceleme sonuçlarını temizleme
- `freeAICodeReviewer.configureProvider` - Sağlayıcı yapılandırması
- `freeAICodeReviewer.selectModel` - Model seçimi
- `freeAICodeReviewer.showStatistics` - İstatistikleri gösterme

### Configuration
- `freeAICodeReviewer.provider` - AI sağlayıcısı seçimi
- `freeAICodeReviewer.model` - Model seçimi
- `freeAICodeReviewer.customEndpoint` - Özel endpoint URL'i
- `freeAICodeReviewer.customHeaders` - Özel HTTP başlıkları
- `freeAICodeReviewer.autoReviewOnSave` - Otomatik inceleme

### Security
- API anahtarları güvenli VS Code ayarlarında saklanır
- Kod sadece seçilen AI sağlayıcısına gönderilir
- Yerel işleme önceliklidir

### Documentation
- Kapsamlı README.md
- Kurulum ve kullanım kılavuzu
- API dokümantasyonu
- Sorun giderme rehberi

---

## Sürüm Notları

### [1.0.0] Hakkında
Bu ilk kararlı sürüm, VS Code için kapsamlı bir AI destekli kod inceleme çözümü sunmaktadır. Ücretsiz ve açık kaynak olan bu eklenti, geliştiricilerin kod kalitesini artırmalarına yardımcı olmak için tasarlanmıştır.

### Gelecek Sürümler
- Daha fazla AI sağlayıcı desteği
- Gelişmiş inceleme kategorileri
- Özel inceleme kuralları
- Takım işbirliği özellikleri
- Performans iyileştirmeleri