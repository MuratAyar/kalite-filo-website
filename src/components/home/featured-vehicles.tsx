import type {
  HomeFeaturedVehiclesCopy,
  InternalPath,
  VehiclePortfolioRecord,
} from "@/types";

import { PageContainer, Section, Stack } from "@/components/layout";
import { ActionLink, SectionHeading } from "@/components/ui";
import {
  VehicleCardFacts,
  getVehicleCardImage,
  VehicleListPrice,
} from "@/components/vehicles/vehicle-card-details";
import { getVehicleDetailPath } from "@/lib/paths";

export type FeaturedVehiclesProps = {
  content: HomeFeaturedVehiclesCopy;
  vehicles: readonly VehiclePortfolioRecord[];
  vehiclesHref: InternalPath;
  locale?: "en" | "tr";
};

export function FeaturedVehicles({
  content,
  vehicles,
  vehiclesHref,
  locale = "tr",
}: FeaturedVehiclesProps) {
  const featuredVehicles = vehicles
    .filter((vehicle) => vehicle.featured && vehicle.coverImage)
    .slice(0, 4);

  if (featuredVehicles.length !== 4) {
    throw new Error(
      "Home requires exactly four owner-supplied featured vehicles with rights-cleared local images.",
    );
  }

  return (
    <Section
      aria-labelledby="featured-vehicles-title"
      className="overflow-hidden"
      surface="muted"
    >
      <PageContainer>
        <Stack gap="2xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              description={content.intro}
              headingId="featured-vehicles-title"
              title={content.title}
            />
            <ActionLink
              className="featured-vehicles-action w-full sm:w-auto sm:min-w-48"
              data-featured-vehicles-action="true"
              href={vehiclesHref}
              size="primary"
              variant="outline"
            >
              {content.emptyState.action.label}
              <span aria-hidden="true">→</span>
            </ActionLink>
          </div>

          <ul className="mobile-card-track grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featuredVehicles.map((vehicle) => {
              const cardImage = getVehicleCardImage(vehicle);

              return (
                <li
                  className="mobile-half-card min-w-0"
                  data-vehicle-card={vehicle.slug}
                  data-monthly-list-net-price-try={
                    vehicle.listPrice.amountMinor / 100
                  }
                  data-vehicle-source-id={vehicle.sourceId}
                  key={vehicle.id}
                >
                  <a
                    aria-label={locale === "en" ? `View ${vehicle.make} ${vehicle.model} details` : `${vehicle.make} ${vehicle.model} araç detayını incele`}
                    className="group flex h-full flex-col overflow-hidden rounded-card border border-border-subtle bg-surface-card text-inherit no-underline shadow-[0_0.5rem_1.5rem_rgb(24_33_54_/_0.05)] transition-[border-color,box-shadow] hover:border-corporate-blue hover:shadow-[0_0.75rem_1.75rem_rgb(24_33_54_/_0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
                    data-vehicle-card-link="true"
                    href={locale === "en" ? `/en/vehicles/${vehicle.slug}/` : getVehicleDetailPath(vehicle.slug)}
                  >
                    <div
                      className="relative aspect-[4/3] overflow-hidden bg-surface-muted"
                      data-vehicle-media="true"
                    >
                      {/* Static delivery is intentional for the export-only host. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={cardImage.alt}
                        className="size-full object-cover"
                        height={cardImage.height}
                        loading="lazy"
                        src={cardImage.src}
                        width={cardImage.width}
                      />
                    </div>

                  <div className="flex flex-1 flex-col p-3 sm:p-5">
                    <h3 className="text-base font-semibold text-text-primary sm:text-xl">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="mt-1 min-h-10 text-xs text-text-secondary sm:min-h-12 sm:text-label">
                      {vehicle.trim}
                    </p>

                    <VehicleCardFacts
                      className="mt-2 border-t border-border-subtle pt-2 sm:mt-4 sm:pt-4"
                      fuelLabel={vehicle.fuelLabel}
                      transmissionLabel={vehicle.transmissionLabel}
                      locale={locale}
                    />

                    <div className="mt-auto flex flex-col gap-3 border-t border-border-subtle pt-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
                    <VehicleListPrice compactCard listPrice={vehicle.listPrice} locale={locale} />
                      <span
                        className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-control bg-accent-orange px-4 text-label font-semibold text-brand-navy transition-colors group-hover:bg-orange-dark group-focus-visible:bg-orange-dark motion-reduce:transition-none 2xl:w-auto"
                        data-vehicle-card-cta="true"
                      >
                        {locale === "en" ? "View Vehicle" : "Aracı İncele"}
                      </span>
                    </div>
                  </div>
                  </a>
                </li>
              );
            })}
          </ul>

        </Stack>
      </PageContainer>
    </Section>
  );
}
