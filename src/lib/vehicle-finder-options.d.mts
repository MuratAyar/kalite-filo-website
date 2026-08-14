export interface VehicleFinderRecord {
  readonly publicationStatus?: "draft" | "approved";
  readonly contentStatus?: "owner-supplied";
  readonly make: string;
  readonly model: string;
}

export interface VehicleFinderOptionGroup {
  readonly make: string;
  readonly models: readonly string[];
}

export function buildVehicleFinderOptions(
  records: readonly VehicleFinderRecord[],
): readonly VehicleFinderOptionGroup[];

export function getModelsForSelectedMake(
  options: readonly VehicleFinderOptionGroup[],
  selectedMake: string,
): readonly string[];
