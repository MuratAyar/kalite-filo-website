"use client";

import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

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

function validationMessageFor(field: HTMLInputElement | HTMLTextAreaElement) {
  if (field.validity.valueMissing) return "*Bu alan boş bırakılamaz.";
  if (field.validity.typeMismatch) return "*Geçersiz e-posta adresi.";
  return "*Bu alan geçerli formatta doldurulmalıdır.";
}

export function ContactForm() {
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
      setFieldErrors(Object.fromEntries(invalidFields.map((field) => [field.name, validationMessageFor(field)])));
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
          setFieldErrors(payload.fieldErrors);
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

  const resultMessage = result ? resultMessages[result] : null;

  return (
    <form acceptCharset="UTF-8" action="/forms/iletisim.php" aria-busy={submitting} className="space-y-5" method="post" noValidate onInput={clearFieldError} onSubmit={handleSubmit}>
      <div aria-hidden="true" className="absolute -left-[10000px] size-px overflow-hidden">
        <label htmlFor="contact-website">Web sitesi</label>
        <input autoComplete="off" id="contact-website" name="website" tabIndex={-1} type="text" />
      </div>
      <div className="space-y-2">
        <label className="block text-label font-semibold" htmlFor="contact-name">İsim Soyisim <span aria-hidden="true">*</span></label>
        <input aria-describedby={fieldErrors.isim ? "contact-name-error" : undefined} aria-invalid={fieldErrors.isim ? true : undefined} autoComplete="name" className={fieldClassName} id="contact-name" name="isim" placeholder="Adınız Soyadınız" required type="text" />
        {fieldErrors.isim ? <p className="text-label text-error" id="contact-name-error">{fieldErrors.isim}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="block text-label font-semibold" htmlFor="contact-email">E-posta <span aria-hidden="true">*</span></label>
        <input aria-describedby={fieldErrors.eposta ? "contact-email-error" : undefined} aria-invalid={fieldErrors.eposta ? true : undefined} autoComplete="email" className={fieldClassName} id="contact-email" name="eposta" placeholder="ornek@sirket.com" required type="email" />
        {fieldErrors.eposta ? <p className="text-label text-error" id="contact-email-error">{fieldErrors.eposta}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="block text-label font-semibold" htmlFor="contact-message">Mesaj</label>
        <textarea className={`${fieldClassName} min-h-36 resize-y py-3`} id="contact-message" name="mesaj" placeholder="Mesajınız..." rows={5} />
      </div>
      {resultMessage ? (
        <div className={`rounded-card border p-4 text-body ${result === "basarili" ? "border-success bg-success-surface text-success" : "border-error bg-error-surface text-error"}`} ref={resultRef} role={result === "basarili" ? "status" : "alert"} tabIndex={-1}>
          <p className="font-semibold">{resultMessage.title}</p>
          <p className="mt-1 text-label">{resultMessage.body}</p>
        </div>
      ) : null}
      <Button disabled={submitting} fullWidth type="submit">{submitting ? "Gönderiliyor..." : "Gönder"} <span aria-hidden="true">→</span></Button>
    </form>
  );
}
