import type { Metadata } from "next";
import { Suspense } from "react";

import { NewsletterPreview } from "@/components/home";
import { ConversionBanner, PageContainer, PageHeader, Section } from "@/components/layout";
import { VehicleCatalogueStaticFallback } from "@/components/vehicles/vehicle-catalogue-static-fallback";
import { VehicleQueryState } from "@/components/vehicles/vehicle-query-state";
import { ENGLISH_STATIC_PATHS } from "@/config/localized-routes";
import { englishHomePageCopy, englishVehiclePortfolio, vehiclePortfolio } from "@/data";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";
import { asInternalPath } from "@/lib";

export const metadata: Metadata = {
  title: "Vehicles",
  description: "Explore Kalite Filo's long-term leasing vehicle portfolio.",
  alternates: { canonical: ENGLISH_STATIC_PATHS.vehicles, languages: { en: ENGLISH_STATIC_PATHS.vehicles, tr: "/arac-listesi/", "x-default": "/arac-listesi/" } },
  robots: createTranslatedRouteRobots("vehicles"),
};

export default function EnglishVehiclesPage() {
  return <main className="flex-1" data-content-status="owner-supplied" id="main-content" tabIndex={-1}>
    <PageHeader breadcrumbs={[{ href: "/en/", label: "Home" }, { label: "Vehicles" }]} breadcrumbsAriaLabel="Breadcrumb" title="Long-Term Rental Vehicles" variant="high-emphasis" />
    <Section aria-label="Vehicle portfolio" className="pb-12 md:pb-16" spacing="none" surface="page"><PageContainer>
      <Suspense fallback={<VehicleCatalogueStaticFallback displayRecords={englishVehiclePortfolio} locale="en" records={vehiclePortfolio} />}>
        <VehicleQueryState displayRecords={englishVehiclePortfolio} locale="en" records={vehiclePortfolio} />
      </Suspense>
    </PageContainer></Section>
    <ConversionBanner actionHref={asInternalPath(ENGLISH_STATIC_PATHS.quote, "English quote")} actionLabel={englishHomePageCopy.conversion.action.label} description={englishHomePageCopy.conversion.body} eyebrow={englishHomePageCopy.conversion.eyebrow} headingId="vehicle-conversion-title" title={englishHomePageCopy.conversion.title} />
    <NewsletterPreview locale="en" />
  </main>;
}
