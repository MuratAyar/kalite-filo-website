import type { HTMLAttributes, ReactNode } from "react";

import { classNames } from "./class-names";

const headingClasses = {
  display: "text-display",
  large: "text-heading-lg",
  medium: "text-heading-md",
} as const;

const alignmentClasses = {
  start: "items-start text-left",
  center: "items-center text-center",
} as const;

type HeadingLevel = 1 | 2 | 3;

export type SectionHeadingProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "title"
> & {
  align?: keyof typeof alignmentClasses;
  description?: string;
  eyebrow?: string;
  headingId?: string;
  level?: HeadingLevel;
  size?: keyof typeof headingClasses;
  title: ReactNode;
};

/** Provides a consistent heading group while leaving document level explicit. */
export function SectionHeading({
  align = "start",
  className,
  description,
  eyebrow,
  headingId,
  level = 2,
  size = "large",
  title,
  ...props
}: SectionHeadingProps) {
  const Heading = `h${level}` as const;

  return (
    <div
      className={classNames(
        "flex max-w-3xl flex-col gap-3",
        alignmentClasses[align],
        className,
      )}
      {...props}
    >
      {eyebrow ? (
        <p className="text-label font-semibold text-corporate-blue">{eyebrow}</p>
      ) : null}
      <Heading
        className={classNames(
          "font-semibold text-balance text-text-primary",
          headingClasses[size],
        )}
        id={headingId}
      >
        {title}
      </Heading>
      {description ? (
        <p className="text-body-lg text-pretty text-text-secondary">{description}</p>
      ) : null}
    </div>
  );
}
