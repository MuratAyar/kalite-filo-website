import type { Metadata } from "next";

import { EditorialPreview } from "@/components/home";
import { PageHeader } from "@/components/layout";
import { VehicleDetail } from "@/components/vehicles/vehicle-detail";
import { ENGLISH_STATIC_PATHS } from "@/config/localized-routes";
import {
  englishArticleCategories,
  englishArticles,
  englishHomePageCopy,
  englishVehiclePortfolio,
} from "@/data";
import { asInternalPath } from "@/lib";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return englishVehiclePortfolio.map((vehicle) => ({ slug: vehicle.slug }));
}

function getVehicle(slug: string) {
  const vehicle = englishVehiclePortfolio.find((record) => record.slug === slug);
  if (!vehicle) throw new Error(`Unknown English vehicle detail slug: ${slug}`);
  return vehicle;
}

export async function generateMetadata({
  params,
}: PageProps<"/en/vehicles/[slug]">): Promise<Metadata> {
  const vehicle = getVehicle((await params).slug);
  const englishPath = `/en/vehicles/${vehicle.slug}/`;
  const turkishPath = `/arac-listesi/${vehicle.slug}/`;

  return {
    alternates: {
      canonical: englishPath,
      languages: { en: englishPath, tr: turkishPath, "x-default": turkishPath },
    },
    description: vehicle.summary,
    robots: createTranslatedRouteRobots("vehicle-detail"),
    title: `${vehicle.make} ${vehicle.model}`,
  };
}

export default async function EnglishVehicleDetailPage({
  params,
}: PageProps<"/en/vehicles/[slug]">) {
  const vehicle = getVehicle((await params).slug);
  const relatedVehicles = englishVehiclePortfolio.filter(
    (candidate) =>
      candidate.id !== vehicle.id &&
      candidate.categoryLabel === vehicle.categoryLabel,
  );

  return (
    <main
      className="flex-1"
      data-content-status="owner-supplied"
      id="main-content"
      tabIndex={-1}
    >
      <PageHeader
        breadcrumbs={[
          { href: asInternalPath(ENGLISH_STATIC_PATHS.home, "English home"), label: "Home" },
          { href: asInternalPath(ENGLISH_STATIC_PATHS.vehicles, "English vehicles"), label: "Vehicles" },
          { label: `${vehicle.make} ${vehicle.model} ${vehicle.trim}` },
        ]}
        breadcrumbsAriaLabel="Breadcrumb"
        title={`${vehicle.make} ${vehicle.model}`}
        variant="high-emphasis"
      />
      <VehicleDetail locale="en" relatedVehicles={relatedVehicles} vehicle={vehicle} />
      <EditorialPreview
        articles={englishArticles}
        categories={englishArticleCategories}
        content={englishHomePageCopy.editorial}
        fleetGuideHref={asInternalPath(ENGLISH_STATIC_PATHS.fleetGuide, "English Fleet Guide")}
        locale="en"
      />
    </main>
  );
}
