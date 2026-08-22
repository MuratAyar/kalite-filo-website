import { APPROVED_ROUTES } from "@/config/routes";
import {
  aboutPageContent,
  articleCategories,
  articles,
  contactInformation,
  faqCategories,
  faqEntries,
  homePageCopy,
  legalPages,
  navigationItems,
  siteIdentity,
  vehiclePortfolio,
  vehicles,
} from "@/data";
import type { EntityId, Slug } from "@/types";

import {
  asEntityId,
  asHttpsUrl,
  asInternalPath,
  asIsoDate,
  asSlug,
  assertMediaAsset,
  assertNonEmptyString,
  assertUniqueBy,
  ContentValidationError,
} from "./validation";

type IdentifiedRecord = { readonly id: EntityId | string };
type SluggedRecord = IdentifiedRecord & { readonly slug: Slug | string };

function validateIds(records: readonly IdentifiedRecord[], name: string): void {
  for (const record of records) {
    asEntityId(record.id, `${name} id`);
  }
}

function validateSlugs(records: readonly SluggedRecord[], name: string): void {
  validateIds(records, name);
  for (const record of records) {
    asSlug(record.slug, `${name} slug`);
  }
}

function validateHomeCopy(): void {
  const copyFields = [
    ["Home hero title", homePageCopy.hero.title],
    ["Home hero intro", homePageCopy.hero.intro],
    ["Home hero primary action", homePageCopy.hero.primaryAction.label],
    ["Home hero secondary action", homePageCopy.hero.secondaryAction.label],
    ["Home finder title", homePageCopy.hero.finder.title],
    ["Home finder body", homePageCopy.hero.finder.body],
    ["Home finder action", homePageCopy.hero.finder.action.label],
    ["Home featured vehicles title", homePageCopy.featuredVehicles.title],
    ["Home featured vehicles intro", homePageCopy.featuredVehicles.intro],
    [
      "Home featured vehicles empty title",
      homePageCopy.featuredVehicles.emptyState.title,
    ],
    [
      "Home featured vehicles empty body",
      homePageCopy.featuredVehicles.emptyState.body,
    ],
    [
      "Home featured vehicles empty action",
      homePageCopy.featuredVehicles.emptyState.action.label,
    ],
    ["Home commercial title", homePageCopy.commercial.title],
    ["Home commercial body", homePageCopy.commercial.body],
    ["Home commercial action", homePageCopy.commercial.action.label],
    ["Home why title", homePageCopy.why.title],
    ["Home why intro", homePageCopy.why.intro],
    ["Home solutions title", homePageCopy.solutions.title],
    ["Home solutions intro", homePageCopy.solutions.intro],
    ["Home conversion eyebrow", homePageCopy.conversion.eyebrow],
    ["Home conversion title", homePageCopy.conversion.title],
    ["Home conversion body", homePageCopy.conversion.body],
    ["Home conversion action", homePageCopy.conversion.action.label],
    ["Home editorial title", homePageCopy.editorial.title],
    ["Home editorial intro", homePageCopy.editorial.intro],
    ["Home editorial empty title", homePageCopy.editorial.emptyState.title],
    ["Home editorial empty body", homePageCopy.editorial.emptyState.body],
    ["Home editorial all action", homePageCopy.editorial.allAction.label],
  ] as const;

  for (const [fieldName, value] of copyFields) {
    assertNonEmptyString(value, fieldName);
  }

  assertUniqueBy(homePageCopy.why.steps, (step) => step.id, "Home step ids");
  for (const step of homePageCopy.why.steps) {
    asEntityId(step.id, "Home step id");
    assertNonEmptyString(step.title, `Home step ${step.id} title`);
    assertNonEmptyString(step.body, `Home step ${step.id} body`);
  }

  assertUniqueBy(
    homePageCopy.solutions.items,
    (solution) => solution.id,
    "Home solution ids",
  );
  for (const solution of homePageCopy.solutions.items) {
    asEntityId(solution.id, "Home solution id");
    assertNonEmptyString(solution.title, `Home solution ${solution.id} title`);
    assertNonEmptyString(solution.body, `Home solution ${solution.id} body`);
    assertNonEmptyString(
      solution.action.label,
      `Home solution ${solution.id} action`,
    );
    if (
      solution.destination !== "vehicles" &&
      solution.destination !== "quote"
    ) {
      throw new ContentValidationError(
        `Home solution ${solution.id} has an unsupported destination.`,
      );
    }
  }

  if (
    homePageCopy.publicationStatus !== "draft" &&
    homePageCopy.publicationStatus !== "approved"
  ) {
    throw new ContentValidationError(
      "Home copy has an unsupported publication status.",
    );
  }

  const homeRoute = APPROVED_ROUTES.find((route) => route.id === "home");
  if (!homeRoute) {
    throw new ContentValidationError("The approved route registry is missing Home.");
  }

  if (
    homeRoute.status === "published" &&
    homePageCopy.publicationStatus !== "approved"
  ) {
    throw new ContentValidationError(
      "Home cannot be published while its page copy remains draft.",
    );
  }
}

