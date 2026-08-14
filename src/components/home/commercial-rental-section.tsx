import type { HomeCommercialCopy, InternalPath } from "@/types";

import { PageContainer, Section } from "@/components/layout";
import { ActionLink, SectionHeading } from "@/components/ui";

export type CommercialRentalSectionProps = {
  actionHref: InternalPath;
  content: HomeCommercialCopy;
};

export function CommercialRentalSection({
  actionHref,
  content,
}: CommercialRentalSectionProps) {
  return (
    <Section
      aria-labelledby="commercial-rental-title"
      className="overflow-hidden"
      surface="card"
    >
      <PageContainer>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              description={content.body}
              headingId="commercial-rental-title"
              title={content.title}
            />
            <ActionLink
              className="mt-7 w-full sm:w-auto"
              href={actionHref}
              size="secondary"
              variant="primary"
            >
              {content.action.label}
              <span aria-hidden="true">→</span>
            </ActionLink>
          </div>
          <div className="relative aspect-[3/2] min-h-0 overflow-hidden rounded-card border border-border-subtle bg-surface-muted shadow-[0_1.25rem_2.5rem_rgb(24_33_54_/_0.12)] md:min-h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Ticari araç kiralama bölümünü destekleyen temsili araç görseli"
              className="size-full object-cover"
              height="800"
              loading="lazy"
              src="/images/home/commercial-fleet.jpg"
              width="1200"
            />
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}
