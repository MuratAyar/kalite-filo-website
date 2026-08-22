# Kalite Filo Production Design System

Last reconciled: 2026-08-15

## 1. Design system purpose

Bu belge, Kalite Filo Phase 1 public web sitesinin güncel production tasarım sistemi ve UI sözleşmesidir. Yeni public sayfalar mevcut Ana Sayfa, Araç Listesi ve shared shell ile aynı ürün ailesine ait görünmelidir.

Tasarım dili **Corporate Modern**, premium, B2B, otomotiv/filo odaklı, güvenilir, operasyonel ve kontrollüdür. Bilgi netliği; dekorasyon, trend veya gösterişli hareketten daha yüksek önceliğe sahiptir. Sistem, consumer startup estetiğine, neon SaaS dashboard görünümüne veya luxury-fashion editorial diline dönüşmemelidir.

Temel yaklaşım:

- güçlü fakat ölçülü kurumsal hiyerarşi;
- açık bilgi grupları ve rahat okunabilirlik;
- dönüşüm noktalarında kontrollü turuncu vurgu;
- sınır ve tonal yüzeylerle kurulan derinlik;
- varsayılan olarak statik, semantik ve erişilebilir HTML;
- az sayıda, amacı açık client-side etkileşim.

Gradient, blur ve fotoğraf üstü overlay yalnızca mevcut Hero, Conversion Banner, editorial media ve küçük newsletter dialog backdrop gibi bilinçli örneklerde kullanılır. Bunlar her sayfaya uygulanacak genel bir efekt repertuvarı değildir. Glow, sürekli animasyon, yoğun glassmorphism, aşırı büyük radius ve ağır gölge standart değildir.

## 2. Source of truth

Authority sırası şöyledir:

1. `AGENTS.md`, Phase 1 kapsamı, mimari, içerik doğruluğu ve completion guardrail'ları konusunda otoritedir.
2. Root `DESIGN.md`, bundan sonraki public UI tasarım kararlarının sözleşmesidir.
3. `src/app/globals.css`, executable semantic token kaynağıdır.
4. `src/components/` altındaki kullanılan shared componentler gerçek component davranışının kaynağıdır.
5. `src/app/page.tsx` ve `src/app/arac-listesi/`, mevcut sayfa kompozisyonunun production örnekleridir.
6. Güncel status belgeleri implementation bağlamı sağlar; tarihsel ölçümler veya eski durum ifadeleri güncel kodun önüne geçmez.
7. `references/stitch/`, yalnızca design evidence ve composition inspiration'dır; production specification değildir.

Bu belge ile executable token veya component implementation arasında fark oluşursa fark sessizce yeni bir sayfaya kopyalanmamalıdır. Mismatch açıkça değerlendirilip ya kod ya bu belge kontrollü biçimde reconcile edilmelidir.

Verified içerik, legal bilgi, araç verisi, fiyat, iletişim bilgisi ve asset hakkı her zaman Stitch içeriğinin önündedir. Eksik bilgi, görsel açıdan inandırıcı bir placeholder ile tamamlanmaz.

## 3. Brand personality

### We are

- structured;
- professional;
- premium but restrained;
- operationally precise;
- trustworthy;
- automotive and fleet focused;
- conversion-aware;
- readable under high information density.

### We are not

- playful consumer startup;
- neon SaaS dashboard;
- luxury-fashion editorial;
- over-animated;
- glow-heavy or glass-first;
- decorative at the expense of clarity;
- a collection of unrelated page-specific design systems.

## 4. Color system

Canonical renkler `src/app/globals.css` içindeki `--kf-*` semantic custom property'leridir.

| Token | Value | Semantic role | Use | Avoid |
| --- | --- | --- | --- | --- |
| `--kf-brand-navy` | `#182136` | Ana kurumsal koyu renk | Başlıklar, koyu yüzeyler, footer, secondary action, turuncu üstü metin | Her linki veya küçük detayı navy yaparak hiyerarşiyi düzleştirmek |
| `--kf-navy-secondary` | `#172750` | Navy tonal layer | Navy yüzey içi ikincil panel, dark hover ve border ayrımı | Ayrı bir primary brand rengi gibi kullanmak |
| `--kf-corporate-blue` | `#014499` | Etkileşim ve structural emphasis | Linkler, active navigation, selected category, focus token | Büyük koyu section background'u veya primary CTA |
| `--kf-accent-orange` | `#FFB343` | Yüksek öncelikli accent | Primary conversion CTA, vurgu etiketi, selection, bazı dark-surface focus durumları | White üstünde küçük turuncu metin; sayfanın tamamını turuncuya boyamak |
| `--kf-orange-dark` | `#D47504` | Orange interaction state | Primary CTA hover/active background | White üstünde normal boy metin |
| `--kf-orange-light` | `#FCD8B6` | Soft orange support | Onaylanmış hafif accent yüzeyleri | Otomatik chip standardı veya turuncu metinle düşük kontrast kombinasyonu |
| `--kf-on-accent` | `#182136` | Accent üstü foreground | Turuncu CTA üzerindeki metin ve ikon | Orange üstünde white'ı varsaymak |
| `--kf-surface-page` | `#F8F9FB` | Ana açık sayfa yüzeyi | Genel sayfa ve açık section zemini | Card sınırı olmadan aynı tonları üst üste yığmak |
| `--kf-surface-muted` | `#F2F4F6` | Sessiz tonal yüzey | Section ayrımı, control disabled/quiet state, image fallback | Her section'ı farklı tona zorlamak |
| `--kf-surface-card` | `#FFFFFF` | Card/control yüzeyi | Kart, field, light header ve dialog | Full-page default olarak hiyerarşisiz beyaz kullanım |
| `--kf-text-primary` | `#182136` | Ana metin | Başlıklar, güçlü body ve label | Dark yüzeyde kullanmak |
| `--kf-text-secondary` | `#5E6675` | Destekleyici metin | Intro, metadata, yardımcı copy | Çok küçük metin veya dark surface |
| `--kf-text-inverse` | `#FFFFFF` | Dark-surface ana metin | Navy section, footer, image overlay | Light surface |
| `--kf-text-inverse-muted` | `#BDC6E2` | Dark-surface ikincil metin | Footer yardımcı linkleri, dark supporting copy | İnce veya çok küçük metinde kontrolsüz opacity azaltmak |
| `--kf-border-subtle` | `#E6E8EC` | Dekoratif ayrım | Card sınırı, divider, low-emphasis grouping | Bir control'ün tek görünür sınırı olarak kritik state taşımak |
| `--kf-border-control` | `#76777D` | Daha güçlü control/hover sınırı | Control boundary, hover emphasis | Dekoratif her divider'da kullanmak |
| `--kf-error` | `#BA1A1A` | Error foreground | Doğrulama ve hata metni | Tek başına hata iletişimi |
| `--kf-error-surface` | `#FFDAD6` | Error surface | Hata callout/background | Brand surface |
| `--kf-success` | `#166534` | Functional success | Başarı state'i | Brand rengi veya pazarlama vurgusu |
| `--kf-success-surface` | `#DCFCE7` | Success surface | Başarı dialog/callout zemini | Brand surface |
| `--kf-focus` | `#014499` | Global focus indicator | Light-surface `focus-visible` outline | Dark navy üzerinde kontrast kontrolü yapılmadan kullanmak |

