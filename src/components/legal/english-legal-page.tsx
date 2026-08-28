import type { Metadata } from "next";

import { PageContainer, PageHeader, Section } from "@/components/layout";
import type { LegalContentKey } from "@/lib/legal-content";
import { readLegalDocument } from "@/lib/legal-content";

import { LegalDocument } from "./legal-document";

export function createEnglishLegalMetadata(contentKey: LegalContentKey, path: string): Metadata {
  const document = readLegalDocument(contentKey);
  return { title: document.title, description: document.description, alternates: { canonical: path }, robots: { index: false, follow: true } };
}

export function EnglishLegalPage({ contentKey }: { contentKey: LegalContentKey }) {
  const document = readLegalDocument(contentKey);
  return <main className="flex-1" id="main-content" tabIndex={-1}>
    <PageHeader breadcrumbs={[{ href: "/en/", label: "Home" }, { label: document.title }]} breadcrumbsAriaLabel="Breadcrumb" intro={document.description} title={document.title} variant="high-emphasis" />
    <Section className="pt-0" spacing="default" surface="page"><PageContainer><LegalDocument locale="en" markdown={document.markdown} /></PageContainer></Section>
  </main>;
}
