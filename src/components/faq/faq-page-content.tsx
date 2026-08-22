import type { FaqCategory, FaqEntry, InternalPath } from "@/types";

import { PageContainer, Section } from "@/components/layout";
import { ActionLink } from "@/components/ui";
import { FaqCategoryFilter } from "./faq-category-filter";

export type FaqPageContentProps = {
  categories: readonly FaqCategory[];
  contactHref: InternalPath;
  entries: readonly FaqEntry[];
};

export function FaqPageContent({
  categories,
  contactHref,
  entries,
}: FaqPageContentProps) {
  const approvedCategories = categories.filter(
    (category) => category.publicationStatus === "approved",
  );
  const approvedEntries = [...entries]
    .filter((entry) => entry.publicationStatus === "approved")
    .sort((left, right) => left.order - right.order);
  return (
    <Section
      aria-labelledby="faq-list-title"
      className="pt-4 md:pt-8"
      surface="page"
    >
      <PageContainer className="max-w-6xl">
        <h2 className="sr-only" id="faq-list-title">
          Soru ve cevaplar
        </h2>

        <FaqCategoryFilter
          categories={approvedCategories}
          entries={approvedEntries}
        />

        <aside
          className="mt-16 rounded-panel bg-brand-navy px-6 py-8 text-text-inverse md:flex md:items-center md:justify-between md:gap-8 md:px-10 md:py-10"
          data-faq-contact="true"
        >
          <div>
            <h2 className="text-heading-lg font-semibold text-balance">
              Aradığınız cevabı bulamadınız mı?
            </h2>
            <p className="mt-3 max-w-2xl text-body-lg text-text-inverse-muted">
              Sorunuz için iletişim sayfasından bize ulaşabilirsiniz.
            </p>
          </div>
          <ActionLink
            className="mt-6 md:mt-0"
            href={contactHref}
            size="primary"
            variant="primary"
          >
            İletişime Geçin
            <span aria-hidden="true">→</span>
          </ActionLink>
        </aside>
      </PageContainer>
    </Section>
  );
}