Functional success/error renkleri brand palette değildir. Yalnızca durum iletişimi içindir.

## 5. Color usage rules

### Navy

Navy; major dark surfaces, headings, footer, secondary CTA ve turuncu üstü foreground için kullanılır. Koyu alanların sayfadaki ağırlığı kontrollü olmalıdır. Ana Sayfa'daki Hero, editorial section, Conversion Banner ve footer mevcut bilinçli örneklerdir.

### Corporate Blue

Corporate Blue; link, current navigation, selected filter/category, structural emphasis ve global light-surface focus state rengidir. Active navigation yalnız renge dayanmaz; desktop'ta alt border, mobile'da underline/tonal state de kullanılır.

### Orange

Orange bir conversion accent'idir. Primary CTA, belirgin badge/eyebrow ve sınırlı focus treatment dışında dağıtılmamalıdır. Orange background üstünde navy foreground kullanılır. `#FFB343` veya `#D47504` white üstünde normal metin olarak yeterli kontrast sağlamaz.

### Component-local exceptions

`featured-vehicles-action` bugün normal durumda hard-coded black border/text ve hover/focus durumunda Corporate Blue kullanır. Bu, kullanıcı tarafından istenmiş mevcut bir component davranışıdır; yeni bir global black token veya genel outline-button kuralı değildir. Yeni sayfalarda bu davranış ancak aynı component yeniden kullanıldığında taşınır.

Hero ve Conversion Banner gradientlerinde bazı hard-coded navy/alpha değerleri bulunur. Bunlar kanonik renk tokenı değil, belirli fotoğraf üstü okunabilirlik katmanlarıdır.

## 6. Typography

### Font family

Production font stack:

```css
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
"Segoe UI", Arial, sans-serif
```

Font runtime CDN'i yoktur ve production artifact font dosyası taşımaz. Font ağırlıkları component class'larıyla 600/700 gibi semantic hiyerarşiye göre kullanılır.

### Semantic scale

| Role | Size behavior | Weight | Line height | Letter spacing | Use |
| --- | --- | ---: | ---: | ---: | --- |
| `display` | `clamp(2.5rem, 2rem + 2.5vw, 4rem)`; 40–64px | 700 | 1.1 | `-0.02em` | Home H1 ve yalnız yüksek öncelikli page entrance |
| `heading-lg` | `clamp(2rem, 1.75rem + 1.25vw, 2.75rem)`; 32–44px | 600 | 1.2 | `-0.01em` | Major section ve standard/high page heading |
| `heading-md` | `clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)`; 24–30px | 600 | 1.3 | normal | Subsection, compact section heading, card-group heading |
| `body-lg` | `1.125rem`; 18px | inherited/400 | 1.6 | normal | Intro ve supporting lead copy |
| `body` | `1rem`; 16px | inherited/400 | 1.5 | normal | Default prose, control ve card copy |
| `label` | `0.875rem`; 14px | 600 | 1.25 | normal | Label, metadata ve compact UI text |

`text-heading` aliases `heading-lg`; `text-subheading` aliases `heading-md`. Yeni kod doğrudan semantic role'u tercih etmelidir.

### Heading hierarchy

- Her public page'de tam olarak bir H1 bulunur.
- `display`, yalnız Home veya gerçekten high-emphasis page entry içindir; her H1 otomatik olarak display değildir.
- H2 major page section'ları tanımlar.
- H3 kart içi veya subsection başlıklarıdır.
- Görsel boyut semantic level yerine geçmez. `SectionHeading` component'i `level` ve `size` değerlerini ayrı tutar.
- Başlıklar fixed-height container içinde kırpılmaz; Turkish copy wrap edebilir.

### Pending / future typography decision

Plus Jakarta Sans, eski Stitch niyetinde yer alır fakat licensed, self-hosted Turkish WOFF2 asset sağlanmadığı için production gerçeği değildir. Böyle bir asset onaylanırsa fallback metrics, yükleme maliyeti ve visual regression kontrol edilmeden font değiştirilmez.

## 7. Layout and spacing system

### Content width

- `--kf-container-width: 85rem` = 1360px.
- Full-width section/header/footer background'u viewport'u kaplar.
- İçerik `PageContainer` ile `max-w-container`, `mx-auto`, `w-full` ve `px-gutter` kullanır.
- 1360px bir page width değil, inner content maximum'udur.

### Page gutters

| Range | Executable token |
| --- | --- |
| Base | `1rem` / 16px |
| `min-width: 48rem` | `1.5rem` / 24px |
| `min-width: 80rem` | `2.5rem` / 40px |

Bu eşikler production CSS'te açıkça tanımlıdır. Page-level özel negatif margin veya `100vw` breakout ile gutter sistemi bypass edilmez.

### Section and internal spacing

