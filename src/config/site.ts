export type SiteDeployTarget = "production" | "staging";

export interface SiteEnvironment {
  readonly target: SiteDeployTarget;
  readonly origin: string;
  readonly allowsCrawling: boolean;
  readonly allowsSearchIndexing: boolean;
}

const SITE_ENVIRONMENTS: Readonly<
  Record<SiteDeployTarget, Omit<SiteEnvironment, "target">>
> = {
  production: {
    origin: "https://kalitefilo.com.tr",
    allowsCrawling: true,
    allowsSearchIndexing: true,
  },
  staging: {
    origin: "https://staging.kalitefilo.com.tr",
    allowsCrawling: false,
    allowsSearchIndexing: false,
  },
};

export function getSiteEnvironment(): SiteEnvironment {
  const configuredTarget = process.env.KALITE_FILO_DEPLOY_TARGET;

  if (configuredTarget === undefined) {
    return { target: "staging", ...SITE_ENVIRONMENTS.staging };
  }

  if (configuredTarget !== "production" && configuredTarget !== "staging") {
    throw new Error(
      "KALITE_FILO_DEPLOY_TARGET must be either production or staging.",
    );
  }

  return {
    target: configuredTarget,
    ...SITE_ENVIRONMENTS[configuredTarget],
  };
}
