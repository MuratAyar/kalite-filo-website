import assert from "node:assert/strict";
import test from "node:test";

import {
  buildVehicleCatalogueOptions,
  filterVehicleCatalogue,
  getVehicleFuelGroup,
  getVehicleTransmissionGroup,
  normalizeVehicleCatalogueFilters,
  readVehicleCatalogueQueryFilters,
  serializeVehicleCatalogueFilters,
} from "../src/lib/vehicle-catalogue-filters.mjs";

const records = Object.freeze([
  Object.freeze({
    id: "clio",
    categoryLabel: "Binek",
    fuelLabel: "Benzin",
    make: "Renault",
    model: "Clio",
    segmentLabel: "B Hatchback",
    transmissionLabel: "X-Tronic Otomatik",
    listPrice: { amountMinor: 4_020_000 },
  }),
  Object.freeze({
    id: "duster",
    categoryLabel: "SUV",
    fuelLabel: "Benzin / Mild Hybrid",
    make: "Renault",
    model: "Duster",
    segmentLabel: "C-SUV",
    transmissionLabel: "7 ileri EDC Otomatik",
    listPrice: { amountMinor: 5_100_000 },
  }),
  Object.freeze({
    id: "transit",
    categoryLabel: "Ticari",
    fuelLabel: "Dizel",
    make: "Ford",
    model: "Transit Van",
    segmentLabel: "Büyük Panelvan",
    transmissionLabel: "6 ileri Manuel",
    listPrice: { amountMinor: 3_250_000 },
  }),
  Object.freeze({
    id: "model-y",
    categoryLabel: "SUV",
    fuelLabel: "Elektrik",
    make: "Tesla",
    model: "Model Y",
    segmentLabel: "D-SUV Elektrik",
    transmissionLabel: "Tek oranlı otomatik",
    listPrice: { amountMinor: 6_300_000 },
  }),
]);

test("reads and normalizes only approved catalogue query keys", () => {
  assert.deepEqual(
    readVehicleCatalogueQueryFilters(
      new URLSearchParams(
        "marka=%20RENAULT%20&model=Clio&kategori=Binek&yakit=Benzin&segment=B%20Hatchback&vites=Otomatik&sirala=fiyat-artan&ignored=yes",
      ),
    ),
    {
      category: "Binek",
      make: "RENAULT",
      model: "Clio",
      fuel: "Benzin",
      segment: "B Hatchback",
      transmission: "Otomatik",
      sort: "fiyat-artan",
    },
  );
});

test("canonicalizes Turkish-aware values against the supplied catalogue", () => {
  assert.deepEqual(
    normalizeVehicleCatalogueFilters(records, {
      category: "suv",
      make: "renault",
      model: "DUSTER",
      fuel: "hybrid",
      segment: "c-suv",
      transmission: "yarı otomatik",
    }),
    {
      category: "SUV",
      make: "Renault",
      model: "Duster",
      fuel: "Hybrid",
      segment: "C-SUV",
      transmission: "Yarı Otomatik",
    },
  );
});

test("rejects unknown values and a model outside its selected make", () => {
  assert.deepEqual(
    normalizeVehicleCatalogueFilters(records, {
      category: "Yönetici",
      make: "Renault",
      model: "Transit Van",
      fuel: "LPG",
      segment: "Denizaltı",
      transmission: "Robot",
    }),
    { make: "Renault" },
  );

  assert.deepEqual(
    normalizeVehicleCatalogueFilters(records, { model: "Clio" }),
    {},
  );
});

test("builds a dependent model list only after a valid make selection", () => {
  assert.deepEqual(buildVehicleCatalogueOptions(records).models, []);
  assert.deepEqual(
    buildVehicleCatalogueOptions(records, "Renault").models,
    ["Clio", "Duster"],
  );
  assert.deepEqual(buildVehicleCatalogueOptions(records).makes, [
    "Ford",
    "Renault",
    "Tesla",
  ]);
});

test("filters by category, exact make/model, fuel group, and transmission", () => {
  assert.deepEqual(
    filterVehicleCatalogue(records, { category: "SUV" }).map(
      (record) => record.id,
    ),
    ["duster", "model-y"],
  );
  assert.deepEqual(
    filterVehicleCatalogue(records, {
      make: "Renault",
      model: "Duster",
      fuel: "Hybrid",
      transmission: "Yarı Otomatik",
    }).map((record) => record.id),
    ["duster"],
  );
  assert.deepEqual(
    filterVehicleCatalogue(records, {
      category: "Ticari",
      fuel: "Dizel",
      segment: "Büyük Panelvan",
      transmission: "Manuel",
    }).map((record) => record.id),
    ["transit"],
  );
});

test("derives verified fuel and transmission groups from portfolio labels", () => {
  assert.equal(getVehicleFuelGroup("Benzin / Mild Hybrid"), "Hybrid");
  assert.equal(getVehicleFuelGroup("Tam Hybrid"), "Hybrid");
  assert.equal(getVehicleFuelGroup("Elektrik"), "Elektrik");
  assert.equal(getVehicleTransmissionGroup("6 ileri Manuel"), "Manuel");
  assert.equal(
    getVehicleTransmissionGroup("7DCT Otomatik"),
    "Yarı Otomatik",
  );
  assert.equal(getVehicleTransmissionGroup("X-Tronic Otomatik"), "Otomatik");
});

test("serializes only non-empty approved query key names", () => {
  assert.equal(
    serializeVehicleCatalogueFilters({
      category: "SUV",
      make: "Renault",
      model: "",
      fuel: "Hybrid",
      segment: "C-SUV",
      transmission: "Otomatik",
      sort: "fiyat-azalan",
    }),
    "kategori=SUV&marka=Renault&yakit=Hybrid&segment=C-SUV&vites=Otomatik&sirala=fiyat-azalan",
  );
});

test("sorts filtered catalogue prices in either direction and preserves default order", () => {
  assert.deepEqual(
    filterVehicleCatalogue(records, { sort: "fiyat-artan" }).map(
      (record) => record.id,
    ),
    ["transit", "clio", "duster", "model-y"],
  );
  assert.deepEqual(
    filterVehicleCatalogue(records, { sort: "fiyat-azalan" }).map(
      (record) => record.id,
    ),
    ["model-y", "duster", "clio", "transit"],
  );
  assert.deepEqual(
    filterVehicleCatalogue(records).map((record) => record.id),
    ["clio", "duster", "transit", "model-y"],
  );
});
