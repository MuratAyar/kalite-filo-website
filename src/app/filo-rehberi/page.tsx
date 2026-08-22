import type { Metadata } from "next";

import { FleetGuideListing } from "@/components/editorial";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer, Section } from "@/components/layout";
import { getPublicStaticRoute } from "@/config/public-navigation";
import { articleCategories, articles } from "@/data";
import { createStaticRouteMetadata } from "@/lib/route-metadata";

const homeRoute = getPublicStaticRoute("home");
const route = getPublicStaticRoute("fleet-guide");

export const metadata: Metadata = {
  ...createStaticRouteMetadata(route.id),
  title: route.label,
};

export default function FleetGuidePage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      <PageHeader
        breadcrumbs={[
          { href: homeRoute.path, label: homeRoute.label },
          { label: route.label },
        ]}
        intro="Kurumsal araç kiralama ve filo yönetimi içerikleri."
        title={route.label}
        variant="high-emphasis"
      />
      <Section
        aria-labelledby="fleet-guide-content-title"
        className="pt-2 md:pt-4"
        surface="page"
      >
        <PageContainer>
          <h2 className="sr-only" id="fleet-guide-content-title">
            Filo Rehberi içerikleri
          </h2>
          <FleetGuideListing
            articles={articles}
            categories={articleCategories}
          />
        </PageContainer>
      </Section>
    </main>
  );
}
