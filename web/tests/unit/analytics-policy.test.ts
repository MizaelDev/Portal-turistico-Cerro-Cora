import assert from "node:assert/strict";
import test from "node:test";
import {
  isAnalyticsEventAllowed,
  sanitizeAnalyticsPath,
  sanitizeAnalyticsReferrer,
  type AnalyticsEntity,
  type AnalyticsEventType,
} from "../../src/lib/analytics-policy.ts";

const entity: AnalyticsEntity = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Teste",
  category: "Restaurante",
};

test("todos os eventos comerciais validos sao aceitos para estabelecimentos ativos", () => {
  const events: AnalyticsEventType[] = [
    "card_view",
    "page_view",
    "whatsapp_click",
    "map_click",
    "instagram_click",
    "site_click",
    "phone_click",
    "reserve_click",
    "details_click",
    "gallery_click",
    "carousel_click",
    "share_click",
    "cta_click",
  ];

  for (const event of events) {
    assert.equal(isAnalyticsEventAllowed(event, entity), true);
  }
});

test("caminhos e referrers removem query string e protocolos perigosos", () => {
  assert.equal(sanitizeAnalyticsPath("/gastronomia?token=segredo#secao"), "/gastronomia");
  assert.equal(sanitizeAnalyticsPath("https://evil.test/path"), null);
  assert.equal(sanitizeAnalyticsPath("//evil.test"), null);
  assert.equal(
    sanitizeAnalyticsReferrer("https://example.com/path?email=user@example.com"),
    "https://example.com/path",
  );
  assert.equal(sanitizeAnalyticsReferrer("javascript:alert(1)"), null);
});
