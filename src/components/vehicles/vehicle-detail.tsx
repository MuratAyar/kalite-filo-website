import type { VehiclePortfolioRecord } from "@/types";

import { PageContainer, Section } from "@/components/layout";
import { getVehicleDetailPath } from "@/lib/paths";

import {
  getVehicleCardImage,
  VehicleCardFacts,
  VehicleListPrice,
} from "./vehicle-card-details";
import { RelatedVehicleCarouselControls } from "./related-vehicle-carousel-controls";
import { VehicleOfferControls } from "./vehicle-offer-controls";

export type VehicleDetailProps = {
  relatedVehicles: readonly VehiclePortfolioRecord[];
  vehicle: VehiclePortfolioRecord;
};

type TechnicalSpecification = readonly [label: string, value: string];

function getAdditionalTechnicalSpecifications(
  featureLabels: readonly string[],
): readonly TechnicalSpecification[] {
  const specifications = new Map<string, string>();

  for (const feature of featureLabels) {
    const luggageVolume = feature.match(/^(\d+(?:[.,]\d+)?)\s*L bagaj$/i);
    if (luggageVolume) {
      specifications.set("Bagaj hacmi", `${luggageVolume[1]} L`);
      continue;
    }

    const loadVolume = feature.match(/(\d+(?:[.,]\d+)?)\s*m³/i);
    if (loadVolume && feature.toLocaleLowerCase("tr-TR").includes("yük")) {
      const approximate = /^Yaklaşık\b/i.test(feature) ? "Yaklaşık " : "";
      const upperLimit = /kadar/i.test(feature) ? "'e kadar" : "";
      specifications.set(
        "Yük hacmi",
        `${approximate}${loadVolume[1]} m³${upperLimit}`,
      );
      continue;
    }

    const torque = feature.match(/(?:^|\/\s*)(\d+)\s*Nm$/i);
    if (torque) {
      specifications.set("Tork", `${torque[1]} Nm`);
      continue;
    }

    const wltpRange = feature.match(/^(\d+)\s*km WLTP$/i);
    if (wltpRange) {
      specifications.set("WLTP menzili", `${wltpRange[1]} km`);
      continue;
    }

    const batteryCapacity = feature.match(
      /^(\d+(?:[.,]\d+)?)\s*kWh batarya$/i,
    );
    if (batteryCapacity) {
      specifications.set(
        "Batarya kapasitesi",
        `${batteryCapacity[1]} kWh`,
      );
      continue;
    }

    const energyConsumption = feature.match(
      /^(\d+(?:[.,]\d+)?)\s*kWh\/100 km$/i,
    );
    if (energyConsumption) {
      specifications.set(
        "Enerji tüketimi",
        `${energyConsumption[1]} kWh/100 km`,
      );
      continue;
    }

    const fuelConsumption = feature.match(
      /^(\d+(?:[.,]\d+)?)\s*L\/100 km(?: civarı WLTP)?$/i,
    );
    if (fuelConsumption) {
      specifications.set(
        "Yakıt tüketimi",
        `${fuelConsumption[1]} L/100 km`,
      );
      continue;
    }

    if (/^RWD$/i.test(feature)) {
      specifications.set("Çekiş sistemi", "Arkadan çekiş (RWD)");
      continue;
    }

    if (/^Arkadan çekiş$/i.test(feature)) {
      specifications.set("Çekiş sistemi", "Arkadan çekiş");
    }
  }

  return [...specifications.entries()];
}

function VehicleMedia({
  eager = false,
  vehicle,
}: {
  eager?: boolean;
  vehicle: VehiclePortfolioRecord;
}) {
  if (!vehicle.coverImage) {
    return (
      <div
        aria-label={`${vehicle.make} ${vehicle.model} için doğrulanmış araç görseli mevcut değil`}
        className="flex aspect-[16/10] size-full items-center justify-center bg-[linear-gradient(145deg,#f2f4f6,#e6e8ec)] px-6 text-center text-body text-text-secondary"
        role="img"
      >
        Doğrulanmış araç görseli mevcut değil
      </div>
    );
  }

  return (
    // Static delivery is intentional for the export-only production host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={vehicle.coverImage.alt}
      className="aspect-[16/10] size-full object-cover"
      height={vehicle.coverImage.height}
      loading={eager ? "eager" : "lazy"}
      src={vehicle.coverImage.src}
      width={vehicle.coverImage.width}
    />
  );
}