- `--kf-section-space: clamp(4rem, 8vw, 6.25rem)`; 64–100px responsive major section spacing.
- `Section spacing="compact"`: `py-12 md:py-16`.
- `--kf-card-padding: 1.5rem` / 24px.
- `--kf-stack-gap: 1rem` / 16px.
- `Stack` named gap'leri: 0, 8, 12, 16, 24, 32 ve 48px karşılıklarıdır.
- `Cluster` named gap'leri: 8, 12, 16, 24 ve 32px karşılıklarıdır.

Yeni sayfa, rastgele section padding dizisi kurmadan önce `Section`, `Stack`, `Cluster` ve mevcut responsive tokenları kullanmalıdır.

## 8. Grid and responsive layout

Sistem mobile-first ve fluid'dir. Tailwind v4 executable breakpoint değerleri:

| Prefix | Value | Current use examples |
| --- | ---: | --- |
| `sm` | 40rem / 640px | İki kolonlu küçük kartlar, inline action, footer 2 kolon |
| `md` | 48rem / 768px | 24px gutter, iki kolon vehicle grid, newsletter split |
| `lg` | 64rem / 1024px | Desktop header nav, media split, vehicle sidebar |
| `xl` | 80rem / 1280px | 40px gutter, 3/4 kolon grid, geniş gap |
| `2xl` | 96rem / 1536px | Featured vehicle price/action satırının geniş variantı |

Breakpoint seçimi yalnız cihaz adına göre yapılmaz; component içeriğinin çakıştığı noktada reflow edilir. Yeni bir breakpoint seti icat edilmez.

Current patterns:

- Home featured, editorial ve solution grid'leri base'te 1, ara genişlikte 2, wide'da 4 kolondur.
- Vehicle catalogue base'te 1, `md`'de 2, `xl`'da 3 kolondur.
- Vehicle filter base/tablet'te native `details`; `lg` ve üstünde 18rem sticky sidebar'dır.
- Media split'ler base'te stack, `lg` ve üstünde iki kolondur.
- Header primary navigation `lg` altında mobile disclosure ile değiştirilir; hiçbir destination kaybolmaz.

Fixed-width desktop kompozisyon mobile'a küçültülmez. Grid kolonları kullanılabilir card genişliğine göre düşer; page-level horizontal overflow kabul edilmez.

## 9. Shape and radius

| Token | Value | Use |
| --- | ---: | --- |
| `--kf-radius-control` | `0.5rem` / 8px | Button, input, select, summary, icon tile |
| `--kf-radius-card` | `1rem` / 16px | Vehicle, solution, editorial ve bilgi kartları; framed media |
| `--kf-radius-panel` | `1.5rem` / 24px | Conversion banner, finder panel, dialog gibi büyük container |
| `--kf-radius-pill` | `9999px` | Chip, badge, compact eyebrow |

Yeni componentler rastgele `rounded-lg`, `rounded-xl`, `rounded-2xl` veya `rounded-3xl` seçmemelidir. Önce semantic role belirlenir, sonra `rounded-control`, `rounded-card`, `rounded-panel` veya `rounded-pill` kullanılır.

## 10. Surface system

### Page surface

`surface-page` (`#F8F9FB`) genel açık zemin ve sakin kurumsal ritim içindir.

### Muted surface

`surface-muted` (`#F2F4F6`) section veya control state ayrımı içindir. Ana Sayfa Featured Vehicles bunun bir production örneğidir.

### Card surface

`surface-card` (`#FFFFFF`) kart, field, dialog ve light header içindir. Border ile page/muted zeminden ayrılır.

### Navy surface

`brand-navy` major dark conversion/editorial/footer bölgelerinde kullanılır. Inverse text tokenlarıyla eşleştirilir.

### Image-backed surface

Hero, Conversion Banner ve editorial preview gibi image-backed alanlarda içerik okunabilirliği için kontrollü overlay zorunludur. Görsel kaybolduğunda text/action yapısı bozulmamalıdır.

Her section'ın farklı renkte olması gerekmez. Surface değişimi içerik grubu veya dönüşüm hiyerarşisini açıklamalıdır.

## 11. Borders, shadows and depth

Temel ilke: **border + tonal layer önce, shadow sonra.**

- Standard `CardSurface`: 1px subtle border, shadow yok.
- Featured vehicle: çok hafif navy ambient shadow; hover'da Corporate Blue border ve biraz daha belirgin shadow.
- Catalogue vehicle: aynı sistemin biraz daha yoğun catalog variantı.
- Header: 1px border, yüzde 95 white surface, tek-pixel tonal shadow ve backdrop blur.
- Commercial image: sınırlı, belirgin fakat tekil media shadow.
- Hero finder: mevcut özel `home-glass-panel`; yüzde 10 white, yüzde 24 border, 12px blur ve düşük-opacity shadow.
- Newsletter dialog: mevcut `shadow-2xl` istisnası; modal katman ayrımı içindir, card standardı değildir.

Glow, çok katmanlı floating card, sürekli `shadow-2xl` ve her hover'da büyük translate/scale kullanılmaz. Fotoğraf overlay'leri depth değil, text contrast ve image treatment amacı taşır.

## 12. Button and action system

Executable kaynak `src/components/ui/button-styles.ts` dosyasıdır. Bütün action'lar control radius, label typography, gap, focus-visible ve reduced-motion contract'ını paylaşır.

### Variants

| Variant | Base | Hover/active | Role |
| --- | --- | --- | --- |
| `primary` | Orange background, navy text | `orange-dark` background | En yüksek conversion; ör. Teklif Al |
| `secondary` | Navy background, white text | `navy-secondary` background | İkinci güçlü action |
| `outline` | 2px navy border, transparent, navy text | muted background | Tertiary action, reset veya secondary navigation |
| `outline-inverse` | Yarı saydam white border, white text | daha güçlü white border ve yüzde 10 white surface | Dark/image-backed yüzeyde secondary navigation |
| `quiet` | Transparent, Corporate Blue text | muted background | Low-priority action |
| `danger` | Error background, white text | yüzde 90 brightness | Destructive action; normal CTA değildir |

### Sizes

| Size | Contract | Typical use |
| --- | --- | --- |
| `primary` | 54px height, 24px horizontal padding | Main conversion CTA |
| `secondary` | 48px height, 20px horizontal padding | Secondary/outline action |
| `compact` | Minimum 44px, 16px horizontal padding | Compact control/form action |
| `icon` | 44×44px | Icon-only action with accessible name |

