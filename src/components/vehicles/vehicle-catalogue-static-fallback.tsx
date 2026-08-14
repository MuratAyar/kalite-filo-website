import type { InternalPath, VehiclePortfolioRecord } from "@/types";

import { VehicleCatalogueView } from "./vehicle-catalogue-view";

export type VehicleCatalogueStaticFallbackProps = {
  quoteHref: InternalPath;
  records: readonly VehiclePortfolioRecord[];
};

/** Full, useful HTML fallback for the query-aware client catalogue boundary. */
export function VehicleCatalogueStaticFallback({
  quoteHref,
  records,
}: VehicleCatalogueStaticFallbackProps) {
  return (
    <VehicleCatalogueView filters={{}} quoteHref={quoteHref} records={records} />
  );
}

