"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Article, ArticleCategory } from "@/types";
import { classNames } from "@/components/ui/class-names";
import { getFiloRehberiArticlePath, getFiloRehberiCategoryPath } from "@/lib/paths";

export type FleetGuideListingProps = {
  articles: readonly Article[];
  categories: readonly ArticleCategory[];
  initialCategoryId?: ArticleCategory["id"];
};

const ARTICLES_PER_PAGE = 6;
const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit", month: "short", timeZone: "UTC", year: "numeric",
});

function ArticleMeta({ article }: { article: Article }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-text-secondary">
      <time dateTime={article.publishedAt}>
        {dateFormatter.format(new Date(`${article.publishedAt}T00:00:00Z`))}
      </time>
      <span aria-hidden="true" className="text-border-control">·</span>
      <span>{article.readingMinutes} dk. okuma</span>
    </p>
  );
}

function ArticleMedia({ article, eager = false }: { article: Article; eager?: boolean }) {
  if (!article.coverImage) {
    return (
      <div
        aria-label={`${article.title} için onaylı kapak görseli henüz mevcut değil.`}
        className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,var(--kf-brand-navy),var(--kf-corporate-blue))] p-6 text-center text-label font-semibold text-text-inverse"
        data-fleet-guide-cover-placeholder="true"
        role="img"
      >
        <span aria-hidden="true">Filo Rehberi</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={article.coverImage.alt} className="absolute inset-0 size-full object-cover"
      height={article.coverImage.height} loading={eager ? "eager" : "lazy"}
      src={article.coverImage.src} width={article.coverImage.width} />
  );
}

