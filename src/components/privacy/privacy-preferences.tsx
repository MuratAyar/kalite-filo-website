"use client";

import { useEffect, useRef, useState } from "react";

import { getActionClassName } from "@/components/ui/button-styles";
import {
  OPEN_PRIVACY_PREFERENCES_EVENT,
  PRIVACY_PREFERENCES_CHANGED_EVENT,
  readPrivacyPreferences,
  savePrivacyPreferences,
} from "@/lib/privacy-preferences";

type View = "summary" | "settings";

function PreferenceSwitch({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="relative inline-flex min-h-11 shrink-0 items-center">
      <span className="sr-only">{label}</span>
      <input
        checked={checked}
        className="peer sr-only"
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        type="checkbox"
      />
      <span className="relative h-7 w-12 rounded-pill bg-text-secondary transition-colors peer-checked:bg-corporate-blue peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 motion-reduce:transition-none motion-reduce:after:transition-none" />
    </label>
  );
}

export function PrivacyPreferencesDialog({ locale = "tr" }: { locale?: "en" | "tr" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSavedChoice, setHasSavedChoice] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [view, setView] = useState<View>("summary");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = readPrivacyPreferences(window.localStorage);

    const initializeState = window.setTimeout(() => {
      setHasSavedChoice(Boolean(saved));
      setFunctional(saved?.functional ?? false);
    }, 0);

    const openSettings = () => {
      const latest = readPrivacyPreferences(window.localStorage);
      setHasSavedChoice(Boolean(latest));
      setFunctional(latest?.functional ?? false);
      setView("settings");
      setIsOpen(true);
    };

    window.addEventListener(OPEN_PRIVACY_PREFERENCES_EVENT, openSettings);
    const timer = saved ? undefined : window.setTimeout(() => setIsOpen(true), 2500);

    return () => {
      window.removeEventListener(OPEN_PRIVACY_PREFERENCES_EVENT, openSettings);
      window.clearTimeout(initializeState);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstButton = dialogRef.current?.querySelector<HTMLElement>("button");
    firstButton?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && hasSavedChoice) setIsOpen(false);
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [hasSavedChoice, isOpen]);

  const persist = (allowFunctional: boolean) => {
    savePrivacyPreferences(window.localStorage, allowFunctional);
    window.dispatchEvent(new Event(PRIVACY_PREFERENCES_CHANGED_EVENT));
    setHasSavedChoice(true);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-navy/70 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && hasSavedChoice) setIsOpen(false);
      }}
    >
      <div
        aria-describedby="privacy-preferences-description"
        aria-labelledby="privacy-preferences-title"
        aria-modal="true"
        className="max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-t-panel bg-surface-card shadow-2xl sm:rounded-panel"
        ref={dialogRef}
        role="dialog"
      >
        <header className="flex items-center justify-between gap-4 bg-brand-navy px-5 py-5 text-text-inverse sm:px-7">
          <h2 className="text-heading-md font-semibold" id="privacy-preferences-title">
            {locale === "en" ? "Privacy Preferences" : "Gizlilik Tercihleri"}
          </h2>
          {hasSavedChoice ? (
            <button
              aria-label={locale === "en" ? "Close privacy preferences" : "Gizlilik tercihlerini kapat"}
              className="inline-flex size-11 items-center justify-center rounded-full text-2xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-orange"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          ) : null}
        </header>

        {view === "summary" ? (
          <div className="p-5 sm:p-7">
            <div className="space-y-4 text-body leading-relaxed text-text-secondary" id="privacy-preferences-description">
              <p>
                {locale === "en" ? "Kalite Filo uses browser storage technologies to operate the website and remember your preferences. Optional third-party content is loaded only with your permission. You can review the technologies, purposes and retention periods in the" : "Kalite Filo internet sitesinde, sayfanın beklenen şekilde çalışması ve tercihlerinizi hatırlamak için tarayıcı depolama teknolojileri kullanılır. İsteğe bağlı üçüncü taraf içerikler yalnızca izin vermeniz halinde yüklenir. Kullanılan teknolojiler, amaçları ve saklama süreleri hakkında ayrıntılı bilgi için"}{" "}
                <a
                  className="font-semibold text-corporate-blue underline underline-offset-4"
                  href={locale === "en" ? "/documents/kalite-filo-cookie-policy.pdf" : "/documents/kalite-filo-cerez-politikasi.pdf"}
                  rel="noreferrer"
                  target="_blank"
                >
                  {locale === "en" ? "Cookie Policy" : "Çerez Politikası’nı"}
                </a>{" "}
                {locale === "en" ? ". You may accept, reject or manage optional technologies individually." : " inceleyebilirsiniz. İsteğe bağlı teknolojileri kabul edebilir, reddedebilir veya tercihlerinizi ayrı ayrı yönetebilirsiniz."}
              </p>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <button className={getActionClassName({ fullWidth: true, size: "primary", variant: "outline" })} onClick={() => persist(false)} type="button">
                {locale === "en" ? "Reject All" : "Tümünü Reddet"}
              </button>
              <button className={getActionClassName({ fullWidth: true, size: "primary", variant: "secondary" })} onClick={() => setView("settings")} type="button">
                {locale === "en" ? "Manage Choices" : "Seçimleri Yönet"}
              </button>
              <button className={getActionClassName({ fullWidth: true, size: "primary", variant: "primary" })} onClick={() => persist(true)} type="button">
                {locale === "en" ? "Accept All" : "Tümünü Onayla"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-7">
            <p className="text-body text-text-secondary" id="privacy-preferences-description">
              {locale === "en" ? "Essential storage is always enabled. You can change your other preference at any time from the footer link." : "Zorunlu depolama her zaman açıktır. Diğer tercihinizi dilediğiniz zaman footer’daki bağlantıdan değiştirebilirsiniz."}
            </p>
            <div className="mt-6 space-y-3">
              <PreferenceRow checked description={locale === "en" ? "Required for core website functions and to remember preferences you explicitly create." : "Sitenin temel işlevlerinin çalışması ve açıkça oluşturduğunuz tercihlerin hatırlanması için gereklidir."} disabled label={locale === "en" ? "Essential Technologies" : "Zorunlu Teknolojiler"} />
              <PreferenceRow checked={functional} description={locale === "en" ? "Enables optional third-party website functions when you choose to allow them." : "Tercihinizle etkinleştirilen isteğe bağlı üçüncü taraf site işlevlerini sağlar."} label={locale === "en" ? "Functional Technologies" : "İşlevsellik Teknolojileri"} onChange={setFunctional} />
              <PreferenceRow checked={false} description={locale === "en" ? "The website does not currently use performance or analytics tracking technologies." : "Sitede performans veya analitik izleme teknolojisi şu anda kullanılmamaktadır."} disabled label={locale === "en" ? "Performance and Analytics" : "Performans ve Analitik"} />
              <PreferenceRow checked={false} description={locale === "en" ? "The website does not currently use personalised advertising or marketing tracking technologies." : "Sitede kişiselleştirilmiş reklam veya pazarlama izleme teknolojisi şu anda kullanılmamaktadır."} disabled label={locale === "en" ? "Advertising and Marketing" : "Reklam ve Pazarlama"} />
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <button className={getActionClassName({ fullWidth: true, size: "primary", variant: "outline" })} onClick={() => persist(false)} type="button">{locale === "en" ? "Reject All" : "Tümünü Reddet"}</button>
              <button className={getActionClassName({ fullWidth: true, size: "primary", variant: "secondary" })} onClick={() => persist(functional)} type="button">{locale === "en" ? "Save Choices" : "Seçimleri Onayla"}</button>
              <button className={getActionClassName({ fullWidth: true, size: "primary", variant: "primary" })} onClick={() => persist(true)} type="button">{locale === "en" ? "Accept All" : "Tümünü Onayla"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreferenceRow({
  checked,
  description,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-card border border-border-subtle bg-surface-muted p-4 sm:p-5">
      <div>
        <h3 className="text-body-lg font-semibold text-text-primary">{label}</h3>
        <p className="mt-2 text-label leading-relaxed text-text-secondary">{description}</p>
      </div>
      <PreferenceSwitch checked={checked} disabled={disabled} label={label} onChange={onChange} />
    </div>
  );
}
