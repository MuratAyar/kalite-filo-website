"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { CommercialEmailConsent } from "@/components/forms/commercial-email-consent";
import { classNames } from "@/components/ui/class-names";
import { formatVehicleListNetPrice } from "@/lib/vehicle-list-price.mjs";
import {
  readVehicleCart,
  subscribeToVehicleCart,
  writeVehicleCart,
  type VehicleCartItem,
} from "@/lib/vehicle-cart";

type QuoteFormType = "kurumsal" | "bireysel" | "sepet";
type ValidationErrors = Record<string, string>;
type SubmissionState = "idle" | "submitting";

type QuoteResponse = {
  fieldErrors?: ValidationErrors;
  quoteNumber: string | null;
  result: ResultKey;
};

const requiredFieldMessage = "*Bu alan boş bırakılamaz.";

const countryCallingCodes = [
  { code: "90", iso: "TR", label: "Türkiye" },
  { code: "49", iso: "DE", label: "Almanya" },
  { code: "43", iso: "AT", label: "Avusturya" },
  { code: "32", iso: "BE", label: "Belçika" },
  { code: "359", iso: "BG", label: "Bulgaristan" },
  { code: "33", iso: "FR", label: "Fransa" },
  { code: "31", iso: "NL", label: "Hollanda" },
  { code: "39", iso: "IT", label: "İtalya" },
  { code: "7", iso: "RU", label: "Rusya" },
  { code: "34", iso: "ES", label: "İspanya" },
  { code: "380", iso: "UA", label: "Ukrayna" },
] as const;
const englishCountryNames: Readonly<Record<string, string>> = Object.freeze({ TR: "Türkiye", DE: "Germany", AT: "Austria", BE: "Belgium", BG: "Bulgaria", FR: "France", NL: "Netherlands", IT: "Italy", RU: "Russia", ES: "Spain", UA: "Ukraine" });

const provinces = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara",
  "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman",
  "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
  "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne",
  "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun",
  "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir",
  "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri",
  "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya",
  "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde",
  "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
  "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak",
  "Van", "Yalova", "Yozgat", "Zonguldak",
] as const;

const fieldClassName =
  "min-h-12 w-full rounded-control border border-border-control bg-surface-card px-4 text-body text-text-primary placeholder:text-text-secondary/75 focus:border-corporate-blue focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const resultMessages = {
  basarili: {
    title: "Talebiniz alındı",
    body: "Teklif talebiniz başarıyla iletildi.",
    tone: "border-success bg-success-surface text-success",
  },
  dogrulama: {
    title: "Bilgileri kontrol edin",
    body: "Zorunlu alanlardan biri eksik veya geçersiz. Lütfen formu kontrol ederek yeniden gönderin.",
    tone: "border-error bg-error-surface text-error",
  },
  limit: {
    title: "Lütfen biraz bekleyin",
    body: "Kısa süre içinde çok sayıda gönderim yapıldı. Birkaç dakika sonra yeniden deneyin.",
    tone: "border-error bg-error-surface text-error",
  },
  gonderilemedi: {
    title: "Talep gönderilemedi",
    body: "Teknik bir sorun oluştu. Lütfen daha sonra yeniden deneyin veya iletişim bilgilerimizden bize ulaşın.",
    tone: "border-error bg-error-surface text-error",
  },
  servis_yok: {
    title: "Teklif servisi bu ortamda çalışmıyor",
    body: "Yerel Next.js önizlemesi PHP çalıştırmaz. Form gönderimini staging veya production cPanel ortamında deneyin.",
    tone: "border-error bg-error-surface text-error",
  },
} as const;

const englishResultMessages: Record<keyof typeof resultMessages, { title: string; body: string; tone: string }> = {
  basarili: { title: "Request received", body: "Your quotation request has been submitted successfully.", tone: resultMessages.basarili.tone },
  dogrulama: { title: "Check the information", body: "A required field is missing or invalid. Review the form and submit it again.", tone: resultMessages.dogrulama.tone },
  limit: { title: "Please wait", body: "Too many submissions were made in a short period. Please try again in a few minutes.", tone: resultMessages.limit.tone },
  gonderilemedi: { title: "Request could not be submitted", body: "A technical issue occurred. Please try again later or contact us using our published details.", tone: resultMessages.gonderilemedi.tone },
  servis_yok: { title: "The quotation service is unavailable here", body: "The local Next.js preview does not run PHP. Test submission in the staging or production cPanel environment.", tone: resultMessages.servis_yok.tone },
};

type ResultKey = keyof typeof resultMessages;

