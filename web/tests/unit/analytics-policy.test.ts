import assert from "node:assert/strict";
import test from "node:test";
import {
  isAnalyticsEventAllowed,
  sanitizeAnalyticsPath,
  sanitizeAnalyticsReferrer,
  type AnalyticsEntity,
} from "../../src/lib/analytics-policy.ts";
import { getCommercialFeatures } from "../../src/lib/commercial.ts";

function entity(plan: "bronze" | "silver" | "gold"): AnalyticsEntity {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Teste",
    category: "Restaurante",
    plan,
    features: getCommercialFeatures(plan),
  };
}

test("Bronze nao contabiliza acesso a pagina, galeria ou carrossel", () => {
  const bronze = entity("bronze");
  assert.equal(isAnalyticsEventAllowed("card_view", bronze), true);
  assert.equal(isAnalyticsEventAllowed("whatsapp_click", bronze), true);
  assert.equal(isAnalyticsEventAllowed("details_click", bronze), false);
  assert.equal(isAnalyticsEventAllowed("page_view", bronze), false);
  assert.equal(isAnalyticsEventAllowed("gallery_click", bronze), false);
  assert.equal(isAnalyticsEventAllowed("carousel_click", bronze), false);
});

test("Prata permite pagina e galeria, mas carrossel continua exclusivo do Ouro", () => {
  const silver = entity("silver");
  assert.equal(isAnalyticsEventAllowed("page_view", silver), true);
  assert.equal(isAnalyticsEventAllowed("gallery_click", silver), true);
  assert.equal(isAnalyticsEventAllowed("carousel_click", silver), false);
  assert.equal(isAnalyticsEventAllowed("carousel_click", entity("gold")), true);
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
