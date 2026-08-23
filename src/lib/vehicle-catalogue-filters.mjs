import { normalizeVehicleQueryValue } from "./vehicle-query.mjs";

export const VEHICLE_CATEGORY_OPTIONS = Object.freeze([
  Object.freeze({ label: "Tüm Araçlar", value: "" }),
  Object.freeze({ label: "Binek", value: "Binek" }),
  Object.freeze({ label: "SUV", value: "SUV" }),
  Object.freeze({ label: "Ticari Araçlar", value: "Ticari" }),
]);

export const VEHICLE_FUEL_OPTIONS = Object.freeze([
  "Benzin",
  "Dizel",
  "Hybrid",
  "Elektrik",
]);

export const VEHICLE_TRANSMISSION_OPTIONS = Object.freeze([
  "Otomatik",
  "Yarı Otomatik",
  "Manuel",
]);

export const VEHICLE_SORT_OPTIONS = Object.freeze([
  Object.freeze({ label: "Fiyat Artan", value: "fiyat-artan" }),
  Object.freeze({ label: "Fiyat Azalan", value: "fiyat-azalan" }),
]);

const QUERY_KEYS = Object.freeze({
  category: "kategori",
  make: "marka",
  model: "model",
  fuel: "yakit",
  segment: "segment",
  transmission: "vites",
  sort: "sirala",
});

function foldLabel(value) {
  return normalizeVehicleQueryValue(value)?.toLocaleLowerCase("tr-TR") ?? "";
}

function getCanonicalValue(values, candidate) {
  const foldedCandidate = foldLabel(candidate);

  if (!foldedCandidate) {
    return undefined;
  }

  return values.find((value) => foldLabel(value) === foldedCandidate);
}

function uniqueSortedLabels(values) {
  const labelsByFoldedValue = new Map();

  for (const candidate of values) {
    const value = normalizeVehicleQueryValue(candidate);

    if (value) {
      labelsByFoldedValue.set(foldLabel(value), value);
    }
  }

  return Object.freeze(
    [...labelsByFoldedValue.values()].sort((left, right) =>
      left.localeCompare(right, "tr-TR"),
    ),
  );
}

export function getVehicleFuelGroup(fuelLabel) {
  const value = foldLabel(fuelLabel);

  if (value.includes("hybrid")) {
    return "Hybrid";
  }

  if (value.includes("elektrik")) {
    return "Elektrik";
  }

  if (value.includes("dizel")) {
    return "Dizel";
  }

  if (value.includes("benzin")) {
    return "Benzin";
  }

  return undefined;
}

export function getVehicleTransmissionGroup(transmissionLabel) {
  const value = foldLabel(transmissionLabel);

  if (value.includes("manuel")) {
    return "Manuel";
  }

  if (
    value.includes("dct") ||
    value.includes("dsg") ||
    value.includes("edc") ||
    value.includes("edcs")
  ) {
    return "Yarı Otomatik";
  }

  if (
    value.includes("otomatik") ||
    value.includes("cvt") ||
    value.includes("x-tronic") ||
    value.includes("steptronic")
  ) {
    return "Otomatik";
  }

  return undefined;
}

/** Read only the approved vehicle-catalogue query keys. */
export function readVehicleCatalogueQueryFilters(searchParams) {
  return Object.freeze({
    category: normalizeVehicleQueryValue(
      searchParams.get(QUERY_KEYS.category),
    ),
    make: normalizeVehicleQueryValue(searchParams.get(QUERY_KEYS.make)),
    model: normalizeVehicleQueryValue(searchParams.get(QUERY_KEYS.model)),
    fuel: normalizeVehicleQueryValue(searchParams.get(QUERY_KEYS.fuel)),
    segment: normalizeVehicleQueryValue(searchParams.get(QUERY_KEYS.segment)),
    transmission: normalizeVehicleQueryValue(
      searchParams.get(QUERY_KEYS.transmission),
    ),
    sort: normalizeVehicleQueryValue(searchParams.get(QUERY_KEYS.sort)),
  });
}

/**
 * Canonicalize filters against the owner-supplied catalogue. Unknown values
 * are discarded, and a model is valid only beneath its selected make.
 */