Bir section'da gereksiz biçimde birden fazla primary CTA kullanılmaz. Navigation `ActionLink`/`<a>`; state-changing action `Button`/`<button>` olmalıdır. `Button` varsayılan olarak `type="button"` kullanır; form submit bilinçli biçimde `type="submit"` seçmelidir.

Full-width kullanım, dar alanda reflow içindir; desktop'ta bütün CTA'ları keyfi olarak full-width yapmak sistem davranışı değildir.

## 13. Link system

- Inline/standalone prose linkleri `TextLink` kullanır; underline ve hover'da daha güçlü decoration non-color cue sağlar.
- Header navigation gerçek route linkleridir; current item `aria-current="page"`, Corporate Blue ve underline/border cue kullanır.
- Footer linkleri inverse muted text, hover'da white ve underline kullanır.
- Button-shaped navigation `ActionLink` kullanır.
- Tıklanabilir kart bir adet semantic link ile tüm yüzeyi kapsar; içine ikinci link veya button yerleştirilmez.
- Hover davranışının keyboard focus eşdeğeri olmalıdır.
- `href="#"`, fake destination ve button-as-link kullanılmaz.

## 14. Shared shell

Yeni sayfa kendi header veya footer'ını oluşturmaz. Root layout bir adet `SkipLink`, `SiteHeader`, route-owned `main` ve `SiteFooter` düzenini sağlar.

### SiteHeader

- Full-width sticky shell; `top: 0`, `z-50`.
- Light card surface yüzde 95 opacity, subtle bottom border, restrained shadow ve `backdrop-blur-md`.
- Inner alignment `PageContainer` ile yapılır.
- Base minimum height 64px; `lg` ve üstünde 80px.
- Approved local horizontal logo Home'a link verir; intrinsic `560×112`, CSS width 144/160/176px.
- Desktop primary navigation `lg` ve üstünde ortalanır.
- Header CTA `Teklif Al` primary variant'tır.
- Active link route-aware küçük Client Component tarafından `usePathname()` ile belirlenir.
- Customer login, portal veya auth control Phase 1 shell'inde yoktur ve eklenmez.

### PrimaryNavigation

- Desktop sırası: Hakkımızda, Araç Listesi, Sıkça Sorulan Sorular, Filo Rehberi.
- Active desktop state: Corporate Blue text + bottom border.
- Active mobile state: muted background + Corporate Blue text + underline.
- Current route `aria-current="page"` alır.
- Mevcut vehicle detail family ve future article detail family, parent navigation item'ına ait olacak şekilde route matcher'da modellenir.

### MobileNavigation

- `lg` altında native, non-modal `details/summary` disclosure.
- Menü document flow içinde açılır; drawer, overlay, focus trap veya animation yoktur.
- Desktop ile aynı destination'lar ve Teklif Al action'ı bulunur.
- Native document-navigation anchor'ları menu state'ini yeni static document'ta sıfırlar.

### SiteFooter

- Full-width navy surface ve responsive PageContainer.
- Base 1 kolon, `sm`'de 2 kolon, `lg`'de brand + üç group yapısı.
- Gruplar: Hızlı Linkler, Kurumsal, Bize Ulaşın.
- Verified route, phone ve email linkleri semantic `href` ile kullanılır.
- Footer wordmark image kullanmaz; approved inverse logo olmadığı için white text brand kullanılır.
- Focus outline dark yüzeyde orange'a override edilir.
- Yeni sayfa özel footer veya newsletter/footer birleşimi üretmez.

### SkipLink and BrandLink

- SkipLink repeated navigation'dan önce gelir, `#main-content` hedefini kullanır ve focus'ta görünür.
- BrandLink light surface'te local logo, navy footer'da accessible text kullanır.

## 15. Page primitives

### PageContainer

Section background'unu sınırlamadan tüm içeriği shared 1360px grid ve responsive gutter sistemine hizalar.

### Section

Semantic full-width section'dır. Surface seçenekleri: `transparent`, `page`, `muted`, `card`, `navy`, `accent`. Spacing seçenekleri: `none`, `compact`, `default`.

`accent` yüzeyi mevcut primitive contract'ında vardır fakat production page composition'da geniş bir orange section standardı değildir; gerekçesiz kullanılmaz.

### PageHeader

- Bir public inner page'in tek H1-bearing giriş bölgesidir.
- Optional breadcrumbs, eyebrow ve intro destekler; eksik değerler render edilmez.
- `standard`: `heading-lg` H1.
- `high-emphasis`: `display` H1.
- Page surface ve compact spacing kullanır.
- İç sayfaların horizontal alignment'ı PageContainer ile shared shell'e bağlanır.

### Breadcrumbs

- Labelled `nav` + ordered list.
- Gerçek route linkleri.
- Son öğe link değildir ve `aria-current="page"` taşır.
- Separator dekoratiftir.
- Long Turkish labels wrap eder; `min-width: 0` ve word-breaking ile overflow engellenir.

### Stack and Cluster

Stack dikey, Cluster wrapping inline composition içindir. Yeni bir page yalnız gap üretmek için tekrarlı özel wrapper class'ları oluşturmadan önce bu primitive'leri kullanmalıdır.

## 16. Card system

Yeni kart tipi oluşturmadan önce mevcut Vehicle, Solution, Editorial veya Informational card'ın variantı olup olmadığı değerlendirilmelidir.

### Vehicle card — Home featured variant

- 4 kart; base 1, `sm` 2, `xl` 4 kolon.
- White surface, 16px radius, subtle border ve restrained shadow.
- Image `4:3`, local source, intrinsic dimensions, `object-cover`.
- H3: make + model; altında trim.
- Yalnız fuel ve sadeleştirilmiş transmission, iki kolonlu tek satır fact row.
- Price: `Aylık Liste Net`, formatted TRY amount + `/ay`, `KDV hariç`.
- CTA visual: orange `Aracı İncele`.
- Tüm kart, ilgili `/arac-listesi/[slug]/` detay URL'sine giden tek linktir; hover/focus border, shadow ve CTA state'ini birlikte değiştirir.
- Category badge ve public image-credit satırı yoktur.

