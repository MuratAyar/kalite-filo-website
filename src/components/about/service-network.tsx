import { PageContainer, Section } from "@/components/layout";
import { CardSurface, SectionHeading } from "@/components/ui";
import { aboutPageContent } from "@/data/about";

import { AboutIcon, type AboutIconName } from "./about-icon";

export function ServiceNetwork({
  content,
}: {
  content: typeof aboutPageContent.network;
}) {
  return (
    <Section
      aria-labelledby="service-network-title"
      data-about-section="service-network"
      surface="page"
    >
      <PageContainer>
        <SectionHeading
          align="center"
          className="mx-auto"
          description={content.intro}
          headingId="service-network-title"
          title={content.title}
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)] lg:items-stretch">
          <figure className="relative min-h-64 overflow-hidden rounded-card border border-border-subtle bg-surface-muted sm:min-h-96 lg:min-h-[31rem]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Kurumsal yerleşke otoparkında sıralanmış araçlar"
              className="absolute inset-0 size-full object-cover"
              height="720"
              loading="lazy"
              src="/images/home/fleet-campus.jpg"
              width="1280"
            />
          </figure>
          <ul className="mobile-card-track grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {content.items.map((item) => (
              <CardSurface
                as="li"
                className="mobile-half-card flex min-w-0 flex-col justify-center"
                key={item.id}
              >
                <span className="text-corporate-blue">
                  <AboutIcon name={item.icon as AboutIconName} />
                </span>
                <h3 className="mt-4 text-xl leading-snug font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 text-body text-pretty text-text-secondary">
                  {item.body}
                </p>
              </CardSurface>
            ))}
          </ul>
        </div>
      </PageContainer>
    </Section>
  );
}
