"use client";

import { useEffect, useRef, useState } from "react";

import type { VehiclePortfolioRecord } from "@/types";
import type {
  VehicleCatalogueCandidateFilters,
  VehicleCatalogueFilters,
} from "@/lib/vehicle-catalogue-filters.mjs";
import { buildVehicleCatalogueOptions } from "@/lib/vehicle-catalogue-filters.mjs";

type FilterKey = "make" | "model" | "fuel" | "transmission" | "segment";

type MobileVehicleFilterDialogProps = {
  filters: VehicleCatalogueFilters;
  onFiltersChange: (filters: VehicleCatalogueCandidateFilters) => void;
  records: readonly VehiclePortfolioRecord[];
};

const filterLabels: Record<FilterKey, string> = {
  make: "Marka",
  model: "Model",
  fuel: "Yakıt Tipi",
  transmission: "Vites Tipi",
  segment: "Segment",
};

const filterKeys: readonly FilterKey[] = [
  "make",
  "model",
  "fuel",
  "transmission",
  "segment",
];

export function MobileVehicleFilterDialog({
  filters,
  onFiltersChange,
  records,
}: MobileVehicleFilterDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const options = buildVehicleCatalogueOptions(records, filters);
  const closeDialog = () => {
    setIsOpen(false);
    setActiveFilter(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setActiveFilter(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const values: Record<FilterKey, readonly string[]> = {
    make: options.makes,
    model: options.models,
    fuel: options.fuels,
    transmission: options.transmissions,
    segment: options.segments,
  };

  const selectValue = (key: FilterKey, value: string) => {
    const nextFilters: VehicleCatalogueCandidateFilters = {
      ...filters,
      [key]: filters[key] === value ? undefined : value,
    };

    onFiltersChange(
      key === "make" ? { ...nextFilters, model: undefined } : nextFilters,
    );
  };

  return (
    <>
      <button
        aria-haspopup="dialog"
        className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-control bg-surface-card px-3 text-label font-semibold text-text-primary transition-colors hover:border-corporate-blue hover:text-corporate-blue motion-reduce:transition-none"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
          <path d="M4 6h16M7 12h10m-7 6h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
        </svg>
        Filtrele
      </button>

      {isOpen ? (
        <div
          aria-labelledby="mobile-filter-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex min-h-dvh flex-col bg-surface-page lg:hidden"
          role="dialog"
        >
          <header className="flex min-h-14 items-center justify-between bg-brand-navy px-4 text-text-inverse">
            <h2 className="text-lg font-semibold" id="mobile-filter-dialog-title">
              {activeFilter ? filterLabels[activeFilter] : "Araçları Filtrele"}
            </h2>
            <button
              aria-label="Filtreleri kapat"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-surface-card text-error transition-colors hover:bg-error-surface motion-reduce:transition-none"
              onClick={closeDialog}
              ref={closeButtonRef}
              type="button"
            >
              <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
                <path
                  d="m6 6 12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
            {activeFilter ? (
              <fieldset>
                <legend className="sr-only">{filterLabels[activeFilter]} seçimi</legend>
                <button
                  className="flex min-h-12 w-full items-center gap-2 border-b border-border-subtle px-3 text-left text-label font-semibold text-corporate-blue"
                  onClick={() => setActiveFilter(null)}
                  type="button"
                >
                  <span aria-hidden="true">←</span> Tüm filtreler
                </button>
                {values[activeFilter].map((value) => {
                  const checked = filters[activeFilter] === value;
                  return (
                    <label
                      className="flex min-h-13 cursor-pointer items-center gap-3 border-b border-border-subtle px-3 text-body text-text-primary"
                      key={value}
                    >
                      <input
                        checked={checked}
                        className="size-5 accent-corporate-blue"
                        name={`mobile-${activeFilter}`}
                        onChange={() => selectValue(activeFilter, value)}
                        type="checkbox"
                      />
                      {value}
                    </label>
                  );
                })}
                {values[activeFilter].length === 0 ? (
                  <p className="px-3 py-6 text-body text-text-secondary">
                    Önce bir marka seçiniz.
                  </p>
                ) : null}
              </fieldset>
            ) : (
              <ul>
                {filterKeys.map((key) => {
                  const disabled = key === "model" && !filters.make;
                  return (
                    <li className="border-b border-border-subtle" key={key}>
                      <button
                        className="flex min-h-13 w-full items-center justify-between gap-4 px-3 text-left font-semibold text-text-primary disabled:cursor-not-allowed disabled:text-text-secondary/60"
                        disabled={disabled}
                        onClick={() => setActiveFilter(key)}
                        type="button"
                      >
                        <span>
                          {filterLabels[key]}
                          {filters[key] ? (
                            <span className="ml-2 text-label font-normal text-corporate-blue">
                              {filters[key]}
                            </span>
                          ) : null}
                        </span>
                        <span aria-hidden="true" className="text-2xl">›</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="flex items-center justify-between gap-4 border-t border-border-subtle bg-surface-card p-3 shadow-[0_-0.5rem_1.5rem_rgb(24_33_54_/_0.08)]">
            <button
              className="min-h-11 px-2 text-label font-semibold text-text-primary"
              onClick={() => {
                onFiltersChange({});
                setActiveFilter(null);
              }}
              type="button"
            >
              ↻ Sıfırla
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-pill bg-accent-orange px-6 text-label font-semibold text-brand-navy transition-colors hover:bg-orange-dark motion-reduce:transition-none"
              onClick={closeDialog}
              type="button"
            >
              Uygun Aracı Bul <span aria-hidden="true" className="ml-2">›</span>
            </button>
          </footer>
        </div>
      ) : null}
    </>
  );
}
