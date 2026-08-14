function normalizeRecordLabel(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || undefined;
}

function foldRecordLabel(value) {
  return value.toLocaleLowerCase("tr-TR");
}

/**
 * Build dependent make/model options from either fully approved vehicle records
 * or the project owner's supplied catalogue identity records.
 */
export function buildVehicleFinderOptions(records) {
  const groupsByFoldedMake = new Map();

  for (const record of records) {
    const isFinderEligible =
      record.publicationStatus === "approved" ||
      record.contentStatus === "owner-supplied";

    if (!isFinderEligible) {
      continue;
    }

    const make = normalizeRecordLabel(record.make);
    const model = normalizeRecordLabel(record.model);

    if (!make || !model) {
      continue;
    }

    const makeKey = foldRecordLabel(make);
    const existingGroup = groupsByFoldedMake.get(makeKey);

    if (existingGroup) {
      existingGroup.models.set(foldRecordLabel(model), model);
    } else {
      groupsByFoldedMake.set(makeKey, {
        make,
        models: new Map([[foldRecordLabel(model), model]]),
      });
    }
  }

  return Object.freeze(
    [...groupsByFoldedMake.values()]
      .sort((left, right) => left.make.localeCompare(right.make, "tr-TR"))
      .map((group) =>
        Object.freeze({
          make: group.make,
          models: Object.freeze(
            [...group.models.values()].sort((left, right) =>
              left.localeCompare(right, "tr-TR"),
            ),
          ),
        }),
      ),
  );
}

/** Return models only after a make has been selected. */
export function getModelsForSelectedMake(options, selectedMake) {
  if (!selectedMake) {
    return Object.freeze([]);
  }

  return (
    options.find((option) => option.make === selectedMake)?.models ??
    Object.freeze([])
  );
}