function RelatedVehicleCard({ vehicle }: { vehicle: VehiclePortfolioRecord }) {
  const cardImage = getVehicleCardImage(vehicle);

  return (
    <article className="h-full min-w-0" data-related-vehicle={vehicle.slug}>
      <a
        aria-label={`${vehicle.make} ${vehicle.model} araç detayını incele`}
        className="group flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-border-subtle bg-surface-card text-inherit no-underline shadow-[0_0.5rem_1.5rem_rgb(24_33_54_/_0.06)] transition-[border-color,box-shadow] hover:border-corporate-blue hover:shadow-[0_0.75rem_1.75rem_rgb(24_33_54_/_0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
        href={getVehicleDetailPath(vehicle.slug)}
      >
        <div className="overflow-hidden bg-surface-muted" data-vehicle-media="true">
          {/* Static card derivatives avoid delivering the larger detail image here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={cardImage.alt}
            className="aspect-[16/10] size-full object-cover"
            decoding="async"
            height={cardImage.height}
            loading="lazy"
            src={cardImage.src}
            width={cardImage.width}
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-xl font-semibold leading-tight text-text-primary">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="mt-2 text-label leading-5 text-text-secondary">
            {vehicle.trim}
          </p>
          <VehicleCardFacts
            className="mt-5 border-t border-border-subtle pt-4"
            fuelLabel={vehicle.fuelLabel}
            transmissionLabel={vehicle.transmissionLabel}
          />
          <div className="mt-auto border-t border-border-subtle pt-5">
            <VehicleListPrice listPrice={vehicle.listPrice} />
            <span className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-control bg-accent-orange px-4 text-label font-semibold text-brand-navy transition-colors group-hover:bg-orange-dark group-focus-visible:bg-orange-dark motion-reduce:transition-none">
              Aracı İncele
            </span>
          </div>
        </div>
      </a>
    </article>
  );
}

export function VehicleDetail({
  relatedVehicles,
  vehicle,
}: VehicleDetailProps) {
  const specifications = [
    ["Model yılı", vehicle.modelYearLabel],
    ["Kategori", vehicle.categoryLabel],
    ["Segment ve gövde", vehicle.segmentLabel],
    ["Yakıt tipi", vehicle.fuelLabel],
    ["Vites tipi", vehicle.transmissionLabel],
    ...(vehicle.powerHp ? [["Motor gücü", `${vehicle.powerHp} HP`]] : []),
    ...(vehicle.seats ? [["Koltuk sayısı", `${vehicle.seats}`]] : []),
    ...getAdditionalTechnicalSpecifications(vehicle.featureLabels),
  ] as const;

  if (relatedVehicles.length < 4) {
    throw new Error("Vehicle detail pages require at least four related vehicles.");
  }

  return (
    <>
      <Section
        aria-label={`${vehicle.make} ${vehicle.model} araç bilgileri`}
        className="pb-10 pt-0 md:pb-12"
        data-vehicle-detail={vehicle.slug}
        spacing="none"
        surface="page"
      >
        <PageContainer>
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,0.85fr)] lg:items-start lg:gap-8">
            <div className="min-w-0 space-y-6">
              <figure className="overflow-hidden rounded-panel border border-border-subtle bg-surface-card p-3 shadow-[0_0.5rem_1.5rem_rgb(24_33_54_/_0.06)] sm:p-5">
                <div className="overflow-hidden rounded-card bg-surface-muted">
                  <VehicleMedia eager vehicle={vehicle} />
                </div>
                <figcaption className="px-1 pt-4 text-label text-text-secondary">
                  Araç görseli model ailesini temsil edebilir; donanım ve renk farklılık gösterebilir.
                </figcaption>
              </figure>

              <div
                className="rounded-panel border border-border-subtle bg-surface-card p-6 sm:p-8"
                data-vehicle-technical-section="true"
              >
                <h2 className="text-heading-md font-semibold text-text-primary">
                  Teknik Özellikler
                </h2>
                <dl className="mt-6 grid gap-x-8 sm:grid-cols-2">
                  {specifications.map(([label, value]) => (
                    <div
                      className="flex min-w-0 items-start justify-between gap-4 border-b border-border-subtle py-4"
                      data-vehicle-technical-specification="true"
                      key={label}
                    >
                      <dt className="text-body text-text-secondary">{label}</dt>
                      <dd className="text-right text-body font-semibold text-text-primary">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <aside
              className="rounded-panel border border-border-subtle bg-surface-card p-6 shadow-[0_0.75rem_2rem_rgb(24_33_54_/_0.08)] lg:sticky lg:top-28 sm:p-8"
              data-vehicle-offer-panel="true"
            >
              <h2 className="text-heading-md font-semibold text-text-primary">
                {vehicle.make} {vehicle.model}
              </h2>
              <p className="mt-2 text-body text-text-secondary">{vehicle.trim}</p>

              <VehicleCardFacts
                className="mt-6 border-y border-border-subtle py-5"
                fuelLabel={vehicle.fuelLabel}
                transmissionLabel={vehicle.transmissionLabel}
              />

              <VehicleOfferControls
                fuelLabel={vehicle.fuelLabel}
                image={getVehicleCardImage(vehicle)}
                listPrice={vehicle.listPrice}
                make={vehicle.make}
                model={vehicle.model}
                slug={vehicle.slug}
                transmissionLabel={vehicle.transmissionLabel}
                trim={vehicle.trim}
              />
            </aside>
          </div>
        </PageContainer>
      </Section>

      <Section
        aria-labelledby="related-vehicles-title"
        className="overflow-x-hidden py-12 [contain:paint] md:py-16"
        data-related-vehicles-section="true"
        spacing="none"
        surface="muted"
      >
        <PageContainer>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2
              className="text-heading-lg font-semibold text-text-primary"
              id="related-vehicles-title"
            >
              İlginizi Çekebilecek Diğer Araçlar
            </h2>
            <RelatedVehicleCarouselControls trackId="related-vehicles-track" />
          </div>

          <ul
            className="mt-8 flex max-w-full min-w-0 snap-x snap-mandatory scroll-smooth gap-5 overflow-x-auto [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
            data-related-vehicles-track="true"
            id="related-vehicles-track"
          >
            {relatedVehicles.map((relatedVehicle) => (
              <li
                className="w-[86%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] xl:w-[calc((100%-3.75rem)/4)]"
                key={relatedVehicle.id}
              >
                <RelatedVehicleCard vehicle={relatedVehicle} />
              </li>
            ))}
          </ul>
        </PageContainer>
      </Section>
    </>
  );
}
