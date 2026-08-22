import type { Metadata } from "next";

import { EditorialPreview } from "@/components/home";
import { PageHeader } from "@/components/layout";
import { VehicleDetail } from "@/components/vehicles/vehicle-detail";
import { getPublicStaticRoute } from "@/config/public-navigation";
import {
  articleCategories,
  articles,
  homePageCopy,
  vehiclePortfolio,
} from "@/data";
import { getVehicleDetailPath } from "@/lib/paths";
import { createFamilyRouteMetadata } from "@/lib/route-metadata";

type VehicleDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const homeRoute = getPublicStaticRoute("home");
const vehiclesRoute = getPublicStaticRoute("vehicles");
const fleetGuideRoute = getPublicStaticRoute("fleet-guide");

export const dynamicParams = false;

export function generateStaticParams() {
  return vehiclePortfolio.map((vehicle) => ({ slug: vehicle.slug }));
}

function getVehicle(slug: string) {
  const vehicle = vehiclePortfolio.find((record) => record.slug === slug);

  if (!vehicle) {
    throw new Error(`Unknown vehicle detail slug: ${slug}`);
  }

  return vehicle;
}

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicle(slug);

  return {
    ...createFamilyRouteMetadata(
      "vehicle-detail",
      getVehicleDetailPath(vehicle.slug),
    ),
    description: vehicle.summary,
    title: `${vehicle.make} ${vehicle.model}`,
  };
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { slug } = await params;
  const vehicle = getVehicle(slug);
  const relatedVehicles = vehiclePortfolio
    .filter(
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
          { href: homeRoute.path, label: homeRoute.label },
          { href: vehiclesRoute.path, label: vehiclesRoute.label },
          { label: `${vehicle.make} ${vehicle.model} ${vehicle.trim}` },
        ]}
        title={`${vehicle.make} ${vehicle.model}`}
        variant="high-emphasis"
      />
      <VehicleDetail relatedVehicles={relatedVehicles} vehicle={vehicle} />
      <EditorialPreview
        articles={articles}
        categories={articleCategories}
        content={homePageCopy.editorial}
        fleetGuideHref={fleetGuideRoute.path}
      />
    </main>
  );
}
