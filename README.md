# Free AI Code Reviewer

VS Code için ücretsiz AI destekli kod inceleme eklentisi. OpenAI, OpenRouter, Google Gemini ve özel AI sağlayıcıları ile kodunuzu analiz edin ve kalitesini artırın.

## 🚀 Özellikler

- **Çoklu AI Sağlayıcı Desteği**: OpenAI, OpenRouter, Google Gemini ve özel endpoint'ler
- **Akıllı Kod İncelemesi**: AI destekli kod kalitesi analizi
- **Git Entegrasyonu**: Değişen dosyaları otomatik tespit
- **Gerçek Zamanlı Geri Bildirim**: VS Code Problems panelinde sonuçlar
- **İlerleme Göstergesi**: İnceleme sürecinin aşamalarını gösteren görsel geri bildirim
- **Toplu İnceleme**: Birden fazla dosyayı aynı anda inceleme
- **İncelenen Dosyalar Görünümü**: ActivityBar'da özel panel ile incelenen dosyaları takip
- **Source Control Entegrasyonu**: Commit butonunun yanında "Review" butonu
- **Detaylı Problem Görünümü**: Her dosya için problemleri hiyerarşik olarak görüntüleme
- **Özelleştirilebilir**: Kendi AI endpoint'inizi kullanın

## 📦 Kurulum

1. VS Code'da Extensions panelini açın (`Ctrl+Shift+X`)
2. "Free AI Code Reviewer" araması yapın
3. Eklentiyi yükleyin ve etkinleştirin

## ⚙️ Yapılandırma

### 1. Sidebar UI ile Kolay Yapılandırma

Eklenti artık sol sidebar'da "AI Code Reviewer" paneli ile kolay yapılandırma sunar:

1. **Explorer** panelinde "AI Code Reviewer" bölümünü bulun
2. Sağlayıcı, model, API anahtarı ayarlarını tek tıkla yapın
3. Bağlantıyı test edin ve yapılandırmayı sıfırlayın

### 2. Komut Paleti ile Yapılandırma (Alternatif)

Komut paletini açın (`Ctrl+Shift+P`) ve şu komutu çalıştırın:

```
Free AI Code Reviewer: Set API Key
```

### 2. Desteklenen Sağlayıcılar

#### OpenAI

