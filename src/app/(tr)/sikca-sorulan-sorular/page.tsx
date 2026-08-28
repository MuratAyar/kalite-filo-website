import type { Metadata } from "next";

import { FaqPageContent } from "@/components/faq";
import { EditorialPreview } from "@/components/home";
import { PageHeader } from "@/components/layout/page-header";
import { getPublicStaticRoute } from "@/config/public-navigation";
import {
  articleCategories,
  articles,
  faqCategories,
  faqEntries,
  homePageCopy,
} from "@/data";
import { createStaticRouteMetadata } from "@/lib/route-metadata";

const homeRoute = getPublicStaticRoute("home");
const route = getPublicStaticRoute("faq");
const contactRoute = getPublicStaticRoute("contact");
const fleetGuideRoute = getPublicStaticRoute("fleet-guide");

export const metadata: Metadata = {
  ...createStaticRouteMetadata(route.id),
  title: route.label,
};

export default function FrequentlyAskedQuestionsPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      <PageHeader
        breadcrumbs={[
          { href: homeRoute.path, label: homeRoute.label },
          { label: route.label },
        ]}
        title={route.label}
      />
      <FaqPageContent
        categories={faqCategories}
        contactHref={contactRoute.path}
        entries={faqEntries}
      />
      <EditorialPreview
        articles={articles}
        categories={articleCategories}
        content={homePageCopy.editorial}
        fleetGuideHref={fleetGuideRoute.path}
      />
    </main>
  );
}
