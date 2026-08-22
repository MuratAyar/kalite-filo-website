import type {
  Article,
  ArticleCategory,
  HomeEditorialCopy,
  InternalPath,
} from "@/types";
import Link from "next/link";

import { PageContainer, Section } from "@/components/layout";
import { TextLink } from "@/components/ui";
import { classNames } from "@/components/ui/class-names";
import { getFiloRehberiArticlePath } from "@/lib/paths";

export type EditorialPreviewProps = {
  articles: readonly Article[];
  categories: readonly ArticleCategory[];
  columns?: 3 | 4;
  content: HomeEditorialCopy;
  fleetGuideHref: InternalPath;
};

type ArticleWithCover = Article & {
  readonly coverImage: NonNullable<Article["coverImage"]>;
};

const turkishDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export function EditorialPreview({
  articles,
  categories,
  columns = 4,
  content,
  fleetGuideHref,
}: EditorialPreviewProps) {
  const categoryById = new Map(
    categories
      .filter((category) => category.publicationStatus === "approved")
      .map((category) => [category.id, category]),
  );
  const approvedArticles = [...articles]
    .filter(
      (article): article is ArticleWithCover =>
        article.publicationStatus === "approved" && Boolean(article.coverImage),
    )
    .sort(
      (left, right) =>
        Number(right.featured) - Number(left.featured) ||
        right.publishedAt.localeCompare(left.publishedAt),
    )
    .slice(0, 4);

  return (
    <Section
      aria-labelledby="editorial-preview-title"
      className="overflow-hidden"
      surface="navy"
    >
      <PageContainer>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h2
              className="text-heading-lg font-semibold text-balance text-text-inverse"
              id="editorial-preview-title"
            >
              {content.title}
            </h2>
            <p className="mt-3 text-body-lg text-pretty text-text-inverse-muted">
              {content.intro}
            </p>
          </div>
          <TextLink
            className="inline-flex min-h-11 shrink-0 items-center self-start !no-underline hover:!no-underline md:self-auto"
            href={fleetGuideHref}
            tone="inverse"
          >
            {content.allAction.label}
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </TextLink>
        </div>
        {approvedArticles.length > 0 ? (
          <ul
            className={classNames(
              "mt-10 grid gap-5 sm:grid-cols-2",
              columns === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4",
            )}
          >
            {approvedArticles.map((article) => {
              const category = categoryById.get(article.categoryId);
              if (!category) {
                throw new Error(
                  `Unknown category for editorial preview article ${article.id}.`,
                );
              }

              return (
              <li
                className="group relative isolate min-h-80 overflow-hidden rounded-card border border-white/20 bg-navy-secondary transition-[border-color,box-shadow] duration-200 hover:border-accent-orange hover:shadow-lg focus-within:border-accent-orange focus-within:shadow-lg"
                key={article.id}
              >
                <Link
                  className="flex min-h-80 flex-col justify-end p-5 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent-orange"
                  data-editorial-preview-article-link="true"
                  href={getFiloRehberiArticlePath(
                    category.slug,
                    article.slug,
                  )}
                >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={article.coverImage.alt}
                  className="absolute inset-0 -z-20 size-full object-cover"
                  height={article.coverImage.height}
                  loading="lazy"
                  src={article.coverImage.src}
                  width={article.coverImage.width}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-gradient-to-t from-black/95 via-black/45 to-transparent"
                />
                <div>
                  <span className="mb-3 w-fit rounded-pill bg-accent-orange px-3 py-1 text-xs font-semibold text-brand-navy">
                    {category.label}
                  </span>
                  <h3 className="text-lg leading-snug font-semibold text-pretty text-text-inverse">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-label text-text-inverse-muted">
                    <time dateTime={article.publishedAt}>
                      {turkishDateFormatter.format(
                        new Date(`${article.publishedAt}T00:00:00Z`),
                      )}
                    </time>
                    <span aria-hidden="true"> · </span>
                    {article.readingMinutes} dk. okuma
                  </p>
                </div>
                </Link>
              </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-10 rounded-card border border-white/20 bg-navy-secondary p-6">
            <h3 className="text-heading-sm font-semibold text-text-inverse">
              {content.emptyState.title}
            </h3>
            <p className="mt-2 text-body-md text-text-inverse-muted">
              {content.emptyState.body}
            </p>
          </div>
        )}
      </PageContainer>
    </Section>
  );
}
