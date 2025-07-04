### **Ürün Gereksinimleri Dokümanı (PRD): Free AI Code Reviewer**

* **Versiyon:** 1.0
* **Tarih:** 2 Temmuz 2025
* **Yazar:** (Proje Sahibi)
* **Durum:** Taslak

### 1. Giriş ve Vizyon

#### 1.1. Ürün Adı
Free AI Code Reviewer

#### 1.2. Vizyon
Geliştiriciler için, farklı yapay zeka sağlayıcılarının ücretsiz modellerini kullanarak kod kalitesini artıran, esnek ve tamamen entegre bir VS Code eklentisi ile otomatik kod incelemeyi demokratikleştirmek.

#### 1.3. Problem Tanımı
Öğrenciler, açık kaynak geliştiricileri ve küçük bütçeli ekipler, genellikle maliyetli oldukları için modern yapay zeka destekli kod inceleme araçlarına erişimde zorluk yaşamaktadır. Mevcut araçlar sıklıkla tek bir ücretli ekosisteme bağlıdır ve bu da kullanıcıların model veya maliyet konusunda seçim yapma özgürlüğünü kısıtlar. Bu proje, özellikle ücretsiz katmanlar sunan AI sağlayıcılarına odaklanarak bu boşluğu doldurmayı hedefler.

#### 1.4. Hedef Kitle (Kullanıcı Personası)
* **Adı:** Alex
* **Rol:** Serbest (Freelance) Web Geliştiricisi / Açık Kaynak Katılımcısı
* **İhtiyaçları:** Projelerinde yüksek kod kalitesini sürdürmek, potansiyel hataları erken aşamada yakalamak ve en iyi pratikleri öğrenmek.
* **Zorlukları:** Pahalı abonelik tabanlı araçlara bütçe ayıramamak, kodunu inceleyecek deneyimli bir ekip üyesinin her zaman bulunmaması.
* **Hedefi:** Manuel eforu azaltan, kodlama akışını bozmayan ve ücretsiz veya çok düşük maliyetli olan bir otomatik inceleme aracına sahip olmak.

### 2. Temel Özellikler ve Kullanıcı Hikayeleri

Bu bölüm, eklentinin ne yapması gerektiğini tanımlar.

#### **Epic 1: Yapılandırma ve Kurulum**
Kullanıcının eklentiyi kendi ihtiyaçlarına göre ayarlamasını sağlar.

* **Kullanıcı Hikayesi 1.1 (Sağlayıcı Seçimi):**
    * **Bir kullanıcı olarak,** eklenti ayarlarından tercih ettiğim AI Sağlayıcısını (**OpenRouter**, **Gemini**, **Özel Uç Nokta**) seçebilmek istiyorum, **böylece** istediğim hizmeti kullanabilirim.

* **Kullanıcı Hikayesi 1.2 (Güvenli API Anahtarı Saklama):**
    * **Bir kullanıcı olarak,** seçtiğim sağlayıcı için API Anahtarımı güvenli bir şekilde girebilmek ve saklayabilmek istiyorum, **böylece** kimlik bilgilerim düz metin olarak açığa çıkmaz.

* **Kullanıcı Hikayesi 1.3 (Özel Uç Nokta Yapılandırması):**
    * **Bir kullanıcı olarak,** "Özel Uç Nokta" seçeneğini seçtiğimde, tam API URL'sini ve gerekli özel başlıkları (örneğin, `Authorization: Bearer $API_KEY`) belirtebilmek istiyorum, **böylece** kendi barındırdığım veya niş AI servislerine bağlanabilirim.

* **Kullanıcı Hikayesi 1.4 (Dinamik Model Seçimi):**
    * **Bir kullanıcı olarak,** seçtiğim sağlayıcıya göre otomatik olarak doldurulan mevcut AI modellerini içeren bir açılır liste görmek istiyorum, **böylece** incelemelerim için `Google: Gemini 1.5 Flash` veya `OpenRouter: Nous Hermes 2 Mixtral 8x7B` gibi belirli bir modeli seçebilirim.

#### **Epic 2: Kod İnceleme İş Akışı**
Eklentinin temel inceleme mekaniğini tanımlar.

* **Kullanıcı Hikayesi 2.1 (Otomatik Tetikleme):**
    * **Bir kullanıcı olarak,** Git tarafından izlenen bir dosyayı kaydettiğimde, eklentinin otomatik olarak bir kod incelemesini tetiklemesini istiyorum, **böylece** manuel bir müdahale olmadan geri bildirim alabilirim.

