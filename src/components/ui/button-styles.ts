import { classNames } from "./class-names";

export const actionVariants = {
  primary:
    "bg-accent-orange text-brand-navy hover:bg-orange-dark active:bg-orange-dark",
  secondary:
    "bg-brand-navy text-text-inverse hover:bg-navy-secondary active:bg-navy-secondary",
  outline:
    "border-2 border-brand-navy bg-transparent text-brand-navy hover:bg-surface-muted",
  quiet: "bg-transparent text-corporate-blue hover:bg-surface-muted",
  danger: "bg-error text-text-inverse hover:brightness-90",
} as const;

export const actionSizes = {
  primary: "h-control-primary px-6",
  secondary: "h-control-secondary px-5",
  compact: "min-h-11 px-4",
  icon: "size-11 p-0",
} as const;

export type ActionVariant = keyof typeof actionVariants;
export type ActionSize = keyof typeof actionSizes;

export function getActionClassName({
  className,
  fullWidth,
  size,
  variant,
}: {
  className?: string;
  fullWidth?: boolean;
  size: ActionSize;
  variant: ActionVariant;
}): string {
  return classNames(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-control text-label font-semibold transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
    actionVariants[variant],
    actionSizes[size],
    fullWidth && "w-full",
    className,
  );
}
