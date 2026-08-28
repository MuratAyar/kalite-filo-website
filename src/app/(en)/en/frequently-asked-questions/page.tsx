import type { Metadata } from "next";

import { FaqPageContent } from "@/components/faq";
import { PageHeader } from "@/components/layout";
import { ENGLISH_STATIC_PATHS } from "@/config/localized-routes";
import { englishFaqCategories, englishFaqEntries } from "@/data";
import { asInternalPath } from "@/lib";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions about corporate vehicle leasing, fleet solutions, maintenance and damage processes.",
  alternates: { canonical: ENGLISH_STATIC_PATHS.faq, languages: { en: ENGLISH_STATIC_PATHS.faq, tr: "/sikca-sorulan-sorular/", "x-default": "/sikca-sorulan-sorular/" } },
  robots: createTranslatedRouteRobots("faq"),
};

export default function EnglishFaqPage() {
  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <PageHeader breadcrumbs={[{ href: asInternalPath("/en/", "English home"), label: "Home" }, { label: "Frequently Asked Questions" }]} breadcrumbsAriaLabel="Breadcrumb" title="Frequently Asked Questions" />
      <FaqPageContent categories={englishFaqCategories} contactHref={asInternalPath(ENGLISH_STATIC_PATHS.contact, "English contact")} entries={englishFaqEntries} locale="en" />
    </main>
  );
}
