import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { PageContainer } from "@/components/layout/page-container";
import { getPublicStaticRoute } from "@/config/public-navigation";
import { readLegalDocument } from "@/lib/legal-content";
import { createStaticRouteMetadata } from "@/lib/route-metadata";

const route = getPublicStaticRoute("form-privacy-notice");
const document = readLegalDocument("aydinlatma-metni");

export const metadata: Metadata = {
  ...createStaticRouteMetadata(route.id),
  description: document.description,
  title: document.title,
};

export default function FormPrivacyNoticePage() {
  return (
    <main className="flex-1 bg-white text-black" id="main-content" tabIndex={-1}>
      <PageContainer className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto mb-10 max-w-5xl border-b border-black pb-6 font-serif">
          <h1 className="text-3xl font-bold leading-tight text-black sm:text-4xl">
            {document.title}
          </h1>
        </div>
        <div className="font-serif [&_a]:!text-black [&_article]:!rounded-none [&_article]:!border-black [&_article]:!bg-white [&_article]:!shadow-none [&_aside]:!rounded-none [&_aside]:!border-black [&_aside]:!bg-white [&_code]:!rounded-none [&_code]:!bg-white [&_code]:!text-black [&_h2]:!text-black [&_h3]:!text-black [&_li]:!text-black [&_ol]:!text-black [&_p]:!text-black [&_table]:!text-black [&_td]:!border-black [&_td]:!text-black [&_th]:!border-black [&_th]:!bg-white [&_th]:!text-black [&_ul]:!text-black">
          <LegalDocument markdown={document.markdown} />
        </div>
      </PageContainer>
    </main>
  );
}
