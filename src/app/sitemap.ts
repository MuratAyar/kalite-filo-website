import type { MetadataRoute } from "next";

import { getSitemapRoutes } from "@/config/routes";
import { getSiteEnvironment } from "@/config/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteEnvironment = getSiteEnvironment();
  const origin = new URL(siteEnvironment.origin);

  return getSitemapRoutes().map((route) => ({
    url: new URL(route.path, origin).toString(),
    ...(route.lastModified === undefined
      ? {}
      : { lastModified: route.lastModified }),
  }));
}