export function normalizeVehicleCatalogueFilters(records, candidate = {}) {
  const category = getCanonicalValue(
    VEHICLE_CATEGORY_OPTIONS.map((option) => option.value).filter(Boolean),
    candidate.category,
  );
  const makes = uniqueSortedLabels(records.map((record) => record.make));
  const make = getCanonicalValue(makes, candidate.make);
  const models = make
    ? uniqueSortedLabels(
        records
          .filter((record) => foldLabel(record.make) === foldLabel(make))
          .map((record) => record.model),
      )
    : Object.freeze([]);
  const model = make
    ? getCanonicalValue(models, candidate.model)
    : undefined;
  const fuel = getCanonicalValue(VEHICLE_FUEL_OPTIONS, candidate.fuel);
  const segments = uniqueSortedLabels(
    records.map((record) => record.segmentLabel),
  );
  const segment = getCanonicalValue(segments, candidate.segment);
  const transmission = getCanonicalValue(
    VEHICLE_TRANSMISSION_OPTIONS,
    candidate.transmission,
  );
  const sort = getCanonicalValue(
    VEHICLE_SORT_OPTIONS.map((option) => option.value),
    candidate.sort,
  );

  return Object.freeze({
    ...(category ? { category } : {}),
    ...(make ? { make } : {}),
    ...(model ? { model } : {}),
    ...(fuel ? { fuel } : {}),
    ...(segment ? { segment } : {}),
    ...(transmission ? { transmission } : {}),
    ...(sort ? { sort } : {}),
  });
}

export function buildVehicleCatalogueOptions(records, selectedMake) {
  const makes = uniqueSortedLabels(records.map((record) => record.make));
  const canonicalMake = getCanonicalValue(makes, selectedMake);
  const models = canonicalMake
    ? uniqueSortedLabels(
        records
          .filter(
            (record) =>
              foldLabel(record.make) === foldLabel(canonicalMake),
          )
          .map((record) => record.model),
      )
    : Object.freeze([]);

  return Object.freeze({
    makes,
    models,
    fuels: Object.freeze(
      VEHICLE_FUEL_OPTIONS.filter((option) =>
        records.some(
          (record) => getVehicleFuelGroup(record.fuelLabel) === option,
        ),
      ),
    ),
    segments: uniqueSortedLabels(records.map((record) => record.segmentLabel)),
    transmissions: Object.freeze(
      VEHICLE_TRANSMISSION_OPTIONS.filter((option) =>
        records.some(
          (record) =>
            getVehicleTransmissionGroup(record.transmissionLabel) === option,
        ),
      ),
    ),
  });
}

export function filterVehicleCatalogue(records, candidateFilters = {}) {
  const filters = normalizeVehicleCatalogueFilters(records, candidateFilters);

  const filteredRecords = records.filter((record) => {
    const categoryMatches =
      !filters.category ||
      foldLabel(record.categoryLabel) === foldLabel(filters.category);
    const makeMatches =
      !filters.make || foldLabel(record.make) === foldLabel(filters.make);
    const modelMatches =
      !filters.model || foldLabel(record.model) === foldLabel(filters.model);
    const fuelMatches =
      !filters.fuel || getVehicleFuelGroup(record.fuelLabel) === filters.fuel;
    const segmentMatches =
      !filters.segment ||
      foldLabel(record.segmentLabel) === foldLabel(filters.segment);
    const transmissionMatches =
      !filters.transmission ||
      getVehicleTransmissionGroup(record.transmissionLabel) ===
        filters.transmission;

    return (
      categoryMatches &&
      makeMatches &&
      modelMatches &&
      fuelMatches &&
      segmentMatches &&
      transmissionMatches
    );
  });

  if (!filters.sort) {
    return filteredRecords;
  }

  const direction = filters.sort === "fiyat-artan" ? 1 : -1;

  return [...filteredRecords].sort((left, right) => {
    const leftPrice = left.listPrice?.amountMinor;
    const rightPrice = right.listPrice?.amountMinor;

    if (!Number.isFinite(leftPrice) || !Number.isFinite(rightPrice)) {
      return 0;
    }

    return (leftPrice - rightPrice) * direction;
  });
}

/** Serialize only canonical, non-empty catalogue filters. */
export function serializeVehicleCatalogueFilters(candidateFilters) {
  const params = new URLSearchParams();

  for (const [filterKey, queryKey] of Object.entries(QUERY_KEYS)) {
    const value = normalizeVehicleQueryValue(candidateFilters[filterKey]);

    if (value) {
      params.set(queryKey, value);
    }
  }

  return params.toString();
}
