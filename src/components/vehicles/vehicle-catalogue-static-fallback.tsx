import type { VehiclePortfolioRecord } from "@/types";

import { VehicleCatalogueView } from "./vehicle-catalogue-view";

export type VehicleCatalogueStaticFallbackProps = {
  displayRecords?: readonly VehiclePortfolioRecord[];
  locale?: "en" | "tr";
  records: readonly VehiclePortfolioRecord[];
};

/** Full, useful HTML fallback for the query-aware client catalogue boundary. */
export function VehicleCatalogueStaticFallback({
  displayRecords,
  locale = "tr",
  records,
}: VehicleCatalogueStaticFallbackProps) {
  return <VehicleCatalogueView displayRecords={displayRecords} filters={{}} locale={locale} records={records} />;
}
