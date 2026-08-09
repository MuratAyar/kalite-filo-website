import type { ComponentPropsWithoutRef } from "react";

import { classNames } from "@/components/ui/class-names";

const surfaceClasses = {
  transparent: "bg-transparent text-text-primary",
  page: "bg-surface-page text-text-primary",
  muted: "bg-surface-muted text-text-primary",
  card: "bg-surface-card text-text-primary",
  navy: "bg-brand-navy text-text-inverse",
  accent: "bg-accent-orange text-brand-navy",
} as const;

const spacingClasses = {
  none: "",
  compact: "py-12 md:py-16",
  default: "py-section",
} as const;

export type SectionSurface = keyof typeof surfaceClasses;
export type SectionSpacing = keyof typeof spacingClasses;

export type SectionProps = ComponentPropsWithoutRef<"section"> & {
  spacing?: SectionSpacing;
  surface?: SectionSurface;
};

/** A full-width semantic section. Pair with PageContainer for aligned content. */
export function Section({
  className,
  spacing = "default",
  surface = "transparent",
  ...props
}: SectionProps) {
  return (
    <section
      className={classNames(
        surfaceClasses[surface],
        spacingClasses[spacing],
        className,
      )}
      {...props}
    />
  );
}
