import { PageContainer, Section } from "@/components/layout";
import { ActionLink, Button } from "@/components/ui";
import { aboutPageContent } from "@/data/about";

import { AboutIcon } from "./about-icon";

export type AboutHeroProps = {
  content: typeof aboutPageContent.hero;
};

export function AboutHero({ content }: AboutHeroProps) {
  return (
    <Section
      aria-labelledby="about-hero-title"
      className="pb-section"
      data-about-section="hero"
      spacing="none"
      surface="page"
    >
      <PageContainer>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 xl:gap-16">
          <div className="max-w-2xl">
            <p className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-surface-muted px-4 py-2 text-label font-semibold tracking-wide text-text-secondary uppercase">
              <AboutIcon name="briefcase" />
              {content.eyebrow}
            </p>
            <h2
              className="mt-7 text-heading-lg font-semibold text-balance text-text-primary"
              id="about-hero-title"
            >
              {content.titleLead}
              <span className="block text-corporate-blue">
                {content.titleAccent}
              </span>
            </h2>
            <p className="mt-6 text-body-lg text-pretty text-text-secondary">
              {content.body}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button data-about-hero-control="milestones" size="primary" variant="secondary">
                {content.primaryAction}
              </Button>
              <ActionLink
                data-about-hero-control="vision"
                href="#vizyon-misyon-degerler"
                size="secondary"
                variant="outline"
              >
                {content.secondaryAction}
                <span aria-hidden="true">→</span>
              </ActionLink>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:grid-rows-2">
            <figure className="relative min-h-72 overflow-hidden rounded-card border border-border-subtle bg-surface-muted sm:col-span-2 sm:min-h-96 lg:col-span-1 lg:row-span-2 lg:min-h-[34rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Ticari araçların bulunduğu kurumsal araç sahası"
                className="absolute inset-0 size-full object-cover"
                height="800"
                src="/images/home/commercial-fleet.jpg"
                width="1200"
              />
            </figure>
            <figure className="relative min-h-48 overflow-hidden rounded-card border border-border-subtle bg-surface-muted sm:min-h-56 lg:min-h-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Şehir yolunda hareket eden kurumsal otomobil"
                className="absolute inset-0 size-full object-cover"
                height="900"
                src="/images/home/hero-fleet-highway.jpg"
                width="1600"
              />
            </figure>
            <div className="flex min-h-48 flex-col justify-center gap-7 rounded-card bg-corporate-blue p-6 text-text-inverse sm:min-h-56 lg:min-h-0 lg:p-7">
              {content.statistics.map((statistic) => (
                <div data-about-statistic={statistic.id} key={statistic.id}>
                  <p className="text-heading-lg font-semibold tabular-nums">
                    {statistic.value}
                  </p>
                  <p className="mt-1 text-body text-text-inverse-muted">
                    {statistic.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}
