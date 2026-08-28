import type { FaqCategory, FaqEntry, InternalPath } from "@/types";

import { PageContainer, Section } from "@/components/layout";
import { ActionLink } from "@/components/ui";
import { FaqCategoryFilter } from "./faq-category-filter";

export type FaqPageContentProps = {
  categories: readonly FaqCategory[];
  contactHref: InternalPath;
  entries: readonly FaqEntry[];
  locale?: "en" | "tr";
};

export function FaqPageContent({
  categories,
  contactHref,
  entries,
  locale = "tr",
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
          {locale === "en" ? "Questions and answers" : "Soru ve cevaplar"}
        </h2>

        <FaqCategoryFilter
          categories={approvedCategories}
          entries={approvedEntries}
          locale={locale}
        />

        <aside
          className="mt-16 rounded-panel bg-brand-navy px-6 py-8 text-text-inverse md:flex md:items-center md:justify-between md:gap-8 md:px-10 md:py-10"
          data-faq-contact="true"
        >
          <div>
            <h2 className="text-heading-lg font-semibold text-balance">
              {locale === "en" ? "Couldn’t find the answer you need?" : "Aradığınız cevabı bulamadınız mı?"}
            </h2>
            <p className="mt-3 max-w-2xl text-body-lg text-text-inverse-muted">
              {locale === "en" ? "Contact us through the contact page and let us know how we can help." : "Sorunuz için iletişim sayfasından bize ulaşabilirsiniz."}
            </p>
          </div>
          <ActionLink
            className="mt-6 md:mt-0"
            href={contactHref}
            size="primary"
            variant="primary"
          >
            {locale === "en" ? "Contact Us" : "İletişime Geçin"}
            <span aria-hidden="true">→</span>
          </ActionLink>
        </aside>
      </PageContainer>
    </Section>
  );
}
