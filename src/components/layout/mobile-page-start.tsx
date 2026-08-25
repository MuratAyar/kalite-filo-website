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

    if (normalizedPathname === "/") {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      let restoreFrame = 0;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);

      const frame = window.requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        restoreFrame = window.requestAnimationFrame(() => {
          window.scrollTo(0, 0);
          root.style.scrollBehavior = previousScrollBehavior;
        });
      });

      return () => {
        window.cancelAnimationFrame(frame);
        window.cancelAnimationFrame(restoreFrame);
        root.style.scrollBehavior = previousScrollBehavior;
      };
    }

    const frame = window.requestAnimationFrame(() => {
      const articleTitleMarker = /^\/filo-rehberi\/[^/]+\/[^/]+\/$/.test(
        normalizedPathname,
      )
        ? document.querySelector<HTMLElement>("[data-mobile-title-start]")
        : null;

      const routeMarker = document.querySelector<HTMLElement>(
        `[data-mobile-route-start="${normalizedPathname}"]`,
      );
      const marker =
        articleTitleMarker ??
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
            (header?.offsetHeight ?? 0) -
            Number(marker.dataset.mobileRouteOffset ?? 0),
        ),
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
