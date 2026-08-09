import type { MediaAsset } from "./media";
import type {
  CurrencyCode,
  EntityId,
  IsoDate,
  PublicationStatus,
  Slug,
} from "./primitives";
import type { SeoMetadata } from "./seo";

export type VehicleAvailabilityStatus =
  | "available"
  | "on-request"
  | "unavailable";

export interface VehicleAvailability {
  readonly status: VehicleAvailabilityStatus;
  readonly verifiedAt: IsoDate;
}

export interface VehicleOffer {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
  readonly vatTreatment: "included" | "excluded" | "not-applicable";
  readonly billingPeriod: "month" | "total";
  readonly termMonths: number;
  readonly annualKilometres: number;
  readonly vehicleQuantity: number;
  readonly validFrom: IsoDate;
  readonly validUntil: IsoDate;
  readonly disclaimer: string;
  readonly verifiedAt: IsoDate;
}

export interface VehicleSpecification {
  readonly id: EntityId;
  readonly label: string;
  readonly value: string;
}

export interface Vehicle {
  readonly id: EntityId;
  readonly slug: Slug;
  readonly publicationStatus: PublicationStatus;
  readonly make: string;
  readonly model: string;
  readonly trim?: string;
  readonly modelYear?: number;
  readonly categoryIds: readonly EntityId[];
  readonly segmentId?: EntityId;
  readonly bodyTypeId?: EntityId;
  readonly fuelTypeId?: EntityId;
  readonly transmissionId?: EntityId;
  readonly rentalTermMonths: readonly number[];
  readonly annualKilometreOptions: readonly number[];
  readonly coverImage: MediaAsset;
  readonly galleryImages: readonly MediaAsset[];
  readonly summary: string;
  readonly specifications: readonly VehicleSpecification[];
  readonly featureLabels: readonly string[];
  readonly featured: boolean;
  readonly badgeId?: EntityId;
  readonly availability?: VehicleAvailability;
  readonly offer?: VehicleOffer;
  readonly seo: SeoMetadata;
}

