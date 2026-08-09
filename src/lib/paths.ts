import type { InternalPath, Slug } from "@/types";
import { asInternalPath, asSlug } from "./validation";

export const VEHICLE_DETAIL_ROUTE_PATTERN = "/araclar/[slug]/" as const;
export const FILO_REHBERI_ARTICLE_ROUTE_PATTERN =
  "/filo-rehberi/[slug]/" as const;

export const APPROVED_ROUTE_FAMILY_PATTERNS = [
  VEHICLE_DETAIL_ROUTE_PATTERN,
  FILO_REHBERI_ARTICLE_ROUTE_PATTERN,
] as const;

export type ApprovedRouteFamilyPattern =
  (typeof APPROVED_ROUTE_FAMILY_PATTERNS)[number];

export function isApprovedRouteFamilyPattern(
  value: string,
): value is ApprovedRouteFamilyPattern {
  return APPROVED_ROUTE_FAMILY_PATTERNS.some((pattern) => pattern === value);
}

export function getFiloRehberiArticlePath(slug: Slug | string): InternalPath {
  const validSlug = asSlug(slug, "article slug");
  return asInternalPath(`/filo-rehberi/${validSlug}/`, "article path");
}
