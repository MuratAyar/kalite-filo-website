import type { Metadata } from "next";

import { CommercialRentalSection, EditorialPreview, FeaturedVehicles, FleetSolutions, HomeHero, NewsletterPreview, WhyKaliteFilo } from "@/components/home";
import { ConversionBanner } from "@/components/layout";
import { ENGLISH_STATIC_PATHS } from "@/config/localized-routes";
import { englishArticleCategories, englishArticles, englishHomePageCopy, englishVehiclePortfolio } from "@/data";
import { asInternalPath } from "@/lib";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";

export const metadata: Metadata = {
  title: "Corporate Fleet Leasing",
  description:
    "Explore Kalite Filo vehicle options and start planning a corporate fleet leasing request.",
  alternates: {
    canonical: ENGLISH_STATIC_PATHS.home,
    languages: { en: ENGLISH_STATIC_PATHS.home, tr: "/", "x-default": "/" },
  },
  robots: createTranslatedRouteRobots("home"),
};

const vehiclesPath = asInternalPath(ENGLISH_STATIC_PATHS.vehicles, "English vehicles path");
const quotePath = asInternalPath(ENGLISH_STATIC_PATHS.quote, "English quote path");

export default function EnglishHomePage() {
  return (
    <main className="max-w-full flex-1 overflow-x-clip" data-content-status="draft" id="main-content" tabIndex={-1}>
      <HomeHero content={englishHomePageCopy.hero} locale="en" quoteHref={quotePath} vehicles={englishVehiclePortfolio} vehiclesHref={vehiclesPath} />
      <FeaturedVehicles content={englishHomePageCopy.featuredVehicles} locale="en" vehicles={englishVehiclePortfolio} vehiclesHref={vehiclesPath} />
      <CommercialRentalSection actionHref="/en/vehicles/?category=Commercial%20Vehicle" content={englishHomePageCopy.commercial} imageAlt="Representative commercial fleet vehicle" />
      <WhyKaliteFilo content={englishHomePageCopy.why} imageAlt="A representative view of coordinated fleet planning" />
      <FleetSolutions content={englishHomePageCopy.solutions} quoteHref={quotePath} vehiclesHref={vehiclesPath} />
      <ConversionBanner actionHref={quotePath} actionLabel={englishHomePageCopy.conversion.action.label} description={englishHomePageCopy.conversion.body} eyebrow={englishHomePageCopy.conversion.eyebrow} title={englishHomePageCopy.conversion.title} />
      <EditorialPreview articles={englishArticles} categories={englishArticleCategories} content={englishHomePageCopy.editorial} fleetGuideHref={asInternalPath(ENGLISH_STATIC_PATHS.fleetGuide, "English Fleet Guide path")} locale="en" />
      <NewsletterPreview locale="en" />
    </main>
  );
}
