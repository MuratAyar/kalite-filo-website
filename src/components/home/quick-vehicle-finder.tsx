import type { InternalPath } from "@/types";
import type { VehicleFinderOptionGroup } from "@/lib/vehicle-finder-options.mjs";

import { VehicleFinderFields } from "./vehicle-finder-fields";

export type QuickVehicleFinderProps = {
  actionHref: InternalPath;
  actionLabel: string;
  description: string;
  options: readonly VehicleFinderOptionGroup[];
  title: string;
};

/**
 * A progressively enhanced GET form. The static host serves the destination,
 * while the vehicle catalogue reads the query string in a narrow client island.
 */
export function QuickVehicleFinder({
  actionHref,
  actionLabel,
  description,
  options,
  title,
}: QuickVehicleFinderProps) {
  return (
    <aside className="home-glass-panel rounded-panel p-6 text-text-inverse sm:p-8">
      <h2 className="text-heading-md font-semibold text-text-inverse">
        {title}
      </h2>
      <p className="sr-only">{description}</p>
      <VehicleFinderFields
        actionHref={actionHref}
        actionLabel={actionLabel}
        options={options}
      />
    </aside>
  );
}
