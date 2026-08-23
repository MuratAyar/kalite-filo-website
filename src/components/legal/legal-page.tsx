import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { getPublicStaticRoute } from "@/config/public-navigation";
import type { LegalContentKey, LegalDocumentSource } from "@/lib/legal-content";
import { readLegalDocument } from "@/lib/legal-content";
import { createStaticRouteMetadata } from "@/lib/route-metadata";

import { LegalDocument } from "./legal-document";

type LegalRouteId = "cookie-policy" | "privacy-security" | "terms-of-use";

type LegalPageProps = {
  readonly contentKey: LegalContentKey;
  readonly routeId: LegalRouteId;
};

const homeRoute = getPublicStaticRoute("home");

export function createLegalPageMetadata(
  routeId: LegalRouteId,
  document: LegalDocumentSource,
): Metadata {
  return {
    ...createStaticRouteMetadata(routeId),
    description: document.description,
    title: document.title,
  };
}

export function LegalPage({ contentKey, routeId }: LegalPageProps) {
  const route = getPublicStaticRoute(routeId);
  const document = readLegalDocument(contentKey);

  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      <PageHeader
        breadcrumbs={[
          { href: homeRoute.path, label: homeRoute.label },
          { label: route.label },
        ]}
        intro={document.description}
        title={document.title}
        variant="high-emphasis"
      />
      <Section className="pt-0" spacing="default" surface="page">
        <PageContainer>
          <LegalDocument markdown={document.markdown} />
        </PageContainer>
      </Section>
    </main>
  );
}
