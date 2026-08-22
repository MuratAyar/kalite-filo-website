# Teklif formu PHP endpoint'i

`teklif.php`, statik Next.js çıktısından ayrı bir çalışma zamanı sınırıdır.
Kaynak dosyası `public/` altında tutulmaz; genel amaçlı statik ön izleme
sunucularının PHP kaynağını düz metin olarak yayımlaması bu şekilde önlenir.

Kontrollü release artifact hazırlanırken dosya document root içindeki
`/forms/teklif.php` konumuna kopyalanmalıdır. `npm run release:production`
statik çıktıyı üretir ve PHP dosyasını yalnızca cPanel'e yüklenecek
`release/production/` paketine ekler. Bu paket genel amaçlı bir statik önizleme
sunucusunda çalıştırılmamalıdır; PHP kaynak kodunu düz metin olarak sunabilir.

Endpoint PHP 8.5 için yazılmıştır
ve `mail()` işlevinin hosting tarafından doğru gönderici alan adıyla
yapılandırılmış olmasını bekler. Depoda ya da dışa aktarılan artifact içinde
posta hesabı parolası bulunmaz.

Gönderim aynı cPanel hesabındaki yerel posta aktarımına bırakılır. Bu nedenle
mailbox veya SMTP parolası Next.js `.env` dosyasına, istemci paketine, PHP
kaynağına ya da release artifact'ine yazılmamalıdır. Hosting `mail()` çağrısını
reddederse önce cPanel Email Accounts > Connect Devices ekranındaki sunucu
ayarları ve hosting posta kayıtları doğrulanmalı; kimlik doğrulamalı SMTP ancak
ayrı bir güvenlik incelemesiyle ve document root dışındaki sunucu yapılandırması
üzerinden eklenmelidir.

Yayına almadan önce staging üzerinde en az şu kontroller yapılmalıdır:

- `php -l server/forms/teklif.php`;
- geçerli Kurumsal ve Bireysel gönderim;
- Kurumsal vergi numarası ve Bireysel T.C. kimlik numarası doğrulaması;
- on iki aydan kısa kiralama süresinin reddedilmesi;
- eksik/geçersiz alan, hatalı origin, honeypot ve hız sınırı yanıtları;
- alıcıya ulaşan Türkçe metnin karakter kodlaması ve `Reply-To` davranışı;
- başarısız posta tesliminde kullanıcıya genel hata durumu dönmesi;
- hosting posta kayıtları ve spam klasörü kontrolü.

PHP `mail()` dönüş değeri iletinin yalnızca posta sistemine kabul edildiğini
gösterir; gerçek teslimat staging üzerinde ayrıca doğrulanmalıdır.
