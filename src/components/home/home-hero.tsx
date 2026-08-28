import type {
  HomeHeroCopy,
  InternalPath,
  VehiclePortfolioRecord,
} from "@/types";

import { PageContainer } from "@/components/layout";
import { ActionLink } from "@/components/ui";
import { buildVehicleFinderOptions } from "@/lib/vehicle-finder-options.mjs";

import { QuickVehicleFinder } from "./quick-vehicle-finder";

export type HomeHeroProps = {
  content: HomeHeroCopy;
  locale?: "en" | "tr";
  quoteHref: InternalPath;
  vehicles: readonly VehiclePortfolioRecord[];
  vehiclesHref: InternalPath;
};

export function HomeHero({
  content,
  locale,
  quoteHref,
  vehicles,
  vehiclesHref,
}: HomeHeroProps) {
  const finderOptions = buildVehicleFinderOptions(vehicles);

  return (
    <section
      aria-labelledby="home-hero-title"
      className="home-hero relative isolate overflow-hidden bg-brand-navy text-text-inverse"
    >
      {/* The local image is atmospheric; the heading carries the section meaning. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 size-full object-cover object-center"
        height="900"
        src="/images/home/hero-fleet-highway.jpg"
        width="1600"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(12,19,34,0.96)_0%,rgba(24,33,54,0.82)_48%,rgba(24,33,54,0.32)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-brand-navy/55 to-transparent"
      />
      <PageContainer className="relative z-10 py-6 sm:py-20 lg:min-h-[38rem] lg:py-24 xl:min-h-[43.75rem]">
        <div className="grid min-h-full items-center gap-5 sm:gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)] xl:gap-16">
          <div className="max-w-4xl">
            <h1
              className="max-w-4xl text-display font-bold text-balance text-text-inverse"
              id="home-hero-title"
            >
              {content.title}
            </h1>
            <p className="mt-3 max-w-2xl text-body-lg text-pretty text-text-inverse-muted sm:mt-6 sm:text-xl">
              {content.intro}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-8 sm:flex sm:flex-row sm:flex-wrap sm:gap-4">
              <ActionLink
                className="w-full px-2 sm:w-auto sm:min-w-44 sm:px-6"
                href={quoteHref}
                size="primary"
                variant="primary"
              >
                {content.primaryAction.label}
                <span aria-hidden="true">→</span>
              </ActionLink>
              <ActionLink
                className="w-full px-2 sm:w-auto sm:min-w-48 sm:px-6"
                href={vehiclesHref}
                size="primary"
                variant="outline-inverse"
              >
                {content.secondaryAction.label}
                <span aria-hidden="true">→</span>
              </ActionLink>
            </div>
          </div>
          <QuickVehicleFinder
            actionHref={vehiclesHref}
            actionLabel={content.finder.action.label}
            description={content.finder.body}
            locale={locale}
            options={finderOptions}
            title={content.finder.title}
          />
        </div>
      </PageContainer>
    </section>
  );
}
