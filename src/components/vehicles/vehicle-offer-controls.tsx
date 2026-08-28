"use client";

import { useState } from "react";

import { Button } from "@/components/ui";
import { VehicleListPrice } from "@/components/vehicles/vehicle-card-details";
import { addVehicleCartItem } from "@/lib/vehicle-cart";
import type { VehiclePortfolioListPrice } from "@/types";

const durations = [12, 18, 24, 30, 36] as const;
const distances = [10_000, 15_000, 20_000, 25_000, 30_000, 35_000, 40_000, 45_000, 50_000, 55_000] as const;

type Props = {
  fuelLabel: string;
  image: { alt: string; height: number; src: string; width: number };
  listPrice: VehiclePortfolioListPrice;
  make: string;
  model: string;
  locale?: "en" | "tr";
  slug: string;
  transmissionLabel: string;
  trim: string;
};

export function VehicleOfferControls(props: Props) {
  const [durationMonths, setDurationMonths] = useState(12);
  const [annualKilometres, setAnnualKilometres] = useState(10_000);
  const [added, setAdded] = useState(false);
  const locale = props.locale ?? "tr";
  const numberFormatter = new Intl.NumberFormat(locale === "en" ? "en-GB" : "tr-TR");

  function addToCart(redirectToCart = false) {
    addVehicleCartItem({
      annualKilometres,
      durationMonths,
      fuelLabel: props.fuelLabel,
      image: props.image,
      make: props.make,
      model: props.model,
      priceAmountMinor: props.listPrice.amountMinor,
      slug: props.slug,
      transmissionLabel: props.transmissionLabel,
      trim: props.trim,
    });
    if (redirectToCart) {
      window.location.assign(locale === "en" ? "/en/request-a-quote/?form=sepet" : "/teklif-al/?form=sepet");
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <label className="grid min-w-0 gap-2 text-xs font-semibold text-text-primary sm:text-label">
          <span className="whitespace-nowrap">{locale === "en" ? "Lease Term (Months)" : "Kiralama Süresi (Ay)"}<span aria-hidden="true">*</span></span>
          <select name="kiralama-suresi" className="h-control-secondary w-full rounded-control border border-border-control bg-surface-card px-3 text-body font-semibold" value={durationMonths} onChange={(event) => setDurationMonths(Number(event.target.value))}>
            {durations.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-xs font-semibold text-text-primary sm:text-label">
          <span className="whitespace-nowrap">{locale === "en" ? "Annual Mileage" : "Yıllık Kilometre"}<span aria-hidden="true">*</span></span>
          <select name="yillik-kilometre" className="h-control-secondary w-full rounded-control border border-border-control bg-surface-card px-3 text-body font-semibold" value={annualKilometres} onChange={(event) => setAnnualKilometres(Number(event.target.value))}>
            {distances.map((value) => <option key={value} value={value}>{numberFormatter.format(value)}</option>)}
          </select>
        </label>
      </div>
      <VehicleListPrice className="mt-6" listPrice={props.listPrice} locale={locale} offerPanel />
      <p className="mt-3 text-xs leading-5 text-text-secondary">{locale === "en" ? "The list price is not a binding quotation or a guarantee of vehicle availability." : "Liste fiyatı bağlayıcı teklif veya araç bulunabilirliği garantisi değildir."}</p>
      <div className="mt-6 grid gap-3">
        <Button data-vehicle-detail-action="quote" fullWidth onClick={() => addToCart(true)} size="primary" type="button">{locale === "en" ? "Request a Quote Now" : "Hemen Teklif İste"}</Button>
        <Button data-vehicle-detail-action="basket" fullWidth onClick={() => addToCart()} size="secondary" type="button" variant="outline">
          {added ? (locale === "en" ? "Added to Cart" : "Sepete Eklendi") : (locale === "en" ? "Add to Vehicle Cart" : "Araç Sepetine Ekle")}
        </Button>
        <p aria-live="polite" className="sr-only">{added ? (locale === "en" ? `${props.make} ${props.model} was added to the cart.` : `${props.make} ${props.model} sepete eklendi.`) : ""}</p>
      </div>
    </>
  );
}
