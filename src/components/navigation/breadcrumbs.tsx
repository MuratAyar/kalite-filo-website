import Link from "next/link";

import { classNames } from "@/components/ui/class-names";

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

export type BreadcrumbsProps = {
  ariaLabel?: string;
  className?: string;
  items: readonly BreadcrumbItem[];
};

/** A labelled breadcrumb trail whose final item is always the current page. */
export function Breadcrumbs({
  ariaLabel = "Sayfa yolu",
  className,
  items,
}: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-text-secondary">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          if (item.href === "#") {
            throw new Error("Breadcrumb links cannot use the placeholder path '#'.");
          }

          return (
            <li className="flex min-w-0 items-center gap-2" key={`${item.label}:${index}`}>
              {isCurrent ? (
                <span aria-current="page" className="font-semibold text-text-primary">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  className={classNames(
                    "rounded-sm underline-offset-4 hover:underline",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  )}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
              {isCurrent ? null : <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
