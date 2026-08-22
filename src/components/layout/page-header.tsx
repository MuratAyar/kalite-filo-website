import type { ComponentPropsWithoutRef, ReactNode } from "react";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/navigation/breadcrumbs";
import { SectionHeading } from "@/components/ui/section-heading";

import { PageContainer } from "./page-container";
import { Section, type SectionSpacing } from "./section";
import { Stack } from "./stack";

export type PageHeaderVariant = "standard" | "high-emphasis";

export type PageHeaderProps = Omit<
  ComponentPropsWithoutRef<"section">,
  "children" | "title"
> & {
  breadcrumbs?: readonly BreadcrumbItem[];
  children?: ReactNode;
  eyebrow?: string;
  headingId?: string;
  intro?: string;
  spacing?: SectionSpacing;
  title: string;
  variant?: PageHeaderVariant;
};

/** The sole H1-bearing heading region for a standard public page. */
export function PageHeader({
  breadcrumbs,
  children,
  className,
  eyebrow,
  headingId = "page-title",
  intro,
  spacing = "compact",
  title,
  variant = "standard",
  ...props
}: PageHeaderProps) {
  return (
    <Section
      aria-labelledby={headingId}
      className={className}
      spacing={spacing}
      surface="page"
      {...props}
    >
      <PageContainer>
        <Stack gap="lg">
          {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
          <SectionHeading
            description={intro}
            eyebrow={eyebrow}
            headingId={headingId}
            level={1}
            size={variant === "high-emphasis" ? "display" : "large"}
            title={title}
          />
          {children}
        </Stack>
      </PageContainer>
    </Section>
  );
}
