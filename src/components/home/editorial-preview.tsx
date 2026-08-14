import type {
  Article,
  ArticleCategory,
  HomeEditorialCopy,
  InternalPath,
} from "@/types";

import { PageContainer, Section } from "@/components/layout";
import { TextLink } from "@/components/ui";

export type EditorialPreviewProps = {
  articles: readonly Article[];
  categories: readonly ArticleCategory[];
  content: HomeEditorialCopy;
  fleetGuideHref: InternalPath;
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
  content,
  fleetGuideHref,
}: EditorialPreviewProps) {
  const categoryLabels = new Map(
    categories
      .filter((category) => category.publicationStatus === "approved")
      .map((category) => [category.id, category.label]),
  );
  const approvedArticles = [...articles]
    .filter((article) => article.publicationStatus === "approved")
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
            className="inline-flex min-h-11 shrink-0 items-center self-start md:self-auto"
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
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {approvedArticles.map((article) => (
              <li
                className="relative isolate min-h-80 overflow-hidden rounded-card border border-white/20 bg-navy-secondary"
                key={article.id}
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
                <div className="flex min-h-80 flex-col justify-end p-5">
                  <span className="mb-3 w-fit rounded-pill bg-accent-orange px-3 py-1 text-xs font-semibold text-brand-navy">
                    {categoryLabels.get(article.categoryId)}
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
              </li>
            ))}
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
