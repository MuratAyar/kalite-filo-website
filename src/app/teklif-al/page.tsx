import type { Metadata } from "next";

import { QuoteForm, QuoteSidebar } from "@/components/forms";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { getPublicStaticRoute } from "@/config/public-navigation";
import { articleCategories, articles } from "@/data";
import { createStaticRouteMetadata } from "@/lib/route-metadata";

const homeRoute = getPublicStaticRoute("home");
const route = getPublicStaticRoute("quote");

export const metadata: Metadata = {
  ...createStaticRouteMetadata(route.id),
  title: route.label,
};

export default function QuotePage() {
  const relatedArticle = articles.find(
    (article) => article.publicationStatus === "approved" && article.coverImage,
  );
  const relatedCategory = relatedArticle
    ? articleCategories.find((category) => category.id === relatedArticle.categoryId)
    : undefined;

  if (!relatedArticle || !relatedCategory) {
    throw new Error("Teklif sayfası için doğrulanmış bir Filo Rehberi kartı bulunamadı.");
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      <PageHeader
        breadcrumbs={[
          { href: homeRoute.path, label: homeRoute.label },
          { label: route.label },
        ]}
        title="Araç Fiyat Teklif Formu"
        variant="high-emphasis"
      />
      <Section className="pt-4 md:pt-8" spacing="default" surface="page">
        <PageContainer>
          <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-16">
            <QuoteForm />
            <QuoteSidebar article={relatedArticle} category={relatedCategory} />
          </div>
        </PageContainer>
      </Section>
    </main>
  );
}
