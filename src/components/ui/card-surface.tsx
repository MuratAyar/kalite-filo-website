import type { HTMLAttributes } from "react";

import { classNames } from "./class-names";

const paddingClasses = {
  none: "",
  compact: "p-4",
  default: "p-6",
  spacious: "p-6 md:p-8",
} as const;

const surfaceClasses = {
  card: "border-border-subtle bg-surface-card text-text-primary",
  muted: "border-border-subtle bg-surface-muted text-text-primary",
  navy: "border-transparent bg-brand-navy text-text-inverse",
} as const;

type CardElement = "article" | "div" | "li" | "section";

export type CardSurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: CardElement;
  padding?: keyof typeof paddingClasses;
  surface?: keyof typeof surfaceClasses;
};

/** A restrained tonal surface; interaction belongs on a semantic child link or button. */
export function CardSurface({
  as: Component = "div",
  className,
  padding = "default",
  surface = "card",
  ...props
}: CardSurfaceProps) {
  return (
    <Component
      className={classNames(
        "rounded-card border",
        surfaceClasses[surface],
        paddingClasses[padding],
        className,
      )}
      {...props}
    />
  );
}
