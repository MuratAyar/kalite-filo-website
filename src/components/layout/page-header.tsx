import type { ComponentPropsWithoutRef } from "react";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/navigation/breadcrumbs";
import { SectionHeading } from "@/components/ui/section-heading";

import { PageContainer } from "./page-container";
import { Section } from "./section";
import { Stack } from "./stack";

export type PageHeaderVariant = "standard" | "high-emphasis";

export type PageHeaderProps = Omit<
  ComponentPropsWithoutRef<"section">,
  "children" | "title"
> & {
  breadcrumbs?: readonly BreadcrumbItem[];
  eyebrow?: string;
  headingId?: string;
  intro?: string;
  title: string;
  variant?: PageHeaderVariant;
};

/** The sole H1-bearing heading region for a standard public page. */
export function PageHeader({
  breadcrumbs,
  className,
  eyebrow,
  headingId = "page-title",
  intro,
  title,
  variant = "standard",
  ...props
}: PageHeaderProps) {
  return (
    <Section
      aria-labelledby={headingId}
      className={className}
      spacing="compact"
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
        </Stack>
      </PageContainer>
    </Section>
  );
}
