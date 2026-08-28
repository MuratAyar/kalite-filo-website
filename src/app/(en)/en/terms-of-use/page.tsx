import { createEnglishLegalMetadata, EnglishLegalPage } from "@/components/legal/english-legal-page";
export const metadata = createEnglishLegalMetadata("terms-of-use-en", "/en/terms-of-use/");
export default function Page() { return <EnglishLegalPage contentKey="terms-of-use-en" />; }
