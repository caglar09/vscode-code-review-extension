# Free AI Code Reviewer

VS Code için ücretsiz AI destekli kod inceleme eklentisi. OpenRouter, Google Gemini ve özel AI sağlayıcıları ile kodunuzu analiz edin ve kalitesini artırın.

## 🚀 Özellikler

- **Çoklu AI Sağlayıcı Desteği**: OpenRouter, Google Gemini ve özel endpoint'ler
- **Akıllı Kod İncelemesi**: AI destekli kod kalitesi analizi
- **Git Entegrasyonu**: Değişen dosyaları otomatik tespit
- **Gerçek Zamanlı Geri Bildirim**: VS Code Problems panelinde sonuçlar
- **Toplu İnceleme**: Birden fazla dosyayı aynı anda inceleme
- **Özelleştirilebilir**: Kendi AI endpoint'inizi kullanın

## 📦 Kurulum

1. VS Code'da Extensions panelini açın (`Ctrl+Shift+X`)
2. "Free AI Code Reviewer" araması yapın
3. Eklentiyi yükleyin ve etkinleştirin

## ⚙️ Yapılandırma

### 1. API Anahtarı Ayarlama

Komut paletini açın (`Ctrl+Shift+P`) ve şu komutu çalıştırın:
```
Free AI Code Reviewer: Set API Key
```

### 2. Desteklenen Sağlayıcılar

#### OpenRouter
- [OpenRouter](https://openrouter.ai) hesabı oluşturun
- API anahtarınızı alın
- Çok sayıda AI modeline erişim

#### Google Gemini
- [Google AI Studio](https://makersuite.google.com/app/apikey) hesabı oluşturun
- API anahtarınızı alın
- Gemini Pro ve diğer modeller

#### Özel Sağlayıcı
- Kendi AI endpoint'inizi kullanın
- OpenAI uyumlu API formatı gerekli

### 3. Model Seçimi

Komut paletinden model seçin:
```
Free AI Code Reviewer: Select Model
```

## 🎯 Kullanım

### Mevcut Dosyayı İnceleme

1. İncelemek istediğiniz dosyayı açın
2. Komut paletini açın (`Ctrl+Shift+P`)
3. `Free AI Code Reviewer: Review Current File` komutunu çalıştırın

### Seçili Dosyaları İnceleme

1. Explorer'da dosyaları seçin
2. Sağ tıklayın
3. "AI Code Review" seçeneğini tıklayın

### Değişen Dosyaları İnceleme

Git ile takip edilen değişiklikleri inceleyin:
```
Free AI Code Reviewer: Review Changed Files
```

### Otomatik İnceleme

Dosya kaydedildiğinde otomatik inceleme için ayarları açın:
```json
{
    "freeAICodeReviewer.autoReviewOnSave": true
}
```

## 📋 Komutlar

| Komut | Açıklama |
|-------|----------|
| `freeAICodeReviewer.setApiKey` | API anahtarı ayarlama |
| `freeAICodeReviewer.reviewCurrentFile` | Mevcut dosyayı inceleme |
| `freeAICodeReviewer.reviewSelectedFiles` | Seçili dosyaları inceleme |
| `freeAICodeReviewer.reviewChangedFiles` | Değişen dosyaları inceleme |
| `freeAICodeReviewer.clearDiagnostics` | İnceleme sonuçlarını temizleme |
| `freeAICodeReviewer.configureProvider` | Sağlayıcı yapılandırması |
| `freeAICodeReviewer.selectModel` | Model seçimi |
| `freeAICodeReviewer.showStatistics` | İstatistikleri gösterme |

## ⚙️ Ayarlar

```json
{
    "freeAICodeReviewer.provider": "openrouter",
    "freeAICodeReviewer.model": "",
    "freeAICodeReviewer.customEndpoint": "",
    "freeAICodeReviewer.customHeaders": {},
    "freeAICodeReviewer.autoReviewOnSave": false
}
```

## 🔧 Desteklenen Diller

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

## 📊 İnceleme Kategorileri

AI şu kategorilerde geri bildirim verir:

- **Hata**: Kritik sorunlar ve hatalar
- **Uyarı**: Potansiyel sorunlar ve iyileştirmeler
- **Bilgi**: Genel öneriler ve en iyi pratikler

## 🔒 Güvenlik

- API anahtarları VS Code ayarlarında güvenli şekilde saklanır
- Kod sadece seçilen AI sağlayıcısına gönderilir
- Yerel işleme önceliklidir

## 🐛 Sorun Giderme

### API Anahtarı Hataları
- API anahtarınızın doğru olduğundan emin olun
- Sağlayıcı hesabınızda kredi bulunduğunu kontrol edin

### Model Listesi Alınamıyor
- İnternet bağlantınızı kontrol edin
- API anahtarınızın geçerli olduğundan emin olun

### İnceleme Sonuçları Görünmüyor
- Problems panelini açın (`Ctrl+Shift+M`)
- "Free AI Code Reviewer" filtresini kontrol edin

## 📝 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 Destek

Sorularınız için:
- GitHub Issues
- [Dokümantasyon](https://github.com/your-username/vscode-free-ai-code-reviewer)

## 🙏 Teşekkürler

- OpenRouter API
- Google Gemini API
- VS Code Extension API
- Tüm katkıda bulunanlar

---

**Not**: Bu eklenti ücretsizdir ve açık kaynak kodludur. AI sağlayıcılarının kendi fiyatlandırma politikaları vardır.