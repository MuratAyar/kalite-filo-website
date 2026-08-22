import { PageContainer, Section } from "@/components/layout";
import { CardSurface, SectionHeading } from "@/components/ui";
import { aboutPageContent } from "@/data/about";

import { AboutIcon, type AboutIconName } from "./about-icon";

export function WhyKaliteFilo({
  content,
}: {
  content: typeof aboutPageContent.why;
}) {
  return (
    <Section
      aria-labelledby="why-kalite-filo-title"
      className="border-y border-border-subtle"
      data-about-section="why-kalite-filo"
      surface="card"
    >
      <PageContainer>
        <SectionHeading
          align="center"
          className="mx-auto"
          description={content.intro}
          headingId="why-kalite-filo-title"
          title={content.title}
        />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {content.items.map((item) => (
            <CardSurface as="li" className="min-w-0" key={item.id}>
              <span className="flex size-12 items-center justify-center rounded-control bg-surface-muted text-corporate-blue">
                <AboutIcon name={item.icon as AboutIconName} />
              </span>
              <h3 className="mt-5 text-xl leading-snug font-semibold text-text-primary">
                {item.title}
              </h3>
              <p className="mt-3 text-body text-pretty text-text-secondary">
                {item.body}
              </p>
            </CardSurface>
          ))}
        </ul>
      </PageContainer>
    </Section>
  );
}

