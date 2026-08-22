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
  VehicleListPrice,
} from "@/components/vehicles/vehicle-card-details";
import {
  buildVehicleCatalogueOptions,
  filterVehicleCatalogue,
  serializeVehicleCatalogueFilters,
  VEHICLE_CATEGORY_OPTIONS,
} from "@/lib/vehicle-catalogue-filters.mjs";
import { getVehicleDetailPath } from "@/lib/paths";

export type VehicleCatalogueViewProps = {
  filters: VehicleCatalogueFilters;
  onFiltersChange?: (filters: VehicleCatalogueCandidateFilters) => void;
  records: readonly VehiclePortfolioRecord[];
};

type FilterFieldsProps = Pick<
  VehicleCatalogueViewProps,
  "filters" | "onFiltersChange" | "records"
> & {
  idPrefix: string;
};

const selectClassName =
  "min-h-12 w-full rounded-control border border-border-subtle bg-surface-card px-3 text-body text-text-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-secondary";

function getCategoryDisplayLabel(categoryLabel: string) {
  return categoryLabel === "Ticari" ? "Ticari Araçlar" : categoryLabel;
}

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
  onFiltersChange,
  records,
}: FilterFieldsProps) {
  const options = buildVehicleCatalogueOptions(records, filters.make);
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
    <form action={VEHICLE_CATALOGUE_PATH} className="space-y-5" method="get">
      {filters.category ? (
        <input name="kategori" type="hidden" value={filters.category} />
      ) : null}

      <div>
        <label
          className="mb-2 block text-label font-semibold text-text-primary"
          htmlFor={`${idPrefix}-make`}
        >
          Marka
        </label>
        <select
          className={selectClassName}
          id={`${idPrefix}-make`}
          name="marka"
          {...getSelectProps("make", filters.make ?? "")}
        >
          <option value="">Tüm Markalar</option>
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
          Model
        </label>
        <select
          className={selectClassName}
          disabled={!filters.make}
          id={`${idPrefix}-model`}
          name="model"
          {...getSelectProps("model", filters.model ?? "")}
        >
          <option value="">
            {filters.make ? "Tüm Modeller" : "Önce marka seçiniz"}
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
          Segment
        </label>
        <select
          className={selectClassName}
          id={`${idPrefix}-segment`}
          name="segment"
          {...getSelectProps("segment", filters.segment ?? "")}
        >
          <option value="">Tüm Segmentler</option>
          {options.segments.map((segment) => (
            <option key={segment} value={segment}>
              {segment}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-2 block text-label font-semibold text-text-primary"
          htmlFor={`${idPrefix}-fuel`}
        >
          Yakıt Tipi
        </label>
        <select
          className={selectClassName}
          id={`${idPrefix}-fuel`}
          name="yakit"
          {...getSelectProps("fuel", filters.fuel ?? "")}
        >
          <option value="">Tüm Yakıt Tipleri</option>
          {options.fuels.map((fuel) => (
            <option key={fuel} value={fuel}>
              {fuel}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-2 block text-label font-semibold text-text-primary"
          htmlFor={`${idPrefix}-transmission`}
        >
          Vites Tipi
        </label>
        <select
          className={selectClassName}
          id={`${idPrefix}-transmission`}
          name="vites"
          {...getSelectProps("transmission", filters.transmission ?? "")}
        >
          <option value="">Tüm Vites Tipleri</option>
          {options.transmissions.map((transmission) => (
            <option key={transmission} value={transmission}>
              {transmission}
            </option>
          ))}
        </select>
      </div>

      {!interactive ? (
        <Button fullWidth size="secondary" type="submit" variant="outline">
          Filtreleri Uygula
        </Button>
      ) : null}
    </form>
  );
}

function VehicleFilterPanel({
  filters,
  onFiltersChange,
  records,
}: Pick<
  VehicleCatalogueViewProps,
  "filters" | "onFiltersChange" | "records"
>) {
  const panelContents = (idPrefix: string) => (
    <FilterFields
      filters={filters}
      idPrefix={idPrefix}
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
          Filtrele
        </h2>
        <p className="mt-1 text-label text-text-secondary">
          Size en uygun aracı bulun
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
            Filtreleri Temizle
          </Button>
        ) : null}
      </aside>

      <details className="rounded-card border border-border-subtle bg-surface-card p-4 lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-control font-semibold text-text-primary marker:content-none">
          <span>Filtrele</span>
          <span aria-hidden="true" className="text-corporate-blue">
            +
          </span>
        </summary>
        <div className="border-t border-border-subtle pt-5">
          {panelContents("mobile-vehicle-filter")}
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
              Filtreleri Temizle
            </Button>
          ) : null}
        </div>
      </details>
    </>
  );
}

function VehicleCard({
  vehicle,
}: {
  vehicle: VehiclePortfolioRecord;
}) {
  return (
    <article
      className="h-full min-w-0"
      data-monthly-list-net-price-try={vehicle.listPrice.amountMinor / 100}
      data-vehicle-card={vehicle.slug}
      data-vehicle-source-id={vehicle.sourceId}
    >
      <a
        aria-label={`${vehicle.make} ${vehicle.model} araç detayını incele`}
        className="group flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-border-subtle bg-surface-card text-inherit no-underline shadow-[0_0.5rem_1.5rem_rgb(24_33_54_/_0.08)] transition-[border-color,box-shadow] hover:border-corporate-blue hover:shadow-[0_0.75rem_1.75rem_rgb(24_33_54_/_0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
        data-vehicle-card-link="true"
        href={getVehicleDetailPath(vehicle.slug)}
      >
        <div
          className="relative aspect-[16/11] overflow-hidden bg-surface-muted"
          data-vehicle-media="true"
        >
        {vehicle.coverImage ? (
          // Static delivery is intentional for the export-only production host.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={vehicle.coverImage.alt}
            className="size-full object-cover"
            height={vehicle.coverImage.height}
            loading="lazy"
            src={vehicle.coverImage.src}
            width={vehicle.coverImage.width}
          />
        ) : (
          <div
            aria-label={`${vehicle.make} ${vehicle.model} için doğrulanmış araç görseli mevcut değil`}
            className="flex size-full items-center justify-center bg-[linear-gradient(145deg,#f2f4f6,#e6e8ec)] px-5 text-center text-label text-text-secondary"
            role="img"
          >
            Doğrulanmış araç görseli mevcut değil
          </div>
        )}
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
        />

        <div className="mt-auto flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-end sm:justify-between">
          <VehicleListPrice listPrice={vehicle.listPrice} />
          <span
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-control bg-accent-orange px-4 text-label font-semibold text-brand-navy transition-colors group-hover:bg-orange-dark group-focus-visible:bg-orange-dark motion-reduce:transition-none sm:w-auto"
            data-vehicle-card-cta="true"
          >
            Aracı İncele
          </span>
        </div>
        </div>
      </a>
    </article>
  );
}

export function VehicleCatalogueView({
  filters,
  onFiltersChange,
  records,
}: VehicleCatalogueViewProps) {
  const filteredRecords = filterVehicleCatalogue(records, filters);
  const activeFilters = [
    filters.category
      ? {
          key: "category" as const,
          label: getCategoryDisplayLabel(filters.category),
        }
      : null,
    filters.make ? { key: "make" as const, label: filters.make } : null,
    filters.model ? { key: "model" as const, label: filters.model } : null,
    filters.fuel ? { key: "fuel" as const, label: filters.fuel } : null,
    filters.segment
      ? { key: "segment" as const, label: filters.segment }
      : null,
    filters.transmission
      ? { key: "transmission" as const, label: filters.transmission }
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
        onFiltersChange={onFiltersChange}
        records={records}
      />

      <div className="min-w-0">
        <section aria-labelledby="vehicle-category-filter-title">
          <h2 className="sr-only" id="vehicle-category-filter-title">
            Araç kategorileri
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
                      {option.label}
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
                          ? `${VEHICLE_CATALOGUE_PATH}?${serializeVehicleCatalogueFilters({ category: option.value })}`
                          : VEHICLE_CATALOGUE_PATH
                      }
                    >
                      {option.label}
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
            Aktif araç filtreleri ve sonuçlar
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="flex min-h-11 flex-wrap items-center gap-2"
              data-vehicle-filter-count={activeFilters.length}
            >
              <span className="text-label text-text-secondary">
                Aktif Filtreler:
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
                      <span className="sr-only"> filtresini kaldır</span>
                    ) : null}
                  </button>
                ))
              ) : (
                <span className="text-label font-medium text-text-primary">
                  Tümü
                </span>
              )}
            </div>
            <p
              aria-live="polite"
              className="text-label font-semibold text-text-primary"
              data-vehicle-result-count={filteredRecords.length}
            >
              {filteredRecords.length} araç gösteriliyor
            </p>
          </div>
        </section>

        <div id="vehicle-catalogue-results" className="mt-6">
          {filteredRecords.length > 0 ? (
            <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredRecords.map((vehicle) => (
                <li key={vehicle.id}>
                  <VehicleCard vehicle={vehicle} />
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="rounded-card border border-border-subtle bg-surface-card p-8 text-center"
              role="status"
            >
              <p className="text-xl font-semibold text-text-primary">
                Bu filtrelerle eşleşen araç bulunamadı.
              </p>
              <p className="mt-2 text-body text-text-secondary">
                Filtrelerden birini kaldırarak portföyü yeniden inceleyin.
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
                  Filtreleri Temizle
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
