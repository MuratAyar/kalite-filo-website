import type { HomeSolutionsCopy, InternalPath } from "@/types";
import Link from "next/link";

import { PageContainer, Section, Stack } from "@/components/layout";
import { CardSurface, SectionHeading } from "@/components/ui";

import { HomeIcon, type HomeIconName } from "./home-icon";

export type FleetSolutionsProps = {
  content: HomeSolutionsCopy;
  quoteHref: InternalPath;
  vehiclesHref: InternalPath;
};

const solutionIcons: readonly HomeIconName[] = [
  "calendar",
  "settings",
  "truck",
  "car",
];

export function FleetSolutions({
  content,
  quoteHref,
  vehiclesHref,
}: FleetSolutionsProps) {
  return (
    <Section aria-labelledby="fleet-solutions-title" surface="page">
      <PageContainer>
        <Stack gap="2xl">
          <SectionHeading
            align="center"
            className="mx-auto"
            description={content.intro}
            headingId="fleet-solutions-title"
            title={content.title}
          />
          <ul className="mobile-card-track grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {content.items.map((solution, index) => (
              <li className="mobile-one-half-card min-w-0" key={solution.id}>
                <Link
                  className="group block h-full rounded-card no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  data-fleet-solution-card="true"
                  href={
                    solution.destination === "vehicles"
                      ? vehiclesHref
                      : quoteHref
                  }
                >
                  <CardSurface
                    as="article"
                    className="flex h-full flex-col transition-colors group-hover:border-border-control group-focus-visible:border-corporate-blue motion-reduce:transition-none"
                    padding="default"
                  >
                    <span className="mb-6 flex size-12 items-center justify-center rounded-control border border-border-subtle bg-surface-muted text-corporate-blue">
                      <HomeIcon name={solutionIcons[index] ?? "compass"} />
                    </span>
                    <h3 className="text-xl font-semibold text-balance text-text-primary">
                      {solution.title}
                    </h3>
                    <p className="mt-3 flex-1 text-body text-pretty text-text-secondary">
                      {solution.body}
                    </p>
                    <span className="mt-5 inline-flex min-h-11 items-center self-start font-semibold text-corporate-blue no-underline">
                      {solution.action.label}
                      <span aria-hidden="true" className="ml-2">
                        →
                      </span>
                    </span>
                  </CardSurface>
                </Link>
              </li>
            ))}
          </ul>
        </Stack>
      </PageContainer>
    </Section>
  );
}