export function FleetGuideListing({ articles, categories, initialCategoryId }: FleetGuideListingProps) {
  const selectedCategoryId = initialCategoryId ?? "all";
  const [currentPage, setCurrentPage] = useState(1);
  const listingStartRef = useRef<HTMLDivElement>(null);
  const previousPageRef = useRef(currentPage);
  const approvedCategories = categories.filter((item) => item.publicationStatus === "approved");
  const categoriesById = new Map(approvedCategories.map((item) => [item.id, item]));
  const approvedArticles = [...articles]
    .filter((item) => item.publicationStatus === "approved")
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.publishedAt.localeCompare(a.publishedAt));
  const visibleArticles = selectedCategoryId === "all"
    ? approvedArticles
    : approvedArticles.filter((item) => item.categoryId === selectedCategoryId);
  const featuredArticle = visibleArticles.find((item) => item.featured) ?? visibleArticles[0];
  const gridArticles = visibleArticles.filter((item) => item.id !== featuredArticle?.id);
  const pageCount = Math.max(1, Math.ceil(gridArticles.length / ARTICLES_PER_PAGE));
  const visibleGridArticles = gridArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE,
  );
  const controls = [
    { href: "/filo-rehberi/" as const, id: "all" as const, label: "Tüm İçerikler" },
    ...approvedCategories.map((item) => ({
      href: getFiloRehberiCategoryPath(item.slug), id: item.id, label: item.label,
    })),
  ];

  function articlePath(article: Article) {
    const category = categoriesById.get(article.categoryId);
    if (!category) throw new Error(`Unknown category for article ${article.id}.`);
    return getFiloRehberiArticlePath(category.slug, article.slug);
  }

  useEffect(() => {
    if (previousPageRef.current === currentPage) return;
    previousPageRef.current = currentPage;
    listingStartRef.current?.focus({ preventScroll: true });
    window.scrollTo({ behavior: "auto", top: 0 });
  }, [currentPage]);

  function changePage(page: number) {
    setCurrentPage(page);
  }

  const cardTransition = "overflow-hidden rounded-card border border-border-subtle bg-surface-card transition-[border-color,box-shadow] hover:border-corporate-blue hover:shadow-lg focus-within:border-corporate-blue focus-within:shadow-lg motion-reduce:transition-none";

  return (
    <div data-fleet-guide-listing="true" data-fleet-guide-page-count={pageCount}
      data-fleet-guide-page-size={ARTICLES_PER_PAGE} data-fleet-guide-record-count={approvedArticles.length}>
      <div aria-label="Filo Rehberi kategorileri" className="border-b border-border-subtle outline-none"
        data-fleet-guide-category-filter="true" ref={listingStartRef} tabIndex={-1}>
        <ul className="mobile-category-track flex gap-x-7 gap-y-2 sm:flex-wrap">
          {controls.map((control) => {
            const selected = selectedCategoryId === control.id;
            return (
              <li key={control.id}>
                <Link aria-current={selected ? "page" : undefined}
                  className={classNames(
                    "relative inline-flex min-h-11 items-center border-b-2 px-1 text-label font-semibold transition-colors motion-reduce:transition-none",
                    selected ? "border-corporate-blue text-corporate-blue" : "border-transparent text-text-secondary hover:border-border-control hover:text-text-primary",
                  )}
                  data-fleet-guide-category-control="true" data-fleet-guide-category-id={control.id}
                  href={control.href}>{control.label}</Link>
              </li>
            );
          })}
        </ul>
      </div>

      <p aria-live="polite" className="sr-only">
        {visibleArticles.length} içerikten {visibleGridArticles.length} tanesi, sayfa {currentPage} / {pageCount} gösteriliyor.
      </p>

      <div className="mt-10" id="fleet-guide-content">
        {featuredArticle ? (
          <article className={cardTransition} data-fleet-guide-article="true" data-fleet-guide-featured="true">
            <Link className="group grid h-full outline-none lg:grid-cols-2"
              data-fleet-guide-article-link="true" href={articlePath(featuredArticle)}>
              <div className="relative min-h-64 overflow-hidden bg-surface-muted lg:min-h-[25rem]">
                <ArticleMedia article={featuredArticle} eager />
                <span className="absolute top-5 left-5 rounded-pill bg-orange-light px-3 py-1 text-xs font-semibold text-orange-dark">Öne Çıkan</span>
              </div>
              <div className="flex flex-col justify-center p-6 md:p-8 lg:p-10">
                <ArticleMeta article={featuredArticle} />
                <p className="mt-6 text-label font-semibold text-corporate-blue">{categoriesById.get(featuredArticle.categoryId)?.label}</p>
                <h3 className="mt-3 text-heading-lg font-semibold text-balance text-text-primary group-hover:text-corporate-blue">{featuredArticle.title}</h3>
                <p className="mt-5 max-w-2xl text-body-lg text-pretty text-text-secondary">{featuredArticle.excerpt}</p>
              </div>
            </Link>
          </article>
        ) : (
          <p className="rounded-card border border-border-subtle bg-surface-card p-6 text-body text-text-secondary">Bu kategoride gösterilecek içerik bulunmuyor.</p>
        )}

        {gridArticles.length > 0 ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3" data-fleet-guide-grid="true">
            {visibleGridArticles.map((article) => (
              <li key={article.id}>
                <article className={`h-full ${cardTransition}`} data-fleet-guide-article="true">
                  <Link className="group flex h-full flex-col outline-none"
                    data-fleet-guide-article-link="true" href={articlePath(article)}>
                    <div className="relative aspect-video overflow-hidden bg-surface-muted">
                      <ArticleMedia article={article} />
                      <span className="absolute top-4 left-4 rounded-pill bg-surface-card/95 px-3 py-1 text-xs font-semibold text-brand-navy">{categoriesById.get(article.categoryId)?.label}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-heading-md font-semibold text-balance text-text-primary group-hover:text-corporate-blue">{article.title}</h3>
                      <p className="mt-4 flex-1 text-body text-pretty text-text-secondary">{article.excerpt}</p>
                      <div className="mt-6 border-t border-border-subtle pt-5"><ArticleMeta article={article} /></div>
                    </div>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        ) : null}

        {pageCount > 1 ? (
          <nav aria-label="Filo Rehberi sayfaları" className="mt-10 flex flex-wrap items-center justify-center gap-2" data-fleet-guide-pagination="true">
            <button className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border-control bg-surface-card px-3 text-label font-semibold text-text-primary transition-colors hover:border-corporate-blue hover:text-corporate-blue disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              data-fleet-guide-page-control="previous" disabled={currentPage === 1}
              onClick={() => changePage(Math.max(1, currentPage - 1))} type="button">
              <span aria-hidden="true">←</span><span className="sr-only">Önceki sayfa</span>
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button aria-current={currentPage === page ? "page" : undefined} aria-label={`${page}. sayfa`}
                className={classNames(
                  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border px-3 text-label font-semibold transition-colors motion-reduce:transition-none",
                  currentPage === page ? "border-corporate-blue bg-corporate-blue text-text-inverse" : "border-border-control bg-surface-card text-text-primary hover:border-corporate-blue hover:text-corporate-blue",
                )}
                data-fleet-guide-page-control={page} key={page} onClick={() => changePage(page)} type="button">{page}</button>
            ))}
            <button className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border-control bg-surface-card px-3 text-label font-semibold text-text-primary transition-colors hover:border-corporate-blue hover:text-corporate-blue disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              data-fleet-guide-page-control="next" disabled={currentPage === pageCount}
              onClick={() => changePage(Math.min(pageCount, currentPage + 1))} type="button">
              <span aria-hidden="true">→</span><span className="sr-only">Sonraki sayfa</span>
            </button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
