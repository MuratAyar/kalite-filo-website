"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * On narrow screens, begin an inner page at its primary content while keeping
 * the breadcrumb and H1 immediately above it for reverse scrolling.
 */
export function MobilePageStart() {
  const pathname = usePathname();

  useEffect(() => {
    const normalizedPathname = pathname.endsWith("/")
      ? pathname
      : `${pathname}/`;

    if (
      !window.matchMedia("(max-width: 47.99rem)").matches ||
      window.location.hash
    ) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (normalizedPathname === "/") {
        window.scrollTo({ behavior: "auto", top: 0 });
        return;
      }

      const routeMarker = document.querySelector<HTMLElement>(
        `[data-mobile-route-start="${normalizedPathname}"]`,
      );
      const marker =
        routeMarker ??
        document.querySelector<HTMLElement>("[data-mobile-page-start]");
      const header = document.querySelector<HTMLElement>("header");

      if (!marker) return;

      window.scrollTo({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        top: Math.max(
          0,
          window.scrollY +
            marker.getBoundingClientRect().top -
            (header?.offsetHeight ?? 0),
        ),
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