function validateAboutCopy(): void {
  const copyFields = [
    ["About metadata description", aboutPageContent.metadata.description],
    ["About hero eyebrow", aboutPageContent.hero.eyebrow],
    ["About hero title lead", aboutPageContent.hero.titleLead],
    ["About hero title accent", aboutPageContent.hero.titleAccent],
    ["About hero body", aboutPageContent.hero.body],
    ["About hero primary action", aboutPageContent.hero.primaryAction],
    ["About hero secondary action", aboutPageContent.hero.secondaryAction],
    ["About vision and mission title", aboutPageContent.visionMissionValues.title],
    ["About vision title", aboutPageContent.visionMissionValues.vision.title],
    ["About vision body", aboutPageContent.visionMissionValues.vision.body],
    ["About mission title", aboutPageContent.visionMissionValues.mission.title],
    ["About mission body", aboutPageContent.visionMissionValues.mission.body],
    ["About values title", aboutPageContent.visionMissionValues.values.title],
    ["About values eyebrow", aboutPageContent.visionMissionValues.values.eyebrow],
    ["About operational title", aboutPageContent.operational.title],
    ["About operational intro", aboutPageContent.operational.intro],
    ["About network title", aboutPageContent.network.title],
    ["About network intro", aboutPageContent.network.intro],
    ["About why title", aboutPageContent.why.title],
    ["About why intro", aboutPageContent.why.intro],
    ["About editorial title", aboutPageContent.editorial.title],
    ["About editorial intro", aboutPageContent.editorial.intro],
    ["About editorial action", aboutPageContent.editorial.allAction.label],
  ] as const;

  for (const [fieldName, value] of copyFields) {
    assertNonEmptyString(value, fieldName);
  }

  assertUniqueBy(
    aboutPageContent.hero.statistics,
    (statistic) => statistic.id,
    "About statistic ids",
  );
  for (const statistic of aboutPageContent.hero.statistics) {
    asEntityId(statistic.id, "About statistic id");
    assertNonEmptyString(statistic.value, `About statistic ${statistic.id} value`);
    assertNonEmptyString(statistic.label, `About statistic ${statistic.id} label`);
  }

  const visionMissionStatements = [
    aboutPageContent.visionMissionValues.vision,
    aboutPageContent.visionMissionValues.mission,
  ] as const;
  assertUniqueBy(
    visionMissionStatements,
    (statement) => statement.id,
    "About vision and mission ids",
  );
  for (const statement of visionMissionStatements) {
    asEntityId(statement.id, "About vision and mission id");
    assertNonEmptyString(statement.icon, `About ${statement.id} icon`);
  }

  assertUniqueBy(
    aboutPageContent.visionMissionValues.values.items,
    (value) => value.id,
    "About value ids",
  );
  for (const value of aboutPageContent.visionMissionValues.values.items) {
    asEntityId(value.id, "About value id");
    assertNonEmptyString(value.icon, `About value ${value.id} icon`);
    assertNonEmptyString(value.title, `About value ${value.id} title`);
  }

  const aboutItemGroups: readonly [
    string,
    readonly {
      readonly id: string;
      readonly icon: string;
      readonly title: string;
      readonly body: string;
    }[],
  ][] = [
    ["operational", aboutPageContent.operational.items],
    ["network", aboutPageContent.network.items],
    ["why", aboutPageContent.why.items],
  ];
  for (const [groupName, items] of aboutItemGroups) {
    assertUniqueBy(items, (item) => item.id, `About ${groupName} ids`);
    for (const item of items) {
      asEntityId(item.id, `About ${groupName} item id`);
      assertNonEmptyString(item.title, `About ${groupName} ${item.id} title`);
      assertNonEmptyString(item.body, `About ${groupName} ${item.id} body`);
      assertNonEmptyString(item.icon, `About ${groupName} ${item.id} icon`);
    }
  }

  if (
    aboutPageContent.publicationStatus !== "draft" &&
    aboutPageContent.publicationStatus !== "approved"
  ) {
    throw new ContentValidationError(
      "About copy has an unsupported publication status.",
    );
  }

  assertUniqueBy(
    aboutPageContent.editorial.articleIds,
    (articleId) => articleId,
    "About editorial article ids",
  );
  const articleIds = new Set<string>(articles.map(({ id }) => id));
  for (const articleId of aboutPageContent.editorial.articleIds) {
    asEntityId(articleId, "About editorial article id");
    if (!articleIds.has(articleId)) {
      throw new ContentValidationError(
        `About editorial references unknown article ${articleId}.`,
      );
    }
  }

  const aboutRoute = APPROVED_ROUTES.find((route) => route.id === "about");
  if (!aboutRoute) {
    throw new ContentValidationError(
      "The approved route registry is missing About.",
    );
  }
  if (
    aboutRoute.status === "published" &&
    String(aboutPageContent.publicationStatus) !== "approved"
  ) {
    throw new ContentValidationError(
      "About cannot be published while its page copy remains draft.",
    );
  }
}

