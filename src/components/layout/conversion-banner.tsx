import type { InternalPath } from "@/types";

import { ActionLink, Icon } from "@/components/ui";

import { PageContainer } from "./page-container";
import { Section } from "./section";

export type ConversionBannerProps = {
  actionHref: InternalPath;
  actionLabel: string;
  description: string;
  eyebrow: string;
  headingId?: string;
  title: string;
};

/** A static conversion pattern with local, illustrative supporting media. */
export function ConversionBanner({
  actionHref,
  actionLabel,
  description,
  eyebrow,
  headingId = "conversion-banner-title",
  title,
}: ConversionBannerProps) {
  return (
    <Section
      aria-labelledby={headingId}
      className="overflow-hidden"
      spacing="compact"
      surface="page"
    >
      <PageContainer>
        <div className="conversion-banner relative isolate overflow-hidden rounded-panel border border-navy-secondary bg-brand-navy px-6 py-8 text-text-inverse sm:px-8 md:px-10 md:py-10 lg:grid lg:min-h-72 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-20 size-full object-cover object-right opacity-60"
            height="700"
            loading="lazy"
            src="/images/home/quote-operations.jpg"
            width="1400"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#182136_0%,rgba(24,33,54,0.98)_42%,rgba(24,33,54,0.68)_72%,rgba(24,33,54,0.2)_100%)]"
          />
          <div className="relative z-10 max-w-3xl">
            <p className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-pill bg-accent-orange/15 px-4 py-2 text-label font-semibold text-accent-orange">
              <Icon className="size-5" decorative>
                <path d="M4 14a8 8 0 1 1 16 0" />
                <path d="m12 14 4-4" />
                <path d="M7 18h10" />
              </Icon>
              {eyebrow}
            </p>
            <h2
              className="max-w-2xl text-heading-lg font-semibold text-balance text-text-inverse"
              id={headingId}
            >
              {title}
            </h2>
            <p className="mt-4 max-w-2xl text-body-lg text-pretty text-text-inverse-muted">
              {description}
            </p>
          </div>
          <ActionLink
            className="relative z-10 mt-7 w-full sm:w-auto lg:mt-0"
            href={actionHref}
            size="primary"
            variant="primary"
          >
            {actionLabel}
            <span aria-hidden="true">→</span>
          </ActionLink>
        </div>
      </PageContainer>
    </Section>
  );
}
