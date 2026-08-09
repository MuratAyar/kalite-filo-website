import type { HttpsUrl } from "./primitives";

export interface InternalNavigationItem<RouteId extends string = string> {
  readonly id: string;
  readonly kind: "internal";
  readonly label: string;
  readonly routeId: RouteId;
  readonly fragment?: `#${string}`;
}

export interface ExternalNavigationItem {
  readonly id: string;
  readonly kind: "external";
  readonly label: string;
  readonly href: HttpsUrl;
}

export type NavigationItem<RouteId extends string = string> =
  | InternalNavigationItem<RouteId>
  | ExternalNavigationItem;

