import type { Metadata } from "next";

import {
  AboutHero,
  OperationalExcellence,
  ServiceNetwork,
  VisionMissionValues,
  WhyKaliteFilo,
} from "@/components/about";
import { EditorialPreview } from "@/components/home";
import { ConversionBanner, PageHeader } from "@/components/layout";
import { getPublicStaticRoute } from "@/config/public-navigation";
import {
  aboutPageContent,
  articleCategories,
  articles,
  homePageCopy,
} from "@/data";
import { createStaticRouteMetadata } from "@/lib/route-metadata";

const homeRoute = getPublicStaticRoute("home");
const route = getPublicStaticRoute("about");
const quoteRoute = getPublicStaticRoute("quote");
const fleetGuideRoute = getPublicStaticRoute("fleet-guide");
const editorialArticleIds = new Set<string>(
  aboutPageContent.editorial.articleIds,
);
const aboutArticles = articles.filter((article) =>
  editorialArticleIds.has(article.id),
);

export const metadata: Metadata = {
  ...createStaticRouteMetadata(route.id),
  description: aboutPageContent.metadata.description,
  title: route.label,
};

export default function AboutPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1"
      data-content-status={aboutPageContent.publicationStatus}
    >
      <PageHeader
        breadcrumbs={[
          { href: homeRoute.path, label: homeRoute.label },
          { label: route.label },
        ]}
        title={route.label}
      />
      <AboutHero content={aboutPageContent.hero} />
      <VisionMissionValues content={aboutPageContent.visionMissionValues} />
      <OperationalExcellence content={aboutPageContent.operational} />
      <ServiceNetwork content={aboutPageContent.network} />
      <WhyKaliteFilo content={aboutPageContent.why} />
      <ConversionBanner
        actionHref={quoteRoute.path}
        actionLabel={homePageCopy.conversion.action.label}
        description={homePageCopy.conversion.body}
        eyebrow={homePageCopy.conversion.eyebrow}
        title={homePageCopy.conversion.title}
      />
      <EditorialPreview
        articles={aboutArticles}
        categories={articleCategories}
        columns={3}
        content={aboutPageContent.editorial}
        fleetGuideHref={fleetGuideRoute.path}
      />
    </main>
  );
}
