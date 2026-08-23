import { PageContainer, Section } from "@/components/layout";
import { aboutPageContent } from "@/data/about";

import { AboutIcon, type AboutIconName } from "./about-icon";

type VisionMissionValuesProps = {
  content: typeof aboutPageContent.visionMissionValues;
};

export function VisionMissionValues({ content }: VisionMissionValuesProps) {
  const statements = [content.vision, content.mission] as const;

  return (
    <Section
      aria-labelledby="vision-mission-values-title"
      className="scroll-mt-28 pt-0"
      data-about-section="vision-mission-values"
      id="vizyon-misyon-degerler"
      surface="page"
    >
      <PageContainer>
        <h2 className="sr-only" id="vision-mission-values-title">
          {content.title}
        </h2>

        <div className="relative isolate overflow-hidden rounded-panel border border-border-subtle bg-brand-navy px-4 py-8 shadow-sm sm:px-6 sm:py-10 lg:px-10 lg:py-12">
          {/* The user-supplied vehicle photograph is decorative context. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-20 size-full object-cover object-center"
            height="768"
            src="/images/about/volvo-xc90-vision-mission.png"
            width="1376"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-brand-navy/55"
          />

          <div className="grid gap-5 md:grid-cols-2">
            {statements.map((statement) => (
              <article
                className="rounded-card border border-white/15 bg-brand-navy/80 p-6 text-text-inverse shadow-sm backdrop-blur-sm sm:p-8"
                key={statement.id}
              >
                <span className="inline-flex size-11 items-center justify-center rounded-control bg-accent-orange/20 text-accent-orange">
                  <AboutIcon name={statement.icon as AboutIconName} />
                </span>
                <h3 className="mt-5 text-heading-md font-semibold">
                  {statement.title}
                </h3>
                <p className="mt-3 max-w-xl text-body text-pretty text-text-inverse-muted">
                  {statement.body}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-panel border border-border-subtle bg-surface-card p-6 sm:p-8 lg:p-10">
          <div className="text-center">
            <h3 className="text-heading-lg font-semibold text-text-primary">
              {content.values.title}
            </h3>
            <p className="mt-2 text-label tracking-wide text-orange-dark uppercase">
              {content.values.eyebrow}
            </p>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.values.items.map((value) => (
              <li
                className="flex min-h-20 items-center gap-4 rounded-card border border-border-subtle bg-surface-card p-4 text-label font-semibold text-text-primary"
                key={value.id}
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-control bg-orange-light text-orange-dark">
                  <AboutIcon name={value.icon as AboutIconName} />
                </span>
                <span className="min-w-0 text-pretty">{value.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </PageContainer>
    </Section>
  );
}
