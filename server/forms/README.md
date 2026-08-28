# Teklif formu SMTP sınırı

`teklif.php`, statik Next.js sitesinden ayrı çalışan PHP 8.5 form sınırıdır.
Tarayıcı aynı origin üzerindeki `/forms/teklif.php` adresine URL-encoded POST
gönderir; endpoint doğrulama ve kötüye kullanım kontrollerinden sonra
`quote-mailer.php` üzerinden PHPMailer ile kimlik doğrulamalı SMTP kullanır.
Uygulamada PHP `mail()` yedeği yoktur.

## Composer ve release

PHPMailer yalnızca geliştirme/release makinesinde Composer ile kurulur:

```sh
composer --working-dir=server/forms install --no-dev --prefer-dist --optimize-autoloader --no-interaction
```

`composer.json` ve `composer.lock` Git'e girer; `server/forms/vendor/` Git'e
girmez. cPanel'de Composer gerekmez. Release assembler statik çıktıyla birlikte
`teklif.php`, `quote-mailer.php`, Composer manifest/lock ve `vendor/` çalışma
zamanını `release/<target>/forms/` altına kopyalar. `vendor/autoload.php` yoksa
paketleme açıklayıcı hatayla durur.

## Özel SMTP yapılandırması

Gerçek yapılandırma her iki document root'un dışında tutulur. Mailer önce
`KALITE_FILO_MAIL_CONFIG` ortam değişkenindeki mutlak ve okunabilir dosyayı,
değişken yoksa aşağıdaki cPanel hesabı ortak yolunu kullanır:

```text
dirname(__DIR__, 2)/private/kalite-filo-mail.php
```

Endpoint `<document-root>/forms/` altında olduğundan iki üst dizin hem
`public_html/forms/` hem `staging.kalitefilo.com.tr/forms/` için cPanel hesap
home dizinine ulaşır. Dosya yoksa veya geçersizse işlem kapalı biçimde başarısız
olur; yol ve hata ayrıntısı ziyaretçiye açıklanmaz.

Sözleşmenin güvenli örneği `kalite-filo-mail.example.php` dosyasındadır. Bu
örnek otomatik yüklenmez ve parola içermez. Yapılandırma yalnızca şu çiftleri
kabul eder:

- `smtps` + 465 (`PHPMailer::ENCRYPTION_SMTPS`)
- `starttls` + 587 (`PHPMailer::ENCRYPTION_STARTTLS`)

Sunucu `smtp.turkticaret.net` olarak yapılandırılabilir; SMTP authentication her
zaman açıktır ve TLS sertifika doğrulaması kapatılamaz. SMTP kullanıcı adı,
From ve recipient birbirinden bağımsız özel yapılandırma alanlarıdır. Ziyaretçi
e-postası yalnızca doğrulanmış `Reply-To` olur; From/To/SMTP kimliği olamaz.

Staging'de önce sağlayıcının aynı-mailbox temel senaryosu
(`teklif` auth/From/recipient), sonra yalnızca özel config değiştirilerek istenen
`noreply` auth/From → `teklif` recipient senaryosu sınanmalıdır. Otomatik kimlik
fallback'i yoktur. Ayrıntılı kontrol listesi: `docs/smtp-staging-test.md`.

Release paketi PHP çalıştıran cPanel document root'una yüklenmelidir. Genel
statik önizleme sunucuları PHP kaynağını düz metin gösterebileceğinden bu paket
onlarda yayımlanmamalıdır.

## İletişim formu

`iletisim.php`, aynı SMTP taşıma katmanını, origin kontrolünü, honeypot ve hız
sınırını kullanır. Teklif alıcısını değiştirmez; özel yapılandırmadaki
`contact_recipient_address` ve `contact_recipient_name` alanlarına gönderir.
Gerçek parola ve SMTP kimliği yalnızca document root dışındaki özel
`kalite-filo-mail.php` dosyasında tutulmalıdır.

## E-bülten ve kalıcı iletişim kaydı

`bulten.php`, açık e-bülten onayıyla gelen adresleri `subscriber-store.php`
üzerinden kaydeder. Teklif ve iletişim formlarında kullanılan e-posta adresleri
de aynı denetim dosyasına yazılır; ancak bu kayıtlar pazarlama izni sayılmaz.
Varsayılan kalıcı dosya document root ve release klasörlerinin dışındadır:

```text
/home/<cpanel-kullanıcısı>/private/kalite-filo-data/newsletter-contacts.csv
```

Yol gerektiğinde `KALITE_FILO_CONTACT_STORE_PATH` ile mutlak bir konuma
taşınabilir. Dosya kilitli ve atomik güncellenir, izinleri `0600` yapılır. Şema:
`id`, `email`, `status`, `consent_source`, `consent_text_version`, `consent_at`,
`confirmed_at`, `unsubscribed_at`, `created_at`, `updated_at`, `iys_status`,
`iys_synced_at`.

E-bülten kaydı başlangıçta `pending` / `pending` durumundadır. Double opt-in ve
gerçek İYS entegrasyonu henüz bulunmadığından `confirmed_at`, `iys_synced_at`
boş kalır; kayıt otomatik olarak `active` veya `approved` ilan edilmez. Teklif ve
iletişim kaynakları `lead_only` / `not_requested` olarak tutulur.

cPanel File Manager'da hesap ana dizinine çıkıp `private` →
`kalite-filo-data` → `newsletter-contacts.csv` yolundan dosya indirilebilir.
Yeni release yalnızca document root'a açıldığı sürece bu dosya korunur. Yine de
cPanel yedeğine bu özel dizin ayrıca dahil edilmelidir.
