import type { PublicationStatus } from "./primitives";

export type HomeSolutionDestination = "quote" | "vehicles";

export interface HomeActionCopy {
  readonly label: string;
}

export interface HomeHeroCopy {
  readonly title: string;
  readonly intro: string;
  readonly primaryAction: HomeActionCopy;
  readonly secondaryAction: HomeActionCopy;
  readonly finder: {
    readonly title: string;
    readonly body: string;
    readonly action: HomeActionCopy;
  };
}

export interface HomeEmptyStateCopy {
  readonly title: string;
  readonly body: string;
  readonly action: HomeActionCopy;
}

export interface HomeFeaturedVehiclesCopy {
  readonly title: string;
  readonly intro: string;
  readonly emptyState: HomeEmptyStateCopy;
}

export interface HomeCommercialCopy {
  readonly title: string;
  readonly body: string;
  readonly action: HomeActionCopy;
}

export interface HomeProcessStepCopy {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

export interface HomeWhyCopy {
  readonly title: string;
  readonly intro: string;
  readonly steps: readonly HomeProcessStepCopy[];
}

export interface HomeSolutionCopy {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly destination: HomeSolutionDestination;
  readonly action: HomeActionCopy;
}

export interface HomeSolutionsCopy {
  readonly title: string;
  readonly intro: string;
  readonly items: readonly HomeSolutionCopy[];
}

export interface HomeConversionCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly action: HomeActionCopy;
}

export interface HomeEditorialCopy {
  readonly title: string;
  readonly intro: string;
  readonly emptyState: Omit<HomeEmptyStateCopy, "action">;
  readonly allAction: HomeActionCopy;
}

/**
 * Repository-owned Home wording. A draft record may be rendered for review on
 * an unpublished route, but it cannot pass validation once Home is published.
 */
export interface HomePageCopy {
  readonly publicationStatus: PublicationStatus;
  readonly hero: HomeHeroCopy;
  readonly featuredVehicles: HomeFeaturedVehiclesCopy;
  readonly commercial: HomeCommercialCopy;
  readonly why: HomeWhyCopy;
  readonly solutions: HomeSolutionsCopy;
  readonly conversion: HomeConversionCopy;
  readonly editorial: HomeEditorialCopy;
}
