import type { Metadata } from "next";
import { Suspense } from "react";

import { NewsletterPreview } from "@/components/home";
import { PageContainer, Section } from "@/components/layout";
import { ConversionBanner } from "@/components/layout/conversion-banner";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleCatalogueStaticFallback } from "@/components/vehicles/vehicle-catalogue-static-fallback";
import { VehicleQueryState } from "@/components/vehicles/vehicle-query-state";
import { getPublicStaticRoute } from "@/config/public-navigation";
import { homePageCopy, vehiclePortfolio } from "@/data";
import { createStaticRouteMetadata } from "@/lib/route-metadata";

const homeRoute = getPublicStaticRoute("home");
const route = getPublicStaticRoute("vehicles");
const quoteRoute = getPublicStaticRoute("quote");

export const metadata: Metadata = {
  ...createStaticRouteMetadata(route.id),
  title: route.label,
};

export default function VehiclesPage() {
  return (
    <main
      className="flex-1"
      data-content-status="owner-supplied"
      id="main-content"
      tabIndex={-1}
    >
      <PageHeader
        breadcrumbs={[
          { href: homeRoute.path, label: homeRoute.label },
          { label: route.label },
        ]}
        intro="Portföydeki araç kayıtlarını marka, model ve teknik özelliklere göre inceleyin."
        title="Uzun Dönem Kiralık Araçlar"
        variant="high-emphasis"
      />
      <Section
        aria-label="Araç portföyü"
        className="pb-12 md:pb-16"
        spacing="none"
        surface="page"
      >
        <PageContainer>
          <Suspense
            fallback={
              <VehicleCatalogueStaticFallback
                records={vehiclePortfolio}
              />
            }
          >
            <VehicleQueryState records={vehiclePortfolio} />
          </Suspense>
        </PageContainer>
      </Section>
      <ConversionBanner
        actionHref={quoteRoute.path}
        actionLabel={homePageCopy.conversion.action.label}
        description={homePageCopy.conversion.body}
        eyebrow={homePageCopy.conversion.eyebrow}
        headingId="vehicle-conversion-title"
        title={homePageCopy.conversion.title}
      />
      <NewsletterPreview />
    </main>
  );
}