function keepPersonNameCharacters(event: FormEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.replace(
    /[^A-Za-zÇĞİÖŞÜçğıöşü' -]/g,
    "",
  );
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <label className="block text-label font-semibold text-text-primary" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function FieldError({ error, id }: { error?: string; id: string }) {
  return error ? (
    <p className="text-label font-semibold text-error" id={id} role="alert" tabIndex={-1}>
      {error}
    </p>
  ) : null;
}

function validationMessageFor(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, locale: "en" | "tr" = "tr") {
  if (field.validity.valueMissing) return locale === "en" ? "*This field is required." : requiredFieldMessage;
  if (field.name === "telefon") return locale === "en" ? "*Enter a valid phone number." : "*Geçerli bir numara giriniz.";
  if (field.name === "eposta") return locale === "en" ? "*Enter a valid email address." : "*Geçersiz e-posta adresi.";
  return locale === "en" ? "*Enter this field in a valid format." : "*Bu alanı geçerli formatta doldurunuz.";
}

function focusField(form: HTMLFormElement, fieldName: string) {
  const field = form.elements.namedItem(fieldName);
  if (field instanceof HTMLElement) {
    field.focus({ preventScroll: true });
    field.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function focusElementById(id: string) {
  const element = document.getElementById(id);
  if (element instanceof HTMLElement) {
    element.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function CountryFlag({ iso }: { iso: string }) {
  return (
    <span aria-hidden="true" className="relative h-4 w-6 shrink-0 overflow-hidden rounded-[2px] border border-black/10 bg-surface-card shadow-sm">
      <span className="absolute inset-0 bg-surface-muted" />
      {iso === "TR" ? <><span className="absolute inset-0 bg-[#e30a17]" /><span className="absolute left-[0.42rem] top-[0.2rem] size-[0.55rem] rounded-full bg-white" /><span className="absolute left-[0.55rem] top-[0.2rem] size-[0.55rem] rounded-full bg-[#e30a17]" /><span className="absolute left-[0.92rem] top-[0.38rem] size-[0.27rem] bg-white [clip-path:polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_93%,50%_72%,21%_93%,32%_57%,2%_35%,39%_35%)]" /></> : null}
      {iso === "DE" ? <span className="absolute inset-0 bg-[linear-gradient(#000_0_33%,#dd0000_33%_66%,#ffce00_66%)]" /> : null}
      {iso === "FR" ? <span className="absolute inset-0 bg-[linear-gradient(90deg,#0055a4_0_33%,#fff_33%_66%,#ef4135_66%)]" /> : null}
      {iso === "IT" ? <span className="absolute inset-0 bg-[linear-gradient(90deg,#009246_0_33%,#fff_33%_66%,#ce2b37_66%)]" /> : null}
      {iso === "NL" ? <span className="absolute inset-0 bg-[linear-gradient(#ae1c28_0_33%,#fff_33%_66%,#21468b_66%)]" /> : null}
      {iso === "ES" ? <span className="absolute inset-0 bg-[linear-gradient(#aa151b_0_25%,#f1bf00_25%_75%,#aa151b_75%)]" /> : null}
      {iso === "AT" ? <span className="absolute inset-0 bg-[linear-gradient(#ed2939_0_33%,#fff_33%_66%,#ed2939_66%)]" /> : null}
      {iso === "BE" ? <span className="absolute inset-0 bg-[linear-gradient(90deg,#000_0_33%,#ffd90c_33%_66%,#ef3340_66%)]" /> : null}
      {iso === "BG" ? <span className="absolute inset-0 bg-[linear-gradient(#fff_0_33%,#00966e_33%_66%,#d62612_66%)]" /> : null}
      {iso === "RU" ? <span className="absolute inset-0 bg-[linear-gradient(#fff_0_33%,#0039a6_33%_66%,#d52b1e_66%)]" /> : null}
      {iso === "UA" ? <span className="absolute inset-0 bg-[linear-gradient(#0057b7_0_50%,#ffd700_50%)]" /> : null}
    </span>
  );
}

function TextField({
  autoComplete,
  className,
  error,
  id,
  label,
  name,
  placeholder,
  required = false,
  type = "text",
  ...props
}: {
  autoComplete?: string;
  className?: string;
  error?: string;
  id: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: "email" | "number" | "text" | "url";
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id" | "name" | "placeholder" | "required" | "type">) {
  return (
    <div className={classNames("space-y-2", className)}>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </FieldLabel>
      <input
        {...props}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? "true" : undefined}
        autoComplete={autoComplete}
        className={classNames(
          fieldClassName,
          error && "border-error focus:border-error focus-visible:outline-error",
        )}
        id={id}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      <FieldError error={error} id={`${id}-error`} />
    </div>
  );
}

function ProvinceSelect({
  id,
  error,
  label,
  name,
  placeholder,
}: {
  id: string;
  error?: string;
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label} *</FieldLabel>
      <select aria-describedby={error ? `${id}-error` : undefined} aria-invalid={error ? "true" : undefined} className={fieldClassName} defaultValue="" id={id} name={name} required>
        <option disabled value="">{placeholder}</option>
        {provinces.map((province) => (
          <option key={province} value={province}>{province}</option>
        ))}
      </select>
      <FieldError error={error} id={`${id}-error`} />
    </div>
  );
}

function PhoneField({ error, locale = "tr" }: { error?: string; locale?: "en" | "tr" }) {
  const [countryCode, setCountryCode] = useState("90");
  const [digits, setDigits] = useState("");
  const countryMenuRef = useRef<HTMLDetailsElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const country = countryCallingCodes.find((item) => item.code === countryCode) ?? countryCallingCodes[0];
  const padded = `${digits.slice(0, 10)}__________`.slice(0, 10);
  const maskedValue = `(${padded.slice(0, 3)}) ${padded.slice(3, 6)} ${padded.slice(6, 8)} ${padded.slice(8, 10)}`;
  const caretPosition = maskedValue.indexOf("_") === -1 ? maskedValue.length : maskedValue.indexOf("_");

  function moveCaretToNextDigit() {
    window.requestAnimationFrame(() => {
      phoneInputRef.current?.setSelectionRange(caretPosition, caretPosition);
    });
  }

  useLayoutEffect(() => {
    const input = phoneInputRef.current;
    if (input && document.activeElement === input) {
      input.setSelectionRange(caretPosition, caretPosition);
    }
  }, [caretPosition]);

  useEffect(() => {
    function closeCountryMenu(event: PointerEvent) {
      const menu = countryMenuRef.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) {
        menu.removeAttribute("open");
      }
    }

    document.addEventListener("pointerdown", closeCountryMenu, true);
    return () => document.removeEventListener("pointerdown", closeCountryMenu, true);
  }, []);

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor="quote-phone">{locale === "en" ? "Phone Number" : "Telefon Numaranız"} *</FieldLabel>
      <div
        className={classNames(
          "flex min-h-12 overflow-visible rounded-control border bg-surface-card focus-within:outline-2 focus-within:outline-offset-2",
          error
            ? "border-error focus-within:border-error focus-within:outline-error"
            : "border-border-control focus-within:border-corporate-blue focus-within:outline-focus",
        )}
      >
        <input name="ulke_kodu" type="hidden" value={countryCode} />
        <details className="group relative shrink-0 border-r border-border-control" ref={countryMenuRef}>
          <summary className="flex h-full min-h-12 cursor-pointer list-none items-center gap-2 px-3 text-label font-semibold marker:hidden">
            <CountryFlag iso={country.iso} /><span>+{country.code}</span><span aria-hidden="true" className="text-[0.6rem]">▼</span>
          </summary>
          <div className="absolute left-0 top-full z-30 mt-1 max-h-64 w-72 overflow-y-auto rounded-control border border-border-control bg-surface-card p-1 shadow-lg">
            {countryCallingCodes.map((item) => (
              <button className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-label hover:bg-surface-muted" key={item.iso} onClick={(event) => { setCountryCode(item.code); event.currentTarget.closest("details")?.removeAttribute("open"); }} type="button">
                <CountryFlag iso={item.iso} /><span className="min-w-0 flex-1">{locale === "en" ? englishCountryNames[item.iso] : item.label}</span><span className="text-text-secondary">+{item.code}</span>
              </button>
            ))}
          </div>
        </details>
        <input
          aria-describedby={error ? "quote-phone-error" : undefined}
          aria-invalid={error ? "true" : undefined}
          aria-label={locale === "en" ? "Phone number" : "Telefon numaranız"}
          autoComplete="tel-national"
          className="min-h-12 min-w-0 flex-1 border-0 bg-transparent px-4 text-body text-text-primary caret-corporate-blue outline-none"
          id="quote-phone"
          inputMode="numeric"
          name="telefon"
          onChange={(event) => setDigits(event.currentTarget.value.replace(/\D/g, "").slice(0, 10))}
          onClick={moveCaretToNextDigit}
          onFocus={moveCaretToNextDigit}
          onKeyDown={(event) => {
            if (/^[0-9]$/.test(event.key)) {
              event.preventDefault();
              setDigits((current) => `${current}${event.key}`.slice(0, 10));
            } else if (event.key === "Backspace" || event.key === "Delete") {
              event.preventDefault();
              setDigits((current) => current.slice(0, -1));
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            setDigits(event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 10));
          }}
          pattern="\([0-9]{3}\) [0-9]{3} [0-9]{2} [0-9]{2}"
          ref={phoneInputRef}
          required
          type="tel"
          value={maskedValue}
        />
      </div>
      <FieldError error={error} id="quote-phone-error" />
    </div>
  );
}

function CartItems({ items, locale = "tr", onChange }: { items: VehicleCartItem[]; locale?: "en" | "tr"; onChange: (items: VehicleCartItem[]) => void }) {
  function changeQuantity(key: string, delta: number) {
    const next = items
      .map((item) => item.key === key ? { ...item, quantity: Math.max(0, Math.min(99, item.quantity + delta)) } : item)
      .filter((item) => item.quantity > 0);
    writeVehicleCart(next);
    onChange(next);
  }

  if (items.length === 0) {
    return <div className="rounded-card border border-dashed border-border-control bg-surface-muted p-6 text-body text-text-secondary">{locale === "en" ? "Your vehicle basket is empty." : "Sepetinizde henüz araç bulunmuyor."}</div>;
  }

  return <div className="grid gap-5">{items.map((item) => (
    <article className="grid min-w-0 overflow-hidden rounded-card border border-border-subtle bg-surface-card md:grid-cols-[14rem_minmax(0,1fr)]" key={item.key}>
      {/* Static local vehicle derivative. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={item.image.alt} className="aspect-[16/9] h-auto w-full self-start bg-surface-muted object-cover md:aspect-auto md:h-full" height={item.image.height} loading="lazy" src={item.image.src} width={item.image.width} />
      <div className="grid min-w-0 gap-4 p-5">
        <div>
          <h3 className="text-xl font-semibold text-text-primary">{item.make} {item.model}</h3>
          <p className="mt-1 text-label text-text-secondary">{item.trim}</p>
        </div>
        <dl className="grid gap-3 text-label sm:grid-cols-2">
          <div><dt className="text-text-secondary">{locale === "en" ? "Lease Term" : "Kiralama Süresi"}</dt><dd className="font-semibold">{item.durationMonths} {locale === "en" ? "months" : "Ay"}</dd></div>
          <div><dt className="text-text-secondary">{locale === "en" ? "Annual Mileage" : "Yıllık Kilometre"}</dt><dd className="font-semibold">{new Intl.NumberFormat(locale === "en" ? "en-GB" : "tr-TR").format(item.annualKilometres)} km</dd></div>
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-control bg-surface-muted p-3">
          <p className="text-xl font-bold text-corporate-blue">{formatVehicleListNetPrice(item.priceAmountMinor)}<span className="text-xs font-normal text-text-secondary"> /ay + %20 KDV</span></p>
          <div className="flex items-center rounded-pill bg-accent-orange p-1 text-brand-navy">
            <button aria-label={`${item.make} ${item.model} aracını sepetten çıkar`} className="grid min-h-10 min-w-10 place-items-center rounded-full hover:bg-brand-navy/10" onClick={() => changeQuantity(item.key, -item.quantity)} type="button">⌫</button>
            <button aria-label="Adedi azalt" className="grid min-h-10 min-w-10 place-items-center rounded-full hover:bg-brand-navy/10" onClick={() => changeQuantity(item.key, -1)} type="button">−</button>
            <span aria-label={`${item.quantity} adet`} className="grid min-h-10 min-w-10 place-items-center rounded-control bg-white font-semibold text-brand-navy">{item.quantity}</span>
            <button aria-label="Adedi artır" className="grid min-h-10 min-w-10 place-items-center rounded-full hover:bg-brand-navy/10" onClick={() => changeQuantity(item.key, 1)} type="button">+</button>
          </div>
        </div>
      </div>
    </article>
  ))}</div>;
}

export function QuoteForm({ locale = "tr" }: { locale?: "en" | "tr" }) {
  const [formType, setFormType] = useState<QuoteFormType>("kurumsal");
  const [result, setResult] = useState<ResultKey | null>(null);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [cartItems, setCartItems] = useState<VehicleCartItem[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);
  const successDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const search = new URLSearchParams(window.location.search);
      const value = search.get("sonuc");
      if (search.get("form") === "sepet") {
        setFormType("sepet");
      }
      if (value && value in resultMessages) {
        setResult(value as ResultKey);
        window.requestAnimationFrame(() => resultRef.current?.focus());
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const update = () => setCartItems(readVehicleCart());
    update();
    return subscribeToVehicleCart(update);
  }, []);

  const resultMessage = result ? (locale === "en" ? englishResultMessages : resultMessages)[result] : null;
  const cartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    const fieldName = target.name;
    if (!fieldName || !validationErrors[fieldName]) {
      return;
    }

    setValidationErrors((current) => {
      if (!target.checkValidity()) {
        return { ...current, [fieldName]: validationMessageFor(target, locale) };
      }
      const remaining = { ...current };
      delete remaining[fieldName];
      return remaining;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formFields = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input:not([type='hidden']), select, textarea",
      ),
    );
    const invalidFields = formFields.filter((field) => !field.checkValidity());

    if (formType === "sepet" && cartItems.length === 0) {
      setValidationErrors({ sepet: locale === "en" ? "*Add at least one vehicle to your basket before requesting a quote." : "*Teklif göndermek için sepetinize en az bir araç ekleyiniz." });
      window.setTimeout(() => focusElementById("quote-cart-error"), 0);
      return;
    }

    if (invalidFields.length > 0) {
      setValidationErrors(
        Object.fromEntries(invalidFields.map((field) => [field.name, validationMessageFor(field, locale)])),
      );
      const firstInvalidField = invalidFields[0]?.name;
      if (firstInvalidField) {
        window.requestAnimationFrame(() => focusField(form, firstInvalidField));
      }
      return;
    }

    setValidationErrors({});
    setResult(null);
    setSubmissionState("submitting");

    try {
      const encodedForm = new URLSearchParams();
      new FormData(form).forEach((value, key) => {
        if (typeof value === "string") encodedForm.append(key, value);
      });
      const response = await fetch(form.action, {
        body: encodedForm,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        method: "POST",
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("application/json")) {
        setResult(response.status === 404 ? "servis_yok" : "gonderilemedi");
        window.requestAnimationFrame(() => resultRef.current?.focus());
        return;
      }

      const payload = (await response.json()) as QuoteResponse;

      if (!response.ok || payload.result !== "basarili" || !payload.quoteNumber) {
        let focusedInvalidField = false;
        if (payload.result === "dogrulama" && payload.fieldErrors) {
          setValidationErrors(payload.fieldErrors);
          const firstInvalidField = Object.keys(payload.fieldErrors)[0];
          if (firstInvalidField) {
            focusedInvalidField = true;
            window.requestAnimationFrame(() => focusField(form, firstInvalidField));
          }
        }
        setResult(payload.result in resultMessages ? payload.result : "gonderilemedi");
        if (!focusedInvalidField) {
          window.requestAnimationFrame(() => resultRef.current?.focus());
        }
        return;
      }

      setQuoteNumber(payload.quoteNumber);
      successDialogRef.current?.showModal();
      if (formType === "sepet") {
        writeVehicleCart([]);
        setCartItems([]);
      }
      form.reset();
    } catch {
      setResult("gonderilemedi");
      window.requestAnimationFrame(() => resultRef.current?.focus());
    } finally {
      setSubmissionState("idle");
    }
  }

  function goHome() {
    window.location.assign(locale === "en" ? "/en/" : "/");
  }

  function selectFormType(value: QuoteFormType) {
    setFormType(value);
    setValidationErrors({});
  }

  return (
    <div className="min-w-0">
      {resultMessage ? (
        <div
          aria-live="polite"
          className={classNames("mb-8 rounded-card border p-5", resultMessage.tone)}
          ref={resultRef}
          role={result === "basarili" ? "status" : "alert"}
          tabIndex={-1}
        >
          <p className="text-body font-semibold">{resultMessage.title}</p>
          <p className="mt-1 text-body">{resultMessage.body}</p>
        </div>
      ) : null}

      <form acceptCharset="UTF-8" action="/forms/teklif.php" aria-busy={submissionState === "submitting"} className="space-y-12" method="post" noValidate onChange={clearFieldError} onInput={clearFieldError} onSubmit={handleSubmit}>
        <input name="form_turu" type="hidden" value={formType} />
        {formType === "sepet" ? <input name="sepet_json" type="hidden" value={JSON.stringify(cartItems)} /> : null}
        <div aria-hidden="true" className="absolute -left-[10000px] top-auto size-px overflow-hidden">
          <label htmlFor="quote-website">Web sitesi</label>
          <input autoComplete="off" id="quote-website" name="website" tabIndex={-1} type="text" />
        </div>

        <div aria-label={locale === "en" ? "Quotation type" : "Teklif türü"} className="grid max-w-xl grid-cols-3 rounded-card border border-border-subtle bg-surface-muted p-1" role="group">
          {(["kurumsal", "bireysel", "sepet"] as const).map((value) => (
            <button
              aria-pressed={formType === value}
              className={classNames(
                "min-h-12 rounded-control px-4 text-label font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none",
                formType === value
                  ? "border border-border-subtle bg-surface-card text-corporate-blue shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
              key={value}
              onClick={(event) => {
                event.preventDefault();
                selectFormType(value);
              }}
              type="button"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {locale === "en" ? (value === "kurumsal" ? "Corporate" : value === "bireysel" ? "Individual" : "My Basket") : (value === "kurumsal" ? "Kurumsal" : value === "bireysel" ? "Bireysel" : "Sepetim")}
                {value === "sepet" && cartQuantity > 0 ? (
                  <span
                    aria-label={`Sepette ${cartQuantity} araç var`}
                    className="inline-grid min-h-6 min-w-6 place-items-center rounded-full bg-error px-1.5 text-xs font-bold leading-none text-white"
                  >
                    {cartQuantity}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>

        {formType === "sepet" ? (
          <fieldset className="space-y-6">
            <legend className="w-full border-b border-border-subtle pb-4 text-heading-md font-semibold text-corporate-blue">{locale === "en" ? "Vehicle Details" : "Araç Bilgileri"}</legend>
            <p className="text-body text-text-secondary">{locale === "en" ? "Review the vehicles, quantities and lease preferences in your basket." : "Sepetinize eklediğiniz araçları, adetleri ve kiralama tercihlerini kontrol ediniz."}</p>
            <CartItems items={cartItems} locale={locale} onChange={setCartItems} />
            <FieldError error={validationErrors.sepet} id="quote-cart-error" />
            <div className="flex justify-end"><Link className="inline-flex min-h-11 items-center rounded-control border border-corporate-blue px-5 text-label font-semibold text-corporate-blue no-underline hover:bg-corporate-blue hover:text-white" href={locale === "en" ? "/en/vehicles/" : "/arac-listesi/"}>{locale === "en" ? "Add a Vehicle" : "Araç Ekle"} →</Link></div>
          </fieldset>
        ) : null}

        <fieldset className="space-y-6">
          <legend className="w-full border-b border-border-subtle pb-4 text-heading-md font-semibold text-corporate-blue">
            {locale === "en" ? "Contact Person Details" : "Yetkili Kişi Bilgileri"}
          </legend>
          <p className="text-body text-text-secondary">{locale === "en" ? "Please complete the contact details below." : "Aşağıdaki yetkili kişi bilgilerini eksiksiz doldurunuz."}</p>
          <div className="grid gap-6 md:grid-cols-2">
            <TextField autoComplete="given-name" error={validationErrors.ad} id="quote-first-name" label={locale === "en" ? "First Name" : "Adınız"} maxLength={80} name="ad" onInput={keepPersonNameCharacters} pattern="[A-Za-zÇĞİÖŞÜçğıöşü' -]+" placeholder={locale === "en" ? "Enter your first name" : "Adınızı yazınız"} required />
            <TextField autoComplete="family-name" error={validationErrors.soyad} id="quote-last-name" label={locale === "en" ? "Last Name" : "Soyadınız"} maxLength={80} name="soyad" onInput={keepPersonNameCharacters} pattern="[A-Za-zÇĞİÖŞÜçğıöşü' -]+" placeholder={locale === "en" ? "Enter your last name" : "Soyadınızı yazınız"} required />
            {formType !== "bireysel" ? (
              <TextField autoComplete="organization-title" id="quote-title" label={locale === "en" ? "Job Title" : "Unvanınız"} maxLength={120} name="unvan" placeholder={locale === "en" ? "Enter your job title" : "Unvanınızı yazınız"} />
            ) : (
              <TextField error={validationErrors.tc_kimlik_no} id="quote-identity" inputMode="numeric" label={locale === "en" ? "Turkish Identity Number" : "T.C. Kimlik Numaranız"} maxLength={11} name="tc_kimlik_no" pattern="[1-9][0-9]{10}" placeholder={locale === "en" ? "Enter the 11-digit identity number" : "11 haneli T.C. kimlik numaranız"} required />
            )}
            <PhoneField error={validationErrors.telefon} locale={locale} />
            <TextField autoComplete="email" error={validationErrors.eposta} id="quote-email" inputMode="email" label={locale === "en" ? "Email Address" : "E-Postanız"} maxLength={254} name="eposta" placeholder={locale === "en" ? "Enter your email address" : "E-postanızı yazınız"} required type="email" />
          </div>
        </fieldset>

        {formType !== "bireysel" ? (
          <fieldset className="space-y-6">
            <legend className="w-full border-b border-border-subtle pb-4 text-heading-md font-semibold text-corporate-blue">
              {locale === "en" ? "Company Details" : "Şirket Bilgileri"}
            </legend>
            <p className="text-body text-text-secondary">
              {locale === "en" ? "Please provide the company information required for our team to assess your request." : "Bizimle iletişim kurmak ve uzman ekibimizle iletişime geçmek için lütfen aşağıdaki şirket bilgilerini eksiksiz doldurunuz."}
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <ProvinceSelect error={validationErrors.il} id="quote-city" label={locale === "en" ? "Province" : "İl"} name="il" placeholder={locale === "en" ? "Select a province" : "Şehrinizi seçiniz"} />
              <TextField autoComplete="address-level2" error={validationErrors.ilce} id="quote-district" label={locale === "en" ? "District" : "İlçe"} maxLength={80} name="ilce" placeholder={locale === "en" ? "Enter the district" : "İlçenizi yazınız"} required />
              <TextField autoComplete="url" id="quote-company-website" label={locale === "en" ? "Company Website" : "Firma Web Sitesi"} maxLength={200} name="firma_web_sitesi" placeholder={locale === "en" ? "Enter the website address" : "Web sitenizi yazınız"} />
              <div className="space-y-2">
                <FieldLabel htmlFor="quote-company-type">{locale === "en" ? "Company Type" : "Şirket Tipi"} *</FieldLabel>
                <select aria-describedby={validationErrors.sirket_tipi ? "quote-company-type-error" : undefined} aria-invalid={validationErrors.sirket_tipi ? "true" : undefined} className={fieldClassName} defaultValue="" id="quote-company-type" name="sirket_tipi" required>
                  <option disabled value="">{locale === "en" ? "Select company type" : "Şirket tipini seçiniz"}</option>
                  <option value="Anonim Şirket">{locale === "en" ? "Joint-Stock Company" : "Anonim Şirket"}</option>
                  <option value="Limited Şirket">{locale === "en" ? "Limited Company" : "Limited Şirket"}</option>
                  <option value="Şahıs Şirketi">{locale === "en" ? "Sole Proprietorship" : "Şahıs Şirketi"}</option>
                  <option value="Kooperatif">{locale === "en" ? "Cooperative" : "Kooperatif"}</option>
                  <option value="Diğer">{locale === "en" ? "Other" : "Diğer"}</option>
                </select>
                <FieldError error={validationErrors.sirket_tipi} id="quote-company-type-error" />
              </div>
              <TextField autoComplete="organization" error={validationErrors.sirket_unvani} id="quote-company-title" label={locale === "en" ? "Registered Company Name" : "Şirket Unvanı"} maxLength={200} name="sirket_unvani" placeholder={locale === "en" ? "Enter the registered company name" : "Şirket unvanını yazınız"} required />
              <ProvinceSelect error={validationErrors.vergi_dairesi_ili} id="quote-tax-city" label={locale === "en" ? "Tax Office Province" : "Vergi Dairesi İli"} name="vergi_dairesi_ili" placeholder={locale === "en" ? "Select the tax office province" : "Vergi dairesi ilini seçiniz"} />
              <TextField error={validationErrors.vergi_dairesi} id="quote-tax-office" label={locale === "en" ? "Tax Office" : "Vergi Dairesi"} maxLength={120} name="vergi_dairesi" placeholder={locale === "en" ? "Enter the tax office" : "Vergi dairesini yazınız"} required />
              <TextField error={validationErrors.vergi_numarasi} id="quote-tax-number" inputMode="numeric" label={locale === "en" ? "Tax Number" : "Vergi Numarası"} maxLength={10} name="vergi_numarasi" pattern="[0-9]{10}" placeholder="_ _ _ _ _ _ _ _ _ _" required />
            </div>
          </fieldset>
        ) : null}

        {formType === "sepet" ? (
          <div className="space-y-2">
            <FieldLabel htmlFor="quote-note">{locale === "en" ? "Additional Notes" : "İletmek İstediğiniz Not"}</FieldLabel>
            <textarea className={classNames(fieldClassName, "min-h-32 py-3")} id="quote-note" maxLength={2000} name="not" placeholder={locale === "en" ? "Enter any relevant notes" : "Notunuzu yazınız"} />
          </div>
        ) : <fieldset className="space-y-6">
          <legend className="w-full border-b border-border-subtle pb-4 text-heading-md font-semibold text-corporate-blue">
            {locale === "en" ? "Vehicle Requirements" : "Araç Bilgileri"}
          </legend>
          <p className="text-body text-text-secondary">{locale === "en" ? "Provide the vehicle and usage requirements for your quotation." : "Aşağıdaki teklif almak istediğiniz araç bilgilerini eksiksiz doldurunuz."}</p>
          <div className="grid gap-6 md:grid-cols-2">
            <TextField error={validationErrors.kiralama_suresi} id="quote-duration" inputMode="numeric" label={locale === "en" ? "Lease Term (Months)" : "Kiralama Süresi (Ay)"} max={120} min={12} name="kiralama_suresi" placeholder={locale === "en" ? "Minimum 12 months" : "En az 12 ay giriniz"} required type="number" />
            <TextField error={validationErrors.arac_sayisi} id="quote-count" inputMode="numeric" label={locale === "en" ? "Number of Vehicles" : "Kiralanacak Araç Sayısı"} max={999} min={1} name="arac_sayisi" placeholder={locale === "en" ? "Enter vehicle quantity" : "Araç sayısı giriniz"} required type="number" />
            <TextField error={validationErrors.arac_markasi} id="quote-make" label={locale === "en" ? "Vehicle Make" : "Araç Markası"} maxLength={100} name="arac_markasi" placeholder={locale === "en" ? "Enter a make" : "Marka giriniz"} required />
            <TextField error={validationErrors.arac_modeli} id="quote-model" label={locale === "en" ? "Vehicle Model" : "Araç Modeli"} maxLength={120} name="arac_modeli" placeholder={locale === "en" ? "Enter a model" : "Model giriniz"} required />
            <TextField error={validationErrors.yillik_km} id="quote-distance" inputMode="numeric" label={locale === "en" ? "Annual Mileage Limit" : "Yıllık KM Limiti"} max={500000} min={1000} name="yillik_km" placeholder={locale === "en" ? "Enter annual mileage" : "Limit giriniz"} required step={1000} type="number" />
            {formType === "bireysel" ? (
              <TextField id="quote-campaign" label={locale === "en" ? "Campaign Code" : "Kampanya Kodu"} maxLength={60} name="kampanya_kodu" placeholder={locale === "en" ? "Enter a campaign code, if applicable" : "Varsa kampanya kodunu giriniz"} />
            ) : null}
            <div className="space-y-2 md:col-span-2">
              <FieldLabel htmlFor="quote-note">{locale === "en" ? "Additional Notes" : "İletmek İstediğiniz Not"}</FieldLabel>
              <textarea className={classNames(fieldClassName, "min-h-32 py-3")} id="quote-note" maxLength={2000} name="not" placeholder={locale === "en" ? "Enter any relevant notes" : "Notunuzu yazınız"} />
            </div>
          </div>
          {formType === "bireysel" ? (
            <p className="text-body text-text-secondary">{locale === "en" ? "The minimum lease term for this form is 12 months." : "Bu formda kiralama süresi en az 12 aydır."}</p>
          ) : null}
        </fieldset>}

        <CommercialEmailConsent id="quote-commercial-email-consent" locale={locale} />

        <div className="flex justify-end">
          <Button className="w-full sm:w-auto sm:min-w-56" disabled={submissionState === "submitting"} type="submit">
            {submissionState === "submitting" ? (locale === "en" ? "Submitting…" : "Gönderiliyor…") : (locale === "en" ? "Submit Form" : "Formu Gönder")}
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </form>

      <dialog
        aria-labelledby="quote-success-title"
        className="m-auto w-[min(32rem,calc(100vw_-_2rem))] rounded-panel border border-border-subtle bg-surface-card p-0 text-text-primary shadow-2xl backdrop:bg-brand-navy/75 backdrop:backdrop-blur-sm"
        onCancel={(event) => {
          event.preventDefault();
          goHome();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) goHome();
        }}
        ref={successDialogRef}
      >
        <div className="p-6 text-center sm:p-8">
          <div aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-success-surface text-2xl text-success">✓</div>
          <h2 className="mt-5 text-heading-md font-semibold" id="quote-success-title">{locale === "en" ? "Your quotation form has been submitted" : "Tebrikler, teklif formunuz başarıyla gönderildi"}</h2>
          <p className="mt-3 text-body text-text-secondary">{locale === "en" ? "Your request has reached our team. You can use the reference number during the review process." : "Talebiniz ekibimize ulaştı. Değerlendirme sürecinde teklif numaranızı kullanabilirsiniz."}</p>
          <p className="mt-5 text-label text-text-secondary">{locale === "en" ? "Your quotation reference:" : "Teklif numaranız:"}</p>
          <p className="mt-1 font-mono text-body-lg font-bold tracking-[0.12em] text-corporate-blue">{quoteNumber}</p>
          <Button className="mt-7 w-full" onClick={goHome}>{locale === "en" ? "Return to Home" : "Anasayfaya Dön"}</Button>
        </div>
      </dialog>
    </div>
  );
}
