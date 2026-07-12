import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultWhatsappMessage,
  getCommercialFeatures,
  getEffectivePlanStatus,
  getPhotoLimits,
  getPlanPriority,
  normalizeCommercialPlan,
  whatsappUrl,
} from "../../src/lib/commercial.ts";

test("plano Bronze não libera página, galeria ou destaque", () => {
  const features = getCommercialFeatures("bronze", {
    pageEnabled: true,
    galleryEnabled: true,
    carouselEnabled: true,
    highlighted: true,
    bookingEnabled: true,
  });

  assert.equal(features.individualPage, false);
  assert.equal(features.gallery, false);
  assert.equal(features.carousel, false);
  assert.equal(features.highlighted, false);
  assert.equal(features.basicAnalytics, true);
  assert.equal(features.bookingButton, false);
});

test("exceções não promovem o Bronze para recursos pagos", () => {
  const features = getCommercialFeatures("bronze", {
    customFeatures: {
      individualPage: true,
      carousel: true,
      gallery: true,
      highlighted: true,
      advancedReport: true,
    },
  });

  assert.equal(features.individualPage, false);
  assert.equal(features.carousel, false);
  assert.equal(features.gallery, false);
  assert.equal(features.highlighted, false);
  assert.equal(features.advancedReport, false);
});

test("serviços públicos não dependem de assinatura comercial", () => {
  const features = getCommercialFeatures("gold", {
    listingType: "public_service",
    status: "expired",
  });

  assert.equal(features.card, true);
  assert.equal(features.whatsapp, true);
  assert.equal(features.maps, true);
  assert.equal(features.individualPage, false);
  assert.equal(features.highlighted, false);
  assert.equal(features.advancedReport, false);
});

test("plano Prata libera página e respeita recursos opcionais desativados", () => {
  const features = getCommercialFeatures("silver", {
    pageEnabled: true,
    galleryEnabled: false,
    carouselEnabled: false,
    bookingEnabled: false,
  });

  assert.equal(features.individualPage, true);
  assert.equal(features.gallery, false);
  assert.equal(features.carousel, false);
  assert.equal(features.highlighted, false);
  assert.equal(features.bookingButton, false);
});

test("carrossel é exclusivo do plano Ouro", () => {
  assert.equal(getCommercialFeatures("bronze", { customFeatures: { carousel: true } }).carousel, false);
  assert.equal(getCommercialFeatures("silver", { customFeatures: { carousel: true } }).carousel, false);
  assert.equal(getCommercialFeatures("gold").carousel, true);
});

test("plano Ouro tem prioridade e recursos premium", () => {
  const features = getCommercialFeatures("gold");

  assert.equal(features.highlighted, true);
  assert.equal(features.advancedReport, true);
  assert.equal(features.monthlyComparison, true);
  assert.equal(features.establishmentStory, true);
  assert.ok(getPlanPriority("gold") > getPlanPriority("silver"));
});

test("migração legada converte basic e pro sem promover para Ouro", () => {
  assert.equal(normalizeCommercialPlan("basic"), "bronze");
  assert.equal(normalizeCommercialPlan("pro"), "silver");
});

test("plano vencido volta aos recursos públicos do Bronze sem apagar dados", () => {
  const features = getCommercialFeatures("gold", { status: "expired" });

  assert.equal(features.individualPage, false);
  assert.equal(features.gallery, false);
  assert.equal(features.highlighted, false);
});

test("vencimento converte plano ativo em expirado automaticamente", () => {
  assert.equal(
    getEffectivePlanStatus("active", "2026-07-01T00:00:00.000Z", new Date("2026-07-11T00:00:00.000Z")),
    "expired",
  );
});

test("exceções comerciais podem destacar Prata e desativar recursos do Ouro", () => {
  assert.equal(getCommercialFeatures("silver", { customFeatures: { highlighted: true } }).highlighted, true);
  assert.equal(getCommercialFeatures("gold", { customFeatures: { seasonalCampaign: false } }).seasonalCampaign, false);
});

test("limites de fotos usam padrão do plano e respeitam limites seguros", () => {
  assert.deepEqual(getPhotoLimits("bronze", 30, 60), { carousel: 1, gallery: 0 });
  assert.deepEqual(getPhotoLimits("silver"), { carousel: 1, gallery: 12 });
  assert.deepEqual(getPhotoLimits("silver", 30), { carousel: 1, gallery: 12 });
  assert.deepEqual(getPhotoLimits("gold", 100, 200), { carousel: 30, gallery: 60 });
});

test("WhatsApp normaliza o DDI e codifica a mensagem", () => {
  const url = whatsappUrl("(84) 98879-1401", "Olá, quero informações!");

  assert.equal(
    url,
    "https://wa.me/5584988791401?text=Ol%C3%A1%2C%20quero%20informa%C3%A7%C3%B5es!",
  );
  assert.match(whatsappUrl("5584988791401"), new RegExp(encodeURIComponent(defaultWhatsappMessage)));
});
