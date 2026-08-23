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
          className="relative !bg-transparent pb-8"
          title={route.label}
          variant="high-emphasis"
        />

        <Section aria-labelledby="contact-form-title" className="relative pt-6 md:pt-10" surface="transparent">
          <PageContainer>
          <div className="grid items-stretch gap-8 lg:grid-cols-2">
            <div className="relative min-h-[34rem] overflow-hidden rounded-panel border border-brand-navy/15 bg-surface-muted shadow-lg">
              <iframe
                allowFullScreen
                className="absolute inset-0 size-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Petrol+%C4%B0%C5%9F+Mahallesi,+Mesire+Sokak,+No:8,+Daire:3,+Kartal,+%C4%B0stanbul&output=embed"
                title="Kalite Filo adresi: Petrol İş Mahallesi, Mesire Sokak, No:8, Daire:3, Kartal, İstanbul"
              />
              <aside className="absolute inset-x-4 bottom-4 rounded-card bg-brand-navy p-5 text-text-inverse shadow-xl sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[28rem] sm:p-6">
                <h2 className="text-heading-md font-semibold">Genel Müdürlük</h2>
                <dl className="mt-5 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-label font-semibold uppercase tracking-wide text-accent-orange">Telefon</dt>
                      <dd className="mt-1"><a className="text-body hover:text-accent-orange" href="tel:+905317158068">05317158068</a></dd>
                    </div>
                    <div>
                      <dt className="text-label font-semibold uppercase tracking-wide text-accent-orange">E-posta</dt>
                      <dd className="mt-1"><a className="whitespace-nowrap text-body hover:text-accent-orange" href="mailto:contact@kalitefilo.com.tr">contact@kalitefilo.com.tr</a></dd>
                    </div>
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
