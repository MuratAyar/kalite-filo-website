"use client";

import { OPEN_PRIVACY_PREFERENCES_EVENT } from "@/lib/privacy-preferences";

export function PrivacySettingsButton({ locale = "tr" }: { locale?: "en" | "tr" }) {
  return (
    <button
      className="min-h-11 rounded-sm py-2 text-left text-body text-text-inverse-muted underline-offset-4 transition-colors hover:text-text-inverse hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-orange"
      onClick={() => window.dispatchEvent(new Event(OPEN_PRIVACY_PREFERENCES_EVENT))}
      type="button"
    >
      {locale === "en" ? "Privacy preferences" : "Gizlilik tercihleri"}
    </button>
  );
}
