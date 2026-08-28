import { createEnglishLegalMetadata, EnglishLegalPage } from "@/components/legal/english-legal-page";
export const metadata = createEnglishLegalMetadata("data-protection-and-security-en", "/en/data-protection-and-security/");
export default function Page() { return <EnglishLegalPage contentKey="data-protection-and-security-en" />; }
