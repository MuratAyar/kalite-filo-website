"use client";

import { useSearchParams } from "next/navigation";

import type { VehiclePortfolioRecord } from "@/types";
import type { VehicleCatalogueCandidateFilters } from "@/lib/vehicle-catalogue-filters.mjs";

import {
  normalizeVehicleCatalogueFilters,
  readVehicleCatalogueQueryFilters,
  serializeVehicleCatalogueFilters,
} from "@/lib/vehicle-catalogue-filters.mjs";

import { VehicleCatalogueView } from "./vehicle-catalogue-view";

export type VehicleQueryStateProps = {
  displayRecords?: readonly VehiclePortfolioRecord[];
  locale?: "en" | "tr";
  records: readonly VehiclePortfolioRecord[];
};

/** The only query-aware boundary for the statically exported vehicle index. */
export function VehicleQueryState({
  displayRecords,
  locale = "tr",
  records,
}: VehicleQueryStateProps) {
  const searchParams = useSearchParams();
  const filters = normalizeVehicleCatalogueFilters(
    records,
    readVehicleCatalogueQueryFilters(searchParams),
  );

  const replaceFilters = (nextFilters: VehicleCatalogueCandidateFilters) => {
    const normalizedFilters = normalizeVehicleCatalogueFilters(
      records,
      nextFilters,
    );
    const query = serializeVehicleCatalogueFilters(normalizedFilters);
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;

    window.history.replaceState(null, "", nextUrl);
  };

  return (
    <VehicleCatalogueView
      filters={filters}
      displayRecords={displayRecords}
      locale={locale}
      onFiltersChange={replaceFilters}
      records={records}
    />
  );
}
