import type { InternalPath } from "@/types";

import {
  getApprovedRouteById,
  type ApprovedRoute,
} from "./routes";
import { ENGLISH_STATIC_PATHS } from "./localized-routes";
import { asInternalPath } from "@/lib";

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
  "form-privacy-notice",
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

const englishLabels: Readonly<Record<PublicStaticRouteId, string>> = Object.freeze({
  home: "Home", about: "About Us", vehicles: "Vehicles", "fleet-guide": "Fleet Guide", faq: "FAQ",
  contact: "Contact", "privacy-security": "Data Protection", "cookie-policy": "Cookie Policy",
  "terms-of-use": "Terms of Use", "form-privacy-notice": "Privacy Notice", quote: "Request a Quote",
});
const englishPathsSource: Readonly<Record<PublicStaticRouteId, string>> = Object.freeze({
  home: ENGLISH_STATIC_PATHS.home, about: ENGLISH_STATIC_PATHS.about, vehicles: ENGLISH_STATIC_PATHS.vehicles,
  "fleet-guide": ENGLISH_STATIC_PATHS.fleetGuide, faq: ENGLISH_STATIC_PATHS.faq, contact: ENGLISH_STATIC_PATHS.contact,
  "privacy-security": ENGLISH_STATIC_PATHS.dataProtection, "cookie-policy": ENGLISH_STATIC_PATHS.cookiePolicy,
  "terms-of-use": ENGLISH_STATIC_PATHS.termsOfUse, "form-privacy-notice": ENGLISH_STATIC_PATHS.privacyNotice, quote: ENGLISH_STATIC_PATHS.quote,
});
const englishPaths = Object.freeze(Object.fromEntries(Object.entries(englishPathsSource).map(([id, path]) => [id, asInternalPath(path, `English navigation ${id}`)]))) as Readonly<Record<PublicStaticRouteId, InternalPath>>;
function createEnglishNavigationItems(ids: readonly PublicStaticRouteId[]): readonly PublicNavigationItem[] {
  return Object.freeze(ids.map((id) => Object.freeze({ id, label: englishLabels[id], path: englishPaths[id] })));
}
export const ENGLISH_PRIMARY_NAVIGATION_ITEMS = createEnglishNavigationItems(["about", "vehicles", "faq", "fleet-guide"]);
export const ENGLISH_FOOTER_NAVIGATION_ITEMS = createEnglishNavigationItems(["about", "vehicles", "fleet-guide", "faq", "contact", "privacy-security", "cookie-policy", "terms-of-use", "quote"]);
export const ENGLISH_QUOTE_NAVIGATION_ITEM = createEnglishNavigationItems(["quote"])[0];
