import { PageContainer, Section } from "@/components/layout";
import { SectionHeading } from "@/components/ui";
import type { HomeWhyCopy } from "@/types";

import { HomeIcon, type HomeIconName } from "./home-icon";

export type WhyKaliteFiloProps = {
  content: HomeWhyCopy;
  imageAlt?: string;
};

const stepIcons: readonly HomeIconName[] = [
  "compass",
  "car",
  "clipboard",
];

export function WhyKaliteFilo({ content, imageAlt = "Filo planlamasını temsil eden yerleşim görseli" }: WhyKaliteFiloProps) {
  return (
    <Section
      aria-labelledby="why-kalite-filo-title"
      className="pt-16 md:pt-20 lg:pt-24"
      spacing="none"
      surface="page"
    >
      <PageContainer>
        <div
          className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
          data-why-layout="unframed"
        >
          <div>
            <SectionHeading
              description={content.intro}
              headingId="why-kalite-filo-title"
              title={content.title}
            />
            <ol className="mt-7 space-y-5">
              {content.steps.map((step, index) => (
                <li className="flex gap-4" key={step.id}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-surface-muted text-corporate-blue">
                    <HomeIcon name={stepIcons[index] ?? "compass"} />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-body font-semibold text-text-primary">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-body text-pretty text-text-secondary">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative aspect-video min-h-0 overflow-hidden rounded-card border border-border-subtle bg-surface-muted md:min-h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={imageAlt}
              className="size-full object-cover"
              height="720"
              loading="lazy"
              src="/images/home/fleet-campus.jpg"
              width="1280"
            />
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}