* **Kullanıcı Hikayesi 2.2 (Değişiklik (Diff) Oluşturma):**
    * **Bir kullanıcı olarak,** eklentinin, dosyanın son commit'lenmiş versiyonuna kıyasla yaptığım değişikliklerin bir "diff"ini oluşturmasını istiyorum, **böylece** verimli bir inceleme için sadece yeni çalışmam AI'a gönderilir.

* **Kullanıcı Hikayesi 2.3 (Akıllı Prompt Hazırlama):**
    * **Bir kullanıcı olarak,** eklentinin, kod diff'ini, dosyanın programlama dilini ve AI'ya "uzman bir kod gözden geçiricisi" olarak hareket etmesi ve geri bildirimi yapılandırılmış bir JSON formatında sunması için talimatlar içeren hassas bir komut istemi (prompt) oluşturmasını istiyorum.

#### **Epic 3: Geri Bildirimlerin Gösterilmesi**
AI'dan gelen sonuçların kullanıcıya sunulma şeklini tanımlar.

* **Kullanıcı Hikayesi 3.1 (Editör İçi Tanılama):**
    * **Bir kullanıcı olarak,** AI tarafından oluşturulan geri bildirimleri doğrudan editörümde tanılama "dalgalı çizgileri" (uyarılar, bilgiler) olarak görmek istiyorum, **böylece** hangi kod satırlarının öneri içerdiğini hızla belirleyebilirim.

* **Kullanıcı Hikayesi 3.2 (Detaylı Açıklama):**
    * **Bir kullanıcı olarak,** vurgulanmış bir kod satırının üzerine fare ile geldiğimde, AI'dan gelen ayrıntılı yorumu içeren bir araç ipucu görmek istiyorum, **böylece** öneriyi anlayabilirim.

* **Kullanıcı Hikayesi 3.3 (İlerleme Göstergesi):**
    * **Bir kullanıcı olarak,** kod incelemesi sırasında VS Code'un ilerleme göstergesi ile inceleme sürecinin aşamalarını ("Değişiklikler alınıyor...", "AI incelemesi yapılıyor...", "Sonuçlar işleniyor...") görmek istiyorum, **böylece** işlemin ne kadar süreceğini ve hangi aşamada olduğunu bilebilirim.

* **Kullanıcı Hikayesi 3.4 (Durum Bildirimleri):**
    * **Bir kullanıcı olarak,** VS Code durum çubuğunda "AI İncelemesi: Devam ediyor...", "AI İncelemesi: Tamamlandı" gibi bir durum mesajı görmek istiyorum, **böylece** inceleme sürecinin mevcut durumunu bilirim.

* **Kullanıcı Hikayesi 3.5 (Hata Yönetimi):**
    * **Bir kullanıcı olarak,** bir API çağrısı başarısız olursa, sorunu açıklayan ("Geçersiz API Anahtarı", "Ağ Hatası" gibi) net bir hata mesajı görmek istiyorum, **böylece** sorunu giderebilirim.

### 3. Teknik Gereksinimler ve Mimari

Bu bölüm, eklentinin nasıl inşa edilmesi gerektiğini tanımlar.

* **Dil:** TypeScript
* **Platform:** Visual Studio Code Extension API
* **Mimari Yaklaşım: Strateji Deseni (Strategy Pattern)**
    * Tüm sağlayıcıların uyması gereken bir `IAgentProvider` arayüzü oluşturulmalıdır. Bu arayüz şu metotları içermelidir:
        * `getProviderId(): string;` (örn: 'openrouter', 'gemini')
        * `getModels(apiKey: string): Promise<string[]>;`
        * `performReview(apiKey: string, model: string, diff: string, languageId: string): Promise<ReviewComment[]>;`
    * Her sağlayıcı için bu arayüzü uygulayan somut sınıflar oluşturulmalıdır: `OpenRouterProvider.ts`, `GeminiProvider.ts`, `CustomEndpointProvider.ts`.
* **Kullanılacak VS Code API'ları:**
    * **Yapılandırma:** `vscode.workspace.getConfiguration('freeAiCodeReviewer')`
    * **Güvenlik:** `vscode.SecretStorage` (API anahtarları için **zorunludur**).
    * **Görsel Geri Bildirim:** `vscode.languages.createDiagnosticCollection`
    * **Bildirimler:** `vscode.window.showInformationMessage`, `vscode.window.showErrorMessage`
    * **İlerleme Durumu:** `vscode.window.withProgress` (kod incelemesi sürecinin aşamalarını göstermek için kullanılır)
    * **Olaylar:** `vscode.workspace.onDidSaveTextDocument`
