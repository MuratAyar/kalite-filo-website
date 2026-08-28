import type { Metadata } from "next";

import {
  createLegalPageMetadata,
  LegalPage,
} from "@/components/legal/legal-page";
import { readLegalDocument } from "@/lib/legal-content";

const document = readLegalDocument("kvkk-ve-guvenlik");

export const metadata: Metadata = createLegalPageMetadata(
  "privacy-security",
  document,
);

export default function PrivacySecurityPage() {
  return <LegalPage contentKey="kvkk-ve-guvenlik" routeId="privacy-security" />;
}
