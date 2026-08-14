import type { Article, ArticleCategory } from "@/types";
import {
  asEntityId,
  asIsoDate,
  asLocalAssetPath,
  asSlug,
  assertUniqueContentRecords,
} from "@/lib";

export const articleCategories: readonly ArticleCategory[] = Object.freeze([
  {
    id: asEntityId("uzun-donem-kiralama"),
    slug: asSlug("uzun-donem-kiralama"),
    label: "Uzun Dönem Kiralama",
    publicationStatus: "approved",
  },
  {
    id: asEntityId("maliyet-ve-finans"),
    slug: asSlug("maliyet-ve-finans"),
    label: "Maliyet ve Finans",
    publicationStatus: "approved",
  },
  {
    id: asEntityId("arac-rehberi"),
    slug: asSlug("arac-rehberi"),
    label: "Araç Rehberi",
    publicationStatus: "approved",
  },
  {
    id: asEntityId("filo-yonetimi"),
    slug: asSlug("filo-yonetimi"),
    label: "Filo Yönetimi",
    publicationStatus: "approved",
  },
  {
    id: asEntityId("elektrikli-araclar"),
    slug: asSlug("elektrikli-araclar"),
    label: "Elektrikli Araçlar",
    publicationStatus: "approved",
  },
  {
    id: asEntityId("bakim-ve-hasar"),
    slug: asSlug("bakim-ve-hasar"),
    label: "Bakım ve Hasar",
    publicationStatus: "approved",
  },
]);

