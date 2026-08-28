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
  "/en/about-us": "about",
  "/en/vehicles": "vehicles",
  "/en/fleet-guide": "fleet-guide",
  "/en/frequently-asked-questions": "faq",
  "/en/contact": "contact",
  "/en/data-protection-and-security": "privacy-security",
  "/en/cookie-policy": "cookie-policy",
  "/en/terms-of-use": "terms-of-use",
  "/en/privacy-notice": "form-privacy-notice",
  "/en/request-a-quote": "quote",
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

  if (normalizedPath.startsWith("/en/vehicles/")) return "vehicles";
  if (normalizedPath.startsWith("/en/fleet-guide/")) return "fleet-guide";

  return undefined;
}
