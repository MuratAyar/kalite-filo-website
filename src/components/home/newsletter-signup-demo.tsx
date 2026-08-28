"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

const CONSENT_TEXT_VERSION = "2026-08-28-v2";

export function NewsletterSignupDemo({ locale = "tr" }: { locale?: "en" | "tr" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [consentError, setConsentError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const consentInput = form.elements.namedItem("consent");

    if (!(consentInput instanceof HTMLInputElement) || !consentInput.checked) {
      setConsentError(true);
      if (consentInput instanceof HTMLInputElement) consentInput.focus();
      return;
    }

    setConsentError(false);

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const body = new URLSearchParams();
      for (const [key, value] of new FormData(form).entries()) {
        body.append(key, String(value));
      }
      const response = await fetch("/forms/bulten.php", {
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        method: "POST",
      });
      const result = (await response.json()) as { message?: string; result?: string };

      if (!response.ok || result.result !== "basarili") {
        throw new Error(locale === "en" ? "Your subscription request could not be processed at this time." : (result.message || "Kayıt talebi şu anda alınamadı."));
      }

      form.reset();
      dialogRef.current?.showModal();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : (locale === "en" ? "Your subscription request could not be processed. Please try again later." : "Kayıt talebi şu anda alınamadı. Lütfen daha sonra yeniden deneyin."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form
        aria-describedby="newsletter-preview-status newsletter-submit-status"
        className="grid min-w-0 gap-3"
        noValidate
        onSubmit={handleSubmit}
      >
        <input name="consent_text_version" type="hidden" value={CONSENT_TEXT_VERSION} />
        <div aria-hidden="true" className="absolute -left-[9999px]" role="presentation">
          <label htmlFor="newsletter-website">Website</label>
          <input autoComplete="off" id="newsletter-website" name="website" tabIndex={-1} />
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="sr-only" htmlFor="newsletter-preview-email">{locale === "en" ? "Email address" : "E-posta adresi"}</label>
          <div className="flex min-h-11 min-w-0 items-center rounded-control border border-border-subtle bg-surface-card text-text-secondary focus-within:border-accent-orange">
            <svg aria-hidden="true" className="ml-3 size-5 shrink-0" fill="none" viewBox="0 0 24 24">
              <path
                d="m3.75 6.75 8.25 6 8.25-6M5.25 5.25h13.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            <input
              autoComplete="email"
              className="h-11 min-w-0 flex-1 border-0 bg-transparent px-3 text-body text-text-secondary outline-none placeholder:text-text-secondary/80 focus:outline-none focus-visible:outline-none"
              id="newsletter-preview-email"
              inputMode="email"
              maxLength={254}
              name="email"
              placeholder={locale === "en" ? "Your email address" : "E-posta adresiniz"}
              required
              type="email"
            />
          </div>
          <Button disabled={isSubmitting} size="compact" type="submit">
            {isSubmitting ? (locale === "en" ? "Subscribing…" : "Kaydediliyor…") : (locale === "en" ? "Subscribe" : "Kayıt Ol")}
            <span aria-hidden="true">→</span>
          </Button>
        </div>

        <div className="grid gap-1.5">
          <label className={`flex items-start gap-2 text-xs leading-5 ${consentError ? "text-error" : "text-text-inverse-muted"}`}>
            <input
              aria-describedby={consentError ? "newsletter-consent-error" : undefined}
              aria-invalid={consentError}
              className="mt-1 size-4 shrink-0 accent-accent-orange"
              name="consent"
              onChange={(event) => {
                if (event.currentTarget.checked) setConsentError(false);
              }}
              required
              type="checkbox"
              value="onaylandi"
            />
            <span>
              <Link
                className={`font-semibold underline decoration-current/50 underline-offset-2 hover:text-accent-orange ${consentError ? "text-error" : "text-text-inverse"}`}
                href={locale === "en" ? "/en/privacy-notice/" : "/aydinlatma-metni/"}
              >
                {locale === "en" ? "Privacy Notice" : "Aydınlatma metnini"}
              </Link>{" "}
              {locale === "en" ? " and consent to receiving Kalite Filo newsletters at my email address." : " okudum ve Kalite Filo e-bültenlerinin e-posta adresime gönderilmesini kabul ediyorum."}
            </span>
          </label>
          {consentError ? (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-error" id="newsletter-consent-error" role="alert">
              <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center rounded-full border border-current text-[0.65rem] leading-none">!</span>
              <span>{locale === "en" ? "Please accept the privacy notice and newsletter consent to continue." : "Devam etmek için aydınlatma metnini ve e-bülten onayını kabul etmelisiniz."}</span>
            </p>
          ) : null}
        </div>

        <p aria-live="polite" className={errorMessage ? "text-xs text-error" : "sr-only"} id="newsletter-submit-status">
          {errorMessage}
        </p>
      </form>

      <dialog
        aria-describedby="newsletter-demo-description"
        aria-labelledby="newsletter-demo-title"
        className="m-auto w-[min(30rem,calc(100vw_-_2rem))] rounded-panel border border-border-subtle bg-surface-card p-0 text-text-primary shadow-2xl backdrop:bg-brand-navy/75 backdrop:backdrop-blur-sm"
        ref={dialogRef}
      >
        <div className="p-6 sm:p-8">
          <div aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-success-surface text-success">
            <svg className="size-6" fill="none" viewBox="0 0 24 24">
              <path d="m6.75 12.75 3 3 7.5-7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
          <h3 className="mt-5 text-heading-md font-semibold tracking-tight" id="newsletter-demo-title">{locale === "en" ? "Your subscription request has been received" : "Kayıt talebiniz alındı"}</h3>
          <p className="mt-3 text-body text-text-secondary" id="newsletter-demo-description">
            {locale === "en" ? "Your email address has been recorded as a pending newsletter subscription. The applicable İYS process will also be completed." : "E-posta adresiniz onay bekleyen bülten kaydı olarak güvenli biçimde kaydedildi. İYS durumu ayrıca tamamlanacaktır."}
          </p>
          <form className="mt-6 flex justify-end" method="dialog">
            <Button size="compact" type="submit">{locale === "en" ? "Close" : "Tamam"}</Button>
          </form>
        </div>
      </dialog>
    </>
  );
}
