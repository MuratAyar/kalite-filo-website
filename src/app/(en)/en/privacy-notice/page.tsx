import { createEnglishLegalMetadata, EnglishLegalPage } from "@/components/legal/english-legal-page";
export const metadata = createEnglishLegalMetadata("privacy-notice-en", "/en/privacy-notice/");
export default function Page() { return <EnglishLegalPage contentKey="privacy-notice-en" />; }
