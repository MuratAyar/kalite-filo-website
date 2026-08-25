import type { Metadata } from "next";

import { ContactForm } from "@/components/contact";
import { EditorialPreview, NewsletterPreview } from "@/components/home";
import { PageContainer, PageHeader, Section } from "@/components/layout";
import { getPublicStaticRoute } from "@/config/public-navigation";
import { articleCategories, articles, homePageCopy } from "@/data";
import { createStaticRouteMetadata } from "@/lib/route-metadata";

const homeRoute = getPublicStaticRoute("home");
const route = getPublicStaticRoute("contact");
const fleetGuideRoute = getPublicStaticRoute("fleet-guide");

export const metadata: Metadata = {
  ...createStaticRouteMetadata(route.id),
  description:
    "Kalite Filo iletişim bilgilerine ulaşın ve kurumsal araç kiralama ihtiyaçlarınız için iletişim formunu kullanın.",
  title: "İletişim",
};

export default function ContactPage() {
  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <div className="relative overflow-hidden bg-accent-orange">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,var(--kf-brand-navy)_1px,transparent_1px),linear-gradient(to_bottom,var(--kf-brand-navy)_1px,transparent_1px)] [background-size:2.5rem_2.5rem]" />
        <PageHeader
          breadcrumbs={[
            { href: homeRoute.path, label: homeRoute.label },
            { label: route.label },
          ]}
          className="relative !bg-transparent"
          title={route.label}
          variant="high-emphasis"
        />

        <Section aria-labelledby="contact-form-title" className="relative pt-6 md:pt-10" surface="transparent">
          <PageContainer>
          <div
            className="grid items-stretch gap-8 lg:grid-cols-2"
            data-mobile-route-offset="8"
            data-mobile-route-start="/iletisim/"
          >
            <div className="relative flex flex-col overflow-hidden rounded-panel border border-brand-navy/15 bg-surface-muted shadow-lg md:min-h-[34rem]">
              <iframe
                allowFullScreen
                className="h-[22rem] w-full border-0 md:absolute md:inset-0 md:size-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Petrol+%C4%B0%C5%9F+Mahallesi,+Mesire+Sokak,+No:8,+Daire:3,+Kartal,+%C4%B0stanbul&output=embed"
                title="Kalite Filo adresi: Petrol İş Mahallesi, Mesire Sokak, No:8, Daire:3, Kartal, İstanbul"
              />
              <aside className="relative w-full bg-brand-navy p-5 text-text-inverse md:absolute md:bottom-6 md:left-6 md:w-[28rem] md:rounded-card md:p-6 md:shadow-xl">
                <h2 className="text-heading-md font-semibold">Genel Müdürlük</h2>
                <dl className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4">
                  <div className="flex min-h-14 items-center gap-3 rounded-control bg-surface-card/10 px-4 md:min-h-0 md:rounded-none md:bg-transparent md:px-0">
                    <dt className="shrink-0 text-accent-orange">
                      <span className="sr-only">Telefon</span>
                      <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
                        <path d="M8.25 4.5 10.5 9l-2.25 1.5a14.2 14.2 0 0 0 5.25 5.25L15 13.5l4.5 2.25v3a1.5 1.5 0 0 1-1.5 1.5A14.25 14.25 0 0 1 3.75 6 1.5 1.5 0 0 1 5.25 4.5h3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
                      </svg>
                    </dt>
                    <dd><a className="text-body hover:text-accent-orange" href="tel:+905317158068">05317158068</a></dd>
                  </div>
                  <div className="flex min-h-14 items-center gap-3 rounded-control bg-surface-card/10 px-4 md:min-h-0 md:rounded-none md:bg-transparent md:px-0">
                    <dt className="shrink-0 text-accent-orange">
                      <span className="sr-only">E-posta</span>
                      <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
                        <path d="m3.75 6.75 8.25 6 8.25-6M5.25 5.25h13.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
                      </svg>
                    </dt>
                    <dd><a className="whitespace-nowrap text-body hover:text-accent-orange" href="mailto:contact@kalitefilo.com.tr">contact@kalitefilo.com.tr</a></dd>
                  </div>
                </dl>
              </aside>
            </div>

            <div className="flex flex-col justify-center rounded-panel border border-border-subtle bg-surface-card p-6 shadow-lg sm:p-8 lg:p-10">
              <div className="mb-8">
                <h2 className="text-heading-lg font-semibold" id="contact-form-title">Bizlere Ulaşın</h2>
                <p className="mt-3 text-body-lg text-text-secondary">Hizmetlerimiz hakkında bilgi almak için bizimle iletişime geçin.</p>
              </div>
              <ContactForm />
            </div>
          </div>
          </PageContainer>
        </Section>
      </div>

      <EditorialPreview articles={articles} categories={articleCategories} columns={4} content={homePageCopy.editorial} fleetGuideHref={fleetGuideRoute.path} />
      <NewsletterPreview />
    </main>
  );
}
