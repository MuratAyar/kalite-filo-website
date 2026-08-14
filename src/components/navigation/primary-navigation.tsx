"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { classNames } from "@/components/ui/class-names";
import type { PublicNavigationItem } from "@/config/public-navigation";
import { getCurrentPublicNavigationRouteId } from "@/lib/navigation-route-matching.mjs";

const listClasses = {
  horizontal: "flex items-center gap-6",
  vertical: "flex flex-col gap-1",
  footer: "grid min-w-0 gap-x-8 sm:grid-cols-2 lg:grid-cols-3",
} as const;

const linkClasses = {
  horizontal:
    "inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-label font-semibold text-text-secondary hover:border-border-control hover:text-corporate-blue",
  vertical:
    "flex min-h-11 w-full min-w-0 items-center rounded-control px-3 py-2 text-body font-semibold text-text-primary hover:bg-surface-muted hover:text-corporate-blue",
  footer:
    "flex min-h-11 min-w-0 items-center break-words rounded-sm py-2 text-body text-text-inverse-muted underline-offset-4 hover:text-text-inverse hover:underline",
} as const;

const currentLinkClasses = {
  horizontal: "!border-corporate-blue !text-corporate-blue",
  vertical:
    "!bg-surface-muted !text-corporate-blue underline decoration-2 underline-offset-4",
  footer: "font-semibold text-text-inverse underline decoration-2",
} as const;

export type PrimaryNavigationProps = {
  actionClassName?: string;
  actionCurrentClassName?: string;
  actionItem?: PublicNavigationItem;
  ariaLabel?: string;
  className?: string;
  documentNavigation?: boolean;
  items: readonly PublicNavigationItem[];
  orientation?: keyof typeof listClasses;
};

/** The only route-aware client boundary in the public shell. */
export function PrimaryNavigation({
  actionClassName,
  actionCurrentClassName,
  actionItem,
  ariaLabel = "Ana menü",
  className,
  documentNavigation = false,
  items,
  orientation = "horizontal",
}: PrimaryNavigationProps) {
  const currentRouteId = getCurrentPublicNavigationRouteId(usePathname());

  function renderLink(
    item: PublicNavigationItem,
    resolvedClassName: string,
    resolvedCurrentClassName: string,
  ) {
    const isCurrent = currentRouteId === item.id;
    const linkClassName = classNames(
      resolvedClassName,
      isCurrent && resolvedCurrentClassName,
    );

    return documentNavigation ? (
      <a
        aria-current={isCurrent ? "page" : undefined}
        className={linkClassName}
        href={item.path}
      >
        {item.label}
      </a>
    ) : (
      <Link
        aria-current={isCurrent ? "page" : undefined}
        className={linkClassName}
        href={item.path}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <>
      <nav aria-label={ariaLabel} className={className}>
        <ul className={listClasses[orientation]}>
          {items.map((item) => (
            <li className="min-w-0" key={item.id}>
              {renderLink(
                item,
                classNames(
                  "break-words rounded-sm transition-colors motion-reduce:transition-none",
                  "focus-visible:outline-2 focus-visible:outline-offset-2",
                  orientation === "footer"
                    ? "focus-visible:outline-accent-orange"
                    : "focus-visible:outline-focus",
                  linkClasses[orientation],
                ),
                currentLinkClasses[orientation],
              )}
            </li>
          ))}
        </ul>
      </nav>
      {actionItem
        ? renderLink(
            actionItem,
            classNames(actionClassName),
            actionCurrentClassName ?? "",
          )
        : null}
    </>
  );
}