/**
 * Runs when the static root layout is evaluated. It deliberately validates only
 * structural facts that can be proven from repository-owned build-time data.
 */
export function validateFoundationContent(): void {
  validateHomeCopy();
  validateAboutCopy();
  validateSlugs(vehicles, "vehicle");
  validateSlugs(vehiclePortfolio, "vehicle portfolio");
  validateSlugs(articleCategories, "article category");
  validateSlugs(articles, "article");
  validateSlugs(faqCategories, "FAQ category");
  validateIds(faqEntries, "FAQ entry");
  validateIds(legalPages, "legal page");

  const articleCategoryIds = new Set(articleCategories.map(({ id }) => id));
  if (articles.length !== 18) {
    throw new ContentValidationError(
      "The approved Filo Rehberi source must contain exactly 18 articles.",
    );
  }
  if (articles.filter((article) => article.featured).length !== 1) {
    throw new ContentValidationError(
      "The approved Filo Rehberi source must contain exactly one featured article.",
    );
  }
  for (const category of articleCategories) {
    assertNonEmptyString(category.label, `article category ${category.id} label`);
    if (
      articles.filter((article) => article.categoryId === category.id).length !== 3
    ) {
      throw new ContentValidationError(
        `Article category ${category.id} must contain exactly three supplied articles.`,
      );
    }
  }
  for (const article of articles) {
    if (!articleCategoryIds.has(article.categoryId)) {
      throw new ContentValidationError(
        `Article ${article.id} references an unknown category.`,
      );
    }
    if (article.coverImage) {
      assertMediaAsset(article.coverImage, `article ${article.id} cover image`);
    }
    assertNonEmptyString(article.title, `article ${article.id} title`);
    assertNonEmptyString(article.excerpt, `article ${article.id} excerpt`);
    asEntityId(article.contentKey, `article ${article.id} contentKey`);
    article.tagIds.forEach((tagId) =>
      asEntityId(tagId, `article ${article.id} tag id`),
    );
    if (!Number.isInteger(article.readingMinutes) || article.readingMinutes <= 0) {
      throw new ContentValidationError(
        `Article ${article.id} readingMinutes must be a positive integer.`,
      );
    }
    if (typeof article.featured !== "boolean") {
      throw new ContentValidationError(
        `Article ${article.id} featured must be a boolean.`,
      );
    }
    if (article.author) {
      assertNonEmptyString(
        article.author.displayName,
        `article ${article.id} author displayName`,
      );
    }
    asIsoDate(article.publishedAt, `article ${article.id} publishedAt`);
    if (article.updatedAt) {
      asIsoDate(article.updatedAt, `article ${article.id} updatedAt`);
    }
    for (const source of article.sources) {
      assertNonEmptyString(source.label, `article ${article.id} source label`);
      asHttpsUrl(source.href, `article ${article.id} source`);
    }
    assertNonEmptyString(article.seo.title, `article ${article.id} SEO title`);
    if (article.seo.description) {
      assertNonEmptyString(
        article.seo.description,
        `article ${article.id} SEO description`,
      );
    }
  }

  for (const vehicle of vehicles) {
    assertMediaAsset(vehicle.coverImage, `vehicle ${vehicle.id} cover image`);
    vehicle.galleryImages.forEach((asset, index) =>
      assertMediaAsset(asset, `vehicle ${vehicle.id} gallery image ${index}`),
    );
    if (vehicle.offer) {
      const positiveOfferNumbers = [
        vehicle.offer.amountMinor,
        vehicle.offer.termMonths,
        vehicle.offer.annualKilometres,
        vehicle.offer.vehicleQuantity,
      ];
      if (positiveOfferNumbers.some((value) => !Number.isInteger(value) || value <= 0)) {
        throw new ContentValidationError(
          `Vehicle ${vehicle.id} offer values must be positive integers.`,
        );
      }
      asIsoDate(vehicle.offer.validFrom, `vehicle ${vehicle.id} offer validFrom`);
      asIsoDate(vehicle.offer.validUntil, `vehicle ${vehicle.id} offer validUntil`);
      asIsoDate(vehicle.offer.verifiedAt, `vehicle ${vehicle.id} offer verifiedAt`);
      assertNonEmptyString(
        vehicle.offer.disclaimer,
        `vehicle ${vehicle.id} offer disclaimer`,
      );
    }
  }

  if (vehiclePortfolio.length !== 32) {
    throw new ContentValidationError(
      "The owner-supplied vehicle portfolio must contain exactly 32 records.",
    );
  }

  assertUniqueBy(
    vehiclePortfolio,
    (vehicle) => vehicle.sourceId,
    "vehicle portfolio source ids",
  );

  const featuredPortfolioVehicles = vehiclePortfolio.filter(
    ({ featured }) => featured,
  );
  if (featuredPortfolioVehicles.length !== 4) {
    throw new ContentValidationError(
      "The Home vehicle portfolio must contain exactly four featured records.",
    );
  }

  for (const vehicle of vehiclePortfolio) {
    if (!/^KF-\d{3}$/.test(vehicle.sourceId)) {
      throw new ContentValidationError(
        `Vehicle portfolio ${vehicle.id} has a malformed source id.`,
      );
    }
    if (
      vehicle.contentStatus !== "owner-supplied" ||
      vehicle.sourceStatus !== "active" ||
      vehicle.priceStatus !== "owner-approved-list-net"
    ) {
      throw new ContentValidationError(
        `Vehicle portfolio ${vehicle.id} has an unsupported source or price state.`,
      );
    }

    if (
      !Number.isSafeInteger(vehicle.listPrice.amountMinor) ||
      vehicle.listPrice.amountMinor <= 0 ||
      vehicle.listPrice.amountMinor % 100 !== 0 ||
      vehicle.listPrice.currency !== "TRY" ||
      vehicle.listPrice.billingPeriod !== "month" ||
      vehicle.listPrice.vatTreatment !== "excluded" ||
      vehicle.listPrice.sourceKind !== "recommended-list-net"
    ) {
      throw new ContentValidationError(
        `Vehicle portfolio ${vehicle.id} has an invalid owner-approved monthly list-net price.`,
      );
    }
    if (vehicle.modelYearLabel !== "2025/2026") {
      throw new ContentValidationError(
        `Vehicle portfolio ${vehicle.id} must preserve the supplied model-year label.`,
      );
    }

    for (const [name, value] of [
      ["make", vehicle.make],
      ["model", vehicle.model],
      ["trim", vehicle.trim],
      ["category", vehicle.categoryLabel],
      ["segment", vehicle.segmentLabel],
      ["fuel", vehicle.fuelLabel],
      ["transmission", vehicle.transmissionLabel],
      ["summary", vehicle.summary],
    ] as const) {
      assertNonEmptyString(value, `vehicle portfolio ${vehicle.id} ${name}`);
    }

    vehicle.featureLabels.forEach((label, index) =>
      assertNonEmptyString(
        label,
        `vehicle portfolio ${vehicle.id} feature ${index}`,
      ),
    );

    for (const [name, value] of [
      ["powerHp", vehicle.powerHp],
      ["seats", vehicle.seats],
    ] as const) {
      if (value !== null && (!Number.isInteger(value) || value <= 0)) {
        throw new ContentValidationError(
          `Vehicle portfolio ${vehicle.id} ${name} must be null or a positive integer.`,
        );
      }
    }

    if (Boolean(vehicle.coverImage) !== Boolean(vehicle.imageLicense)) {
      throw new ContentValidationError(
        `Vehicle portfolio ${vehicle.id} media and licence record must be provided together.`,
      );
    }

    if (vehicle.featured && (!vehicle.coverImage || !vehicle.imageLicense)) {
      throw new ContentValidationError(
        `Featured vehicle portfolio ${vehicle.id} requires local media and a verified licence record.`,
      );
    }

    if (vehicle.coverImage && vehicle.imageLicense) {
      assertMediaAsset(
        vehicle.coverImage,
        `vehicle portfolio ${vehicle.id} cover image`,
      );
      assertNonEmptyString(
        vehicle.imageLicense.creator,
        `vehicle portfolio ${vehicle.id} image creator`,
      );
      assertNonEmptyString(
        vehicle.imageLicense.licenseName,
        `vehicle portfolio ${vehicle.id} image licence`,
      );
      assertNonEmptyString(
        vehicle.imageLicense.localDerivativeNote,
        `vehicle portfolio ${vehicle.id} image derivative note`,
      );
      asHttpsUrl(
        vehicle.imageLicense.sourcePage,
        `vehicle portfolio ${vehicle.id} image source`,
      );
      asHttpsUrl(
        vehicle.imageLicense.licenseUrl,
        `vehicle portfolio ${vehicle.id} image licence URL`,
      );
    }
  }

  const faqCategoryIds = new Set(faqCategories.map(({ id }) => id));
  for (const category of faqCategories) {
    assertNonEmptyString(category.label, `FAQ category ${category.id} label`);
  }
  for (const entry of faqEntries) {
    if (!faqCategoryIds.has(entry.categoryId)) {
      throw new ContentValidationError(
        `FAQ entry ${entry.id} references an unknown category.`,
      );
    }
    assertNonEmptyString(entry.question, `FAQ entry ${entry.id} question`);
    if (entry.answerParagraphs.length === 0) {
      throw new ContentValidationError(
        `FAQ entry ${entry.id} must contain at least one answer paragraph.`,
      );
    }
    for (const paragraph of entry.answerParagraphs) {
      assertNonEmptyString(paragraph, `FAQ entry ${entry.id} answer paragraph`);
    }
    if (!Number.isInteger(entry.order) || entry.order < 0) {
      throw new ContentValidationError(
        `FAQ entry ${entry.id} order must be a non-negative integer.`,
      );
    }
  }

  for (const page of legalPages) {
    asInternalPath(page.path, `legal page ${page.id} path`);
    asIsoDate(page.effectiveAt, `legal page ${page.id} effectiveAt`);
  }

  const publishedRouteIds = new Set(
    APPROVED_ROUTES.filter(({ status }) => status === "published").map(
      ({ id }) => id,
    ),
  );
  for (const item of navigationItems) {
    asEntityId(item.id, "navigation item id");
    assertNonEmptyString(item.label, `navigation item ${item.id} label`);
    if (item.kind === "internal" && !publishedRouteIds.has(item.routeId)) {
      throw new ContentValidationError(
        `Navigation item ${item.id} references an unpublished or unknown route.`,
      );
    }
    if (item.kind === "external") {
      asHttpsUrl(item.href, `navigation item ${item.id} href`);
    }
  }

  if (siteIdentity) {
    assertNonEmptyString(siteIdentity.brandName, "site identity brandName");
    assertNonEmptyString(siteIdentity.defaultTitle, "site identity defaultTitle");
  }

  if (contactInformation) {
    validateIds(contactInformation.phones, "phone contact");
    validateIds(contactInformation.emails, "email contact");
    contactInformation.socialLinks?.forEach((link) =>
      asHttpsUrl(link.href, `social link ${link.id} href`),
    );
  }
}
