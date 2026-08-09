import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

import {
  getActionClassName,
  type ActionSize,
  type ActionVariant,
} from "./button-styles";

export type ActionLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  fullWidth?: boolean;
  size?: ActionSize;
  variant?: ActionVariant;
};

/** A button-shaped link for navigation. Use Button for in-page actions. */
export function ActionLink({
  className,
  fullWidth = false,
  rel,
  size,
  target,
  variant = "primary",
  ...props
}: ActionLinkProps) {
  const resolvedSize = size ?? (variant === "primary" ? "primary" : "secondary");
  const safeRel = target === "_blank" ? (rel ?? "noopener noreferrer") : rel;

  return (
    <Link
      className={getActionClassName({
        className,
        fullWidth,
        size: resolvedSize,
        variant,
      })}
      rel={safeRel}
      target={target}
      {...props}
    />
  );
}
