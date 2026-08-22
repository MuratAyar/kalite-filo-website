import type { VehiclePortfolioRecord } from "@/types";

import { VehicleCatalogueView } from "./vehicle-catalogue-view";

export type VehicleCatalogueStaticFallbackProps = {
  records: readonly VehiclePortfolioRecord[];
};

/** Full, useful HTML fallback for the query-aware client catalogue boundary. */
export function VehicleCatalogueStaticFallback({
  records,
}: VehicleCatalogueStaticFallbackProps) {
  return <VehicleCatalogueView filters={{}} records={records} />;
}