### Vehicle card — Catalogue variant

- Aynı semantic ve data hierarchy'nin daha yoğun grid variantıdır.
- Image `16:11`.
- Base 1, `md` 2, `xl` 3 kolon; `lg` desktop filter yanında fluid kalır.
- Image olmayan doğrulanmış kayıtlar için muted gradient ve açık Türkçe `role="img"` fallback vardır.
- Tüm card tek gerçek araç-detay linkidir; nested interactive control yoktur.

### Vehicle detail

- Her owner-supplied portföy kaydı, `/arac-listesi/[slug]/` ailesinde `generateStaticParams()` ile statik üretilir.
- Shared `PageHeader`, breadcrumb ve tam bir H1 kullanılır; URL slug'ı doğrulanmış portföy slug'ından gelir.
- Ana medya tek local, intrinsic-size image veya dürüst missing-image state'tir; onaylı galeri yoksa thumbnail/carousel icat edilmez.
- Desktop'ta bilgi alanı ile sticky fiyat/action paneli iki kolondur; küçük ekranlarda doğal document order ile stack olur.
- Teknik özellikler yalnız typed portföy alanlarından gelir. Onaysız süre, kilometre, ön ödeme veya fiyat hesaplayıcısı gösterilmez.
- Fiyat `Aylık Liste Net`, `/ay`, `KDV hariç` contract'ını korur ve bağlayıcı teklif/uygunluk garantisi olmadığını açıklar.
- `Hemen Teklif İste` ve `Araç Sepetine Ekle` mevcut review aşamasında semantik butondur fakat navigation/form işlemi başlatmaz; gerçek iş akışı ayrıca onaylanmalıdır.
- `İlginizi Çekebilecek Diğer Araçlar`, mevcut kayıtla aynı kategorideki tüm diğer gerçek portföy kayıtlarını yatay bir kart şeridinde sunar. Masaüstünde aynı anda dört kart görünür; dar ekranlarda kart genişliği okunabilir kalır.
- Şeridin önceki/sonraki kontrolleri 44px dokunma hedefi, görünür focus ve `aria-controls` kullanır. Kartlar Server Component olarak kalır; yalnızca kaydırma düğmeleri küçük bir Client Component sınırıdır.
- Detay breadcrumb'ının current item'ı marka, model ve trim bilgisinin tamamını taşır; H1 yalnız marka ve modeldir. Ayrı bir tekrar intro satırı kullanılmaz.
- `Teknik Özellikler` paneli yalnız yapılandırılmış teknik satırlar içerir. Araç özeti, `✓` özellik listesi, tekrar eden şanzıman/yakıt/güç ifadeleri ve teknik olmayan pazarlama nitelemeleri bu panelde gösterilmez. Kaynak veride ölçülebilir biçimde bulunan bagaj/yük hacmi, tork, menzil, batarya, tüketim ve çekiş değerleri aynı tanım listesine normalize edilir. Fiyat/action panelinde ve related başlığında kategori badge'i kullanılmaz.
- Araç detay sayfası, ilgili araçlar bölümünden sonra ve shared Footer'dan önce mevcut `EditorialPreview` ile Ana Sayfa'daki `Filo Dünyası'nı Keşfedin` kompozisyonunu yeniden kullanır; sayfaya özel kopya veya ikinci bir editorial kart sistemi oluşturmaz.

### Feature / Solution card

- `CardSurface` üstünde icon tile, H3, kısa copy ve action cue.
- Card'ın tamamı tek gerçek route linkidir.
- Hover border-control; focus Corporate Blue border + focus outline.
- Visible action cue underline kullanmaz fakat arrow ve full-card affordance korunur.

### Editorial / Article preview card

- Navy section içinde image-overlay card.
- 16px radius, yüzde 20 white border, `navy-secondary` fallback.
- Bottom black gradient, orange category pill, inverse title, date ve reading time.
- Shared preview kartının tamamı, kategori ve slug içeren gerçek Filo Rehberi detay route'una giden tek linktir; iç içe link kullanılmaz.
- Hover ve `focus-within` durumunda accent-orange border ile restrained shadow kullanılır; klavye focus'u ayrı ve görünür kalır.
- Filo Rehberi detay sayfasında owner-supplied Markdown build time'da render edilir. Kategori H1 üstünde tekrarlanmaz; giriş metninin altındaki kompakt satır kategori, yayın tarihi ve okuma süresini taşır. Sağ sütun sırasıyla görünür H2 id'leriyle birebir eşleşen sticky İçindekiler, kompakt ve izole paylaşım kontrolleri ve gerçek kategori-aware route'a bağlı tek ilgili makale kartını içerir. Sidebar bağımsız scroll container oluşturmaz; alt içeriği ana sayfa kaydırması görünür kılar. Dar ekranda normal belge akışına girer. `Önemli Çıkarım` blokları rounded/tinted alert kartı değil, arka plansız ve sade ayraçlı editoryal not olarak görünür.
- Anchor navigation `scroll-behavior: smooth` kullanır; `prefers-reduced-motion` bu davranışı otomatik kaydırmaya indirger.

### Informational card

`CardSurface`, `card`, `muted` veya `navy` surface; `none`, `compact`, `default`, `spacious` padding variant'larını sunar. Normal informational card border + tonal layer kullanır, interaction yoksa hover effect almaz.

## 17. Image treatment

- Production image'ları local project-owned path'ten gelir.
- Her semantic image intrinsic `width` ve `height` ile layout shift'i önler.
- Meaningful image concise Turkish `alt`; decorative image `alt=""` ve gerektiğinde `aria-hidden` kullanır.
- Standard card/media frame `rounded-card`, `overflow-hidden`, explicit aspect ratio ve `object-cover` kullanır.
- Crop, component variant'ına göre kasıtlıdır; essential bilgi crop dışında kalmamalıdır.
- `ResponsivePicture`, önceden üretilmiş local sources/srcset için vardır; runtime optimizer gerektirmez.
- Static export nedeniyle plain semantic `<img>` production'da kabul edilen ve sık kullanılan yöntemdir.
- Stitch remote asset, `lh3.googleusercontent.com`, Google aida-public, random hotlink, base64 ve external runtime image service yasaktır.
- `images.unoptimized: true` runtime optimizer olmamasının bilinçli sonucudur; assetler build öncesi hazırlanır.
- Image licensing/provenance internal kayıt olarak korunabilir; public UI'a otomatik credit linki eklenmez.

