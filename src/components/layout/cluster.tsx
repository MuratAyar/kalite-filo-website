import type { HTMLAttributes } from "react";

import { classNames } from "@/components/ui/class-names";

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
} as const;

const justifyClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

const gapClasses = {
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
} as const;

type ClusterElement = "div" | "nav" | "ol" | "ul";

export type ClusterProps = HTMLAttributes<HTMLElement> & {
  align?: keyof typeof alignClasses;
  as?: ClusterElement;
  gap?: keyof typeof gapClasses;
  justify?: keyof typeof justifyClasses;
};

/** Arranges related items inline and lets them wrap before they collide. */
export function Cluster({
  align = "center",
  as: Component = "div",
  className,
  gap = "md",
  justify = "start",
  ...props
}: ClusterProps) {
  return (
    <Component
      className={classNames(
        "flex flex-wrap",
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        className,
      )}
      {...props}
    />
  );
}
