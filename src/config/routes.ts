import routeRecords from "./approved-routes.json";
import type { InternalPath } from "@/types";
import {
  asInternalPath,
  assertNonEmptyString,
  assertUniqueBy,
  isApprovedRouteFamilyPattern,
} from "@/lib";
import type { ApprovedRouteFamilyPattern } from "@/lib";

export type ApprovedRouteKind = "static" | "family";
export type ApprovedRouteStatus =
  | "foundation"
  | "canonical-path"
  | "published";

export interface ApprovedRoute {
  readonly id: string;
  readonly kind: ApprovedRouteKind;
  readonly path: InternalPath | ApprovedRouteFamilyPattern;
  readonly label: string;
  readonly status: ApprovedRouteStatus;
  readonly indexable: boolean;
  readonly sitemap: boolean;
}

export interface SitemapRoute {
  readonly path: string;
  readonly lastModified?: string | Date;
}

function isRouteKind(value: string): value is ApprovedRouteKind {
  return value === "static" || value === "family";
}

function isRouteStatus(value: string): value is ApprovedRouteStatus {
  return (
    value === "foundation" ||
    value === "canonical-path" ||
    value === "published"
  );
}

function parseApprovedRoute(record: (typeof routeRecords)[number]): ApprovedRoute {
  assertNonEmptyString(record.id, "route id");
  assertNonEmptyString(record.label, `route ${record.id} label`);

  if (!isRouteKind(record.kind)) {
    throw new Error(`Route ${record.id} has an unsupported kind.`);
  }

  if (!isRouteStatus(record.status)) {
    throw new Error(`Route ${record.id} has an unsupported status.`);
  }

  if (record.status !== "published" && (record.indexable || record.sitemap)) {
    throw new Error(
      `Route ${record.id} cannot be indexable or included in the sitemap before publication.`,
    );
  }

  if (record.sitemap && !record.indexable) {
    throw new Error(`Route ${record.id} cannot be in the sitemap while noindex.`);
  }

  if (record.kind === "family") {
    if (!isApprovedRouteFamilyPattern(record.path)) {
      throw new Error(`Route family ${record.id} has an unapproved path pattern.`);
    }

    return {
      id: record.id,
      kind: record.kind,
      path: record.path,
      label: record.label,
      status: record.status,
      indexable: record.indexable,
      sitemap: record.sitemap,
    };
  }

  return {
    id: record.id,
    kind: record.kind,
    path: asInternalPath(record.path, `route ${record.id} path`),
    label: record.label,
    status: record.status,
    indexable: record.indexable,
    sitemap: record.sitemap,
  };
}

export const APPROVED_ROUTES: readonly ApprovedRoute[] = Object.freeze(
  routeRecords.map(parseApprovedRoute),
);

assertUniqueBy(APPROVED_ROUTES, (route) => route.id, "route ids");
assertUniqueBy(APPROVED_ROUTES, (route) => route.path, "route paths");

export function getApprovedRouteById(id: string): ApprovedRoute {
  assertNonEmptyString(id, "route id");

  const route = APPROVED_ROUTES.find((candidate) => candidate.id === id);

  if (route === undefined) {
    throw new Error(`Unknown approved route id: ${id}`);
  }

  return route;
}

export function getSitemapRoutes(): SitemapRoute[] {
  return APPROVED_ROUTES.filter(
    (route) =>
      route.kind === "static" &&
      route.status === "published" &&
      route.indexable &&
      route.sitemap,
  ).map((route) => ({ path: route.path }));
}
