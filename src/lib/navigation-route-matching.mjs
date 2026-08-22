const EXACT_ROUTE_OWNERS = Object.freeze({
  "/hakkimizda": "about",
  "/arac-listesi": "vehicles",
  "/filo-rehberi": "fleet-guide",
  "/sikca-sorulan-sorular": "faq",
  "/iletisim": "contact",
  "/kvkk-ve-guvenlik": "privacy-security",
  "/cerez-politikasi": "cookie-policy",
  "/kullanim-kosullari": "terms-of-use",
  "/teklif-al": "quote",
});

/**
 * Normalize a browser pathname for route ownership checks without changing
 * case or treating query/fragment text as part of the route.
 */
export function normalizeNavigationPath(pathname) {
  if (typeof pathname !== "string") {
    return "";
  }

  const pathOnly = pathname.split(/[?#]/, 1)[0];

  if (!pathOnly.startsWith("/")) {
    return "";
  }

  return pathOnly === "/" ? "/" : pathOnly.replace(/\/+$/, "");
}

/**
 * Return the navigation item that owns a static route or approved detail
 * family. Home intentionally has no ordinary navigation item.
 */
export function getCurrentPublicNavigationRouteId(pathname) {
  const normalizedPath = normalizeNavigationPath(pathname);
  const exactOwner = EXACT_ROUTE_OWNERS[normalizedPath];

  if (exactOwner) {
    return exactOwner;
  }

  if (normalizedPath.startsWith("/arac-listesi/")) {
    return "vehicles";
  }

  if (normalizedPath.startsWith("/filo-rehberi/")) {
    return "fleet-guide";
  }

  return undefined;
}
