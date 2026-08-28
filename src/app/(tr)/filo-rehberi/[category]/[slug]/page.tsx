import type { Metadata } from "next";

import { ArticleDetail } from "@/components/editorial";
import { getPublicStaticRoute } from "@/config/public-navigation";
import { getSiteEnvironment } from "@/config/site";
import { articleCategories, articles } from "@/data";
import { readArticleMarkdown } from "@/lib/article-content";
import { getFiloRehberiArticlePath } from "@/lib/paths";
import { createFamilyRouteMetadata } from "@/lib/route-metadata";

type ArticlePageProps = { params: Promise<{ category: string; slug: string }> };

const homeRoute = getPublicStaticRoute("home");
const guideRoute = getPublicStaticRoute("fleet-guide");

export const dynamicParams = false;

export function generateStaticParams() {
  const categories = new Map(articleCategories.map((item) => [item.id, item]));
  return articles.map((article) => {
    const category = categories.get(article.categoryId);
    if (!category) throw new Error(`Unknown category for article ${article.id}.`);
    return { category: category.slug, slug: article.slug };
  });
}

function getRecord(categorySlug: string, articleSlug: string) {
  const category = articleCategories.find((item) => item.slug === categorySlug);
  const article = articles.find(
    (item) => item.slug === articleSlug && item.categoryId === category?.id,
  );
  if (!category || !article) throw new Error(`Unknown Filo Rehberi article: ${categorySlug}/${articleSlug}`);
  return { article, category };
}

function getRelatedArticle(currentArticleId: string) {
  const candidates = articles.filter((item) => item.id !== currentArticleId && item.coverImage);
  if (candidates.length === 0) return undefined;
  const currentIndex = articles.findIndex((item) => item.id === currentArticleId);
  return candidates[currentIndex % candidates.length];
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const values = await params;
  const { article, category } = getRecord(values.category, values.slug);
  return {
    ...createFamilyRouteMetadata("fleet-guide-article", getFiloRehberiArticlePath(category.slug, article.slug)),
    description: article.seo.description,
    title: { absolute: article.seo.title },
  };
}

export default async function FleetGuideArticlePage({ params }: ArticlePageProps) {
  const values = await params;
  const { article, category } = getRecord(values.category, values.slug);
  const articlePath = getFiloRehberiArticlePath(category.slug, article.slug);
  const relatedArticle = getRelatedArticle(article.id);
  const relatedCategory = relatedArticle
    ? articleCategories.find((item) => item.id === relatedArticle.categoryId)
    : undefined;

  return (
    <ArticleDetail
      article={article}
      canonicalUrl={new URL(articlePath, getSiteEnvironment().origin).toString()}
      category={category}
      guidePath={guideRoute.path}
      homePath={homeRoute.path}
      markdown={readArticleMarkdown(article.contentKey)}
      relatedArticle={relatedArticle}
      relatedArticlePath={relatedArticle && relatedCategory ? getFiloRehberiArticlePath(relatedCategory.slug, relatedArticle.slug) : undefined}
    />
  );
}
