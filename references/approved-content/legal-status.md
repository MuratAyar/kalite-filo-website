# Kalite Filo — Legal Status

> Bu dosya web sitesi geliştirme sürecinde hukuki/kurumsal bilgilerin hangi alanlarda kullanılacağını tanımlar.
> Aşağıdaki içerik hukuki danışmanlık değildir. Resmî bilgiler şirket belgelerinden doğrulanmadan üretim ortamında yayınlanmamalıdır.

## Görünen Ticari Unvan

Tasarım ekranlarının footer bölümünde kullanılan ifade:

**Kalite Filo Kiralama A.Ş.**

> Bu unvanın Ticaret Sicili / MERSİS kayıtlarındaki tam ticari unvanla birebir aynı olduğu teyit edilmelidir.

## Marka Adı

- **Kalite Filo**

## Hukuki Yapı

Tasarım diline göre şirket türü:

- **Anonim Şirket (A.Ş.)**

> Resmî şirket evraklarından doğrulanmalıdır.

## Resmî Bilgi Alanları

Aşağıdaki bilgiler üretim öncesinde şirketten temin edilmelidir:

- Tam ticari unvan
- MERSİS numarası
- Ticaret sicil numarası
- Ticaret sicil müdürlüğü
- Vergi dairesi
- Vergi numarası
- KEP adresi
- Merkez adresi
- Yetkili iletişim e-posta adresi
- Telefon
- Varsa ETBİS bilgileri
- Varsa ilgili lisans/izin/üyelik bilgileri

## Footer Telif Metni

Tasarım ekranlarında kullanılan örnek:

`© 2024 Kalite Filo Kiralama A.Ş. Tüm hakları saklıdır.`

### Önerilen dinamik kullanım

Yıl hard-code edilmemeli:

`© {CURRENT_YEAR} Kalite Filo Kiralama A.Ş. Tüm hakları saklıdır.`

## Zorunlu / Önerilen Hukuki Sayfalar

Web sitesinde aşağıdaki sayfaların bulunması önerilir:

### 1. KVKK ve Gizlilik

İçermesi gereken temel başlıklar:

- Veri sorumlusu bilgileri
- İşlenen kişisel veri kategorileri
- İşleme amaçları
- Hukuki sebepler
- Verilerin aktarılabileceği taraflar
- Saklama süreleri
- İlgili kişi hakları
- Başvuru yöntemleri

### 2. Aydınlatma Metni

Özellikle:

- Teklif formu
- İletişim formu
- E-bülten formu
- Müşteri giriş sistemi

için gerekli metinler ayrı veya uygun kapsamda hazırlanmalıdır.

### 3. Çerez Politikası

Şunları açıklamalıdır:

- Zorunlu çerezler
- Analitik çerezler
- Pazarlama/reklam çerezleri
- Üçüncü taraf çerezleri
- Tercih yönetimi
- Saklama süreleri

Zorunlu olmayan çerezler kullanıcı onayı alınmadan çalıştırılmamalıdır.

### 4. Kullanım Koşulları

Şunları kapsamalıdır:

- Site kullanım şartları
- İçeriklerin fikrî mülkiyeti
- Bilgi doğruluğu ve güncellik
- Üçüncü taraf bağlantıları
- Sorumluluk sınırlamaları
- Uyuşmazlık / uygulanacak hukuk hükümleri

### 5. Ticari Elektronik İleti Onayı

E-bülten, kampanya ve pazarlama iletileri için gerekli izin mekanizması mevzuata uygun kurulmalıdır.

## Formlarda Hukuki Gereksinimler

Teklif ve iletişim formlarında:

- Aydınlatma metni bağlantısı görünür olmalı.
- Pazarlama izni, hizmetin yürütülmesi için zorunlu bir onay gibi sunulmamalı.
- Gerekli olduğunda ayrı açık rıza / ticari ileti onayı alınmalı.
- Checkbox varsayılan seçili olmamalı.
- Onay kayıtları tarih/saat ve ilgili metin versiyonuyla tutulabilmelidir.

## Fiyat ve Teklif Açıklaması

Araç sayfalarında gösterilecek fiyatlar için önerilen açıklama:

- Fiyatların örnek/başlangıç fiyatı olup olmadığı açıkça belirtilmeli.
- KDV dahil/hariç durumu belirtilmeli.
- Kiralama süresi, kilometre, araç adedi ve hizmet kapsamına göre fiyatın değişebileceği yazılmalı.
- Stok ve araç bulunabilirliği garanti gibi gösterilmemeli.

## Blog ve Mevzuat İçeriği

Vergi, muhasebe veya mevzuat hakkında içerikler:

- Yayın tarihi taşımalı.
- Son güncelleme tarihi gerektiğinde gösterilmeli.
- Kaynak/uzman kontrolü yapılmalı.
- Değişebilecek oran ve kurallar otomatik olarak kalıcı doğru bilgi gibi sunulmamalıdır.

## Veri Güvenliği

Müşteri girişi ve formlar için minimum teknik beklentiler:

- HTTPS zorunlu
- Güvenli oturum yönetimi
- Güçlü parola politikası
- Rate limiting
- CSRF/XSS/SQL injection korumaları
- Sunucu tarafı input validation
- Hassas verilerin loglara yazılmaması
- Erişim kontrolü
- Gerektiğinde MFA
- Düzenli yedekleme
- Kişisel veriler için erişim ve saklama politikaları

## Yayına Çıkış Öncesi Hukuki Kontrol Listesi

- [ ] Ticari unvan doğrulandı
- [ ] MERSİS / sicil / vergi bilgileri doğrulandı
- [ ] Merkez adresi doğrulandı
- [ ] Telefon ve e-posta doğrulandı
- [ ] KVKK metinleri hukuk danışmanı tarafından kontrol edildi
- [ ] Çerez yönetimi kuruldu
- [ ] Form aydınlatma/onay metinleri eklendi
- [ ] E-bülten izin mekanizması mevzuata uygun hale getirildi
- [ ] Fiyat açıklamaları eklendi
- [ ] Telif yılı dinamik hale getirildi