- [OpenAI Platform](https://platform.openai.com/api-keys) hesabı oluşturun
- API anahtarınızı alın
- GPT-4, GPT-3.5-turbo, o1-preview, o1-mini modellerine erişim

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

### Sidebar UI ile Hızlı Erişim

1. **Explorer** panelinde "AI Code Reviewer" bölümünü açın
2. Yapılandırma ayarlarınızı kontrol edin
3. "Bağlantıyı Test Et" ile kurulumu doğrulayın

### İncelenen Dosyalar Görünümü

1. **ActivityBar**'da "AI Code Reviewer" ikonuna tıklayın
2. "Reviewed Files" bölümünde incelenen dosyaları görün
3. Dosyaların altındaki problemlere tıklayarak ilgili satıra gidin
4. Problem sayısı ve ciddiyet seviyelerini takip edin

### Source Control ile Hızlı İnceleme

1. **Source Control** panelini açın
2. Commit butonunun yanındaki "Review" butonuna tıklayın
3. Değişen dosyalar otomatik olarak incelenir
4. Sonuçlar "Reviewed Files" görünümünde gösterilir

### Mevcut Dosyayı İnceleme

1. İncelemek istediğiniz dosyayı açın
2. Komut paletini açın (`Ctrl+Shift+P`)
3. `Free AI Code Reviewer: Review Current File` komutunu çalıştırın
4. İnceleme süreci boyunca ilerleme göstergesi görüntülenir (değişiklikler alınıyor, AI incelemesi yapılıyor, sonuçlar işleniyor)

### Seçili Dosyaları İnceleme

1. Explorer'da dosyaları seçin
2. Sağ tıklayın
3. "AI Code Review" seçeneğini tıklayın

### Değişen Dosyaları İnceleme

Git ile takip edilen değişiklikleri inceleyin:

```
Free AI Code Reviewer: Review Changed Files
```

**Alternatif**: Source Control panelindeki "Review" butonunu kullanın

### Otomatik İnceleme

Dosya kaydedildiğinde otomatik inceleme için ayarları açın:

```json
{
	"freeAICodeReviewer.autoReviewOnSave": true
}
```

## 📋 Komutlar

### Ana Komutlar

| Komut                                    | Açıklama                       |
| ---------------------------------------- | ------------------------------ |
| `freeAICodeReviewer.reviewCurrentFile`   | Mevcut dosyayı inceleme        |
| `freeAICodeReviewer.reviewSelectedFiles` | Seçili dosyaları inceleme      |
| `freeAICodeReviewer.reviewChangedFiles`  | Değişen dosyaları inceleme     |
| `freeAICodeReviewer.clearDiagnostics`    | İnceleme sonuçlarını temizleme |
| `freeAICodeReviewer.showStatistics`      | İstatistikleri gösterme        |

### Yapılandırma Komutları (Sidebar UI Önerilir)

| Komut                                    | Açıklama                       |
| ---------------------------------------- | ------------------------------ |
| `freeAICodeReviewer.setApiKey`           | API anahtarı ayarlama          |
| `freeAICodeReviewer.configureProvider`   | Sağlayıcı yapılandırması       |
| `freeAICodeReviewer.selectModel`         | Model seçimi                   |

### UI Komutları (Sidebar'dan Erişilebilir)

| Komut                                        | Açıklama                       |
| -------------------------------------------- | ------------------------------ |
| `freeAICodeReviewer.ui.selectProvider`       | Sağlayıcı seçimi               |
| `freeAICodeReviewer.ui.selectModel`          | Model seçimi                   |
| `freeAICodeReviewer.ui.setApiKey`            | API anahtarı ayarlama          |
| `freeAICodeReviewer.ui.setCustomEndpoint`    | Özel endpoint ayarlama         |
| `freeAICodeReviewer.ui.testConnection`       | Bağlantı testi                 |
| `freeAICodeReviewer.ui.resetConfiguration`   | Yapılandırmayı sıfırlama       |

## ⚙️ Ayarlar

```json
{
	"freeAICodeReviewer.provider": "openai",
	"freeAICodeReviewer.model": "",
	"freeAICodeReviewer.apiKey.openai": "",
	"freeAICodeReviewer.apiKey.openrouter": "",
	"freeAICodeReviewer.apiKey.gemini": "",
	"freeAICodeReviewer.apiKey.custom": "",
	"freeAICodeReviewer.customEndpoint": "",
	"freeAICodeReviewer.customHeaders": {},
	"freeAICodeReviewer.autoReviewOnSave": false
}
```

## 🏗️ Teknik Mimari

### UI Mimarisi

- **TreeView Provider**: VS Code sidebar entegrasyonu
- **UI Command Manager**: Kullanıcı arayüzü komutları
- **Configuration Tree**: Hiyerarşik yapılandırma görünümü
- **Real-time Updates**: Yapılandırma değişikliklerinde otomatik yenileme

### Prompt Yönetimi

Eklenti, merkezi prompt yönetimi için `PromptManager` sınıfını kullanır:

- **Merkezi Prompt Depolama**: Tüm AI sağlayıcıları ortak prompt'ları kullanır
- **Sağlayıcı Özel Prompt'lar**: Gemini gibi özel gereksinimleri olan sağlayıcılar için ayrı prompt'lar
- **Tutarlı Geri Bildirim**: Tüm sağlayıcılarda aynı JSON formatında sonuç
- **Kolay Güncelleme**: Prompt değişiklikleri tek yerden yönetilir

### Provider Mimarisi

- `IAgentProvider` arayüzü ile standart yapı
- `PromptManager` ile merkezi prompt yönetimi
- Sağlayıcı özel konfigürasyonlar
- Hata yönetimi ve geri bildirim standardizasyonu

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

### Dokümantasyon Kuralları

#### README.md Güncelleme Zorunluluğu
- `project_rules.md` dosyasında yapılan her değişiklik sonrasında bu README.md dosyası da güncellenmelidir
- Yeni özellikler, teknik gereksinimler ve mimari değişiklikler README'ye yansıtılmalıdır
- Kullanıcı dostu dil kullanılmalı ve PRD ile tutarlılık sağlanmalıdır

#### Proje Mimarisi Değişiklikleri
- Yeni sınıflar, arayüzler veya design pattern'ler eklendiğinde `project_rules.md` güncellenmelidir
- VS Code API kullanımında değişiklikler dokümante edilmelidir
- Provider mimarisi ve Strategy Pattern uygulamasındaki değişiklikler belgelenmelidir

#### Versiyon Kontrolü
- Büyük özellik eklemeleri sonrasında versiyon numarası güncellenmelidir
- Önemli değişiklikler tarih ile birlikte kayıt altına alınmalıdır

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
