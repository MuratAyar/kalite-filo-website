# Kalite Filo Türkçe–İngilizce Çeviri Durumu

Bu dosya, Türkçe sitenin profesyonel İngilizce sürümünün içerik ve uygulama durumunu izleyen ana kayıt dosyasıdır.

## Durumlar

- `Bekliyor`: Çeviri veya uygulama başlamadı.
- `Devam ediyor`: Çeviri ya da teknik uygulama üzerinde çalışılıyor.
- `İnceleme gerekli`: Çeviri tamamlandı; dil, hukuk veya işletme onayı bekliyor.
- `Tamamlandı`: Çeviri, rota, bağlantılar, metadata ve statik çıktı doğrulandı.

## Yayın ve SEO kuralları

- Türkçe varsayılan dil olarak kök rotalarda kalır.
- İngilizce içerikler çevrilmiş slug’larla `/en/` altında yayımlanır.
- Her iki dilde self-referencing canonical ve karşılıklı `hreflang` (`tr`, `en`, `x-default`) kullanılır.
- İngilizce bir sayfa, içeriği ve bağlantılı kullanıcı akışı tamamlanmadan dil seçiciden erişilebilir yapılmaz.
- Hukuki metinler ve PDF çevirileri onaylanana kadar `noindex` kalır ve `İnceleme gerekli` durumunda tutulur.
- Marka/model, fiyat ve teknik araç verileri çevrilirken kaynak değerler değiştirilmez; yalnızca kullanıcıya gösterilen açıklamalar çevrilir.

## 1. Teknik altyapı ve ortak bileşenler

| İş | Türkçe | İngilizce hedef | Durum |
|---|---|---|---|
| Statik İngilizce rota mimarisi | `/` | `/en/` | Tamamlandı |
| Dil seçici ve tam sayfa yönlendirme | `TR` | `EN → /en/` | Tamamlandı |
| Header, masaüstü ve mobil navigasyon | Türkçe kabuk | İngilizce kabuk | Tamamlandı |
| Footer, iletişim ve tercih menüleri | Türkçe kabuk | İngilizce kabuk | Tamamlandı |
| Çerez tercihleri ve erişilebilirlik metinleri | Türkçe | İngilizce | Tamamlandı |
| 404 ve ortak hata/sonuç mesajları | Türkçe | İngilizce | Tamamlandı |
| Canonical ve hreflang metadata | Türkçe rotalar | Karşılıklı TR/EN | Tamamlandı |
| İngilizce sitemap kayıtları | Türkçe sitemap | İngilizce rotalar | Tamamlandı (yayın onay kapısına bağlı) |
| Form sonuçları ve doğrulama mesajları | Türkçe | İngilizce | Tamamlandı |

## 2. Ana ve kurumsal sayfalar

| Sayfa | Türkçe rota | İngilizce rota | Durum |
|---|---|---|---|
| Ana Sayfa | `/` | `/en/` | Tamamlandı |
| Hakkımızda | `/hakkimizda/` | `/en/about-us/` | Tamamlandı |
| İletişim | `/iletisim/` | `/en/contact/` | Tamamlandı |
| Teklif Al | `/teklif-al/` | `/en/request-a-quote/` | Tamamlandı |
| Sıkça Sorulan Sorular | `/sikca-sorulan-sorular/` | `/en/frequently-asked-questions/` | Tamamlandı |

## 3. Araç portföyü

