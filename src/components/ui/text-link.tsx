import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

import { classNames } from "./class-names";

export type TextLinkProps = ComponentPropsWithoutRef<typeof Link>;

export type TextLinkTone = "default" | "inverse";

export type StyledTextLinkProps = TextLinkProps & {
  tone?: TextLinkTone;
};

/** An inline or standalone text link with non-color and keyboard-focus cues. */
export function TextLink({
  className,
  rel,
  target,
  tone = "default",
  ...props
}: StyledTextLinkProps) {
  const safeRel = target === "_blank" ? (rel ?? "noopener noreferrer") : rel;

  return (
    <Link
      className={classNames(
        "font-semibold underline decoration-1 underline-offset-4 hover:decoration-2",
        "focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2",
        tone === "inverse"
          ? "text-accent-orange hover:text-text-inverse focus-visible:outline-accent-orange"
          : "text-corporate-blue focus-visible:outline-focus",
        className,
      )}
      rel={safeRel}
      target={target}
      {...props}
    />
  );
}
