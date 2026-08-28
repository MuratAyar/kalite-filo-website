import type { Metadata } from "next";

import { ArticleDetail } from "@/components/editorial";
import {
  ENGLISH_ARTICLE_CATEGORY_SLUGS,
  ENGLISH_ARTICLE_SLUGS,
  ENGLISH_STATIC_PATHS,
} from "@/config/localized-routes";
import { getSiteEnvironment } from "@/config/site";
import { englishArticleCategories, englishArticles } from "@/data";
import { asInternalPath } from "@/lib";
import { readArticleMarkdown } from "@/lib/article-content";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";

type Props = { params: Promise<{ category: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const categories = new Map(englishArticleCategories.map((item) => [item.id, item]));
  return englishArticles.map((article) => {
    const category = categories.get(article.categoryId);
    if (!category) throw new Error(`Unknown category for English article ${article.id}.`);
    return { category: category.slug, slug: article.slug };
  });
}

function getRecord(categorySlug: string, articleSlug: string) {
  const category = englishArticleCategories.find((item) => item.slug === categorySlug);
  const article = englishArticles.find(
    (item) => item.slug === articleSlug && item.categoryId === category?.id,
  );
  if (!category || !article) throw new Error(`Unknown English Fleet Guide article: ${categorySlug}/${articleSlug}`);
  return { article, category };
}

function getRelatedArticle(currentArticleId: string) {
  const candidates = englishArticles.filter((item) => item.id !== currentArticleId && item.coverImage);
  if (candidates.length === 0) return undefined;
  const currentIndex = englishArticles.findIndex((item) => item.id === currentArticleId);
  return candidates[currentIndex % candidates.length];
}

function getEnglishArticlePath(category: string, slug: string) {
  return asInternalPath(`/en/fleet-guide/${category}/${slug}/`, "English Fleet Guide article");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const values = await params;
  const { article, category } = getRecord(values.category, values.slug);
  const path = getEnglishArticlePath(category.slug, article.slug);
  const trCategory = Object.entries(ENGLISH_ARTICLE_CATEGORY_SLUGS).find(([, en]) => en === category.slug)?.[0];
  const trArticle = Object.entries(ENGLISH_ARTICLE_SLUGS).find(([, en]) => en === article.slug)?.[0];
  const trPath = trCategory && trArticle ? `/filo-rehberi/${trCategory}/${trArticle}/` : "/filo-rehberi/";
  return {
    alternates: { canonical: path, languages: { en: path, tr: trPath, "x-default": trPath } },
    description: article.seo.description,
    robots: createTranslatedRouteRobots("fleet-guide-article"),
    title: { absolute: article.seo.title },
  };
}

export default async function EnglishFleetGuideArticlePage({ params }: Props) {
  const values = await params;
  const { article, category } = getRecord(values.category, values.slug);
  const articlePath = getEnglishArticlePath(category.slug, article.slug);
  const relatedArticle = getRelatedArticle(article.id);
  const relatedCategory = relatedArticle
    ? englishArticleCategories.find((item) => item.id === relatedArticle.categoryId)
    : undefined;

  return (
    <ArticleDetail
      article={article}
      canonicalUrl={new URL(articlePath, getSiteEnvironment().origin).toString()}
      category={category}
      guidePath={asInternalPath(ENGLISH_STATIC_PATHS.fleetGuide, "English Fleet Guide")}
      homePath={asInternalPath(ENGLISH_STATIC_PATHS.home, "English home")}
      locale="en"
      markdown={readArticleMarkdown(article.contentKey)}
      relatedArticle={relatedArticle}
      relatedArticlePath={relatedArticle && relatedCategory ? getEnglishArticlePath(relatedCategory.slug, relatedArticle.slug) : undefined}
    />
  );
}
