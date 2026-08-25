import type { Metadata } from "next";
import Link from "next/link";

import {
  ArticleContent,
  ArticleShareActions,
  getArticleTableOfContents,
} from "@/components/editorial";
import { PageContainer, PageHeader, Section } from "@/components/layout";
import { classNames } from "@/components/ui/class-names";
import { getPublicStaticRoute } from "@/config/public-navigation";
import { getSiteEnvironment } from "@/config/site";
import { articleCategories, articles } from "@/data";
import { readArticleMarkdown } from "@/lib/article-content";
import { getFiloRehberiArticlePath } from "@/lib/paths";
import { createFamilyRouteMetadata } from "@/lib/route-metadata";

type ArticlePageProps = { params: Promise<{ category: string; slug: string }> };

const homeRoute = getPublicStaticRoute("home");
const guideRoute = getPublicStaticRoute("fleet-guide");
const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

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
  if (!category || !article) {
    throw new Error(
      `Unknown Filo Rehberi article: ${categorySlug}/${articleSlug}`,
    );
  }
  return { article, category };
}

function getRelatedArticle(currentArticleId: string) {
  const candidates = articles.filter(
    (item) => item.id !== currentArticleId && item.coverImage,
  );
  if (candidates.length === 0) return undefined;

  const currentIndex = articles.findIndex((item) => item.id === currentArticleId);
  return candidates[currentIndex % candidates.length];
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;
  const { article, category } = getRecord(categorySlug, slug);
  return {
    ...createFamilyRouteMetadata(
      "fleet-guide-article",
      getFiloRehberiArticlePath(category.slug, article.slug),
    ),
    description: article.seo.description,
    title: { absolute: article.seo.title },
  };
}

export default async function FleetGuideArticlePage({ params }: ArticlePageProps) {
  const { category: categorySlug, slug } = await params;
  const { article, category } = getRecord(categorySlug, slug);
  const markdown = readArticleMarkdown(article.contentKey);
  const tableOfContents = getArticleTableOfContents(markdown);
  const articlePath = getFiloRehberiArticlePath(category.slug, article.slug);
  const canonicalUrl = new URL(
    articlePath,
    getSiteEnvironment().origin,
  ).toString();
  const relatedArticle = getRelatedArticle(article.id);
  const relatedCategory = relatedArticle
    ? articleCategories.find((item) => item.id === relatedArticle.categoryId)
    : undefined;

  return (
    <main
      className="flex-1"
      data-fleet-guide-detail="true"
      id="main-content"
      tabIndex={-1}
    >
      <PageHeader
        breadcrumbs={[
          { href: homeRoute.path, label: homeRoute.label },
          { href: guideRoute.path, label: guideRoute.label },
          { label: article.title },
        ]}
        intro={article.excerpt}
        title={article.title}
        variant="high-emphasis"
      >
        <ul
          aria-label="Makale bilgileri"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-text-secondary"
          data-article-header-meta="true"
        >
          <li className="rounded-pill bg-corporate-blue px-3 py-2 font-semibold text-text-inverse">
            {category.label}
          </li>
          <li>
            <span className="sr-only">Yayın tarihi: </span>
            <time dateTime={article.publishedAt}>
              {dateFormatter.format(
                new Date(`${article.publishedAt}T00:00:00Z`),
              )}
            </time>
          </li>
          <li>{article.readingMinutes} dk okuma</li>
        </ul>
      </PageHeader>

      <Section spacing="none" surface="page">
        <PageContainer className="grid gap-8 pb-section lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
          {article.coverImage ? (
            <figure
              className="min-w-0 overflow-hidden rounded-panel border border-border-subtle bg-surface-card p-3 md:p-4"
              data-article-cover="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={article.coverImage.alt}
                className="aspect-video w-full rounded-card object-cover"
                height={article.coverImage.height}
                src={article.coverImage.src}
                width={article.coverImage.width}
              />
            </figure>
          ) : null}

          <aside
            aria-label="Makale yardımcı araçları"
            className="space-y-5 lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start"
            data-article-sidebar="true"
          >
            <section
              aria-labelledby="article-table-of-contents-title"
              className="rounded-card border border-border-subtle bg-surface-card p-6"
              data-article-table-of-contents="true"
            >
              <h2
                className="text-label font-semibold tracking-wide text-text-primary uppercase"
                id="article-table-of-contents-title"
              >
                İçindekiler
              </h2>
              <nav aria-label="Makale içindekiler" className="mt-5">
                <ol className="space-y-3">
                  {tableOfContents.map((item) => (
                    <li className="relative pl-4" key={item.id}>
                      <span
                        aria-hidden="true"
                        className="absolute top-[0.65em] left-0 size-1.5 rounded-pill bg-border-control"
                      />
                      <a
                        className="text-body leading-relaxed text-text-secondary underline decoration-transparent underline-offset-4 transition-colors hover:text-corporate-blue hover:decoration-current focus-visible:rounded-control"
                        data-article-toc-link="true"
                        href={`#${item.id}`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </section>

            <section
              aria-labelledby="article-share-title"
              className="rounded-card border border-border-subtle bg-surface-card p-5"
              data-article-share-panel="true"
            >
              <h2
                className="text-label font-semibold tracking-wide text-text-primary uppercase"
                id="article-share-title"
              >
                Makaleyi paylaş
              </h2>
              <div className="mt-4">
                <ArticleShareActions
                  canonicalUrl={canonicalUrl}
                  title={article.title}
                />
              </div>
            </section>

            {relatedArticle?.coverImage && relatedCategory ? (
              <Link
                className="group block overflow-hidden rounded-card border border-border-subtle bg-surface-card transition-[border-color,box-shadow] hover:border-accent-orange hover:shadow-[0_14px_30px_rgba(24,33,54,0.12)] focus-visible:border-accent-orange"
                data-article-related="true"
                href={getFiloRehberiArticlePath(
                  relatedCategory.slug,
                  relatedArticle.slug,
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={relatedArticle.coverImage.alt}
                  className="aspect-video w-full object-cover"
                  height={relatedArticle.coverImage.height}
                  loading="lazy"
                  src={relatedArticle.coverImage.src}
                  width={relatedArticle.coverImage.width}
                />
                <span className="block p-5">
                  <span className="block text-body font-semibold text-text-primary">
                    {relatedArticle.title}
                  </span>
                  <span className="mt-2 line-clamp-2 block text-label text-text-secondary">
                    {relatedArticle.excerpt}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-2 text-body font-semibold text-corporate-blue">
                    İncele <span aria-hidden="true">→</span>
                  </span>
                </span>
              </Link>
            ) : null}
          </aside>

          <article
            className={classNames(
              "min-w-0 rounded-panel border border-border-subtle bg-surface-card p-6 md:p-10",
              article.coverImage
                ? "lg:col-start-1 lg:row-start-2"
                : "lg:col-start-1 lg:row-start-1",
            )}
          >
            <ArticleContent markdown={markdown} />
          </article>
        </PageContainer>
      </Section>
    </main>
  );
}
