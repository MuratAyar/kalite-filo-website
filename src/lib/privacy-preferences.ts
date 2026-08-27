export const PRIVACY_PREFERENCES_STORAGE_KEY =
  "kalite-filo-privacy-preferences-v1";
export const PRIVACY_PREFERENCES_CHANGED_EVENT =
  "kalite-filo:privacy-preferences-changed";
export const OPEN_PRIVACY_PREFERENCES_EVENT =
  "kalite-filo:open-privacy-preferences";

const PREFERENCE_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;

export type PrivacyPreferences = {
  readonly functional: boolean;
  readonly savedAt: string;
  readonly version: 1;
};

export function readPrivacyPreferences(
  storage: Pick<Storage, "getItem">,
  now = Date.now(),
): PrivacyPreferences | null {
  try {
    const value = storage.getItem(PRIVACY_PREFERENCES_STORAGE_KEY);
    if (!value) return null;

    const parsed = JSON.parse(value) as Partial<PrivacyPreferences>;
    const savedAt = Date.parse(parsed.savedAt ?? "");

    if (
      parsed.version !== 1 ||
      typeof parsed.functional !== "boolean" ||
      !Number.isFinite(savedAt) ||
      now - savedAt > PREFERENCE_LIFETIME_MS
    ) {
      return null;
    }

    return parsed as PrivacyPreferences;
  } catch {
    return null;
  }
}

export function savePrivacyPreferences(
  storage: Pick<Storage, "setItem">,
  functional: boolean,
): PrivacyPreferences {
  const preferences: PrivacyPreferences = {
    functional,
    savedAt: new Date().toISOString(),
    version: 1,
  };

  storage.setItem(
    PRIVACY_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  );
  return preferences;
}