| İçerik | Türkçe rota | İngilizce rota | Durum |
|---|---|---|---|
| Araç listesi ve filtreler | `/arac-listesi/` | `/en/vehicles/` | Tamamlandı |
| Renault Clio Evolution 1.0 TCe X-Tronic 90 | `/arac-listesi/renault-clio-evolution-1-0-tce-x-tronic-90/` | `/en/vehicles/renault-clio-evolution-1-0-tce-x-tronic-90/` | Tamamlandı |
| Hyundai i20 1.0 T-GDI 90 7DCT Jump | `/arac-listesi/hyundai-i20-1-0-t-gdi-90-7dct-jump/` | `/en/vehicles/hyundai-i20-1-0-t-gdi-90-7dct-jump/` | Tamamlandı |
| Opel Corsa Hybrid 1.2 110 e-DCT6 Edition | `/arac-listesi/opel-corsa-hybrid-1-2-110-100-hp-e-dct6-edition/` | `/en/vehicles/opel-corsa-hybrid-1-2-110-100-hp-e-dct6-edition/` | Tamamlandı |
| Fiat Egea Sedan Urban 1.6 M.Jet 130 DCT | `/arac-listesi/fiat-egea-sedan-urban-1-6-m-jet-130-dct/` | `/en/vehicles/fiat-egea-sedan-urban-1-6-m-jet-130-dct/` | Tamamlandı |
| Škoda Kamiq 1.0 TSI 115 DSG Premium FL | `/arac-listesi/skoda-kamiq-1-0-tsi-115-dsg-premium-fl/` | `/en/vehicles/skoda-kamiq-1-0-tsi-115-dsg-premium-fl/` | Tamamlandı |
| Toyota Corolla Sedan 1.5 Dream X-Pack | `/arac-listesi/toyota-corolla-sedan-1-5-dream-x-pack-multidrive-s/` | `/en/vehicles/toyota-corolla-sedan-1-5-dream-x-pack-multidrive-s/` | Tamamlandı |
| Toyota Corolla Sedan 1.8 Hybrid Dream | `/arac-listesi/toyota-corolla-sedan-1-8-hybrid-dream-e-cvt-140/` | `/en/vehicles/toyota-corolla-sedan-1-8-hybrid-dream-e-cvt-140/` | Tamamlandı |
| Renault Megane Sedan Touch 1.3 TCe | `/arac-listesi/renault-megane-sedan-touch-1-3-tce-edc-140/` | `/en/vehicles/renault-megane-sedan-touch-1-3-tce-edc-140/` | Tamamlandı |
| Škoda Octavia Premium 1.5 TSI mHEV | `/arac-listesi/skoda-octavia-premium-1-5-tsi-mhev-150-dsg/` | `/en/vehicles/skoda-octavia-premium-1-5-tsi-mhev-150-dsg/` | Tamamlandı |
| Škoda Superb Prestige 1.5 TSI mHEV | `/arac-listesi/skoda-superb-prestige-1-5-tsi-mhev-150-dsg/` | `/en/vehicles/skoda-superb-prestige-1-5-tsi-mhev-150-dsg/` | Tamamlandı |
| Hyundai Bayon 1.0 T-GDI 90 Style DCT | `/arac-listesi/hyundai-bayon-1-0-t-gdi-90-style-dct/` | `/en/vehicles/hyundai-bayon-1-0-t-gdi-90-style-dct/` | Tamamlandı |
| Volkswagen Taigo Life 1.0 TSI 116 DSG | `/arac-listesi/volkswagen-taigo-life-1-0-tsi-116-dsg/` | `/en/vehicles/volkswagen-taigo-life-1-0-tsi-116-dsg/` | Tamamlandı |
| Opel Frontera Hybrid 1.2 145 | `/arac-listesi/opel-frontera-hybrid-1-2-145-e-dct6-edition/` | `/en/vehicles/opel-frontera-hybrid-1-2-145-e-dct6-edition/` | Tamamlandı |
| Peugeot 2008 Allure Hybrid 145 | `/arac-listesi/peugeot-2008-allure-hybrid-145-edcs6/` | `/en/vehicles/peugeot-2008-allure-hybrid-145-edcs6/` | Tamamlandı |
| Renault Duster Turbo TCe EDC 145 | `/arac-listesi/renault-duster-turbo-tce-edc-145/` | `/en/vehicles/renault-duster-turbo-tce-edc-145/` | Tamamlandı |
| Nissan Qashqai Mild Hybrid 158 | `/arac-listesi/nissan-qashqai-1-3-dig-t-mild-hybrid-158-x-tronic-designpack/` | `/en/vehicles/nissan-qashqai-1-3-dig-t-mild-hybrid-158-x-tronic-designpack/` | Tamamlandı |
| Peugeot 3008 Allure Hybrid 145 | `/arac-listesi/peugeot-3008-allure-1-2-hybrid-145-edcs6/` | `/en/vehicles/peugeot-3008-allure-1-2-hybrid-145-edcs6/` | Tamamlandı |
| Volkswagen T-Roc Life 1.5 eTSI | `/arac-listesi/volkswagen-t-roc-life-1-5-etsi-150-dsg/` | `/en/vehicles/volkswagen-t-roc-life-1-5-etsi-150-dsg/` | Tamamlandı |
| Renault Austral Techno Mild Hybrid | `/arac-listesi/renault-austral-techno-mild-hybrid-150-auto/` | `/en/vehicles/renault-austral-techno-mild-hybrid-150-auto/` | Tamamlandı |
| Kia Sportage 1.6L T-GDI 150 PS | `/arac-listesi/kia-sportage-1-6l-t-gdi-150-ps-dct/` | `/en/vehicles/kia-sportage-1-6l-t-gdi-150-ps-dct/` | Tamamlandı |
| Peugeot 408 Allure Hybrid 145 | `/arac-listesi/peugeot-408-allure-hybrid-145-edcs6/` | `/en/vehicles/peugeot-408-allure-hybrid-145-edcs6/` | Tamamlandı |
| Tesla Model Y RWD | `/arac-listesi/tesla-model-y-rwd/` | `/en/vehicles/tesla-model-y-rwd/` | Tamamlandı |
| Kia EV3 Cool Long Range 150 kW | `/arac-listesi/kia-ev3-cool-long-range-150-kw/` | `/en/vehicles/kia-ev3-cool-long-range-150-kw/` | Tamamlandı |
| BMW 320i Sedan | `/arac-listesi/bmw-320i-sedan-320i/` | `/en/vehicles/bmw-320i-sedan-320i/` | Tamamlandı |
| Fiat Doblo Cargo 1.5 BlueHDi | `/arac-listesi/fiat-doblo-cargo-1-5-bluehdi-100-6mt/` | `/en/vehicles/fiat-doblo-cargo-1-5-bluehdi-100-6mt/` | Tamamlandı |
| Fiat Doblo Combi 1.5 BlueHDi | `/arac-listesi/fiat-doblo-combi-1-5-bluehdi-130-at-easy/` | `/en/vehicles/fiat-doblo-combi-1-5-bluehdi-130-at-easy/` | Tamamlandı |
| Fiat Scudo Van Standard Business L2 | `/arac-listesi/fiat-scudo-van-standard-business-l2-1-5-120/` | `/en/vehicles/fiat-scudo-van-standard-business-l2-1-5-120/` | Tamamlandı |
| Ford Tourneo Courier 1.0 EcoBoost | `/arac-listesi/ford-tourneo-courier-1-0-ecoboost-125-7dct/` | `/en/vehicles/ford-tourneo-courier-1-0-ecoboost-125-7dct/` | Tamamlandı |
| Ford Transit Custom Van 320L | `/arac-listesi/ford-transit-custom-van-2-0-ecoblue-136-320l-van-trend/` | `/en/vehicles/ford-transit-custom-van-2-0-ecoblue-136-320l-van-trend/` | Tamamlandı |
| Ford Transit Van 350M 9.5 m³ | `/arac-listesi/ford-transit-van-350m-9-5-m3-2-0-ecoblue-130-trend/` | `/en/vehicles/ford-transit-van-350m-9-5-m3-2-0-ecoblue-130-trend/` | Tamamlandı |
| Citroën Berlingo Van 1.5 BlueHDi | `/arac-listesi/citroen-berlingo-van-1-5-bluehdi-100-6mt/` | `/en/vehicles/citroen-berlingo-van-1-5-bluehdi-100-6mt/` | Tamamlandı |
| Fiat Ducato Van Maxi 13 m³ | `/arac-listesi/fiat-ducato-van-maxi-13-m3-2-2-multijet-140-6mt/` | `/en/vehicles/fiat-ducato-van-maxi-13-m3-2-2-multijet-140-6mt/` | Tamamlandı |

