import { APPROVED_ROUTES } from "@/config/routes";
import {
  articleCategories,
  articles,
  contactInformation,
  faqCategories,
  faqEntries,
  legalPages,
  navigationItems,
  siteIdentity,
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

/**
 * Runs when the static root layout is evaluated. It deliberately validates only
 * structural facts that can be proven from repository-owned build-time data.
 */
export function validateFoundationContent(): void {
  validateSlugs(vehicles, "vehicle");
  validateSlugs(articleCategories, "article category");
  validateSlugs(articles, "article");
  validateSlugs(faqCategories, "FAQ category");
  validateIds(faqEntries, "FAQ entry");
  validateIds(legalPages, "legal page");

  const articleCategoryIds = new Set(articleCategories.map(({ id }) => id));
  for (const article of articles) {
    if (!articleCategoryIds.has(article.categoryId)) {
      throw new ContentValidationError(
        `Article ${article.id} references an unknown category.`,
      );
    }
    assertMediaAsset(article.coverImage, `article ${article.id} cover image`);
    asIsoDate(article.publishedAt, `article ${article.id} publishedAt`);
    if (article.updatedAt) {
      asIsoDate(article.updatedAt, `article ${article.id} updatedAt`);
    }
    for (const source of article.sources) {
      asHttpsUrl(source.href, `article ${article.id} source`);
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

  const faqCategoryIds = new Set(faqCategories.map(({ id }) => id));
  for (const entry of faqEntries) {
    if (!faqCategoryIds.has(entry.categoryId)) {
      throw new ContentValidationError(
        `FAQ entry ${entry.id} references an unknown category.`,
      );
    }
    assertNonEmptyString(entry.question, `FAQ entry ${entry.id} question`);
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
