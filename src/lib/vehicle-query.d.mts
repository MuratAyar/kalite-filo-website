export interface VehicleQueryFilters {
  readonly make?: string;
  readonly model?: string;
}

export interface VehicleQueryRecord {
  readonly make: string;
  readonly model: string;
}

export interface SearchParamsReader {
  get(name: string): string | null;
}

export function normalizeVehicleQueryValue(
  value: unknown,
): string | undefined;

export function readVehicleQueryFilters(
  searchParams: SearchParamsReader,
): Readonly<VehicleQueryFilters>;

export function filterVehicleRecords<T extends VehicleQueryRecord>(
  records: readonly T[],
  filters: VehicleQueryFilters,
): T[];
