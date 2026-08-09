import type { LegalPageMetadata } from "@/types";
import { assertUniqueBy } from "@/lib";

export const legalPages: readonly LegalPageMetadata[] = Object.freeze([]);

assertUniqueBy(legalPages, (page) => page.id, "legal page ids");
assertUniqueBy(legalPages, (page) => page.path, "legal page paths");

