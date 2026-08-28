import type { Metadata } from "next";

import { AboutHero, OperationalExcellence, ServiceNetwork, VisionMissionValues, WhyKaliteFilo } from "@/components/about";
import { ConversionBanner, PageHeader } from "@/components/layout";
import { ENGLISH_STATIC_PATHS } from "@/config/localized-routes";
import { englishAboutPageContent, englishHomePageCopy } from "@/data";
import { asInternalPath } from "@/lib";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";

export const metadata: Metadata = {
  title: "About Us",
  description: englishAboutPageContent.metadata.description,
  alternates: { canonical: ENGLISH_STATIC_PATHS.about, languages: { en: ENGLISH_STATIC_PATHS.about, tr: "/hakkimizda/", "x-default": "/hakkimizda/" } },
  robots: createTranslatedRouteRobots("about"),
};

export default function EnglishAboutPage() {
  return (
    <main className="flex-1" data-content-status="draft" id="main-content" tabIndex={-1}>
      <PageHeader breadcrumbs={[{ href: asInternalPath("/en/", "English home"), label: "Home" }, { label: "About Us" }]} breadcrumbsAriaLabel="Breadcrumb" title="About Us" />
      <AboutHero content={englishAboutPageContent.hero} imageAlts={["Corporate vehicle facility with commercial vehicles", "Corporate vehicle travelling on an urban road"]} />
      <VisionMissionValues content={englishAboutPageContent.visionMissionValues} />
      <OperationalExcellence content={englishAboutPageContent.operational} />
      <ServiceNetwork content={englishAboutPageContent.network} imageAlt="Vehicles arranged at a corporate operations facility" />
      <WhyKaliteFilo content={englishAboutPageContent.why} />
      <ConversionBanner actionHref={asInternalPath(ENGLISH_STATIC_PATHS.quote, "English quote")} actionLabel={englishHomePageCopy.conversion.action.label} description={englishHomePageCopy.conversion.body} eyebrow={englishHomePageCopy.conversion.eyebrow} title={englishHomePageCopy.conversion.title} />
    </main>
  );
}
