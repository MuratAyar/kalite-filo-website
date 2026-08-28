import type { Metadata } from "next";

import {
  createLegalPageMetadata,
  LegalPage,
} from "@/components/legal/legal-page";
import { readLegalDocument } from "@/lib/legal-content";

const document = readLegalDocument("cerez-politikasi");

export const metadata: Metadata = createLegalPageMetadata(
  "cookie-policy",
  document,
);

export default function CookiePolicyPage() {
  return <LegalPage contentKey="cerez-politikasi" routeId="cookie-policy" />;
}
