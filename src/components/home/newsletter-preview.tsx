import { PageContainer } from "@/components/layout/page-container";

import { NewsletterSignupDemo } from "./newsletter-signup-demo";

/**
 * Static newsletter section with an isolated, no-storage interaction demo.
 */
export function NewsletterPreview() {
  return (
    <section
      aria-labelledby="newsletter-preview-title"
      className="w-full border-t border-navy-secondary bg-brand-navy text-text-inverse"
    >
      <PageContainer className="grid gap-6 py-8 md:grid-cols-[minmax(0,1fr)_minmax(20rem,31rem)] md:items-center md:gap-10">
        <div className="min-w-0">
          <h2
            className="text-heading-md font-semibold tracking-tight"
            id="newsletter-preview-title"
          >
            E-Bültenimize Kaydolun
          </h2>
          <p
            className="mt-1 text-label text-text-inverse-muted"
            id="newsletter-preview-status"
          >
            Tasarım ön izlemesinde adresiniz gönderilmez veya kaydedilmez.
          </p>
        </div>

        <NewsletterSignupDemo />
      </PageContainer>
    </section>
  );
}
