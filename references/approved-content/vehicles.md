# Kalite Filo — Vehicles

> Bu dosya, Kalite Filo web sitesindeki araç katalog yapısını ve Stitch tasarımlarında kullanılan örnek araçları tanımlar.
> Görseldeki fiyatlar ve modeller demo/tasarım verisi olarak değerlendirilmelidir; üretimde gerçek veri kaynağından beslenmelidir.

## Araç Katalog Kategorileri

Tasarım ekranındaki üst seviye kategoriler:

- Tüm Araçlar
- Binek
- SUV
- Hafif Ticari
- Yönetici
- İkinci El

## Araç Etiketleri / Segmentleri

Tasarım kartlarında kullanılan örnek etiketler:

- Premium
- Executive
- SUV
- Ticari

İhtiyaca göre eklenebilecek etiketler:

- Elektrikli
- Hibrit
- Ekonomik
- Yönetici
- Hafif Ticari
- Otomatik
- Manuel

## Filtreler

Araç listesi tasarımında bulunan filtreler:

- Marka
- Model
- Vites Tipi
- Yakıt Tipi
- Gövde Tipi
- Kiralama Süresi

Önerilen ek filtreler:

- Aylık fiyat aralığı
- Araç segmenti
- Elektrikli / hibrit
- Koltuk sayısı
- Bagaj hacmi
- Yıllık kilometre limiti
- Kullanılabilirlik / stok durumu

## Tasarımda Görünen Örnek Araçlar

Aşağıdaki kayıtlar Stitch ekranlarında görünmektedir ve **demo içerik** olarak ele alınmalıdır.

### BMW 3 Serisi

- Segment/etiket: Premium
- Örnek motor: 1.6 / 2.0 varyant
- Yakıt: Benzin
- Vites: Otomatik
- Kullanım: Yönetici / premium binek

### Audi A5

- Segment/etiket: Executive
- Yakıt: Dizel
- Vites: Otomatik
- Kullanım: Yönetici / premium binek

### Volvo XC90

- Segment/etiket: SUV
- Yakıt: Hibrit
- Vites: Otomatik
- Kullanım: Premium SUV

### Volkswagen Passat

- Segment/etiket: Premium
- Versiyon: 1.5 TSI Elegance DSG
- Yakıt: Benzin
- Vites: Otomatik
- Tasarımda görünen başlangıç fiyatı: ₺18.500/ay

### Toyota Corolla Cross

- Segment/etiket: Executive
- Versiyon: 1.8 Hybrid Flame e-CVT
- Yakıt: Hibrit
- Vites: Otomatik
- Tasarımda görünen başlangıç fiyatı: ₺19.200/ay

### Ford Transit Custom

- Segment/etiket: Ticari
- Versiyon: 2.0L EcoBlue 136PS Van
- Yakıt: Dizel
- Vites: Manuel
- Tasarımda görünen başlangıç fiyatı: ₺16.800/ay

### Audi A6

- Segment/etiket: Premium
- Versiyon: 40 TDI quattro Advanced S tronic
- Yakıt: Dizel
- Vites: Otomatik
- Tasarımda görünen başlangıç fiyatı: ₺35.000/ay

### Peugeot 3008

- Segment/etiket: SUV
- Versiyon: 1.2 PureTech Allure EAT8
- Yakıt: Benzin
- Vites: Otomatik
- Tasarımda görünen başlangıç fiyatı: ₺21.500/ay

### Fiat Fiorino Cargo

- Segment/etiket: Ticari
- Versiyon: 1.3 Multijet Pop
- Yakıt: Dizel
- Vites: Manuel
- Tasarımda görünen başlangıç fiyatı: ₺12.500/ay

> **UYARI:** Yukarıdaki fiyatlar yalnızca Stitch tasarımında görünen örneklerdir. Gerçek fiyat olarak yayınlanmamalıdır.

## Önerilen Araç Veri Modeli

Her araç için aşağıdaki alanların tutulması önerilir:

```yaml
id: string
slug: string
brand: string
model: string
version: string
model_year: integer
category: string
segment: string
body_type: string
fuel_type: string
transmission: string
engine: string
power_hp: integer
seats: integer
doors: integer
monthly_price_from: number | null
currency: TRY
vat_included: boolean | null
rental_term_months: [12, 24, 36]
annual_km_options: [10000, 15000, 20000, 30000]
available: boolean
featured: boolean
badge: string | null
cover_image: string
gallery: [string]
short_description: string
features: [string]
seo_title: string
seo_description: string
```

## Araç Kartı

Araç kartında bulunması önerilen bilgiler:

1. Araç görseli
2. Segment/etiket
3. Marka + model
4. Versiyon
5. Yakıt tipi
6. Vites tipi
7. Aylık başlangıç fiyatı veya “Teklif Al”
8. Detay linki
9. Teklif CTA

## Araç Detay Sayfası

Önerilen bölümler:

- Büyük araç görseli / galeri
- Marka, model ve versiyon
- Teknik özellikler
- Yakıt ve vites
- Segment ve gövde tipi
- Kiralama süresi seçenekleri
- Yıllık kilometre seçenekleri
- Dahil hizmetler
- Aylık başlangıç fiyatı veya teklif iste
- Benzer araçlar
- SSS
- Hızlı teklif formu

## Fiyatlandırma İlkesi

Üretim ortamında:

- Tasarımda kullanılan statik fiyatları hard-code etmeyin.
- Fiyatlar CMS/API/veritabanından gelmeli.
- Fiyatın KDV dahil/hariç durumu belirtilmeli.
- “Başlangıç fiyatı” ifadesi gerçek koşullarla uyumlu olmalı.
- Kiralama süresi ve yıllık kilometre değişince fiyat yeniden hesaplanabilmeli.
- Stok/bulunabilirlik ayrı alan olarak tutulmalı.

## Görsel İlkesi

- Araç görselleri aynı oran ve çözünürlük standardında tutulmalı.
- Liste kartlarında tutarlı crop uygulanmalı.
- Görseller WebP/AVIF gibi modern formatlarda sunulmalı.
- Responsive `srcset` kullanılmalı.
- Her görsel için anlamlı `alt` metni bulunmalı.

## SEO İçin URL Yapısı

Önerilen örnekler:

- `/araclar`
- `/araclar/binek`
- `/araclar/suv`
- `/araclar/hafif-ticari`
- `/araclar/yonetici`
- `/araclar/volkswagen-passat`
- `/araclar/toyota-corolla-cross`

## Arama / Filtre Davranışı

- Filtreler URL query parametrelerine yansıtılmalı.
- Kullanıcı filtre sonrası sayfayı paylaşabilmeli.
- Mobilde filtreler drawer/bottom-sheet içinde açılmalı.
- “Filtreleri Temizle” tüm aktif filtreleri sıfırlamalı.
- Sonuç sayısı kullanıcıya gösterilmeli.
- Filtre değişiklikleri mümkünse sayfa yenilemeden uygulanmalı.