## 18. Media split sections

Home production örüntüsü:

- Base/mobile: copy ve media stack.
- `lg`: iki dengeli kolon, 40–64px arası mevcut responsive gap'ler.
- Copy column: SectionHeading → supporting copy → optional ActionLink.
- Media: semantic/local image, intrinsic dimensions, intentional aspect ratio, card radius ve subtle border.
- Copy-left/image-right mevcut canonical örnektir. Ters sıra gerekiyorsa reading order semantic DOM'da mantıklı kalmalıdır.
- Görsel yüklenmese de heading, copy ve action kullanılabilir olmalıdır.
- Fixed height yerine aspect ratio/content-driven sizing tercih edilir.

## 19. Conversion Banner

`ConversionBanner` aynı quote amacı için tekrar markup üretmek yerine yeniden kullanılmalıdır.

Contract:

- Page surface üstünde 24px radius navy panel;
- subtle navy-secondary border;
- local decorative right-aligned operations image;
- soldan sağa navy-to-transparent overlay;
- orange-tinted pill eyebrow;
- H2 ve inverse supporting copy;
- tek primary Teklif Al action;
- base'te stack, `lg`'de copy/action grid;
- compact section spacing, responsive internal padding.

Yeni page aynı amaca sahip farklı renk, radius, CTA veya shadow ile duplicate banner üretmez. Copy yalnız verified content'ten gelir.

## 20. Iconography

- Production standardı project-owned/code-native inline SVG path'leridir.
- Shared `Icon` frame: `24×24` viewBox, default 1.5 stroke, round cap/join, currentColor.
- Standard sizes: 16px (`sm`), 24px (`md`), 32px (`lg`).
- Decorative icon `aria-hidden`; informative icon `role="img"` ve label alır.
- Icon-only control 44×44px ve accessible name gerektirir.
- Adjacent text anlamı taşıyorsa icon dekoratiftir.
- Material Symbols CDN, icon font veya gereksiz yeni icon library eklenmez.

## 21. Form controls

### Canonical today

Global tokens:

- primary control height 54px;
- secondary control height 48px;
- standalone touch target minimum 44px;
- control radius 8px;
- surface-card veya bağlama uygun transparent surface;
- connected visible label;
- global 3px Corporate Blue focus-visible outline + 3px offset;
- disabled state açıkça görünür ve cursor/state değişir.

Home Quick Vehicle Finder mevcut canonical progressive-enhancement örneğidir: labelled native selects, dependent Model state, native GET destination, query olmadan da çalışabilen submission ve küçük isolated client enhancement.

Vehicle filters labelled native selects, mobile native disclosure ve no-JS static fallback sağlar.

### Not yet canonical / future contract

Contact ve Teklif Al tam form system'i henüz uygulanmamıştır. Error summary, field error, consent, server success/failure, PHP submission ve spam state'leri production component contract'ı olarak tamamlanmamıştır; uydurulmamalıdır.

Newsletter control yalnız no-storage interaction demo'sudur, gerçek subscription form standardı değildir. Input için global outline özel olarak kaldırılıp wrapper orange border ile focus state gösterilir. Bu local exception erişilebilirlik/kontrast açısından yeniden değerlendirilmeli ve diğer field'lara kopyalanmamalıdır.

## 22. Responsive design contract

Aşağıdaki genişlikler yeni CSS breakpointleri değil, zorunlu QA hedefleridir:

- 320px;
- 375/390px;
- 768px;
- 1024px;
- 1440px;
- 1920px.

Her yeni page için:

- page-level horizontal overflow bulunmamalı;
- fixed desktop width kullanılmamalı;
- `PageContainer` gutter ve max-width korunmalı;
- uzun Turkish navigation, title, model, address ve legal copy wrap edebilmeli;
- readable line length korunmalı;
- button text wrap veya width expansion ile kullanılabilir kalmalı;
- standalone target yaklaşık minimum 44px olmalı;
- card kolon sayısı usable card width'e göre düşmeli;
- text/media section'lar küçük alanda stack olmalı;
- desktop kompozisyon mobile'a ölçeklenmemeli;
- image crop variant ve viewport için kasıtlı olmalı;
- focus outline sticky/overflow container tarafından kırpılmamalı;
- sticky header H1 veya fragment target'ı örtmemeli;
- 200% text ve 400% zoom'da içerik/fonksiyon kaybı olmamalı;
- mobile navigation bütün desktop destination'larını korumalı;
- native control ve no-JS baseline mümkün olduğunca kullanılmalı.

Current implementation Edge ile 320, 390, 768, 1024, 1440 ve 1920px hedeflerinde smoke-test edilmiştir. Bu geçmiş doğrulama, yeni page'in test edildiği anlamına gelmez.

## 23. Accessibility design contract

Accessibility sonradan eklenen checklist değil, component sözleşmesinin parçasıdır.

- Her route'ta bir H1.
- `header`, labelled `nav`, route-owned `main`, `footer` landmark sırası.
- İlk erişilebilir bypass olarak SkipLink.
- Global visible `focus-visible`; kaldırılırsa eşdeğer ve kontrastlı component-level state zorunlu.
- Standalone touch target minimum 44×44px.
- Link navigation, button action semantiği.
- Current page için `aria-current="page"`.
- Native disclosure/control, redundant ARIA'ya tercih edilir.
- Meaningful image alt; decorative image boş alt.
- Decorative SVG `aria-hidden`.
- State yalnız renkle anlatılmaz; underline, border, text veya semantic state eklenir.
- Hover'ın focus eşdeğeri bulunur; touch'ta bilgi kaybolmaz.
- Logical DOM/tab order görsel reflow ile bozulmaz.
- Dynamic result count veya status yalnız gerektiğinde uygun live region kullanır.
- Dark ve light surface focus/contrast ayrı kontrol edilir.
- `prefers-reduced-motion` bütün transition/animation sürelerini pratik olarak sıfırlar.
- Keyboard trap, hover-only content ve inaccessible nested interactive card yoktur.

