import type { FaqCategory, FaqEntry } from "@/types";
import { assertUniqueContentRecords, assertUniqueBy } from "@/lib";

export const faqCategories: readonly FaqCategory[] = Object.freeze([]);
export const faqEntries: readonly FaqEntry[] = Object.freeze([]);

assertUniqueContentRecords(faqCategories, "FAQ categories");
assertUniqueBy(faqEntries, (entry) => entry.id, "FAQ entry ids");

