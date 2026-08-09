import type { Vehicle } from "@/types";
import { assertUniqueContentRecords } from "@/lib";

export const vehicles: readonly Vehicle[] = Object.freeze([]);

assertUniqueContentRecords(vehicles, "vehicles");