## 24. Motion

Motion restrained, kısa ve state communication amaçlıdır.

- Standard action/card transition yalnız color, border veya shadow değişimidir.
- Decorative continuous animation yoktur.
- Autoplay carousel, parallax, scroll choreography veya büyük scale standard değildir.
- `prefers-reduced-motion: reduce` durumunda animation/transition `0.01ms` seviyesine indirilir, iteration 1 olur ve scroll behavior auto'ya döner.
- Yeni motion, içerik veya destination keşfi için zorunlu olamaz.

## 25. Content density

B2B filo bağlamında önerilen bilgi sırası:

1. title;
2. kısa supporting copy;
3. karar için gerekli fact/metadata;
4. fiyat qualifier veya status;
5. tek net action.

Kurallar:

- Section heading group `max-w-3xl` ile okunabilir measure kullanır.
- Hero intro mevcut örnekte `max-w-2xl`.
- Card metadata heading'den sonra görsel olarak ikincildir.
- Vehicle fact row yalnız fuel ve customer-facing transmission bilgisini gösterir; teknik source string card'a taşınmaz.
- Fiyat, `Aylık Liste Net` ve `KDV hariç` qualifier olmadan gösterilmez.
- Teknik özellik çoksa card'a sıkıştırmak yerine detail/layout çözümü beklenir.
- Whitespace, grup ayrımı sağlar; gereksiz boşluk içerik eksikliğini saklamak için kullanılmaz.
- Bir paragraph mevcut supporting role'u aşacak kadar uzunsa section composition yeniden değerlendirilir; font küçültülmez.

## 26. Page composition language

Uygun bir inner page sırası şu olabilir:

```text
Shared Header
↓
Breadcrumbs / PageHeader
↓
Primary content veya page-specific hero
↓
Alternating factual/media sections
↓
Benefits, cards veya structured information
↓
ConversionBanner
↓
Optional relevant editorial content
↓
Shared Footer
```

Bu zorunlu tek template değildir. İçerik ihtiyacı bulunmayan section sırf screenshot'ta yer aldığı için eklenmez. Aynı site ailesi; shared alignment, typography, surface, radius, action ve spacing contract'ıyla kurulur.

## 27. Do / Don't

### Do

- `AGENTS.md` ve root `DESIGN.md` dosyalarını önce oku.
- Semantic `--kf-*` token ve Tailwind theme mapping'lerini kullan.
- Shared primitives ve shell componentlerini reuse et.
- Full-width surface + inner `PageContainer` ayrımını koru.
- Existing button variant ve size sistemini kullan.
- Semantic radius seç.
- Border/tonal layer ile depth kur.
- Local, approved, intrinsic-size image kullan.
- Link/button semantiğini doğru seç.
- Hover davranışına focus eşdeğeri sağla.
- Mobile-first reflow ve uzun Turkish copy test et.
- No-JS baseline ve static export sınırını koru.
- Yeni page'i Home, Araç Listesi, Header ve Footer yanında görsel olarak karşılaştır.

### Don't

- Stitch Tailwind config'ini kopyalama.
- Random hex'i global design token gibi yayma.
- Rastgele border radius seçme.
- Duplicate header/footer veya page-specific button system oluşturma.
- Her section'a gradient, glow, blur veya ağır shadow ekleme.
- Material Symbols, Google Fonts CDN veya başka runtime CDN ekleme.
- Remote Stitch/generated image kullanma.
- Page'i responsive yapmak için tamamını Client Component'e çevirme.
- Placeholder route, `href="#"`, customer login veya fake external link ekleme.
- Unverified copy, metric, price qualifier, legal text veya company fact icat etme.
- Accessibility state'ini yalnız renkle ifade etme.
- Kategori ve slug içeren gerçek detail route olmadan clickable editorial/detail card üretme.

## 28. New page implementation checklist

- [ ] `AGENTS.md` ve root `DESIGN.md` okundu.
- [ ] İlgili installed Next.js 16.2.11 docs, framework API kullanılacaksa okundu.
- [ ] Shared `SiteHeader` / `SiteFooter` root layout'tan kullanılıyor; duplicate shell yok.
- [ ] Route-owned tek `main` ve tek H1 var.
- [ ] `PageContainer`, `Section`, `PageHeader`, `Stack` ve mevcut primitives değerlendirildi.
- [ ] Semantic design tokenlar kullanıldı; rastgele palette oluşturulmadı.
- [ ] Existing action variants/sizes kullanıldı.
- [ ] Canonical radius seçildi.
- [ ] Local image, intrinsic dimensions ve doğru alt contract'ı sağlandı.
- [ ] Link/button/card semantiği doğru ve nested interactive control yok.
- [ ] 320, 375/390, 768, 1024, 1440 ve 1920px test edildi.
- [ ] Long Turkish copy, 200% text ve zoom/reflow değerlendirildi.
- [ ] Focus-visible, keyboard, aria-current ve reduced motion kontrol edildi.
- [ ] Page-level horizontal overflow yok.
- [ ] External runtime asset/dependency yok.
- [ ] Client Component yalnız en küçük gerekli island; no-JS baseline var.
- [ ] Unverified içerik veya unsupported route eklenmedi.
- [ ] Home ve Araç Listesi ile yan yana visual regression kontrolü yapıldı.
- [ ] Lint, strict typecheck, tests/validation ve clean static export geçti.

## 29. Visual regression principle

Yeni bir Kalite Filo sayfasının başarılı kabul edilmesi için yalnızca Stitch screenshot'ına benzemesi yeterli değildir.

Yeni page, Ana Sayfa, Araç Listesi, Header ve Footer ile yan yana açıldığında aynı site ailesinin parçası gibi görünmelidir. Mevcut production page'leri; typography, spacing, surface, action, radius, card density, responsive ve accessibility bakımından Stitch screenshot'tan daha güçlü style authority'dir.

## 30. Stitch'in rolü

`references/stitch/` şu amaçlarla kullanılabilir:

- layout inspiration;
- content hierarchy;
- composition;
- section order;
- visual intent.

Şunlar production contract değildir:

