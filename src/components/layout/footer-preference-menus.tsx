"use client";

import { useEffect, useRef, useState } from "react";

type Language = "TR" | "EN";
type Currency = "TRY" | "EUR" | "USD" | "GBP";

const CURRENCIES: ReadonlyArray<{ code: Currency; symbol: string }> = [
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
  { code: "TRY", symbol: "₺" },
];

function FooterFlag({ language }: { language: Language }) {
  return (
    <span
      aria-hidden="true"
      className="relative size-6 shrink-0 overflow-hidden rounded-full border border-white/20 shadow-sm"
    >
      {language === "TR" ? (
        <>
          <span className="absolute inset-0 bg-[#e30a17]" />
          <span className="absolute left-[20%] top-[23%] size-[55%] rounded-full bg-white" />
          <span className="absolute left-[33%] top-[23%] size-[55%] rounded-full bg-[#e30a17]" />
          <span className="absolute left-[62%] top-[38%] size-[26%] bg-white [clip-path:polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_93%,50%_72%,21%_93%,32%_57%,2%_35%,39%_35%)]" />
        </>
      ) : (
        <>
          <span className="absolute inset-0 bg-[#012169]" />
          <span className="absolute left-1/2 top-1/2 h-[140%] w-[0.18rem] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
          <span className="absolute left-1/2 top-1/2 h-[140%] w-[0.18rem] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-white" />
          <span className="absolute inset-x-0 top-1/2 h-[0.28rem] -translate-y-1/2 bg-white" />
          <span className="absolute inset-y-0 left-1/2 w-[0.28rem] -translate-x-1/2 bg-white" />
          <span className="absolute inset-x-0 top-1/2 h-[0.14rem] -translate-y-1/2 bg-[#c8102e]" />
          <span className="absolute inset-y-0 left-1/2 w-[0.14rem] -translate-x-1/2 bg-[#c8102e]" />
        </>
      )}
    </span>
  );
}

export function FooterPreferenceMenus() {
  const menusRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<Language>("TR");
  const [currency, setCurrency] = useState<Currency>("TRY");
  const selectedCurrency = CURRENCIES.find((item) => item.code === currency) ?? CURRENCIES[3];
  const summaryClasses =
    "flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-pill border border-text-inverse/20 bg-navy-secondary px-3 text-label font-semibold text-text-inverse transition-colors marker:hidden hover:border-accent-orange hover:text-accent-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-orange motion-reduce:transition-none";
  const menuClasses =
    "absolute bottom-full right-0 z-20 mb-2 min-w-32 overflow-hidden rounded-card border border-border-subtle bg-surface-card py-1 text-text-primary shadow-lg";
  const optionClasses =
    "flex min-h-11 w-full items-center gap-2 px-3 text-left text-label font-medium transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-[-0.2rem] focus-visible:outline-corporate-blue";

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      if (menusRef.current?.contains(event.target as Node)) {
        return;
      }

      menusRef.current?.querySelectorAll("details[open]").forEach((menu) => {
        menu.removeAttribute("open");
      });
    };

    document.addEventListener("pointerdown", closeMenus);
    return () => document.removeEventListener("pointerdown", closeMenus);
  }, []);

  const closeOtherMenu = (currentMenu: HTMLDetailsElement) => {
    if (!currentMenu.open) {
      return;
    }

    menusRef.current?.querySelectorAll("details[open]").forEach((menu) => {
      if (menu !== currentMenu) {
        menu.removeAttribute("open");
      }
    });
  };

  return (
    <div className="flex items-center justify-center gap-2 md:justify-end" ref={menusRef}>
      <details
        className="group relative"
        onToggle={(event) => closeOtherMenu(event.currentTarget)}
      >
        <summary aria-label="Dil seçeneklerini göster" className={summaryClasses}>
          <FooterFlag language={language} />
          <span>{language}</span>
        </summary>
        <div aria-label="Dil seçenekleri" className={menuClasses} role="menu">
          {(["TR", "EN"] as const).map((option) => (
            <button
              aria-checked={language === option}
              className={`${optionClasses} ${language === option ? "bg-surface-muted font-semibold" : ""}`}
              key={option}
              onClick={(event) => {
                setLanguage(option);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              role="menuitemradio"
              type="button"
            >
              <FooterFlag language={option} />
              <span>{option}</span>
            </button>
          ))}
        </div>
      </details>

      <details
        className="group relative"
        onToggle={(event) => closeOtherMenu(event.currentTarget)}
      >
        <summary aria-label="Para birimi seçeneklerini göster" className={summaryClasses}>
          <span aria-hidden="true">{selectedCurrency.symbol}</span>
          <span>{selectedCurrency.code}</span>
        </summary>
        <div aria-label="Para birimi seçenekleri" className={menuClasses} role="menu">
          {CURRENCIES.map((option) => (
            <button
              aria-checked={currency === option.code}
              className={`${optionClasses} ${currency === option.code ? "bg-surface-muted font-semibold" : ""}`}
              key={option.code}
              onClick={(event) => {
                setCurrency(option.code);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              role="menuitemradio"
              type="button"
            >
              <span aria-hidden="true" className="w-4 text-center">
                {option.symbol}
              </span>
              <span>{option.code}</span>
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
