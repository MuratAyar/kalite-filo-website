import type { InternalPath, Slug } from "@/types";
import { asInternalPath, asSlug } from "./validation";

export const VEHICLE_DETAIL_ROUTE_PATTERN = "/arac-listesi/[slug]/" as const;
export const FILO_REHBERI_CATEGORY_ROUTE_PATTERN =
  "/filo-rehberi/[category]/" as const;
export const FILO_REHBERI_ARTICLE_ROUTE_PATTERN =
  "/filo-rehberi/[category]/[slug]/" as const;

export const APPROVED_ROUTE_FAMILY_PATTERNS = [
  VEHICLE_DETAIL_ROUTE_PATTERN,
  FILO_REHBERI_CATEGORY_ROUTE_PATTERN,
  FILO_REHBERI_ARTICLE_ROUTE_PATTERN,
] as const;

export type ApprovedRouteFamilyPattern =
  (typeof APPROVED_ROUTE_FAMILY_PATTERNS)[number];

export function isApprovedRouteFamilyPattern(
  value: string,
): value is ApprovedRouteFamilyPattern {
  return APPROVED_ROUTE_FAMILY_PATTERNS.some((pattern) => pattern === value);
}

export function getFiloRehberiCategoryPath(
  category: Slug | string,
): InternalPath {
  const validCategory = asSlug(category, "article category slug");
  return asInternalPath(
    `/filo-rehberi/${validCategory}/`,
    "article category path",
  );
}

export function getFiloRehberiArticlePath(
  category: Slug | string,
  slug: Slug | string,
): InternalPath {
  const validCategory = asSlug(category, "article category slug");
  const validSlug = asSlug(slug, "article slug");
  return asInternalPath(
    `/filo-rehberi/${validCategory}/${validSlug}/`,
    "article path",
  );
}

export function getVehicleDetailPath(slug: Slug | string): InternalPath {
  const validSlug = asSlug(slug, "vehicle slug");
  return asInternalPath(`/arac-listesi/${validSlug}/`, "vehicle detail path");
}
