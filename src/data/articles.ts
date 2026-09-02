import articleRecords from "./article-records.json";

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

export const articles: readonly Article[] = Object.freeze(
  articleRecords.map((record) => ({
    id: asEntityId(record.id),
    slug: asSlug(record.slug),
    publicationStatus: "approved" as const,
    title: record.title,
    excerpt: record.excerpt,
    categoryId: asEntityId(record.categoryId),
    tagIds: record.tagIds.map((tagId) => asEntityId(tagId)),
    publishedAt: asIsoDate(record.publishedAt),
    readingMinutes: record.readingMinutes,
    featured: record.featured,
    categoryFeatured: (record as { categoryFeatured?: boolean }).categoryFeatured === true,
    coverImage: record.coverImage
      ? {
          src: asLocalAssetPath(record.coverImage.src),
          width: record.coverImage.width,
          height: record.coverImage.height,
          purpose: "informative" as const,
          alt: record.coverImage.alt,
        }
      : undefined,
    sources: [],
    contentKey: asEntityId(record.contentKey),
    seo: record.seo,
  })),
);

assertUniqueContentRecords(articleCategories, "article categories");
assertUniqueContentRecords(articles, "articles");
