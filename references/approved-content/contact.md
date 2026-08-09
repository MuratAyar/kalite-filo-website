# Kalite Filo — Contact

> Bu dosya, web sitesindeki iletişim bilgilerinin ve iletişim kanallarının tek noktadan yönetilmesi için hazırlanmıştır.
> Ekran tasarımlarında birbiriyle çelişen bazı örnek bilgiler bulunduğu için üretim öncesinde doğrulama gerektiren alanlar açıkça işaretlenmiştir.

## Ana İletişim Bilgileri

### Telefon

Tasarım ekranlarında kullanılan ana telefon:

- **+90 531 715 80 68**
- Alternatif gösterim: **0531 715 80 68**
- Sayısal format: **05317158068**

Önerilen `tel:` bağlantısı:

`tel:+905317158068`

### E-posta

Tasarım ekranlarında kullanılan ana kurumsal e-posta:

- **info@kalitefilo.com.tr**

Önerilen `mailto:` bağlantısı:

`mailto:info@kalitefilo.com.tr`

## İletişim Formu

İletişim sayfasındaki form alanları:

- İsim Soyisim
- E-posta
- Mesaj

Önerilen ek alanlar:

- Telefon
- Firma Adı
- İletişim Konusu
- KVKK/Aydınlatma Metni onayı

Form gönderildikten sonra kullanıcıya açık bir başarı/hata mesajı gösterilmelidir.

## Teklif Formu

Kurumsal teklif formunda tasarım ekranlarında bulunan alanlar:

### Yetkili Kişi Bilgileri

- Ad
- Soyad
- Unvan
- Telefon Numarası
- E-posta

### Şirket Bilgileri

- Firma Adı
- Sektör
- İl
- İlçe

### Araç Bilgileri

- Kiralama Süresi (Ay)
- Kiralanacak Araç Sayısı
- Araç Markası / Model Tercihi
- Yıllık KM Limiti

### Onay

Formda kişisel verilerin işlenmesine ve iletişim amaçlı kullanılmasına ilişkin açık onay/aydınlatma metni bağlantısı bulunmalıdır.

## Kurumsal Destek

Tasarım ekranında:

- **Çağrı Merkezi:** `444 28 47`

> **Doğrulama gerekli:** Bu numara yayın öncesinde Kalite Filo tarafından teyit edilmelidir.

## Adres

İletişim tasarımında örnek olarak şu adres yer almaktadır:

- `Merkez Mah. No:123`
- `Şişli / İstanbul`

> **UYARI:** Bu adres tasarımda placeholder/örnek niteliğinde görünmektedir. Resmî şirket adresi doğrulanmadan üretim sitesinde kullanılmamalıdır.

## Çelişen / Eski Görünen Bilgiler

Bazı ekranlarda aşağıdaki e-posta da görülmektedir:

- `destek@kalitefilo.com`

Bu adres ana footer'da görünen `info@kalitefilo.com.tr` adresiyle aynı değildir.

### Önerilen karar

Üretim için tek bir kaynak kullanılmalı:

- Genel iletişim: `info@kalitefilo.com.tr`
- Destek e-postası ayrıca gerçekten kullanılacaksa ayrı kanal olarak tanımlanmalı.

## Sosyal Medya

Sosyal medya hesapları bu dosyaya gerçek URL'leri doğrulandıktan sonra eklenmelidir.

Önerilen alanlar:

- Instagram
- LinkedIn
- Facebook
- X
- YouTube
- TikTok

## Footer İletişim Alanı

Footer için önerilen yapı:

**Bize Ulaşın**

- İletişim
- +90 531 715 80 68
- info@kalitefilo.com.tr

## Teknik Notlar

- Telefon numarası kullanıcıya okunabilir biçimde, linkte E.164 formatında tutulmalıdır.
- E-posta adresleri mümkünse CMS/config üzerinden yönetilmelidir.
- İletişim bilgileri HTML içine farklı sayfalarda tekrar tekrar hard-code edilmemelidir.
- Formlar spam koruması, rate limit, server-side validation ve güvenli veri işleme ile korunmalıdır.
- Form kayıtları KVKK gereksinimlerine uygun saklanmalıdır.