export const articles: readonly Article[] = Object.freeze([
  {
    id: asEntityId("operasyonel-arac-kiralama-nedir"),
    slug: asSlug("operasyonel-arac-kiralama-nedir"),
    publicationStatus: "approved",
    title: "Operasyonel Araç Kiralama Nedir? Şirketler İçin Kapsamlı Rehber",
    excerpt:
      "Şirket araçlarını satın almak yerine uzun dönem kiralamanın nasıl çalıştığını; maliyet, operasyon, bakım ve ikinci el riski açısından sunduğu avantajlarla birlikte inceleyin.",
    categoryId: asEntityId("uzun-donem-kiralama"),
    tagIds: [
      asEntityId("operasyonel-kiralama"),
      asEntityId("uzun-donem-kiralama"),
      asEntityId("filo-yonetimi"),
      asEntityId("kurumsal-arac-kiralama"),
    ],
    publishedAt: asIsoDate("2026-08-13"),
    readingMinutes: 7,
    featured: true,
    coverImage: {
      src: asLocalAssetPath(
        "/images/filo-rehberi/01-operasyonel-arac-kiralama.webp",
      ),
      width: 1600,
      height: 900,
      purpose: "informative",
      alt: "Havadan çekilmiş, sıralar halinde park edilmiş otomobiller",
    },
    sources: [],
    contentKey: asEntityId("operasyonel-arac-kiralama-nedir"),
    seo: {
      title: "Operasyonel Araç Kiralama Nedir? Şirketler İçin Rehber | Kalite Filo",
      description:
        "Operasyonel araç kiralamanın nasıl çalıştığını, satın almadan farklarını, şirketlere sağladığı operasyonel avantajları ve doğru kiralama modelinin nasıl seçileceğini öğrenin.",
    },
  },
  {
    id: asEntityId("filo-toplam-sahip-olma-maliyeti-tco"),
    slug: asSlug("filo-toplam-sahip-olma-maliyeti-tco"),
    publicationStatus: "approved",
    title:
      "Filo Maliyetleri Nasıl Hesaplanır? TCO ile Gerçek Araç Maliyetini Görmek",
    excerpt:
      "Bir şirket aracının maliyeti satın alma veya kira bedelinden ibaret değildir. TCO yaklaşımıyla filonuzun gerçek maliyetini oluşturan kalemleri inceleyin.",
    categoryId: asEntityId("maliyet-ve-finans"),
    tagIds: [
      asEntityId("tco"),
      asEntityId("filo-maliyeti"),
      asEntityId("maliyet-analizi"),
      asEntityId("operasyonel-kiralama"),
    ],
    publishedAt: asIsoDate("2026-08-11"),
    readingMinutes: 8,
    featured: false,
    coverImage: {
      src: asLocalAssetPath("/images/filo-rehberi/02-filo-tco-maliyet.webp"),
      width: 1600,
      height: 900,
      purpose: "informative",
      alt: "Hesap makinesi, ABD doları banknotları ve otomobil anahtarı",
    },
    sources: [],
    contentKey: asEntityId("filo-toplam-sahip-olma-maliyeti-tco"),
    seo: {
      title: "Filo TCO Hesaplama: Şirket Araçlarının Gerçek Maliyeti | Kalite Filo",
      description:
        "Filo toplam sahip olma maliyeti TCO nedir? Yakıt, bakım, değer kaybı, finansman ve operasyon maliyetleriyle şirket araçlarının gerçek maliyetini hesaplayın.",
    },
  },
  {
    id: asEntityId("kurumsal-filoda-dogru-arac-secimi"),
    slug: asSlug("kurumsal-filoda-dogru-arac-secimi"),
    publicationStatus: "approved",
    title: "Kurumsal Filoda Doğru Araç Nasıl Seçilir?",
    excerpt:
      "Sedan, SUV veya hafif ticari araç arasında karar verirken yalnızca marka ve fiyatı değil; görev, kilometre, sürücü ve toplam maliyeti birlikte değerlendirin.",
    categoryId: asEntityId("arac-rehberi"),
    tagIds: [
      asEntityId("arac-secimi"),
      asEntityId("kurumsal-filo"),
      asEntityId("arac-rehberi"),
      asEntityId("filo-politikasi"),
    ],
    publishedAt: asIsoDate("2026-08-09"),
    readingMinutes: 7,
    featured: false,
    coverImage: {
      src: asLocalAssetPath("/images/filo-rehberi/03-dogru-arac-secimi.webp"),
      width: 1600,
      height: 900,
      purpose: "informative",
      alt: "Otoparkta sıralanmış SUV araçlar",
    },
    sources: [],
    contentKey: asEntityId("kurumsal-filoda-dogru-arac-secimi"),
    seo: {
      title: "Şirket Filosu İçin Doğru Araç Nasıl Seçilir? | Kalite Filo",
      description:
        "Şirket araç filosu oluştururken segment, motor, kilometre, kullanım amacı, sürücü profili ve TCO kriterlerine göre doğru araç seçiminin püf noktaları.",
    },
  },
  {
    id: asEntityId("filo-kiralama-kilometre-limiti-nasil-belirlenir"),
    slug: asSlug("filo-kiralama-kilometre-limiti-nasil-belirlenir"),
    publicationStatus: "approved",
    title: "Filo Kiralamada Kilometre Limiti Nasıl Belirlenir?",
    excerpt:
      "Kiralama sözleşmesindeki kilometreyi tahmin etmek yerine gerçek kullanım verileriyle planlamak, dönem sonu maliyetlerini kontrol altında tutmanıza yardımcı olabilir.",
    categoryId: asEntityId("filo-yonetimi"),
    tagIds: [
      asEntityId("kilometre-limiti"),
      asEntityId("filo-yonetimi"),
      asEntityId("uzun-donem-kiralama"),
      asEntityId("filo-planlama"),
    ],
    publishedAt: asIsoDate("2026-08-07"),
    readingMinutes: 6,
    featured: false,
    coverImage: {
      src: asLocalAssetPath("/images/filo-rehberi/04-kilometre-limiti.webp"),
      width: 1600,
      height: 900,
      purpose: "informative",
      alt: "86490 kilometreyi gösteren otomobil gösterge paneli",
    },
    sources: [],
    contentKey: asEntityId(
      "filo-kiralama-kilometre-limiti-nasil-belirlenir",
    ),
    seo: {
      title: "Araç Kiralamada Kilometre Limiti Nasıl Belirlenir? | Kalite Filo",
      description:
        "Uzun dönem araç kiralamada yıllık kilometre limiti nasıl hesaplanır? Geçmiş kullanım, çalışan profili ve sözleşme süresine göre doğru kilometre planlaması.",
    },
  },
  {
    id: asEntityId("elektrikli-araclar-sirket-filosu-gecis-rehberi"),
    slug: asSlug("elektrikli-araclar-sirket-filosu-gecis-rehberi"),
    publicationStatus: "approved",
    title: "Elektrikli Araçlar Şirket Filoları İçin Mantıklı mı?",
    excerpt:
      "Elektrikli araçlara geçişte yalnızca araç fiyatını değil; günlük rota, şarj altyapısı, enerji maliyeti ve operasyon gereksinimlerini birlikte değerlendirin.",
    categoryId: asEntityId("elektrikli-araclar"),
    tagIds: [
      asEntityId("elektrikli-arac"),
      asEntityId("elektrikli-filo"),
      asEntityId("sarj-altyapisi"),
      asEntityId("surdurulebilir-filo"),
    ],
    publishedAt: asIsoDate("2026-08-05"),
    readingMinutes: 8,
    featured: false,
    coverImage: {
      src: asLocalAssetPath("/images/filo-rehberi/05-elektrikli-filo.webp"),
      width: 1600,
      height: 900,
      purpose: "informative",
      alt: "Supercharger istasyonunda şarj edilen beyaz Tesla otomobil",
    },
    sources: [],
    contentKey: asEntityId("elektrikli-araclar-sirket-filosu-gecis-rehberi"),
    seo: {
      title: "Elektrikli Araçlar Şirket Filoları İçin Mantıklı mı? | Kalite Filo",
      description:
        "Kurumsal filolarda elektrikli araçlara geçiş nasıl planlanır? Şarj altyapısı, kullanım profili, menzil, operasyon ve TCO açısından elektrikli filo rehberi.",
    },
  },
  {
    id: asEntityId("filo-bakim-hasar-yonetimi"),
    slug: asSlug("filo-bakim-hasar-yonetimi"),
    publicationStatus: "approved",
    title:
      "Filo Bakım ve Hasar Yönetimi: Araçların Yolda Kalmasını Değil, İşte Kalmasını Sağlayın",
    excerpt:
      "Periyodik bakım, lastik, hasar ve servis süreçlerini doğru planlayarak araçların operasyon dışında kaldığı süreyi azaltmanın yollarını inceleyin.",
    categoryId: asEntityId("bakim-ve-hasar"),
    tagIds: [
      asEntityId("bakim-ve-hasar"),
      asEntityId("filo-bakimi"),
      asEntityId("hasar-yonetimi"),
      asEntityId("filo-operasyonu"),
    ],
    publishedAt: asIsoDate("2026-08-03"),
    readingMinutes: 7,
    featured: false,
    coverImage: {
      src: asLocalAssetPath("/images/filo-rehberi/06-bakim-hasar-yonetimi.webp"),
      width: 1600,
      height: 900,
      purpose: "informative",
      alt: "Servis atölyesinde otomobil üzerinde çalışan teknisyen",
    },
    sources: [],
    contentKey: asEntityId("filo-bakim-hasar-yonetimi"),
    seo: {
      title: "Filo Bakım ve Hasar Yönetimi Rehberi | Kalite Filo",
      description:
        "Şirket araçlarında periyodik bakım, servis, hasar, lastik ve ikame araç süreçlerini doğru yöneterek operasyon kaybını ve filo maliyetlerini azaltın.",
    },
  },
]);

assertUniqueContentRecords(articleCategories, "article categories");
assertUniqueContentRecords(articles, "articles");
