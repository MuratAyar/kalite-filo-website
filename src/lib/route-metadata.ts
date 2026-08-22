import type { Metadata } from "next";
import type { InternalPath } from "@/types";

import { getApprovedRouteById } from "@/config/routes";
import {
  getSiteEnvironment,
  type SiteEnvironment,
} from "@/config/site";
import { asSlug } from "@/lib/validation";

type RobotsMetadata = NonNullable<Metadata["robots"]>;

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

  return {
    alternates: { canonical: concretePath },
    robots: mayIndex
      ? { index: true, follow: true }
      : createNoIndexRobots(siteEnvironment),
  };
}
