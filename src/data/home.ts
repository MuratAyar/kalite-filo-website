import type { HomePageCopy } from "@/types";

export const homePageCopy: HomePageCopy = {
  publicationStatus: "draft",
  hero: {
    title: "Filo Kiralamada İşinizin Gücüne Güç Katın",
    intro:
      "Kurumsal araç ihtiyacınızı planlamak için araç seçeneklerini inceleyin veya teklif sürecine başlayın.",
    primaryAction: {
      label: "Hemen Teklif Al",
    },
    secondaryAction: {
      label: "Araçları İncele",
    },
    finder: {
      title: "Hızlı Araç Bul",
      body: "Marka ve model seçiminizle araç görünümünü filtreleyin.",
      action: {
        label: "Araçları Listele",
      },
    },
  },
  featuredVehicles: {
    title: "Öne Çıkan Araçlar",
    intro: "Kampanyalı araç modellerini inceleyin.",
    emptyState: {
      title: "Henüz yayıma hazır araç kaydı bulunmuyor",
      body: "Güncel araç seçenekleri için Araçlar sayfasını inceleyin.",
      action: {
        label: "Araçları Görüntüle",
      },
    },
  },
  commercial: {
    title: "Ticari Araç Kiralama İhtiyaçlarınızda Da Yanınızdayız",
    body:
      "Kurumsal kullanım ihtiyacınıza uygun araç seçeneklerini değerlendirmek için portföy sayfasına göz atın.",
    action: {
      label: "Ticari Araçları Listele",
    },
  },
  why: {
    title: "Neden Kalite Filo'yu Tercih Etmelisiniz?",
    intro:
      "Araç seçimi ve teklif adımlarını mevcut sayfalardan ilerletebilirsiniz.",
    steps: [
      {
        id: "ihtiyac",
        title: "İhtiyacınızı Belirleyin",
        body: "Araç türü ve kullanım ihtiyacınızı netleştirin.",
      },
      {
        id: "araclar",
        title: "Araçları İnceleyin",
        body: "Araç seçeneklerini Araçlar sayfasından değerlendirin.",
      },
      {
        id: "teklif",
        title: "Teklif Sayfasına Geçin",
        body: "Kiralama talebiniz için Teklif Al sayfasını inceleyin.",
      },
    ],
  },
  solutions: {
    title: "Size Özel Filo Çözümleri",
    intro: "Kurumsal araç ihtiyacınıza uygun yolu seçin.",
    items: [
      {
        id: "uzun-donem",
        title: "Uzun Dönem Kiralama",
        body: "Kiralama ihtiyacınız için araç seçeneklerini inceleyin.",
        destination: "vehicles",
        action: {
          label: "Araçları İncele",
        },
      },
      {
        id: "operasyonel",
        title: "Operasyonel Yönetim",
        body: "Filo ihtiyacınız için teklif sayfasına geçin.",
        destination: "quote",
        action: {
          label: "Teklif Al",
        },
      },
      {
        id: "ticari",
        title: "Ticari Araç Çözümleri",
        body: "Ticari araç seçenekleri için portföy sayfasını inceleyin.",
        destination: "vehicles",
        action: {
          label: "Araçları İncele",
        },
      },
      {
        id: "yonetici",
        title: "Yönetici Araçları",
        body: "Yönetici aracı ihtiyacınız için portföy sayfasını inceleyin.",
        destination: "vehicles",
        action: {
          label: "Araçları İncele",
        },
      },
    ],
  },
  conversion: {
    eyebrow: "Hızlı İşlem",
    title: "Filo Çözümlerimiz İçin Hızlı Teklif Alın",
    body:
      "İhtiyaçlarınıza özel operasyonel kiralama seçenekleri için bizimle iletişime geçin.",
    action: {
      label: "Hızlı Teklif Al",
    },
  },
  editorial: {
    title: "Filo Dünyası'nı Keşfedin",
    intro:
      "Kurumsal araç kiralama ve filo yönetimi içerikleri için Filo Rehberi’ni ziyaret edin.",
    emptyState: {
      title: "Henüz yayıma hazır Filo Rehberi içeriği bulunmuyor",
      body:
        "Onaylı içerikler eklendiğinde bu alan Filo Rehberi kayıtlarından beslenecek.",
    },
    allAction: {
      label: "Tümünü Görüntüle",
    },
  },
};
