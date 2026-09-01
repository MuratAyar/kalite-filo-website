import portfolioRecords from "./vehicle-portfolio.json";
import priceSource from "./vehicle-list-prices.json";
import featuredVehicleIdsSource from "./featured-vehicle-ids.json";
import vehicleMediaSource from "./vehicle-media.json";

import type {
  EntityId,
  HttpsUrl,
  LocalAssetPath,
  Slug,
  VehiclePortfolioListPrice,
  VehiclePortfolioRecord,
} from "@/types";

type PortfolioRecordSource = Omit<
  VehiclePortfolioRecord,
  "coverImage" | "id" | "imageLicense" | "listPrice" | "slug"
> & {
  readonly id: string;
  readonly slug: string;
};

type PriceSourceId = keyof typeof priceSource.amountsMinor;

const featuredVehicleIds = featuredVehicleIdsSource as readonly string[];
if (featuredVehicleIds.length !== 4 || new Set(featuredVehicleIds).size !== 4) {
  throw new Error("The featured vehicle ordering contract requires exactly four unique ids.");
}
const featuredOrderById = new Map(featuredVehicleIds.map((id, index) => [id, index + 1]));

function createListPrice(sourceId: string): VehiclePortfolioListPrice {
  const amountMinor = priceSource.amountsMinor[sourceId as PriceSourceId];

  if (!amountMinor) {
    throw new Error(`Vehicle portfolio ${sourceId} is missing its approved list price.`);
  }

  return Object.freeze({
    amountMinor,
    currency: "TRY",
    billingPeriod: "month",
    vatTreatment: "excluded",
    sourceKind: "recommended-list-net",
  });
}

type PortfolioMediaSource = {
  readonly vehicleId: string;
  readonly fileName: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly creator: string;
  readonly sourcePage: string;
  readonly licenseName: string;
  readonly licenseUrl: string;
  readonly localDerivativeNote: string;
  readonly checksum: string;
};

const portfolioMedia = new Map(
  (vehicleMediaSource.records as readonly PortfolioMediaSource[]).map((media) => [
    media.vehicleId,
    Object.freeze({
      image: Object.freeze({
        purpose: "informative" as const,
        src: `/images/vehicles/${media.fileName}` as LocalAssetPath,
        width: media.width,
        height: media.height,
        alt: media.alt,
      }),
      license: Object.freeze({
        creator: media.creator,
        sourcePage: media.sourcePage as HttpsUrl,
        licenseName: media.licenseName,
        licenseUrl: media.licenseUrl as HttpsUrl,
        localDerivativeNote: media.localDerivativeNote,
      }),
    }),
  ]),
);

if (vehicleMediaSource.schemaVersion !== 1 || portfolioMedia.size !== vehicleMediaSource.records.length) {
  throw new Error("Vehicle media contract is invalid or contains duplicate vehicle ids.");
}

export const vehiclePortfolio: readonly VehiclePortfolioRecord[] = Object.freeze(
  (portfolioRecords as readonly PortfolioRecordSource[]).map((record) => {
    const media = portfolioMedia.get(record.id);
    const featuredOrder = featuredOrderById.get(record.id);

    return Object.freeze({
      ...record,
      id: record.id as EntityId,
      slug: record.slug as Slug,
      priceStatus: "owner-approved-list-net",
      featured: featuredOrder !== undefined,
      ...(featuredOrder !== undefined ? { featuredOrder } : {}),
      listPrice: createListPrice(record.sourceId),
      featureLabels: Object.freeze([...record.featureLabels]),
      ...(media
        ? { coverImage: media.image, imageLicense: media.license }
        : {}),
    });
  }),
);

if (featuredVehicleIds.some((id) => !vehiclePortfolio.some((vehicle) => vehicle.id === id))) {
  throw new Error("The featured vehicle ordering contract references an unknown vehicle id.");
}
