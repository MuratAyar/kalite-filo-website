import type { MetadataRoute } from "next";

import { getSiteEnvironment } from "@/config/site";

// Next 16 treats generated metadata endpoints as GET handlers. Export mode
// requires this explicit build-time-only route contract.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const siteEnvironment = getSiteEnvironment();
  const origin = new URL(siteEnvironment.origin);

  if (!siteEnvironment.allowsCrawling) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      host: origin.origin,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/admin-api/"],
    },
    sitemap: new URL("/sitemap.xml", origin).toString(),
    host: origin.origin,
  };
}
