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
  locale?: "en" | "tr";
};

type VehicleListPriceProps = {
  className?: string;
  compactCard?: boolean;
  offerPanel?: boolean;
  listPrice: VehiclePortfolioListPrice;
  locale?: "en" | "tr";
};

export const vehicleCardPlaceholder = Object.freeze({
  alt: "Örtü altında temsili araç görseli",
  height: 440,
  src: "/images/vehicles/cards/vehicle-placeholder.jpg",
  width: 640,
});

export function getVehicleCardImage(
  vehicle: Pick<VehiclePortfolioRecord, "coverImage">,
) {
  if (!vehicle.coverImage) {
    return vehicleCardPlaceholder;
  }

  return {
    ...vehicle.coverImage,
    height: 440,
    src: vehicle.coverImage.src.replace(
      "/images/vehicles/",
      "/images/vehicles/cards/",
    ),
    width: 640,
  };
}

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
  locale = "tr",
}: VehicleCardFactsProps) {
  const transmissionDisplayLabel =
    getVehicleTransmissionGroup(transmissionLabel) ?? transmissionLabel;

  return (
    <dl
      className={classNames(
        "grid min-h-12 grid-cols-2 items-center gap-x-3 text-xs leading-4 text-text-secondary sm:text-sm",
        className,
      )}
      data-vehicle-facts="true"
      data-vehicle-facts-layout="single-row"
    >
      <div className="flex min-h-10 min-w-0 items-center" data-vehicle-fact="fuel">
        <dt className="sr-only">{locale === "en" ? "Fuel type" : "Yakıt tipi"}</dt>
        <dd className="flex items-center gap-1.5 break-words">
          <FuelIcon />
          <span>{fuelLabel}</span>
        </dd>
      </div>
      <div
        className="flex min-h-10 min-w-0 items-center"
        data-vehicle-fact="transmission"
        data-vehicle-transmission-display={transmissionDisplayLabel}
      >
        <dt className="sr-only">{locale === "en" ? "Transmission type" : "Vites tipi"}</dt>
        <dd className="flex items-center gap-1.5 break-words">
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
  compactCard = false,
  offerPanel = false,
  listPrice,
  locale = "tr",
}: VehicleListPriceProps) {
  const amountTry = listPrice.amountMinor / 100;

  return (
    <div
      className={classNames(
        "min-w-0",
        offerPanel &&
          "flex items-center justify-between gap-4 rounded-card border border-accent-orange bg-surface-page p-4",
        className,
      )}
      data-vehicle-list-price="true"
    >
      {!compactCard && !offerPanel ? (
        <p className="text-xs leading-4 text-text-secondary">{locale === "en" ? "Monthly Net List Price" : "Aylık Liste Net"}</p>
      ) : null}
      <p
        className={classNames(
          "whitespace-nowrap font-bold leading-tight text-text-primary tabular-nums",
          offerPanel
            ? "text-3xl text-corporate-blue"
            : compactCard
              ? "text-2xl"
              : "mt-1 text-xl",
        )}
      >
        <data value={amountTry}>
          {formatVehicleListNetPrice(listPrice.amountMinor)}
        </data>
        <span className="ml-0.5 text-sm font-normal text-text-secondary">
          {locale === "en" ? "/month" : "/ay"}
        </span>
      </p>
      <p
        className={classNames(
          "text-xs font-semibold leading-4",
          offerPanel
            ? "shrink-0 rounded-control bg-surface-muted px-3 py-2 text-text-primary"
            : "mt-1 text-text-secondary",
        )}
      >
        {locale === "en" ? (compactCard || offerPanel ? "+ 20% VAT" : "Excluding VAT") : (compactCard || offerPanel ? "+ %20 KDV" : "KDV hariç")}
      </p>
    </div>
  );
}
