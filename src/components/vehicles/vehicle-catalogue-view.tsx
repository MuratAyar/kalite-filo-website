import type { ChangeEvent } from "react";

import type { VehiclePortfolioRecord } from "@/types";
import type {
  VehicleCatalogueCandidateFilters,
  VehicleCatalogueFilters,
} from "@/lib/vehicle-catalogue-filters.mjs";

const VEHICLE_CATALOGUE_PATH = "/arac-listesi/";

import { Button } from "@/components/ui";
import {
  VehicleCardFacts,
  getVehicleCardImage,
  VehicleListPrice,
} from "@/components/vehicles/vehicle-card-details";
import {
  buildVehicleCatalogueOptions,
  filterVehicleCatalogue,
  serializeVehicleCatalogueFilters,
  VEHICLE_CATEGORY_OPTIONS,
  VEHICLE_SORT_OPTIONS,
} from "@/lib/vehicle-catalogue-filters.mjs";
import { getVehicleDetailPath } from "@/lib/paths";
import { MobileVehicleFilterDialog } from "./mobile-vehicle-filter-dialog";

export type VehicleCatalogueViewProps = {
  displayRecords?: readonly VehiclePortfolioRecord[];
  filters: VehicleCatalogueFilters;
  locale?: "en" | "tr";
  onFiltersChange?: (filters: VehicleCatalogueCandidateFilters) => void;
  records: readonly VehiclePortfolioRecord[];
};

type FilterFieldsProps = Pick<
  VehicleCatalogueViewProps,
  "filters" | "onFiltersChange" | "records"
> & {
  idPrefix: string;
  locale: "en" | "tr";
};

const selectClassName =
  "min-h-12 w-full rounded-control border border-border-subtle bg-surface-card px-3 text-body text-text-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-secondary";

function getCategoryDisplayLabel(categoryLabel: string, locale: "en" | "tr") {
  if (locale === "en") return categoryLabel === "Ticari" ? "Commercial Vehicles" : categoryLabel === "Binek" ? "Passenger Cars" : categoryLabel;
  return categoryLabel === "Ticari" ? "Ticari Araçlar" : categoryLabel;
}

const text = (locale: "en" | "tr", english: string, turkish: string) => locale === "en" ? english : turkish;
const englishFilterLabels: Readonly<Record<string, string>> = Object.freeze({
  Binek: "Passenger Cars", Ticari: "Commercial Vehicles", Benzin: "Petrol", Dizel: "Diesel", Elektrik: "Electric",
  Otomatik: "Automatic", "Yarı Otomatik": "Semi-Automatic", Manuel: "Manual", "B/C-SUV Elektrik": "B/C-Segment Electric SUV",
  "Büyük Panelvan": "Large Panel Van", "D Premium Sedan": "D-Segment Premium Saloon", "D-SUV Elektrik": "D-Segment Electric SUV",
  "Küçük Combi": "Compact Combi Van", "Küçük Panelvan": "Compact Panel Van", "Orta Panelvan": "Medium Panel Van",
});
const displayFilterValue = (value: string, locale: "en" | "tr") => locale === "en" ? englishFilterLabels[value] ?? value : value;

function updateFilter(
  filters: VehicleCatalogueFilters,
  key: keyof VehicleCatalogueCandidateFilters,
  value: string,
): VehicleCatalogueCandidateFilters {
  const nextFilters: VehicleCatalogueCandidateFilters = {
    ...filters,
    [key]: value || undefined,
  };

  if (key === "make") {
    return { ...nextFilters, model: undefined };
  }

  return nextFilters;
}

