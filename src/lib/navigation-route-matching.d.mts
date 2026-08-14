import type { PublicStaticRouteId } from "@/config/public-navigation";

export function normalizeNavigationPath(pathname: string): string;

export function getCurrentPublicNavigationRouteId(
  pathname: string,
): PublicStaticRouteId | undefined;
