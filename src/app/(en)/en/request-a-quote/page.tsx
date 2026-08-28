import type { Metadata } from "next";

import { QuoteForm, QuoteSidebar } from "@/components/forms";
import { PageContainer, PageHeader, Section } from "@/components/layout";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";
import { englishArticleCategories, englishArticles } from "@/data";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Tell Kalite Filo about your vehicle, mileage and lease-term requirements to request a corporate or individual long-term leasing quotation.",
  alternates: { canonical: "/en/request-a-quote/", languages: { en: "/en/request-a-quote/", tr: "/teklif-al/", "x-default": "/teklif-al/" } },
  robots: createTranslatedRouteRobots("quote"),
};

export default function EnglishQuotePage() {
  const article = englishArticles.find((item) => item.publicationStatus === "approved" && item.coverImage);
  const category = article ? englishArticleCategories.find((item) => item.id === article.categoryId) : undefined;
  if (!article || !category) throw new Error("An approved English Fleet Guide card is required for the quotation page.");
  return <main className="flex-1" id="main-content" tabIndex={-1}>
    <PageHeader breadcrumbs={[{ href: "/en/", label: "Home" }, { label: "Request a Quote" }]} breadcrumbsAriaLabel="Breadcrumb" title="Vehicle Quotation Form" variant="high-emphasis" />
    <Section className="pt-4 md:pt-8" spacing="default" surface="page"><PageContainer><div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-16"><QuoteForm locale="en" /><QuoteSidebar article={article} category={category} locale="en" /></div></PageContainer></Section>
  </main>;
}
