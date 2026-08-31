import type { MediaAsset } from "./media";
import type { EntityId, HttpsUrl, Slug } from "./primitives";

export type VehiclePortfolioPriority = "A" | "B";
export type VehiclePortfolioConfidence =
  | "high"
  | "medium-high"
  | "review-required";

export interface VehicleImageLicense {
  readonly creator: string;
  readonly sourcePage: HttpsUrl;
  readonly licenseName: string;
  readonly licenseUrl: HttpsUrl;
  readonly localDerivativeNote: string;
}

/** Owner-approved monthly list-net price sourced from the supplied workbook. */
export interface VehiclePortfolioListPrice {
  readonly amountMinor: number;
  readonly currency: "TRY";
  readonly billingPeriod: "month";
  readonly vatTreatment: "excluded";
  readonly sourceKind: "recommended-list-net";
}

/**
 * Owner-supplied catalogue identity. This remains separate from VehicleOffer:
 * validity, availability, service scope and final offer terms are unresolved.
 */
export interface VehiclePortfolioRecord {
  readonly id: EntityId;
  readonly sourceId: string;
  readonly contentStatus: "owner-supplied";
  readonly sourceStatus: "active";
  readonly priority: VehiclePortfolioPriority;
  readonly featured: boolean;
  /** Explicit one-based homepage order; absent for non-featured vehicles. */
  readonly featuredOrder?: number;
  readonly make: string;
  readonly model: string;
  readonly trim: string;
  readonly modelYearLabel: string;
  readonly categoryLabel: string;
  readonly segmentLabel: string;
  readonly fuelLabel: string;
  readonly transmissionLabel: string;
  readonly powerHp: number | null;
  readonly seats: number | null;
  readonly slug: Slug;
  readonly summary: string;
  readonly featureLabels: readonly string[];
  readonly dataConfidence: VehiclePortfolioConfidence;
  readonly editorialReviewRequired: boolean;
  readonly priceStatus: "owner-approved-list-net";
  readonly listPrice: VehiclePortfolioListPrice;
  readonly coverImage?: MediaAsset;
  readonly imageLicense?: VehicleImageLicense;
}
