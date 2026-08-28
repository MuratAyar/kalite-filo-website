import Link from "next/link";

import type { Article, ArticleCategory, InternalPath } from "@/types";

import { PageContainer, PageHeader, Section } from "@/components/layout";
import { classNames } from "@/components/ui/class-names";

import { ArticleContent, getArticleTableOfContents } from "./article-content";
import { ArticleShareActions } from "./article-share-actions";

type ArticleDetailProps = {
  article: Article;
  canonicalUrl: string;
  category: ArticleCategory;
  guidePath: InternalPath;
  homePath: InternalPath;
  locale?: "en" | "tr";
  markdown: string;
  relatedArticle?: Article;
  relatedArticlePath?: InternalPath;
};

export function ArticleDetail({
  article,
  canonicalUrl,
  category,
  guidePath,
  homePath,
  locale = "tr",
  markdown,
  relatedArticle,
  relatedArticlePath,
}: ArticleDetailProps) {
  const tableOfContents = getArticleTableOfContents(markdown);
  const isEnglish = locale === "en";
  const formattedDate = new Intl.DateTimeFormat(isEnglish ? "en-GB" : "tr-TR", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${article.publishedAt}T00:00:00Z`));

  return (
    <main
      className="flex-1"
      data-fleet-guide-detail="true"
      id="main-content"
      tabIndex={-1}
    >
      <PageHeader
        breadcrumbs={[
          { href: homePath, label: isEnglish ? "Home" : "Ana Sayfa" },
          { href: guidePath, label: isEnglish ? "Fleet Guide" : "Filo Rehberi" },
          { label: article.title },
        ]}
        breadcrumbsAriaLabel={isEnglish ? "Breadcrumb" : undefined}
        intro={article.excerpt}
        mobileStartAtTitle
        title={article.title}
        variant="high-emphasis"
      >
        <ul
          aria-label={isEnglish ? "Article information" : "Makale bilgileri"}
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-text-secondary"
          data-article-header-meta="true"
        >
          <li className="rounded-pill bg-corporate-blue px-3 py-2 font-semibold text-text-inverse">
            {category.label}
          </li>
          <li>
            <span className="sr-only">{isEnglish ? "Published: " : "Yayın tarihi: "}</span>
            <time dateTime={article.publishedAt}>{formattedDate}</time>
          </li>
          <li>{isEnglish ? `${article.readingMinutes} min read` : `${article.readingMinutes} dk okuma`}</li>
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
            aria-label={isEnglish ? "Article tools" : "Makale yardımcı araçları"}
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
                {isEnglish ? "Contents" : "İçindekiler"}
              </h2>
              <nav aria-label={isEnglish ? "Article contents" : "Makale içindekiler"} className="mt-5">
                <ol className="space-y-3">
                  {tableOfContents.map((item) => (
                    <li className="relative pl-4" key={item.id}>
                      <span aria-hidden="true" className="absolute top-[0.65em] left-0 size-1.5 rounded-pill bg-border-control" />
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
              <h2 className="text-label font-semibold tracking-wide text-text-primary uppercase" id="article-share-title">
                {isEnglish ? "Share article" : "Makaleyi paylaş"}
              </h2>
              <div className="mt-4">
                <ArticleShareActions canonicalUrl={canonicalUrl} locale={locale} title={article.title} />
              </div>
            </section>

            {relatedArticle?.coverImage && relatedArticlePath ? (
              <Link
                className="group block overflow-hidden rounded-card border border-border-subtle bg-surface-card transition-[border-color,box-shadow] hover:border-accent-orange hover:shadow-[0_14px_30px_rgba(24,33,54,0.12)] focus-visible:border-accent-orange"
                data-article-related="true"
                href={relatedArticlePath}
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
                  <span className="block text-body font-semibold text-text-primary">{relatedArticle.title}</span>
                  <span className="mt-2 line-clamp-2 block text-label text-text-secondary">{relatedArticle.excerpt}</span>
                  <span className="mt-4 inline-flex items-center gap-2 text-body font-semibold text-corporate-blue">
                    {isEnglish ? "View Article" : "İncele"} <span aria-hidden="true">→</span>
                  </span>
                </span>
              </Link>
            ) : null}
          </aside>

          <article
            className={classNames(
              "min-w-0 rounded-panel border border-border-subtle bg-surface-card p-6 md:p-10",
              article.coverImage ? "lg:col-start-1 lg:row-start-2" : "lg:col-start-1 lg:row-start-1",
            )}
          >
            <ArticleContent markdown={markdown} />
          </article>
        </PageContainer>
      </Section>
    </main>
  );
}
