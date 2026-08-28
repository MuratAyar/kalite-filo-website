"use client";

import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { CommercialEmailConsent } from "@/components/forms/commercial-email-consent";

type FieldErrors = Partial<Record<"isim" | "eposta" | "mesaj", string>>;
type ContactResult = "basarili" | "dogrulama" | "limit" | "gonderilemedi" | "servis_yok";
type ContactResponse = { fieldErrors?: FieldErrors; result?: ContactResult };

const fieldClassName =
  "min-h-12 w-full rounded-control border border-border-control bg-surface-page px-4 text-body text-text-primary placeholder:text-text-secondary/75 focus:border-corporate-blue focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const resultMessages: Record<ContactResult, { body: string; title: string }> = {
  basarili: { body: "Mesajınız ekibimize ulaştı. En kısa sürede sizinle iletişime geçeceğiz.", title: "Mesajınız gönderildi" },
  dogrulama: { body: "Lütfen işaretlenen alanları kontrol ederek yeniden gönderin.", title: "Bilgileri kontrol edin" },
  limit: { body: "Kısa süre içinde çok sayıda gönderim yapıldı. Lütfen daha sonra yeniden deneyin.", title: "Gönderim sınırına ulaşıldı" },
  gonderilemedi: { body: "Teknik bir sorun oluştu. Lütfen daha sonra yeniden deneyin veya iletişim bilgilerimizi kullanın.", title: "Mesaj gönderilemedi" },
  servis_yok: { body: "Form gönderim servisi bu yerel önizlemede çalışmıyor. Form, PHP destekli staging ve production ortamında gönderilebilir.", title: "Gönderim servisi kullanılamıyor" },
};

function validationMessageFor(field: HTMLInputElement | HTMLTextAreaElement, locale: "en" | "tr") {
  if (field.validity.valueMissing) return locale === "en" ? "*This field is required." : "*Bu alan boş bırakılamaz.";
  if (field.validity.typeMismatch) return locale === "en" ? "*Enter a valid email address." : "*Geçersiz e-posta adresi.";
  return locale === "en" ? "*Enter a valid value." : "*Bu alan geçerli formatta doldurulmalıdır.";
}

