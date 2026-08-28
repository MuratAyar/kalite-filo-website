import type { Metadata } from "next";

import {
  createLegalPageMetadata,
  LegalPage,
} from "@/components/legal/legal-page";
import { readLegalDocument } from "@/lib/legal-content";

const document = readLegalDocument("kullanim-kosullari");

export const metadata: Metadata = createLegalPageMetadata(
  "terms-of-use",
  document,
);

export default function TermsOfUsePage() {
  return <LegalPage contentKey="kullanim-kosullari" routeId="terms-of-use" />;
}
