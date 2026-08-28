import type { Metadata } from "next";

import { FleetGuideListing } from "@/components/editorial";
import { PageContainer, PageHeader, Section } from "@/components/layout";
import { englishArticleCategories, englishArticles } from "@/data";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";

export const metadata: Metadata = {
  title: "Fleet Guide",
  description: "Professional guidance on long-term leasing, fleet cost, vehicle selection, electric vehicles, maintenance and damage management.",
  alternates: { canonical: "/en/fleet-guide/", languages: { en: "/en/fleet-guide/", tr: "/filo-rehberi/", "x-default": "/filo-rehberi/" } },
  robots: createTranslatedRouteRobots("fleet-guide"),
};

export default function EnglishFleetGuidePage() {
  return <main className="flex-1" id="main-content" tabIndex={-1}>
    <PageHeader breadcrumbs={[{ href: "/en/", label: "Home" }, { label: "Fleet Guide" }]} breadcrumbsAriaLabel="Breadcrumb" title="Fleet Guide" variant="high-emphasis" />
    <Section aria-labelledby="english-fleet-guide-title" className="pt-2 md:pt-4" surface="page"><PageContainer>
      <h2 className="sr-only" id="english-fleet-guide-title">Fleet management articles</h2>
      <FleetGuideListing articles={englishArticles} categories={englishArticleCategories} locale="en" />
    </PageContainer></Section>
  </main>;
}
