export type AnalyticsConsent = "granted" | "denied";

export const analyticsConsentStorageKey = "portal_analytics_consent_v1";
export const analyticsConsentChangedEvent = "portal:analytics-consent-changed";
export const analyticsSessionKey = "portal_commercial_session_id";
export const analyticsViewDedupePrefix = "portal_commercial_seen";

export function readAnalyticsConsent(storage?: Pick<Storage, "getItem">): AnalyticsConsent | null {
  if (!storage && typeof window !== "undefined") storage = window.localStorage;
  if (!storage) return null;

  try {
    const value = storage.getItem(analyticsConsentStorageKey);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent() {
  return readAnalyticsConsent() === "granted";
}

export function clearApplicationAnalyticsIdentifiers(storage?: Pick<Storage, "length" | "key" | "removeItem">) {
  if (!storage && typeof window !== "undefined") storage = window.sessionStorage;
  if (!storage) return;

  try {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key === analyticsSessionKey || key?.startsWith(`${analyticsViewDedupePrefix}:`)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => storage!.removeItem(key));
  } catch {
    // Storage indisponível não deve bloquear a revogação das coletas futuras.
  }
}
