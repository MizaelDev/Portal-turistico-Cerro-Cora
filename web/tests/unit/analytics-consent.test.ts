import assert from "node:assert/strict";
import test from "node:test";
import {
  analyticsConsentStorageKey,
  analyticsSessionKey,
  analyticsViewDedupePrefix,
  clearApplicationAnalyticsIdentifiers,
  readAnalyticsConsent,
} from "../../src/lib/analytics-consent";

test("consentimento começa indefinido e aceita apenas escolhas conhecidas", () => {
  assert.equal(readAnalyticsConsent({ getItem: () => null }), null);
  assert.equal(readAnalyticsConsent({ getItem: () => "granted" }), "granted");
  assert.equal(readAnalyticsConsent({ getItem: () => "denied" }), "denied");
  assert.equal(readAnalyticsConsent({ getItem: () => "valor-invalido" }), null);
  assert.equal(analyticsConsentStorageKey, "portal_analytics_consent_v1");
});

test("revogação remove somente identificadores de analytics controlados pelo portal", () => {
  const values = new Map([
    [analyticsSessionKey, "session"],
    [`${analyticsViewDedupePrefix}:restaurant:1:page_view`, "1"],
    ["preferencia_visual", "dark"],
  ]);
  const storage = {
    get length() {
      return values.size;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };

  clearApplicationAnalyticsIdentifiers(storage);

  assert.equal(values.has(analyticsSessionKey), false);
  assert.equal(values.has(`${analyticsViewDedupePrefix}:restaurant:1:page_view`), false);
  assert.equal(values.get("preferencia_visual"), "dark");
});
