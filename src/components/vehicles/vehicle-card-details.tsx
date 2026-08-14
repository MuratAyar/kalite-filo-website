import type {
  VehiclePortfolioListPrice,
  VehiclePortfolioRecord,
} from "@/types";

import { Icon } from "@/components/ui";
import { classNames } from "@/components/ui/class-names";
import { getVehicleTransmissionGroup } from "@/lib/vehicle-catalogue-filters.mjs";
import { formatVehicleListNetPrice } from "@/lib/vehicle-list-price.mjs";

type VehicleCardFactsProps = Pick<
  VehiclePortfolioRecord,
  "fuelLabel" | "transmissionLabel"
> & {
  className?: string;
};

type VehicleListPriceProps = {
  className?: string;
  listPrice: VehiclePortfolioListPrice;
};

function FuelIcon() {
  return (
    <Icon className="mt-px" decorative size="sm">
      <path d="M5 22V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v18" />
      <path d="M3 22h15" />
      <path d="M7 6h7v5H7z" />
      <path d="m16 7 3 3v7a1.5 1.5 0 0 0 3 0v-6l-2-2" />
    </Icon>
  );
}

function TransmissionIcon() {
  return (
    <Icon className="mt-px" decorative size="sm">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </Icon>
  );
}

/** Shared factual rows for Home and catalogue vehicle cards. */
export function VehicleCardFacts({
  className,
  fuelLabel,
  transmissionLabel,
}: VehicleCardFactsProps) {
  const transmissionDisplayLabel =
    getVehicleTransmissionGroup(transmissionLabel) ?? transmissionLabel;

  return (
    <dl
      className={classNames(
        "grid grid-cols-2 gap-x-3 text-xs leading-4 text-text-secondary sm:text-sm",
        className,
      )}
      data-vehicle-facts="true"
      data-vehicle-facts-layout="single-row"
    >
      <div className="min-w-0" data-vehicle-fact="fuel">
        <dt className="sr-only">Yakıt tipi</dt>
        <dd className="flex items-start gap-1.5 break-words">
          <FuelIcon />
          <span>{fuelLabel}</span>
        </dd>
      </div>
      <div
        className="min-w-0"
        data-vehicle-fact="transmission"
        data-vehicle-transmission-display={transmissionDisplayLabel}
      >
        <dt className="sr-only">Vites tipi</dt>
        <dd className="flex items-start gap-1.5 break-words">
          <TransmissionIcon />
          <span>{transmissionDisplayLabel}</span>
        </dd>
      </div>
    </dl>
  );
}

/** Owner-approved monthly list-net display; this is not a final offer. */
export function VehicleListPrice({
  className,
  listPrice,
}: VehicleListPriceProps) {
  const amountTry = listPrice.amountMinor / 100;

  return (
    <div
      className={classNames("min-w-0", className)}
      data-vehicle-list-price="true"
    >
      <p className="text-xs leading-5 text-text-secondary">Aylık Liste Net</p>
      <p className="whitespace-nowrap text-xl font-bold leading-tight text-text-primary tabular-nums">
        <data value={amountTry}>
          {formatVehicleListNetPrice(listPrice.amountMinor)}
        </data>
        <span className="ml-0.5 text-sm font-normal text-text-secondary">
          /ay
        </span>
      </p>
      <p className="mt-1 text-xs leading-4 text-text-secondary">KDV hariç</p>
    </div>
  );
}
