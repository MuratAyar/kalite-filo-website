import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

import { classNames } from "./class-names";

export type TextLinkProps = ComponentPropsWithoutRef<typeof Link>;

/** An inline or standalone text link with non-color and keyboard-focus cues. */
export function TextLink({
  className,
  rel,
  target,
  ...props
}: TextLinkProps) {
  const safeRel = target === "_blank" ? (rel ?? "noopener noreferrer") : rel;

  return (
    <Link
      className={classNames(
        "font-semibold text-corporate-blue underline decoration-1 underline-offset-4",
        "hover:decoration-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        className,
      )}
      rel={safeRel}
      target={target}
      {...props}
    />
  );
}
