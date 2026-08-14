export type VehicleCatalogueCategory = "Binek" | "SUV" | "Ticari";
export type VehicleCatalogueFuel =
  | "Benzin"
  | "Dizel"
  | "Hybrid"
  | "Elektrik";
export type VehicleCatalogueTransmission =
  | "Otomatik"
  | "Yarı Otomatik"
  | "Manuel";

export interface VehicleCatalogueFilterRecord {
  readonly make: string;
  readonly model: string;
  readonly categoryLabel: string;
  readonly fuelLabel: string;
  readonly segmentLabel: string;
  readonly transmissionLabel: string;
}

export interface VehicleCatalogueFilters {
  readonly category?: VehicleCatalogueCategory;
  readonly make?: string;
  readonly model?: string;
  readonly fuel?: VehicleCatalogueFuel;
  readonly segment?: string;
  readonly transmission?: VehicleCatalogueTransmission;
}

export interface VehicleCatalogueCandidateFilters {
  readonly category?: string;
  readonly make?: string;
  readonly model?: string;
  readonly fuel?: string;
  readonly segment?: string;
  readonly transmission?: string;
}

export interface VehicleCatalogueOptions {
  readonly makes: readonly string[];
  readonly models: readonly string[];
  readonly fuels: readonly VehicleCatalogueFuel[];
  readonly segments: readonly string[];
  readonly transmissions: readonly VehicleCatalogueTransmission[];
}

export interface SearchParamsReader {
  get(name: string): string | null;
}

export const VEHICLE_CATEGORY_OPTIONS: readonly Readonly<{
  label: string;
  value: "" | VehicleCatalogueCategory;
}>[];
export const VEHICLE_FUEL_OPTIONS: readonly VehicleCatalogueFuel[];
export const VEHICLE_TRANSMISSION_OPTIONS: readonly VehicleCatalogueTransmission[];

export function getVehicleFuelGroup(
  fuelLabel: string,
): VehicleCatalogueFuel | undefined;

export function getVehicleTransmissionGroup(
  transmissionLabel: string,
): VehicleCatalogueTransmission | undefined;

export function readVehicleCatalogueQueryFilters(
  searchParams: SearchParamsReader,
): Readonly<VehicleCatalogueCandidateFilters>;

export function normalizeVehicleCatalogueFilters(
  records: readonly VehicleCatalogueFilterRecord[],
  candidate?: VehicleCatalogueCandidateFilters,
): Readonly<VehicleCatalogueFilters>;

export function buildVehicleCatalogueOptions(
  records: readonly VehicleCatalogueFilterRecord[],
  selectedMake?: string,
): Readonly<VehicleCatalogueOptions>;

export function filterVehicleCatalogue<
  T extends VehicleCatalogueFilterRecord,
>(
  records: readonly T[],
  candidateFilters?: VehicleCatalogueCandidateFilters,
): T[];

export function serializeVehicleCatalogueFilters(
  candidateFilters: VehicleCatalogueCandidateFilters,
): string;
