import type { ComponentPropsWithoutRef } from "react";

import { classNames } from "@/components/ui/class-names";

export type PageContainerProps = ComponentPropsWithoutRef<"div">;

/** Keeps page content on the shared grid without constraining section backgrounds. */
export function PageContainer({
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={classNames("mx-auto w-full max-w-container px-gutter", className)}
      {...props}
    />
  );
}
