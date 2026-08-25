import type { ComponentPropsWithoutRef, ReactNode } from "react";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/navigation/breadcrumbs";
import { SectionHeading } from "@/components/ui/section-heading";
import { classNames } from "@/components/ui/class-names";

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
  mobileStartAtTitle?: boolean;
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
  mobileStartAtTitle = false,
  spacing = "compact",
  title,
  variant = "standard",
  ...props
}: PageHeaderProps) {
  return (
    <>
      <Section
        aria-labelledby={headingId}
        className={classNames(
          spacing === "compact" ? "py-6 md:py-8" : undefined,
          className,
        )}
        spacing={spacing === "compact" ? "none" : spacing}
        surface="page"
        data-page-header-variant={variant}
        {...props}
      >
        <PageContainer>
          <Stack gap="sm">
            {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
            {mobileStartAtTitle ? (
              <div aria-hidden="true" data-mobile-title-start="true" />
            ) : null}
            <SectionHeading
              description={intro}
              eyebrow={eyebrow}
              headingId={headingId}
              level={1}
              size="large"
              title={title}
            />
            {children}
          </Stack>
        </PageContainer>
      </Section>
      <div aria-hidden="true" data-mobile-page-start="true" />
    </>
  );
}
