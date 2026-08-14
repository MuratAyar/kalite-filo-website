import type { InternalPath } from "@/types";

import {
  getApprovedRouteById,
  type ApprovedRoute,
} from "./routes";

export const PUBLIC_STATIC_ROUTE_IDS = [
  "home",
  "about",
  "vehicles",
  "fleet-guide",
  "faq",
  "contact",
  "privacy-security",
  "cookie-policy",
  "terms-of-use",
  "quote",
] as const;

export type PublicStaticRouteId = (typeof PUBLIC_STATIC_ROUTE_IDS)[number];

export type PublicStaticRoute = ApprovedRoute & {
  readonly id: PublicStaticRouteId;
  readonly kind: "static";
  readonly path: InternalPath;
};

export interface PublicNavigationItem {
  readonly id: PublicStaticRouteId;
  readonly label: string;
  readonly path: InternalPath;
}

export function getPublicStaticRoute(
  routeId: PublicStaticRouteId,
): PublicStaticRoute {
  const route = getApprovedRouteById(routeId);

  if (route.kind !== "static") {
    throw new Error(`Public shell route ${routeId} must be static.`);
  }

  return route as PublicStaticRoute;
}

function createNavigationItems(
  routeIds: readonly PublicStaticRouteId[],
): readonly PublicNavigationItem[] {
  return Object.freeze(
    routeIds.map((routeId) => {
      const route = getPublicStaticRoute(routeId);

      return Object.freeze({
        id: route.id,
        label: route.label,
        path: route.path,
      });
    }),
  );
}

export const PRIMARY_NAVIGATION_ITEMS: readonly PublicNavigationItem[] =
  createNavigationItems(["about", "vehicles", "faq", "fleet-guide"]);

export const FOOTER_NAVIGATION_ITEMS: readonly PublicNavigationItem[] =
  Object.freeze(
    createNavigationItems([
      "about",
      "vehicles",
      "fleet-guide",
      "faq",
      "contact",
      "privacy-security",
      "cookie-policy",
      "terms-of-use",
      "quote",
    ]).map((item) =>
      item.id === "faq"
        ? Object.freeze({ ...item, label: "SSS" })
        : item,
    ),
  );

export const QUOTE_NAVIGATION_ITEM = createNavigationItems(["quote"])[0];
