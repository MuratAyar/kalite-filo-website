import type {
  CurrencyCode,
  EntityId,
  HttpsUrl,
  InternalPath,
  IsoDate,
  LocalAssetPath,
  MediaAsset,
  Slug,
} from "@/types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INTERNAL_PATH_PATTERN =
  /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
const LOCAL_ASSET_PATTERN = /^\/(?:images|icons|fonts)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;
const PLACEHOLDER_LINKS = new Set(["", "#"]);
const PROHIBITED_ROUTE_SEGMENTS = new Set([
  "admin",
  "api",
  "auth",
  "crm",
  "giris",
  "login",
  "musteri-girisi",
  "musteri-portali",
  "portal",
]);

export class ContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentValidationError";
  }
}

export function assertNonEmptyString(
  value: string,
  fieldName: string,
): void {
  if (value.trim().length === 0) {
    throw new ContentValidationError(`${fieldName} must not be empty.`);
  }
}

export function asEntityId(value: string, fieldName = "id"): EntityId {
  if (!SLUG_PATTERN.test(value)) {
    throw new ContentValidationError(
      `${fieldName} must contain lowercase ASCII letters, numbers, and single hyphens only.`,
    );
  }

  return value as EntityId;
}

export function asSlug(value: string, fieldName = "slug"): Slug {
  if (!SLUG_PATTERN.test(value)) {
    throw new ContentValidationError(
      `${fieldName} must contain lowercase ASCII letters, numbers, and single hyphens only.`,
    );
  }

  return value as Slug;
}

export function asInternalPath(
  value: string,
  fieldName = "path",
): InternalPath {
  if (PLACEHOLDER_LINKS.has(value)) {
    throw new ContentValidationError(`${fieldName} is a placeholder link.`);
  }

  if (!INTERNAL_PATH_PATTERN.test(value)) {
    throw new ContentValidationError(
      `${fieldName} must be a lowercase, ASCII, root-relative path with a trailing slash.`,
    );
  }

  const segments = value.split("/").filter(Boolean);
  const prohibitedSegment = segments.find((segment) =>
    PROHIBITED_ROUTE_SEGMENTS.has(segment),
  );

  if (prohibitedSegment) {
    throw new ContentValidationError(
      `${fieldName} contains prohibited route segment "${prohibitedSegment}".`,
    );
  }

  return value as InternalPath;
}

export function asHttpsUrl(value: string, fieldName = "url"): HttpsUrl {
  if (PLACEHOLDER_LINKS.has(value)) {
    throw new ContentValidationError(`${fieldName} is a placeholder link.`);
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new ContentValidationError(`${fieldName} must be a valid URL.`);
  }

  if (url.protocol !== "https:" || url.username || url.password) {
    throw new ContentValidationError(
      `${fieldName} must be an HTTPS URL without embedded credentials.`,
    );
  }

  return value as HttpsUrl;
}

export function asIsoDate(value: string, fieldName = "date"): IsoDate {
  if (!ISO_DATE_PATTERN.test(value)) {
    throw new ContentValidationError(
      `${fieldName} must use the YYYY-MM-DD format.`,
    );
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new ContentValidationError(`${fieldName} must be a real calendar date.`);
  }

  return value as IsoDate;
}

export function asCurrencyCode(
  value: string,
  fieldName = "currency",
): CurrencyCode {
  if (!CURRENCY_CODE_PATTERN.test(value)) {
    throw new ContentValidationError(
      `${fieldName} must be a three-letter uppercase ISO currency code.`,
    );
  }

  return value as CurrencyCode;
}

export function asLocalAssetPath(
  value: string,
  fieldName = "asset path",
): LocalAssetPath {
  if (
    !LOCAL_ASSET_PATTERN.test(value) ||
    value.includes("//") ||
    value.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new ContentValidationError(
      `${fieldName} must point to a local file below /images, /icons, or /fonts.`,
    );
  }

  return value as LocalAssetPath;
}

export function assertMediaAsset(asset: MediaAsset, fieldName: string): void {
  asLocalAssetPath(asset.src, `${fieldName}.src`);

  if (!Number.isInteger(asset.width) || asset.width <= 0) {
    throw new ContentValidationError(`${fieldName}.width must be a positive integer.`);
  }

  if (!Number.isInteger(asset.height) || asset.height <= 0) {
    throw new ContentValidationError(`${fieldName}.height must be a positive integer.`);
  }

  if (asset.purpose === "informative") {
    assertNonEmptyString(asset.alt, `${fieldName}.alt`);
  } else if (asset.alt !== "") {
    throw new ContentValidationError(
      `${fieldName}.alt must be empty when the image is decorative.`,
    );
  }
}

export function assertUniqueBy<T>(
  records: readonly T[],
  getValue: (record: T) => string,
  fieldName: string,
): void {
  const seen = new Set<string>();

  for (const record of records) {
    const value = getValue(record);

    if (seen.has(value)) {
      throw new ContentValidationError(
        `${fieldName} contains duplicate value "${value}".`,
      );
    }

    seen.add(value);
  }
}

export function assertUniqueContentRecords<
  T extends { readonly id: EntityId; readonly slug: Slug },
>(records: readonly T[], collectionName: string): void {
  assertUniqueBy(records, (record) => record.id, `${collectionName} ids`);
  assertUniqueBy(records, (record) => record.slug, `${collectionName} slugs`);
}

