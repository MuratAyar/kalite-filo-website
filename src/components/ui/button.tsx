import type { ComponentPropsWithoutRef } from "react";

import {
  getActionClassName,
  type ActionSize,
  type ActionVariant,
} from "./button-styles";

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  fullWidth?: boolean;
  size?: ActionSize;
  variant?: ActionVariant;
};

/** A native action control. It defaults to type="button" to prevent accidental form submission. */
export function Button({
  className,
  fullWidth = false,
  size,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const resolvedSize = size ?? (variant === "primary" ? "primary" : "secondary");

  return (
    <button
      className={getActionClassName({
        className,
        fullWidth,
        size: resolvedSize,
        variant,
      })}
      type={type}
      {...props}
    />
  );
}