function FilterFields({
  filters,
  idPrefix,
  locale,
  onFiltersChange,
  records,
}: FilterFieldsProps) {
  const options = buildVehicleCatalogueOptions(records, filters);
  const interactive = Boolean(onFiltersChange);

  const getSelectProps = (
    key: keyof VehicleCatalogueCandidateFilters,
    value: string,
  ) => {
    if (!interactive) {
      return { defaultValue: value };
    }

    return {
      onChange: (event: ChangeEvent<HTMLSelectElement>) =>
        onFiltersChange?.(updateFilter(filters, key, event.target.value)),
      value,
    };
  };

  return (
    <form action={locale === "en" ? "/en/vehicles/" : VEHICLE_CATALOGUE_PATH} className="space-y-5" method="get">
      {filters.category ? (
        <input name="kategori" type="hidden" value={filters.category} />
      ) : null}

      <div>
        <label
          className="mb-2 block text-label font-semibold text-text-primary"
          htmlFor={`${idPrefix}-make`}
        >
          {text(locale, "Make", "Marka")}
        </label>
        <select
          className={selectClassName}
          id={`${idPrefix}-make`}
          name="marka"
          {...getSelectProps("make", filters.make ?? "")}
        >
          <option value="">{text(locale, "All Makes", "Tüm Markalar")}</option>
          {options.makes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-2 block text-label font-semibold text-text-primary"
          htmlFor={`${idPrefix}-model`}
        >
          {text(locale, "Model", "Model")}
        </label>
        <select
          className={selectClassName}
          disabled={!filters.make}
          id={`${idPrefix}-model`}
          name="model"
          {...getSelectProps("model", filters.model ?? "")}
        >
          <option value="">
            {filters.make ? text(locale, "All Models", "Tüm Modeller") : text(locale, "Select a make first", "Önce marka seçiniz")}
          </option>
          {options.models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-2 block text-label font-semibold text-text-primary"
          htmlFor={`${idPrefix}-segment`}
        >
          {text(locale, "Segment", "Segment")}
        </label>
        <select
          className={selectClassName}
          id={`${idPrefix}-segment`}
          name="segment"
          {...getSelectProps("segment", filters.segment ?? "")}
        >
          <option value="">{text(locale, "All Segments", "Tüm Segmentler")}</option>
          {options.segments.map((segment) => (
            <option key={segment} value={segment}>
              {displayFilterValue(segment, locale)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-2 block text-label font-semibold text-text-primary"
          htmlFor={`${idPrefix}-fuel`}
        >
          {text(locale, "Fuel Type", "Yakıt Tipi")}
        </label>
        <select
          className={selectClassName}
          id={`${idPrefix}-fuel`}
          name="yakit"
          {...getSelectProps("fuel", filters.fuel ?? "")}
        >
          <option value="">{text(locale, "All Fuel Types", "Tüm Yakıt Tipleri")}</option>
          {options.fuels.map((fuel) => (
            <option key={fuel} value={fuel}>
              {displayFilterValue(fuel, locale)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-2 block text-label font-semibold text-text-primary"
          htmlFor={`${idPrefix}-transmission`}
        >
          {text(locale, "Transmission", "Vites Tipi")}
        </label>
        <select
          className={selectClassName}
          id={`${idPrefix}-transmission`}
          name="vites"
          {...getSelectProps("transmission", filters.transmission ?? "")}
        >
          <option value="">{text(locale, "All Transmission Types", "Tüm Vites Tipleri")}</option>
          {options.transmissions.map((transmission) => (
            <option key={transmission} value={transmission}>
              {displayFilterValue(transmission, locale)}
            </option>
          ))}
        </select>
      </div>

      {!interactive ? (
        <Button fullWidth size="secondary" type="submit" variant="outline">
          {text(locale, "Apply Filters", "Filtreleri Uygula")}
        </Button>
      ) : null}
    </form>
  );
}

function VehicleFilterPanel({
  filters,
  locale = "tr",
  onFiltersChange,
  records,
}: Pick<
  VehicleCatalogueViewProps,
  "filters" | "locale" | "onFiltersChange" | "records"
>) {
  const panelContents = (idPrefix: string) => (
    <FilterFields
      filters={filters}
      idPrefix={idPrefix}
      locale={locale}
      onFiltersChange={onFiltersChange}
      records={records}
    />
  );

  return (
    <>
      <aside
        aria-labelledby="desktop-vehicle-filters-title"
        className="hidden self-start rounded-card border border-border-subtle bg-surface-card p-5 lg:sticky lg:top-28 lg:block xl:p-6"
      >
        <h2
          className="text-heading-md font-semibold text-text-primary"
          id="desktop-vehicle-filters-title"
        >
          {text(locale, "Filter", "Filtrele")}
        </h2>
        <p className="mt-1 text-label text-text-secondary">
          {text(locale, "Find the right vehicle for your needs", "Size en uygun aracı bulun")}
        </p>
        <div className="mt-6">{panelContents("desktop-vehicle-filter")}</div>
        {onFiltersChange ? (
          <Button
            className="mt-6"
            data-vehicle-reset="true"
            fullWidth
            onClick={() => onFiltersChange({})}
            size="secondary"
            type="button"
            variant="outline"
          >
            {text(locale, "Clear Filters", "Filtreleri Temizle")}
          </Button>
        ) : null}
      </aside>

    </>
  );
}

function VehicleCard({
  locale,
  vehicle,
}: {
  locale: "en" | "tr";
  vehicle: VehiclePortfolioRecord;
}) {
  const cardImage = getVehicleCardImage(vehicle);

  return (
    <article
      className="h-full min-w-0"
      data-monthly-list-net-price-try={vehicle.listPrice.amountMinor / 100}
      data-vehicle-card={vehicle.slug}
      data-vehicle-source-id={vehicle.sourceId}
    >
      <a
        aria-label={locale === "en" ? `View details for ${vehicle.make} ${vehicle.model}` : `${vehicle.make} ${vehicle.model} araç detayını incele`}
        className="group flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-border-subtle bg-surface-card text-inherit no-underline shadow-[0_0.5rem_1.5rem_rgb(24_33_54_/_0.08)] transition-[border-color,box-shadow] hover:border-corporate-blue hover:shadow-[0_0.75rem_1.75rem_rgb(24_33_54_/_0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
        data-vehicle-card-link="true"
        href={locale === "en" ? `/en/vehicles/${vehicle.slug}/` : getVehicleDetailPath(vehicle.slug)}
      >
        <div
          className="relative aspect-[16/11] overflow-hidden bg-surface-muted"
          data-vehicle-media="true"
        >
          {/* Static card derivative is intentional for the export-only host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={cardImage.alt}
            className="size-full object-cover"
            height={cardImage.height}
            loading="lazy"
            src={cardImage.src}
            width={cardImage.width}
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-semibold leading-tight text-text-primary">
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="mt-2 text-label leading-5 text-text-secondary">
          {vehicle.trim}
        </p>

        <VehicleCardFacts
          className="mt-5 border-t border-border-subtle pt-4"
          fuelLabel={vehicle.fuelLabel}
          transmissionLabel={vehicle.transmissionLabel}
          locale={locale}
        />

        <div className="mt-auto flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-end sm:justify-between">
          <VehicleListPrice compactCard listPrice={vehicle.listPrice} locale={locale} />
          <span
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-control bg-accent-orange px-4 text-label font-semibold text-brand-navy transition-colors group-hover:bg-orange-dark group-focus-visible:bg-orange-dark motion-reduce:transition-none sm:w-auto"
            data-vehicle-card-cta="true"
          >
            {text(locale, "View Vehicle", "Aracı İncele")}
          </span>
        </div>
        </div>
      </a>
    </article>
  );
}

function VehicleSortControl({
  filters,
  locale = "tr",
  onFiltersChange,
}: Pick<VehicleCatalogueViewProps, "filters" | "locale" | "onFiltersChange">) {
  const currentOption = VEHICLE_SORT_OPTIONS.find(
    (option) => option.value === filters.sort,
  );

  if (!onFiltersChange) {
    return null;
  }

  return (
    <details className="group relative" data-vehicle-sort-control="true">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-control border border-border-control bg-surface-card px-3 text-label font-semibold text-text-primary transition-colors hover:border-corporate-blue hover:text-corporate-blue marker:content-none motion-reduce:transition-none">
        <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
          <path d="M8 7h11M8 12h8M8 17h5M4 5v14m0 0-2.5-2.5M4 19l2.5-2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
        </svg>
        <span>{currentOption ? (locale === "en" ? (currentOption.value === "fiyat-artan" ? "Price: Low to High" : "Price: High to Low") : currentOption.label) : text(locale, "Sort", "Sırala")}</span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 min-w-48 overflow-hidden rounded-card border border-border-subtle bg-surface-card p-2 shadow-[0_0.75rem_1.75rem_rgb(24_33_54_/_0.14)]">
        {VEHICLE_SORT_OPTIONS.map((option) => {
          const isSelected = filters.sort === option.value;

          return (
            <button
              aria-pressed={isSelected}
              className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-control px-3 text-left text-label font-medium transition-colors motion-reduce:transition-none ${
                isSelected
                  ? "bg-surface-muted text-corporate-blue"
                  : "text-text-primary hover:bg-surface-muted"
              }`}
              key={option.value}
              onClick={(event) => {
                onFiltersChange({
                  ...filters,
                  sort: isSelected ? undefined : option.value,
                });
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              type="button"
            >
              {locale === "en" ? (option.value === "fiyat-artan" ? "Price: Low to High" : "Price: High to Low") : option.label}
              {isSelected ? <span aria-hidden="true">✓</span> : null}
            </button>
          );
        })}
      </div>
    </details>
  );
}

export function VehicleCatalogueView({
  displayRecords,
  filters,
  locale = "tr",
  onFiltersChange,
  records,
}: VehicleCatalogueViewProps) {
  const filteredRecords = filterVehicleCatalogue(records, filters);
  const displayBySlug = new Map((displayRecords ?? records).map((record) => [record.slug, record]));
  const activeFilters = [
    filters.category
      ? {
          key: "category" as const,
          label: getCategoryDisplayLabel(filters.category, locale),
        }
      : null,
    filters.make ? { key: "make" as const, label: filters.make } : null,
    filters.model ? { key: "model" as const, label: filters.model } : null,
    filters.fuel ? { key: "fuel" as const, label: displayFilterValue(filters.fuel, locale) } : null,
    filters.segment
      ? { key: "segment" as const, label: displayFilterValue(filters.segment, locale) }
      : null,
    filters.transmission
      ? { key: "transmission" as const, label: displayFilterValue(filters.transmission, locale) }
      : null,
  ].filter((filter) => filter !== null);

  const setCategory = (category: string) => {
    onFiltersChange?.({ ...filters, category: category || undefined });
  };

  const removeFilter = (key: keyof VehicleCatalogueCandidateFilters) => {
    const nextFilters: VehicleCatalogueCandidateFilters = {
      ...filters,
      [key]: undefined,
    };

    onFiltersChange?.(
      key === "make" ? { ...nextFilters, model: undefined } : nextFilters,
    );
  };

  return (
    <div
      className="grid min-w-0 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] xl:gap-8"
      data-vehicle-catalogue="true"
    >
      <VehicleFilterPanel
        filters={filters}
        locale={locale}
        onFiltersChange={onFiltersChange}
        records={records}
      />

      <div className="min-w-0">
        <section aria-labelledby="vehicle-category-filter-title">
          <h2 className="sr-only" id="vehicle-category-filter-title">
            {text(locale, "Vehicle categories", "Araç kategorileri")}
          </h2>
          <ul className="flex flex-wrap gap-x-2 gap-y-2 border-b border-border-subtle sm:gap-x-5">
            {VEHICLE_CATEGORY_OPTIONS.map((option) => {
              const isCurrent = (filters.category ?? "") === option.value;

              return (
                <li key={option.label}>
                  {onFiltersChange ? (
                    <button
                      aria-controls="vehicle-catalogue-results"
                      aria-pressed={isCurrent}
                      className={`min-h-12 border-b-2 px-3 text-label font-semibold transition-colors motion-reduce:transition-none ${
                        isCurrent
                          ? "border-corporate-blue text-corporate-blue"
                          : "border-transparent text-text-secondary hover:text-text-primary"
                      }`}
                      onClick={() => setCategory(option.value)}
                      type="button"
                    >
                      {locale === "en" ? getCategoryDisplayLabel(option.value || "All Vehicles", locale) : option.label}
                    </button>
                  ) : (
                    <a
                      aria-current={isCurrent ? "true" : undefined}
                      className={`inline-flex min-h-12 items-center border-b-2 px-3 text-label font-semibold ${
                        isCurrent
                          ? "border-corporate-blue text-corporate-blue"
                          : "border-transparent text-text-secondary hover:text-text-primary"
                      }`}
                      href={
                        option.value
                          ? `${locale === "en" ? "/en/vehicles/" : VEHICLE_CATALOGUE_PATH}?${serializeVehicleCatalogueFilters({ category: option.value })}`
                          : locale === "en" ? "/en/vehicles/" : VEHICLE_CATALOGUE_PATH
                      }
                    >
                      {locale === "en" ? getCategoryDisplayLabel(option.value || "All Vehicles", locale) : option.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section
          aria-labelledby="selected-vehicle-filters-title"
          className="mt-5"
        >
          <h2 className="sr-only" id="selected-vehicle-filters-title">
            {text(locale, "Active vehicle filters and results", "Aktif araç filtreleri ve sonuçlar")}
          </h2>
          {onFiltersChange ? (
            <div className="mb-3 flex items-center gap-2 lg:hidden">
              <p
                aria-live="polite"
                className="mr-auto text-xs font-semibold text-text-primary"
                data-vehicle-mobile-result-count={filteredRecords.length}
              >
                {filteredRecords.length} {text(locale, "vehicles shown", "araç gösteriliyor")}
              </p>
              <MobileVehicleFilterDialog
                filters={filters}
                locale={locale}
                onFiltersChange={onFiltersChange}
                records={records}
              />
              <VehicleSortControl
                filters={filters}
                locale={locale}
                onFiltersChange={onFiltersChange}
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="flex min-h-11 flex-wrap items-center gap-2"
              data-vehicle-filter-count={activeFilters.length}
            >
              <span className="text-label text-text-secondary">
                {text(locale, "Active Filters:", "Aktif Filtreler:")}
              </span>
              {activeFilters.length > 0 ? (
                activeFilters.map((filter) => (
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-surface-muted px-4 text-label font-medium text-text-primary hover:bg-border-subtle disabled:cursor-default"
                    disabled={!onFiltersChange}
                    key={filter.key}
                    onClick={() => removeFilter(filter.key)}
                    type="button"
                  >
                    {filter.label}
                    {onFiltersChange ? <span aria-hidden="true">×</span> : null}
                    {onFiltersChange ? (
                      <span className="sr-only">{text(locale, " remove filter", " filtresini kaldır")}</span>
                    ) : null}
                  </button>
                ))
              ) : (
                <span className="text-label font-medium text-text-primary">
                  {text(locale, "All", "Tümü")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <p
                aria-live="polite"
                className="hidden text-label font-semibold text-text-primary lg:block"
                data-vehicle-result-count={filteredRecords.length}
              >
                {filteredRecords.length} {text(locale, "vehicles shown", "araç gösteriliyor")}
              </p>
              <div className="hidden lg:block">
                <VehicleSortControl
                  filters={filters}
                  locale={locale}
                  onFiltersChange={onFiltersChange}
                />
              </div>
            </div>
          </div>
        </section>

        <div id="vehicle-catalogue-results" className="mt-6">
          {filteredRecords.length > 0 ? (
            <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredRecords.map((vehicle) => (
                <li key={vehicle.id}>
                  <VehicleCard locale={locale} vehicle={displayBySlug.get(vehicle.slug) ?? vehicle} />
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="rounded-card border border-border-subtle bg-surface-card p-8 text-center"
              role="status"
            >
              <p className="text-xl font-semibold text-text-primary">
                {text(locale, "No vehicles match these filters.", "Bu filtrelerle eşleşen araç bulunamadı.")}
              </p>
              <p className="mt-2 text-body text-text-secondary">
                {text(locale, "Remove a filter to review the portfolio again.", "Filtrelerden birini kaldırarak portföyü yeniden inceleyin.")}
              </p>
              {onFiltersChange ? (
                <Button
                  className="mt-5"
                  data-vehicle-reset="true"
                  onClick={() => onFiltersChange({})}
                  size="secondary"
                  type="button"
                  variant="outline"
                >
                  {text(locale, "Clear Filters", "Filtreleri Temizle")}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