## 4. Fleet Guide kategorileri ve makaleleri

İngilizce ana rota: `/en/fleet-guide/`

| Makale | İngilizce slug | Durum |
|---|---|---|
| Operasyonel Araç Kiralama Nedir? | `what-is-operational-vehicle-leasing` | Tamamlandı |
| Filo Toplam Sahip Olma Maliyeti | `calculating-fleet-total-cost-of-ownership` | Tamamlandı |
| Kurumsal Filoda Doğru Araç Seçimi | `how-to-choose-the-right-company-fleet-vehicle` | Tamamlandı |
| Filo Kiralamada Kilometre Limiti | `how-to-set-mileage-limits-for-fleet-leasing` | Tamamlandı |
| Elektrikli Araçlara Geçiş Rehberi | `electric-vehicles-for-company-fleets` | Tamamlandı |
| Filo Bakım ve Hasar Yönetimi | `fleet-maintenance-and-damage-management` | Tamamlandı |
| Uzun Dönem Kiralama Sözleşmesinde 12 Madde | `12-points-to-review-in-a-long-term-lease-agreement` | Tamamlandı |
| Satın Almak mı, Uzun Dönem Kiralamak mı? | `buy-or-long-term-lease-company-vehicles` | Tamamlandı |
| 12 Aylık Filo Bütçesi | `how-to-prepare-a-12-month-fleet-budget` | Tamamlandı |
| Filo Bütçesindeki Gizli Maliyetler | `eight-hidden-costs-in-a-fleet-budget` | Tamamlandı |
| Sedan, SUV veya Hafif Ticari | `sedan-suv-or-light-commercial-vehicle-for-a-company-fleet` | Tamamlandı |
| Yüksek Kilometre İçin Araç Seçimi | `vehicle-selection-for-high-mileage-businesses` | Tamamlandı |
| Kurumsal Filo Politikası | `how-to-create-a-corporate-fleet-policy` | Tamamlandı |
| Telematik ve Sürücü Davranışı | `improving-fleet-efficiency-with-telematics` | Tamamlandı |
| Elektrikli Filo Şarj Altyapısı | `planning-charging-infrastructure-for-an-electric-fleet` | Tamamlandı |
| Elektrikli, Hibrit veya İçten Yanmalı | `electric-hybrid-or-combustion-fleet-vehicles` | Tamamlandı |
| Kaza Sonrası Filo Hasar Yönetimi | `post-accident-damage-management-for-company-vehicles` | Tamamlandı |
| Filo Lastik Yönetimi | `fleet-tyre-management-guide` | Tamamlandı |

