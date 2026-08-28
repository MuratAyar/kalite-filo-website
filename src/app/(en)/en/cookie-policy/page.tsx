import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { PageContainer, PageHeader, Section } from "@/components/layout";
import { ENGLISH_STATIC_PATHS } from "@/config/localized-routes";
import { asInternalPath } from "@/lib";
import { readLegalDocument } from "@/lib/legal-content";

const document = readLegalDocument("cookie-policy-en");

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
  alternates: { canonical: ENGLISH_STATIC_PATHS.cookiePolicy, languages: { en: ENGLISH_STATIC_PATHS.cookiePolicy, tr: "/cerez-politikasi/", "x-default": "/cerez-politikasi/" } },
  robots: { index: false, follow: false },
};

export default function EnglishCookiePolicyPage() {
  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <PageHeader breadcrumbs={[{ href: asInternalPath("/en/", "English home"), label: "Home" }, { label: document.title }]} breadcrumbsAriaLabel="Breadcrumb" intro={document.description} title={document.title} variant="high-emphasis" />
      <Section className="pt-0" surface="page"><PageContainer><LegalDocument locale="en" markdown={document.markdown} /></PageContainer></Section>
    </main>
  );
}
