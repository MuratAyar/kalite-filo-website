"use client";

import { useSearchParams } from "next/navigation";

import type { InternalPath, VehiclePortfolioRecord } from "@/types";
import type { VehicleCatalogueCandidateFilters } from "@/lib/vehicle-catalogue-filters.mjs";

import {
  normalizeVehicleCatalogueFilters,
  readVehicleCatalogueQueryFilters,
  serializeVehicleCatalogueFilters,
} from "@/lib/vehicle-catalogue-filters.mjs";

import { VehicleCatalogueView } from "./vehicle-catalogue-view";

export type VehicleQueryStateProps = {
  quoteHref: InternalPath;
  records: readonly VehiclePortfolioRecord[];
};

/** The only query-aware boundary for the statically exported vehicle index. */
export function VehicleQueryState({
  quoteHref,
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
      onFiltersChange={replaceFilters}
      quoteHref={quoteHref}
      records={records}
    />
  );
}
