"use client";

import { useState } from "react";

import type { InternalPath } from "@/types";
import type { VehicleFinderOptionGroup } from "@/lib/vehicle-finder-options.mjs";

import { Button } from "@/components/ui";
import { getModelsForSelectedMake } from "@/lib/vehicle-finder-options.mjs";

export type VehicleFinderFieldsProps = {
  actionHref: InternalPath;
  actionLabel: string;
  options: readonly VehicleFinderOptionGroup[];
};

const selectClassName =
  "min-h-12 w-full rounded-control border border-white/25 bg-white/10 px-4 text-body text-text-inverse outline-none backdrop-blur-sm focus-visible:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55";

/** The smallest client island needed for the dependent native selects. */
export function VehicleFinderFields({
  actionHref,
  actionLabel,
  options,
}: VehicleFinderFieldsProps) {
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const models = getModelsForSelectedMake(options, selectedMake);
  const hasApprovedOptions = options.length > 0;

  return (
    <form
      action={actionHref}
      className="mt-5 space-y-4"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const searchParams = new URLSearchParams();

        if (selectedMake) {
          searchParams.set("marka", selectedMake);
        }

        if (selectedMake && selectedModel) {
          searchParams.set("model", selectedModel);
        }

        const query = searchParams.toString();
        window.location.assign(query ? `${actionHref}?${query}` : actionHref);
      }}
    >
      <div>
        <label
          className="mb-2 block text-label font-semibold text-text-inverse"
          htmlFor="quick-vehicle-make"
        >
          Marka Seçiniz
        </label>
        <select
          className={selectClassName}
          disabled={!hasApprovedOptions}
          id="quick-vehicle-make"
          name="marka"
          onChange={(event) => {
            setSelectedMake(event.target.value);
            setSelectedModel("");
          }}
          value={selectedMake}
        >
          <option className="bg-brand-navy text-text-inverse" value="">
            {hasApprovedOptions ? "Tüm Markalar" : "Portföy verisi bekleniyor"}
          </option>
          {options.map((option) => (
            <option
              className="bg-brand-navy text-text-inverse"
              key={option.make}
              value={option.make}
            >
              {option.make}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          className="mb-2 block text-label font-semibold text-text-inverse"
          htmlFor="quick-vehicle-model"
        >
          Model Seçiniz
        </label>
        <select
          className={selectClassName}
          disabled={!selectedMake}
          id="quick-vehicle-model"
          name="model"
          onChange={(event) => setSelectedModel(event.target.value)}
          value={selectedModel}
        >
          <option className="bg-brand-navy text-text-inverse" value="">
            {selectedMake ? "Tüm Modeller" : "Önce marka seçiniz"}
          </option>
          {models.map((model) => (
            <option
              className="bg-brand-navy text-text-inverse"
              key={model}
              value={model}
            >
              {model}
            </option>
          ))}
        </select>
      </div>
      <Button
        disabled={!hasApprovedOptions}
        fullWidth
        size="primary"
        type="submit"
        variant="primary"
      >
        {actionLabel}
        <span aria-hidden="true">→</span>
      </Button>
      {!hasApprovedOptions ? (
        <p className="text-sm leading-6 text-text-inverse-muted">
          Doğrulanmış portföy seçenekleri eklendiğinde araç arama kullanılabilir.
        </p>
      ) : null}
    </form>
  );
}
