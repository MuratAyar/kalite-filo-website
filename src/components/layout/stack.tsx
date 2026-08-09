import type { HTMLAttributes } from "react";

import { classNames } from "@/components/ui/class-names";

const gapClasses = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
  "2xl": "gap-12",
} as const;

type StackElement = "article" | "div" | "ol" | "section" | "ul";

export type StackProps = HTMLAttributes<HTMLElement> & {
  as?: StackElement;
  gap?: keyof typeof gapClasses;
};

/** Arranges children vertically with a named, consistent gap. */
export function Stack({
  as: Component = "div",
  className,
  gap = "md",
  ...props
}: StackProps) {
  return (
    <Component
      className={classNames("flex flex-col", gapClasses[gap], className)}
      {...props}
    />
  );
}
