import type { MetadataRoute } from "next";

import { getApprovedRouteById, getSitemapRoutes } from "@/config/routes";
import { getSiteEnvironment } from "@/config/site";
import { ENGLISH_STATIC_PATHS } from "@/config/localized-routes";
import { englishArticleCategories, englishArticles, englishVehiclePortfolio } from "@/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteEnvironment = getSiteEnvironment();
  const origin = new URL(siteEnvironment.origin);

  const turkishRoutes = getSitemapRoutes().map((route) => ({
    url: new URL(route.path, origin).toString(),
    ...(route.lastModified === undefined
      ? {}
      : { lastModified: route.lastModified }),
  }));
  const staticEnglishRoutes = [
    ["home", ENGLISH_STATIC_PATHS.home], ["about", ENGLISH_STATIC_PATHS.about], ["vehicles", ENGLISH_STATIC_PATHS.vehicles],
    ["fleet-guide", ENGLISH_STATIC_PATHS.fleetGuide], ["faq", ENGLISH_STATIC_PATHS.faq], ["contact", ENGLISH_STATIC_PATHS.contact], ["quote", ENGLISH_STATIC_PATHS.quote],
  ] as const;
  const englishRoutes: MetadataRoute.Sitemap = staticEnglishRoutes
    .filter(([id]) => { const route = getApprovedRouteById(id); return route.status === "published" && route.indexable && route.sitemap; })
    .map(([, routePath]) => ({ url: new URL(routePath, origin).toString() }));
  const vehicleFamily = getApprovedRouteById("vehicle-detail");
  if (vehicleFamily.status === "published" && vehicleFamily.indexable && vehicleFamily.sitemap) {
    englishRoutes.push(...englishVehiclePortfolio.map((vehicle) => ({ url: new URL(`/en/vehicles/${vehicle.slug}/`, origin).toString() })));
  }
  const categoryFamily = getApprovedRouteById("fleet-guide-category");
  if (categoryFamily.status === "published" && categoryFamily.indexable && categoryFamily.sitemap) {
    englishRoutes.push(...englishArticleCategories.map((category) => ({ url: new URL(`/en/fleet-guide/${category.slug}/`, origin).toString() })));
  }
  const articleFamily = getApprovedRouteById("fleet-guide-article");
  if (articleFamily.status === "published" && articleFamily.indexable && articleFamily.sitemap) {
    const categories = new Map(englishArticleCategories.map((category) => [category.id, category]));
    englishRoutes.push(...englishArticles.map((article) => ({ url: new URL(`/en/fleet-guide/${categories.get(article.categoryId)?.slug}/${article.slug}/`, origin).toString(), lastModified: article.publishedAt })));
  }
  return [...turkishRoutes, ...englishRoutes];
}
