import type { Metadata } from "next";

import { ContactForm } from "@/components/contact";
import { EditorialPreview, NewsletterPreview } from "@/components/home";
import { PageContainer, PageHeader, Section } from "@/components/layout";
import { ConsentAwareMap } from "@/components/privacy";
import { ENGLISH_STATIC_PATHS } from "@/config/localized-routes";
import { englishArticleCategories, englishArticles, englishHomePageCopy } from "@/data";
import { createTranslatedRouteRobots } from "@/lib/route-metadata";
import { asInternalPath } from "@/lib";

export const metadata: Metadata = { title: "Contact", description: "Contact Kalite Filo about corporate vehicle leasing requirements.", alternates: { canonical: ENGLISH_STATIC_PATHS.contact, languages: { en: ENGLISH_STATIC_PATHS.contact, tr: "/iletisim/", "x-default": "/iletisim/" } }, robots: createTranslatedRouteRobots("contact") };

export default function EnglishContactPage() {
  return <main className="flex-1" id="main-content" tabIndex={-1}>
    <div className="relative overflow-hidden bg-accent-orange">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,var(--kf-brand-navy)_1px,transparent_1px),linear-gradient(to_bottom,var(--kf-brand-navy)_1px,transparent_1px)] [background-size:2.5rem_2.5rem]" />
      <PageHeader breadcrumbs={[{ href: "/en/", label: "Home" }, { label: "Contact" }]} breadcrumbsAriaLabel="Breadcrumb" className="relative !bg-transparent" title="Contact" variant="high-emphasis" />
      <Section aria-labelledby="contact-form-title" className="relative pt-6 md:pt-10" surface="transparent"><PageContainer>
        <div className="grid items-stretch gap-8 lg:grid-cols-2" data-mobile-route-offset="8" data-mobile-route-start="/en/contact/">
          <div className="relative flex flex-col overflow-hidden rounded-panel border border-brand-navy/15 bg-surface-muted shadow-lg md:min-h-[34rem]">
            <ConsentAwareMap locale="en" />
            <aside className="relative w-full bg-brand-navy p-5 text-text-inverse md:absolute md:bottom-6 md:left-6 md:w-[28rem] md:rounded-card md:p-6 md:shadow-xl"><h2 className="text-heading-md font-semibold">Head Office</h2><dl className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4"><div className="flex min-h-14 items-center gap-3 rounded-control bg-surface-card/10 px-4 md:min-h-0 md:rounded-none md:bg-transparent md:px-0"><dt className="shrink-0 text-accent-orange"><span className="sr-only">Phone</span><svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24"><path d="M8.25 4.5 10.5 9l-2.25 1.5a14.2 14.2 0 0 0 5.25 5.25L15 13.5l4.5 2.25v3a1.5 1.5 0 0 1-1.5 1.5A14.25 14.25 0 0 1 3.75 6 1.5 1.5 0 0 1 5.25 4.5h3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></dt><dd><a className="text-body hover:text-accent-orange" href="tel:+905317158068">05317158068</a></dd></div><div className="flex min-h-14 items-center gap-3 rounded-control bg-surface-card/10 px-4 md:min-h-0 md:rounded-none md:bg-transparent md:px-0"><dt className="shrink-0 text-accent-orange"><span className="sr-only">Email</span><svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24"><path d="m3.75 6.75 8.25 6 8.25-6M5.25 5.25h13.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></dt><dd><a className="whitespace-nowrap text-body hover:text-accent-orange" href="mailto:contact@kalitefilo.com.tr">contact@kalitefilo.com.tr</a></dd></div></dl></aside>
          </div>
          <div className="flex flex-col justify-center rounded-panel border border-border-subtle bg-surface-card p-6 shadow-lg sm:p-8 lg:p-10"><div className="mb-8"><h2 className="text-heading-lg font-semibold" id="contact-form-title">Contact Us</h2><p className="mt-3 text-body-lg text-text-secondary">Contact us to learn more about our services.</p></div><ContactForm locale="en" /></div>
        </div>
      </PageContainer></Section>
    </div>
    <EditorialPreview articles={englishArticles} categories={englishArticleCategories} columns={4} content={englishHomePageCopy.editorial} fleetGuideHref={asInternalPath(ENGLISH_STATIC_PATHS.fleetGuide, "English Fleet Guide")} locale="en" />
    <NewsletterPreview locale="en" />
  </main>;
}