- generated Tailwind config;
- generated radius veya spacing values;
- generated colors;
- remote images;
- generated fonts ve icon-font dependencies;
- fake vehicle/article data, prices veya metrics;
- generated navbar/footer implementation;
- customer-login UI;
- placeholder links;
- desktop utility class'larının responsive coverage iddiası.

Older “Unified” screen family implementation authority değildir. Updated Stitch family bile production kodu ve verified içerikten sonra gelir.

## 31. Known inconsistencies and pending reconciliation

### Historical rules intentionally overridden

Güncel production implementation aşağıdaki eski Stitch niyetlerinin önüne geçer:

- Plus Jakarta Sans yerine bugün local asset gerektirmeyen güvenli system font stack kullanılır.
- Sabit 12/8/4 kolon tarifi yerine mevcut PageContainer üstünde content-driven Tailwind grid'leri kullanılır.
- Desktop/mobile gutter davranışı genel bir `24px / 16px` önerisi değil; executable olarak 16px, 768px'den itibaren 24px ve 1280px'den itibaren 40px'tir.
- Mobile vehicle filter, eski “bottom sheet veya full-screen overlay” önerisi yerine bugün native in-flow `details` disclosure kullanır.
- Vehicle card'larda eski class/category badge ve üçlü fuel/transmission/class spec satırı yoktur; production kartı yalnız fuel ve sadeleştirilmiş transmission gösterir.
- Eski Stitch demo fiyatları kullanılmaz; yalnız owner-approved workbook `Önerilen Liste Net` değeri doğru qualifier'larla gösterilir.
- Eski generated header/footer, placeholder navigation, customer login, remote logo/icon ve farklı footer verileri kullanılmaz; root shared shell kazanır.
- “Border only, shadow almost never” niyeti yön göstericidir fakat production vehicle hover, media frame, header, finder ve dialog için ölçülü component-local shadow'lar kullanır.
- Stitch'in generated radius mapping'leri yerine 8/16/24px semantic production radius tokenları kullanılır.
- Orange'ın geniş dekoratif page surface olarak kullanıldığı Stitch örnekleri production standardı değildir; orange conversion accent olarak sınırlandırılmıştır.

Bu maddeler gerçekleşmiş genel sistem kuralları olarak yayılmamalıdır:

- `featured-vehicles-action` normal state black rengini hard-coded kullanır; semantic black token yoktur. Bu yalnız mevcut local override'dır.
- Hero ve Conversion Banner bazı gradient değerlerini hard-code eder. Bunlar generic gradient token değildir.
- Vehicle card ve media shadow'ları arbitrary values kullanır; canonical elevation token seti henüz çıkarılmamıştır.
- Newsletter dialog `shadow-2xl` kullanır; modal istisnasıdır.
- Newsletter email input global focus outline'ı kaldırıp yalnız orange wrapper border kullanır. Bu davranış diğer formlara kopyalanmamalı ve WCAG focus contrast review beklemektedir.
- Bazı local empty-state typography utility'leri semantic production scale dışındaki Tailwind utilities'e dayanır; yeni pattern olarak yayılmamalıdır.
- Home review imagery'nin bir bölümü için final production provenance/approval status belgelere göre hâlâ release gate'tir.
- Mevcut responsive smoke testleri genişlik/overflow davranışını kanıtlar; tam screen-reader, 200/400% zoom ve cross-browser approval yerine geçmez.

## 32. Future design decisions

Yalnız gerçekten unresolved konular:

- licensed, self-hosted Plus Jakarta Sans ve Turkish coverage kullanılıp kullanılmayacağı;
- approved inverse/footer logo;
- dedicated square favicon/brand mark;
- Contact ve Teklif Al için canonical form fields, validation, error summary, success/failure ve PHP-backed states;
- gerçek newsletter provider, consent ve result UX'i;
- vehicle-detail gallery/multi-image interaction ve gerçek teklif/sepet workflow'u;
- Filo Rehberi index/detail interaction ve mobile article treatment;
- FAQ category/filter ve answer composition;
- legal document long-form layout ve table-of-contents davranışı;
- approved responsive crops ve remaining vehicle images;
- canonical elevation/shadow tokenizasyonu;
- newsletter focus exception'ının erişilebilir reconciliation'ı;
- tam cross-browser, screen-reader ve zoom-based visual approval.

Bu kararlar çözülene kadar mevcut sistemde gerçekleşmiş özellik gibi yazılmaz veya yeni sayfada uydurulmaz.

## 33. Architecture boundary for UI work

Tasarım sistemi, project architecture'dan ayrı değildir:

- Next.js 16.2.11 App Router ve static export korunur.
- Server Components varsayılandır.
- Responsive layout için SSR, request API, Middleware, Proxy veya bütün-page Client Component kullanılmaz.
- Client JavaScript yalnız küçük, gerekçeli island'dır.
- Form UI, Server Action veya runtime Next API gerektirecek şekilde tasarlanmaz.
- Production runtime external font/image/icon dependency'si oluşturulmaz.
- Customer login, portal, auth, CRM ve admin UI bu tasarım sisteminin parçası değildir.

## 34. Implementation references

| Area | Executable/reference path |
| --- | --- |
| Project guardrails | `AGENTS.md` |
| Design tokens and global states | `src/app/globals.css` |
| Root landmark shell | `src/app/layout.tsx` |
| Actions | `src/components/ui/button-styles.ts`, `action-link.tsx`, `button.tsx` |
| Typography and card primitives | `src/components/ui/section-heading.tsx`, `card-surface.tsx` |
| Layout primitives | `src/components/layout/` |
| Shared shell | `src/components/layout/site-header.tsx`, `site-footer.tsx` |
| Navigation | `src/components/navigation/` |
| Home patterns | `src/app/page.tsx`, `src/components/home/` |
| Vehicle patterns | `src/app/arac-listesi/`, `src/components/vehicles/` |
| Current implementation records | `docs/shared-shell-status.md`, `docs/home-status.md`, `docs/vehicles-status.md` |
| Historical audit evidence | `docs/design-audit.md`, `docs/component-inventory.md`, `docs/responsive-gaps.md` |
| Historical Stitch evidence | `references/stitch/` |