* **Git Entegrasyonu:**
    * Değişiklikleri (diff) oluşturmak için `simple-git` gibi bir Node.js kütüphanesi kullanılmalıdır.
* **API Etkileşim Detayları:**
    * **OpenRouter:**
        * Uç Nokta: `https://openrouter.ai/api/v1/chat/completions`
        * Modelleri Getirme: `https://openrouter.ai/api/v1/models` (GET isteği)
        * Kimlik Doğrulama: `Authorization: Bearer $API_KEY`
    * **Gemini (Google AI):**
        * Uç Nokta: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=$API_KEY`
        * Modelleri Getirme: `https://generativelanguage.googleapis.com/v1beta/models?key=$API_KEY` (GET isteği)
    * **Özel Uç Nokta:**
        * Kullanıcı, ayarlar üzerinden tam URL'yi sağlamalıdır.
        * Eklenti, kullanıcının tanımladığı başlıklardaki `$API_KEY` gibi değişkenleri `SecretStorage`'dan alınan gerçek değerle değiştirmelidir.

### 4. Fonksiyonel Olmayan Gereksinimler

* **Performans:** API çağrıları, kullanıcı yazarken sürekli tetiklenmemelidir. İnceleme sadece dosya kaydedildiğinde tetiklenmelidir. Ağ istekleri kullanıcı arayüzünü (UI) engellememelidir.
* **Güvenlik:** API anahtarları, `settings.json`'a asla düz metin olarak yazılmamalıdır. Yalnızca VS Code'un `SecretStorage` API'si kullanılmalıdır.
* **Kullanılabilirlik:** Tüm ayarlar, VS Code Ayarlar arayüzünde `markdownDescription` kullanılarak açıkça belgelenmelidir.
* **Güvenilirlik:** Eklenti, API hatalarını, ağ kesintilerini ve geçersiz kullanıcı yapılandırmalarını çökmeyecek şekilde zarif bir biçimde yönetmelidir.

### 5. Kapsam Dışı (Versiyon 1.0 için)

* Tüm dosyaların veya projelerin tam incelemesi (sadece commit'lenmemiş değişiklikler).
* Satır içi yorum dizileri (VS Code `Comments API`). V1 için `Diagnostics API` yeterlidir.
* Kullanıcı arayüzü üzerinden özelleştirilebilir AI komut istemleri (prompt'lar).
* Otomatik kod düzeltme ("hızlı düzeltme") eylemleri.
* Git dışındaki sürüm kontrol sistemleri için destek.

### 6. Dokümantasyon ve Proje Yönetimi Kuralları

#### 6.1. README.md Güncelleme Kuralı
* **Zorunlu Güncelleme:** Bu PRD dosyasında (`project_rules.md`) yapılan her değişiklik sonrasında, `/Users/caglar/Desktop/ReactProjects/vscode-code-review-extension/README.md` dosyası da güncellenmelidir.
* **Güncelleme Kapsamı:** Yeni özellikler, değişen teknik gereksinimler, kullanıcı hikayeleri ve mimari değişiklikler README.md dosyasına yansıtılmalıdır.
* **Tutarlılık:** README.md dosyasındaki bilgiler, PRD ile tutarlı olmalı ve kullanıcı dostu bir dilde yazılmalıdır.

#### 6.2. Proje Mimarisi Değişiklik Kuralı
* **Mimari Değişiklikler:** Proje mimarisinde etkili olan değişiklikler (yeni sınıflar, arayüzler, design pattern'ler, API değişiklikleri) yapıldığında, bu PRD dosyası (`project_rules.md`) da güncellenmelidir.
* **Güncelleme Alanları:** 
  * Teknik Gereksinimler ve Mimari bölümü (Bölüm 3)
  * Kullanılacak VS Code API'ları listesi
  * Provider mimarisi ve Strategy Pattern uygulaması
  * Yeni eklenen sınıflar ve arayüzler
* **Dokümantasyon Senkronizasyonu:** Kod değişiklikleri ile dokümantasyon arasında tutarlılık sağlanmalıdır.

#### 6.3. Versiyon Kontrolü
* **Versiyon Güncelleme:** Büyük özellik eklemeleri veya mimari değişiklikler sonrasında PRD versiyonu güncellenmelidir.
* **Değişiklik Takibi:** Önemli değişiklikler tarih ile birlikte belgelenmelidir.