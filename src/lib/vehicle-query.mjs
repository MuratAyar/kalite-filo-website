const QUERY_VALUE_MAX_LENGTH = 80;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;

/**
 * Convert a user-entered vehicle query value into safe, displayable text.
 * React still owns HTML escaping; this helper only normalizes the filter value.
 */
export function normalizeVehicleQueryValue(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value
    .normalize("NFKC")
    .replace(CONTROL_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, QUERY_VALUE_MAX_LENGTH)
    .trim();

  return normalized || undefined;
}

/** Read only the approved query keys from a URLSearchParams-compatible value. */
export function readVehicleQueryFilters(searchParams) {
  return Object.freeze({
    make: normalizeVehicleQueryValue(searchParams.get("marka")),
    model: normalizeVehicleQueryValue(searchParams.get("model")),
  });
}

function foldVehicleQueryValue(value) {
  return normalizeVehicleQueryValue(value)?.toLocaleLowerCase("tr-TR") ?? "";
}

/**
 * Dependency-free filtering for the future verified vehicle collection.
 * No records are seeded by this helper.
 */
export function filterVehicleRecords(records, filters) {
  const makeQuery = foldVehicleQueryValue(filters.make);
  const modelQuery = foldVehicleQueryValue(filters.model);

  if (!makeQuery && !modelQuery) {
    return [...records];
  }

  return records.filter((record) => {
    const makeMatches =
      !makeQuery || foldVehicleQueryValue(record.make).includes(makeQuery);
    const modelMatches =
      !modelQuery || foldVehicleQueryValue(record.model).includes(modelQuery);

    return makeMatches && modelMatches;
  });
}
