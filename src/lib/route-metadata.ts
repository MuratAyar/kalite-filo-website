import type { Metadata } from "next";
import type { InternalPath } from "@/types";

import { getApprovedRouteById } from "@/config/routes";
import {
  getSiteEnvironment,
  type SiteEnvironment,
} from "@/config/site";
import { asSlug } from "@/lib/validation";
import { ENGLISH_ARTICLE_CATEGORY_SLUGS, ENGLISH_ARTICLE_SLUGS, ENGLISH_STATIC_PATHS } from "@/config/localized-routes";

type RobotsMetadata = NonNullable<Metadata["robots"]>;

const englishStaticPathByRouteId: Readonly<Record<string, string>> = Object.freeze({
  home: ENGLISH_STATIC_PATHS.home, about: ENGLISH_STATIC_PATHS.about, vehicles: ENGLISH_STATIC_PATHS.vehicles,
  "fleet-guide": ENGLISH_STATIC_PATHS.fleetGuide, faq: ENGLISH_STATIC_PATHS.faq, contact: ENGLISH_STATIC_PATHS.contact,
  quote: ENGLISH_STATIC_PATHS.quote, "form-privacy-notice": ENGLISH_STATIC_PATHS.privacyNotice,
  "privacy-security": ENGLISH_STATIC_PATHS.dataProtection, "cookie-policy": ENGLISH_STATIC_PATHS.cookiePolicy,
  "terms-of-use": ENGLISH_STATIC_PATHS.termsOfUse,
});

function createNoIndexRobots(
  siteEnvironment: SiteEnvironment,
): RobotsMetadata {
  return {
    index: false,
    follow: false,
    ...(siteEnvironment.target === "staging" ? { nocache: true } : {}),
  };
}

/**
 * A safe inherited default for routes that have not declared their own
 * registry-backed metadata. Route pages must opt into indexing explicitly.
 */
export function createDefaultRobotsMetadata(): RobotsMetadata {
  return createNoIndexRobots(getSiteEnvironment());
}

/** Keeps a translated route behind the same verified publication gate as its Turkish counterpart. */
export function createTranslatedRouteRobots(routeId: string): RobotsMetadata {
  const route = getApprovedRouteById(routeId);
  const siteEnvironment = getSiteEnvironment();
  return siteEnvironment.allowsSearchIndexing && route.status === "published" && route.indexable
    ? { index: true, follow: true }
    : createNoIndexRobots(siteEnvironment);
}

/**
 * Creates build-time-only metadata for an approved static route. A route is
 * indexable only when both its registry publication state and the deployment
 * target permit indexing.
 */
export function createStaticRouteMetadata(routeId: string): Metadata {
  const route = getApprovedRouteById(routeId);
  const siteEnvironment = getSiteEnvironment();

  if (route.kind !== "static") {
    throw new Error(
      `Route metadata for family ${route.id} requires a concrete canonical path.`,
    );
  }

  const mayIndex =
    siteEnvironment.allowsSearchIndexing &&
    route.status === "published" &&
    route.indexable;

  return {
    alternates: {
      canonical: route.path,
      ...(englishStaticPathByRouteId[routeId] ? { languages: { tr: route.path, en: englishStaticPathByRouteId[routeId], "x-default": route.path } } : {}),
    },
    robots: mayIndex
      ? {
          index: true,
          follow: true,
        }
      : createNoIndexRobots(siteEnvironment),
  };
}

/** Creates build-time metadata for one concrete path in an approved family. */
export function createFamilyRouteMetadata(
  routeId: string,
  concretePath: InternalPath,
): Metadata {
  const route = getApprovedRouteById(routeId);
  const siteEnvironment = getSiteEnvironment();

  if (route.kind !== "family") {
    throw new Error(`Route ${route.id} is not an approved route family.`);
  }

  const patternSegments = route.path.split("/").filter(Boolean);
  const concreteSegments = concretePath.split("/").filter(Boolean);

  if (patternSegments.length !== concreteSegments.length) {
    throw new Error(`Concrete path does not belong to route family ${route.id}.`);
  }

  patternSegments.forEach((segment, index) => {
    const concreteSegment = concreteSegments[index];
    if (segment.startsWith("[") && segment.endsWith("]")) {
      asSlug(concreteSegment, `${route.id} concrete ${segment.slice(1, -1)}`);
      return;
    }
    if (segment !== concreteSegment) {
      throw new Error(`Concrete path does not belong to route family ${route.id}.`);
    }
  });

  const mayIndex =
    siteEnvironment.allowsSearchIndexing &&
    route.status === "published" &&
    route.indexable;

  let englishPath: string | undefined;
  if (routeId === "vehicle-detail") englishPath = `/en/vehicles/${concreteSegments[1]}/`;
  if (routeId === "fleet-guide-category") {
    const category = ENGLISH_ARTICLE_CATEGORY_SLUGS[concreteSegments[1] as keyof typeof ENGLISH_ARTICLE_CATEGORY_SLUGS];
    if (category) englishPath = `/en/fleet-guide/${category}/`;
  }
  if (routeId === "fleet-guide-article") {
    const category = ENGLISH_ARTICLE_CATEGORY_SLUGS[concreteSegments[1] as keyof typeof ENGLISH_ARTICLE_CATEGORY_SLUGS];
    const article = ENGLISH_ARTICLE_SLUGS[concreteSegments[2] as keyof typeof ENGLISH_ARTICLE_SLUGS];
    if (category && article) englishPath = `/en/fleet-guide/${category}/${article}/`;
  }

  return {
    alternates: { canonical: concretePath, ...(englishPath ? { languages: { tr: concretePath, en: englishPath, "x-default": concretePath } } : {}) },
    robots: mayIndex
      ? { index: true, follow: true }
      : createNoIndexRobots(siteEnvironment),
  };
}
