import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { classNames } from "./class-names";

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
} as const;

type DecorativeIcon = {
  decorative?: true;
  label?: never;
};

type InformativeIcon = {
  decorative: false;
  label: string;
};

export type IconProps = Omit<
  ComponentPropsWithoutRef<"svg">,
  "aria-hidden" | "aria-label" | "children" | "role"
> &
  (DecorativeIcon | InformativeIcon) & {
    children: ReactNode;
    size?: keyof typeof sizeClasses;
  };

/** Shared SVG frame for project-owned or code-native icon paths. */
export function Icon({
  children,
  className,
  decorative = true,
  label,
  size = "md",
  strokeWidth = 1.5,
  viewBox = "0 0 24 24",
  ...props
}: IconProps) {
  const accessibilityProps = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ "aria-label": label, role: "img" } as const);

  return (
    <svg
      className={classNames("shrink-0", sizeClasses[size], className)}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox={viewBox}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </svg>
  );
}
