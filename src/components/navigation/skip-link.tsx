import type { ComponentPropsWithoutRef } from "react";

import { classNames } from "@/components/ui/class-names";

export type SkipLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  label?: string;
  targetId?: string;
};

/** Must be rendered before repeated navigation and target the page's main landmark. */
export function SkipLink({
  className,
  label = "Ana içeriğe geç",
  targetId = "main-content",
  ...props
}: SkipLinkProps) {
  return (
    <a
      className={classNames(
        "sr-only fixed left-4 top-4 z-50 rounded-control bg-surface-card px-4 py-3 text-label font-semibold text-text-primary",
        "focus:not-sr-only focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        className,
      )}
      href={`#${targetId}`}
      {...props}
    >
      {label}
    </a>
  );
}
