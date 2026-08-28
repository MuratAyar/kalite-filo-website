import type { Metadata } from "next";

import {
  CommercialRentalSection,
  EditorialPreview,
  FeaturedVehicles,
  FleetSolutions,
  HomeHero,
  NewsletterPreview,
  WhyKaliteFilo,
} from "@/components/home";
import { ConversionBanner } from "@/components/layout";
import { getPublicStaticRoute } from "@/config/public-navigation";
import {
  articleCategories,
  articles,
  homePageCopy,
  vehiclePortfolio,
} from "@/data";
import { createStaticRouteMetadata } from "@/lib/route-metadata";

export const metadata: Metadata = createStaticRouteMetadata("home");

const vehiclesRoute = getPublicStaticRoute("vehicles");
const fleetGuideRoute = getPublicStaticRoute("fleet-guide");
const quoteRoute = getPublicStaticRoute("quote");

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="max-w-full flex-1 overflow-x-clip"
      data-content-status={homePageCopy.publicationStatus}
    >
      <HomeHero
        content={homePageCopy.hero}
        quoteHref={quoteRoute.path}
        vehicles={vehiclePortfolio}
        vehiclesHref={vehiclesRoute.path}
      />
      <FeaturedVehicles
        content={homePageCopy.featuredVehicles}
        vehicles={vehiclePortfolio}
        vehiclesHref={vehiclesRoute.path}
      />
      <CommercialRentalSection
        actionHref="/arac-listesi/?kategori=Ticari"
        content={homePageCopy.commercial}
      />
      <WhyKaliteFilo content={homePageCopy.why} />
      <FleetSolutions
        content={homePageCopy.solutions}
        quoteHref={quoteRoute.path}
        vehiclesHref={vehiclesRoute.path}
      />
      <ConversionBanner
        actionHref={quoteRoute.path}
        actionLabel={homePageCopy.conversion.action.label}
        description={homePageCopy.conversion.body}
        eyebrow={homePageCopy.conversion.eyebrow}
        title={homePageCopy.conversion.title}
      />
      <EditorialPreview
        articles={articles}
        categories={articleCategories}
        content={homePageCopy.editorial}
        fleetGuideHref={fleetGuideRoute.path}
      />
      <NewsletterPreview />
    </main>
  );
}
