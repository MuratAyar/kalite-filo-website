import type { FaqCategory, FaqEntry } from "@/types";
import {
  asEntityId,
  asSlug,
  assertUniqueContentRecords,
  assertUniqueBy,
} from "@/lib";

export const faqCategories: readonly FaqCategory[] = Object.freeze([
  {
    id: asEntityId("kiralama-sureci"),
    slug: asSlug("kiralama-sureci"),
    label: "Kiralama Süreci",
    publicationStatus: "approved",
  },
  {
    id: asEntityId("arac-cozumleri"),
    slug: asSlug("arac-cozumleri"),
    label: "Araç Çözümleri",
    publicationStatus: "approved",
  },
  {
    id: asEntityId("bakim-ve-servis"),
    slug: asSlug("bakim-ve-servis"),
    label: "Bakım ve Servis",
    publicationStatus: "approved",
  },
  {
    id: asEntityId("hasar-ve-kaza"),
    slug: asSlug("hasar-ve-kaza"),
    label: "Hasar ve Kaza",
    publicationStatus: "approved",
  },
]);

export const faqEntries: readonly FaqEntry[] = Object.freeze([
  {
    id: asEntityId("uzun-donem-arac-kiralama-nedir"),
    categoryId: asEntityId("kiralama-sureci"),
    question: "Uzun dönem araç kiralama nedir?",
    answerParagraphs: [
      "Uzun dönem araç kiralama, şirketlerin uzun süreli araç ihtiyacını satın alma zorunluluğu olmadan karşılayan operasyonel kiralama hizmetidir.",
      "Araç ve kullanım ihtiyacı analiz edilir; uygun segment, kiralama süresi, kilometre limiti ve operasyonel hizmet kapsamı netleştirildikten sonra teklif hazırlanır.",
    ],
    order: 10,
    publicationStatus: "approved",
  },
  {
    id: asEntityId("teklif-sureci-nasil-ilerler"),
    categoryId: asEntityId("kiralama-sureci"),
    question: "Teklif süreci nasıl ilerler?",
    answerParagraphs: [
      "Önce araç ve operasyon ihtiyacı değerlendirilir. Kullanım amacına göre araç ve segment seçimi, kiralama süresi, kilometre limiti ve ihtiyaç duyulan hizmet kapsamı belirlenir.",
      "Bu bilgiler netleştirildikten sonra kiralama talebine uygun teklif oluşturulur.",
    ],
    order: 20,
    publicationStatus: "approved",
  },
  {
    id: asEntityId("hangi-arac-ihtiyaclarina-cozum-sunulur"),
    categoryId: asEntityId("arac-cozumleri"),
    question: "Hangi araç ihtiyaçlarına çözüm sunulur?",
    answerParagraphs: [
      "Kurumsal şirketlerin ve işletmelerin uzun dönem araç ihtiyaçları için binek, ticari ve yönetici aracı seçenekleri değerlendirilir.",
      "Lojistik, dağıtım ve saha hizmetleri gibi operasyonlara yönelik ticari araç ihtiyaçları da kullanım amacına göre ele alınır.",
    ],
    order: 30,
    publicationStatus: "approved",
  },
  {
    id: asEntityId("filo-yonetimi-hangi-surecleri-kapsar"),
    categoryId: asEntityId("arac-cozumleri"),
    question: "Filo yönetimi hangi süreçleri kapsar?",
    answerParagraphs: [
      "Filo yönetimi; araç kullanımından bakım planlamasına kadar operasyonel süreçlerin düzenli ve verimli biçimde yürütülmesine yönelik çalışmaları kapsar.",
      "Hizmet kapsamı ihtiyaca göre bakım, servis, lastik, hasar, ikame araç ve raporlama süreçlerinin takibini içerebilir.",
    ],
    order: 40,
    publicationStatus: "approved",
  },
  {
    id: asEntityId("bakim-ve-servis-nasil-yonetilir"),
    categoryId: asEntityId("bakim-ve-servis"),
    question: "Bakım ve servis süreçleri nasıl yönetilir?",
    answerParagraphs: [
      "Periyodik bakım ve servis ihtiyaçları, aracın kullanım süresindeki operasyonel devamlılığı destekleyecek şekilde planlanır ve koordine edilir.",
      "Uygulanacak hizmetlerin kapsamı, kiralama talebi ve sözleşme koşulları netleştirilirken ayrıca belirlenir.",
    ],
    order: 50,
    publicationStatus: "approved",
  },
  {
    id: asEntityId("kaza-ve-hasar-surecleri-nasil-yonetilir"),
    categoryId: asEntityId("hasar-ve-kaza"),
    question: "Kaza ve hasar süreçleri nasıl yönetilir?",
    answerParagraphs: [
      "Kaza ve hasar durumlarında gerekli koordinasyon, operasyonun devamlılığını destekleyecek biçimde yürütülür.",
      "İzlenecek adımlar ve sağlanacak hizmetler olayın koşullarına ve sözleşmede belirlenen kapsama göre değerlendirilir.",
    ],
    order: 60,
    publicationStatus: "approved",
  },
]);

assertUniqueContentRecords(faqCategories, "FAQ categories");
assertUniqueBy(faqEntries, (entry) => entry.id, "FAQ entry ids");
