# Sıkça Sorulan Sorular sayfası durumu

Last reconciled: 2026-08-17

## Uygulanan yapı

- `/sikca-sorulan-sorular/` route'u production design system ile uyumlu tam bir statik sayfa kompozisyonuna kavuştu.
- Shared `PageHeader`, breadcrumb, `PageContainer`, `Section`, `ActionLink` ve global shell yeniden kullanıldı.
- Dört kategori ve altı soru-cevap kaydı repository-owned typed data olarak `src/data/faqs.ts` içinde tutuluyor.
- Soru açma/kapama davranışı native `<details>/<summary>` ile sağlanıyor.
- Kategori kontrolleri, yalnızca SSS listesini yöneten izole `FaqCategoryFilter` Client Component'i içinde gerçek düğmeler olarak uygulanır. Varsayılan seçim “Tümü”dür; seçim sayfayı bir fragmana kaydırmadan yalnızca ilgili kategori kayıtlarını gösterir ve `aria-pressed` ile bildirilir.
- JavaScript çalışmadığında statik dışa aktarımın ilk HTML'i bütün soru ve cevapları göstermeye devam eder; filtreleme yalnızca progressive enhancement katmanıdır.
- Repository genelindeki izinli authored Client Component sayısı bu izole filtreyle 6'dır; SSS sayfasının geri kalanı Server Component olarak kalır.
- İlk soru başlangıçta açık, diğer sorular kapalıdır; kullanıcı birden fazla cevabı aynı anda açık tutabilir.
- İletişim çağrısı gerçek `/iletisim/` route'una gider.
- Footer'ın hemen üstünde mevcut shared `EditorialPreview`, Ana Sayfa ile aynı varsayılan dört kolonlu sözleşmeyle kullanılır; geniş ekranda dört kart aynı satırda yer alır.

## İçerik sınırı

FAQ metinleri yalnızca `references/approved-content/company.md` içindeki onaylı hizmet ve operasyon akışından türetildi. Stitch ekranındaki aşağıdaki unsurlar üretime taşınmadı:

- sahte `0850 XXX XX XX` numarası;
- doğrulanmamış 12–48 ay/minimum süre ifadeleri;
- bütün hizmetlerin aylık bedele dahil olduğu iddiası;
- vergi avantajı yönlendirmesi;
- ikame araç garantisi;
- sonuçları saklanmayan “Bu cevap faydalı oldu mu?” kontrolü.

## Yayın ve SEO durumu

Route registry değişmedi. Sayfa hâlâ `canonical-path`, `indexable:false`, `sitemap:false` durumundadır. Production canonical yolu `https://kalitefilo.com.tr/sikca-sorulan-sorular/` olur; production ve staging sayfa metadata'sı route yayına alınana kadar noindex/nofollow kalır.

## Ertelenenler

- operasyon ve hukuk ekiplerinin onaylayacağı sözleşme, ödeme, teslim/iadeler, kilometre aşımı ve olay anı prosedürleri;
- gerçek veri işleme amacı ve endpoint'i olmadan FAQ geri bildirim toplama;
- yalnızca görünür ve yayınlanmış cevaplardan üretilecek FAQ structured data;
- route'un yayınlanması ve sitemap'e alınması.