export function ContactForm({ locale = "tr" }: { readonly locale?: "en" | "tr" }) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<ContactResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    const name = target.name as keyof FieldErrors;
    if (!fieldErrors[name]) return;
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input:not([type='hidden']), textarea"));
    const invalidFields = fields.filter((field) => !field.checkValidity());
    if (invalidFields.length > 0) {
      setFieldErrors(Object.fromEntries(invalidFields.map((field) => [field.name, validationMessageFor(field, locale)])));
      setResult("dogrulama");
      invalidFields[0]?.focus();
      return;
    }

    setFieldErrors({});
    setResult(null);
    setSubmitting(true);
    try {
      const body = new URLSearchParams();
      new FormData(form).forEach((value, key) => {
        if (typeof value === "string") body.append(key, value);
      });
      const response = await fetch(form.action, {
        body,
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        method: "POST",
      });
      if (!(response.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
        setResult(response.status === 404 ? "servis_yok" : "gonderilemedi");
        return;
      }
      const payload = (await response.json()) as ContactResponse;
      if (!response.ok || payload.result !== "basarili") {
        if (payload.result === "dogrulama" && payload.fieldErrors) {
          setFieldErrors(locale === "en" ? Object.fromEntries(Object.keys(payload.fieldErrors).map((key) => [key, "*Enter a valid value."])) : payload.fieldErrors);
          const firstInvalid = Object.keys(payload.fieldErrors)[0];
          const target = firstInvalid ? form.elements.namedItem(firstInvalid) : null;
          if (target instanceof HTMLElement) window.requestAnimationFrame(() => target.focus());
        }
        setResult(payload.result && payload.result in resultMessages ? payload.result : "gonderilemedi");
        return;
      }
      setResult("basarili");
      form.reset();
    } catch {
      setResult("gonderilemedi");
    } finally {
      setSubmitting(false);
      window.requestAnimationFrame(() => resultRef.current?.focus());
    }
  }

  const englishResultMessages: typeof resultMessages = {
    basarili: { title: "Your message has been sent", body: "Your message has reached our team. We will contact you as soon as possible." },
    dogrulama: { title: "Check your information", body: "Review the highlighted fields and submit the form again." },
    limit: { title: "Submission limit reached", body: "Several submissions were made in a short period. Please try again later." },
    gonderilemedi: { title: "Message could not be sent", body: "A technical problem occurred. Please try again later or use our contact details." },
    servis_yok: { title: "Submission service unavailable", body: "The form service is unavailable in this local preview. It can be used in the PHP-enabled staging and production environments." },
  };
  const resultMessage = result ? (locale === "en" ? englishResultMessages : resultMessages)[result] : null;

  return (
    <form acceptCharset="UTF-8" action="/forms/iletisim.php" aria-busy={submitting} className="space-y-5" method="post" noValidate onInput={clearFieldError} onSubmit={handleSubmit}>
      <input name="locale" type="hidden" value={locale} />
      <div aria-hidden="true" className="absolute -left-[10000px] size-px overflow-hidden">
        <label htmlFor="contact-website">{locale === "en" ? "Website" : "Web sitesi"}</label>
        <input autoComplete="off" id="contact-website" name="website" tabIndex={-1} type="text" />
      </div>
      <div className="space-y-2">
        <label className="block text-label font-semibold" htmlFor="contact-name">{locale === "en" ? "Full Name" : "İsim Soyisim"} <span aria-hidden="true">*</span></label>
        <input aria-describedby={fieldErrors.isim ? "contact-name-error" : undefined} aria-invalid={fieldErrors.isim ? true : undefined} autoComplete="name" className={fieldClassName} id="contact-name" name="isim" placeholder={locale === "en" ? "Your full name" : "Adınız Soyadınız"} required type="text" />
        {fieldErrors.isim ? <p className="text-label text-error" id="contact-name-error">{fieldErrors.isim}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="block text-label font-semibold" htmlFor="contact-email">{locale === "en" ? "Email" : "E-posta"} <span aria-hidden="true">*</span></label>
        <input aria-describedby={fieldErrors.eposta ? "contact-email-error" : undefined} aria-invalid={fieldErrors.eposta ? true : undefined} autoComplete="email" className={fieldClassName} id="contact-email" name="eposta" placeholder={locale === "en" ? "name@company.com" : "ornek@sirket.com"} required type="email" />
        {fieldErrors.eposta ? <p className="text-label text-error" id="contact-email-error">{fieldErrors.eposta}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="block text-label font-semibold" htmlFor="contact-message">{locale === "en" ? "Message" : "Mesaj"}</label>
        <textarea className={`${fieldClassName} min-h-36 resize-y py-3`} id="contact-message" name="mesaj" placeholder={locale === "en" ? "Your message..." : "Mesajınız..."} rows={5} />
      </div>
      {resultMessage ? (
        <div className={`rounded-card border p-4 text-body ${result === "basarili" ? "border-success bg-success-surface text-success" : "border-error bg-error-surface text-error"}`} ref={resultRef} role={result === "basarili" ? "status" : "alert"} tabIndex={-1}>
          <p className="font-semibold">{resultMessage.title}</p>
          <p className="mt-1 text-label">{resultMessage.body}</p>
        </div>
      ) : null}
      <CommercialEmailConsent id="contact-commercial-email-consent" locale={locale} />
      <Button disabled={submitting} fullWidth type="submit">{submitting ? (locale === "en" ? "Sending..." : "Gönderiliyor...") : (locale === "en" ? "Send" : "Gönder")} <span aria-hidden="true">→</span></Button>
    </form>
  );
}
