"use client";

import { useEffect, useState } from "react";

import {
  OPEN_PRIVACY_PREFERENCES_EVENT,
  PRIVACY_PREFERENCES_CHANGED_EVENT,
  readPrivacyPreferences,
} from "@/lib/privacy-preferences";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps?q=Petrol+%C4%B0%C5%9F+Mahallesi,+Mesire+Sokak,+No:8,+Daire:3,+Kartal,+%C4%B0stanbul&output=embed";

export function ConsentAwareMap() {
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsAllowed(readPrivacyPreferences(window.localStorage)?.functional === true);
    };

    update();
    window.addEventListener(PRIVACY_PREFERENCES_CHANGED_EVENT, update);
    return () => window.removeEventListener(PRIVACY_PREFERENCES_CHANGED_EVENT, update);
  }, []);

  if (isAllowed) {
    return (
      <iframe
        allowFullScreen
        className="h-[22rem] w-full border-0 md:absolute md:inset-0 md:size-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={GOOGLE_MAPS_URL}
        title="Kalite Filo adresi: Petrol İş Mahallesi, Mesire Sokak, No:8, Daire:3, Kartal, İstanbul"
      />
    );
  }

  return (
    <div className="flex h-[22rem] w-full items-center justify-center bg-surface-muted p-6 text-center md:absolute md:inset-0 md:h-full">
      <div className="max-w-sm">
        <h2 className="text-heading-md font-semibold text-text-primary">
          Harita tercihinize bağlıdır
        </h2>
        <p className="mt-3 text-body text-text-secondary">
          Google Maps içeriğini görüntülemek için işlevsellik tercihini
          etkinleştirin.
        </p>
        <button
          className="mt-5 min-h-11 rounded-control bg-accent-orange px-5 text-label font-semibold text-brand-navy transition-colors hover:bg-orange-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          onClick={() => window.dispatchEvent(new Event(OPEN_PRIVACY_PREFERENCES_EVENT))}
          type="button"
        >
          Gizlilik tercihlerini aç
        </button>
      </div>
    </div>
  );
}