Kategori slug’ları: `long-term-leasing`, `cost-and-finance`, `vehicle-guide`, `fleet-management`, `electric-vehicles`, `maintenance-and-damage`.

Her makale için başlık, özet, gövde, görsel alt metni, SEO başlığı/açıklaması, iç bağlantılar ve okuma süresi ayrıca doğrulanacaktır.

## 5. Yasal sayfalar ve belgeler

| İçerik | Türkçe | İngilizce hedef | Durum |
|---|---|---|---|
| Form Aydınlatma Metni | `/aydinlatma-metni/` | `/en/privacy-notice/` | İnceleme gerekli |
| KVKK ve Güvenlik | `/kvkk-ve-guvenlik/` | `/en/data-protection-and-security/` | İnceleme gerekli |
| Çerez Politikası | `/cerez-politikasi/` | `/en/cookie-policy/` | İnceleme gerekli |
| Kullanım Koşulları | `/kullanim-kosullari/` | `/en/terms-of-use/` | İnceleme gerekli |
| Çerez Politikası PDF | `/documents/kalite-filo-cerez-politikasi.pdf` | `/documents/kalite-filo-cookie-policy.pdf` | İnceleme gerekli |

## 6. Tamamlanma kapısı

Her parça tamamlanmadan önce:

- İngilizce metinler Türkçe kaynakla anlam ve kapsam bakımından karşılaştırılır.
- Doğrulanmış şirket, fiyat, araç ve iletişim verileri aynen korunur.
- İç bağlantılar yalnızca yayıma hazır İngilizce hedeflere gider.
- Erişilebilir adlar, form hataları, görsel alt metinleri ve metadata çevrilir.
- Canonical/hreflang ve trailing slash kuralları doğrulanır.
- Gereksiz client-side JavaScript eklenmez.
- Lint, strict TypeScript, testler ve temiz static export build geçer.

## Değişiklik günlüğü

- 28.08.2026: Envanter oluşturuldu; İngilizce rota ve SEO mimarisi `Devam ediyor` durumuna alındı.
- 28.08.2026: İngilizce ana sayfa metin seti oluşturuldu; doğrulanmamış yeni ticari iddia eklenmedi.
- 28.08.2026: Türkçe sayfalar URL’leri değişmeden `(tr)` route group’una taşındı; İngilizce `lang="en"` root layout, header ve footer kabukları oluşturuldu.
- 28.08.2026: `/en/` taslak statik rotası, İngilizce metadata, canonical ve karşılıklı dil alternatifleriyle oluşturuldu; indeksleme tüm İngilizce ağ tamamlanana kadar kapalı tutuldu.
- 28.08.2026: 32 araç liste/detay sayfası ve 18 Filo Rehberi makalesi, altı kategori rotasıyla birlikte İngilizce statik çıktıya bağlandı.
- 28.08.2026: İngilizce teklif, gizlilik tercihleri, 404, yasal sayfalar ve ayrı Çerez Politikası PDF'i oluşturuldu. Yasal çeviriler şirket/hukuk onayı için `İnceleme gerekli` durumunda ve `noindex` tutuldu.
- 28.08.2026: Türkçe ve İngilizce eşdeğer rotalara karşılıklı canonical/hreflang ilişkileri eklendi; lint, strict TypeScript ve 139 sayfalık static export build geçti.
- 28.08.2026: İngilizce header ve footer ayrı tasarımlardan çıkarılarak Türkçe sürümle aynı ortak bileşenlere bağlandı; İngilizce rotalarda aktif navigasyon vurgusu doğrulandı. İngilizce araç listesi, Türkçe katalogla aynı filtre, kategori, sıralama, kart, CTA ve newsletter düzenine geçirildi. İletişim ve teklif sayfalarının yerleşimleri de Türkçe eşdeğerleriyle hizalandı.
