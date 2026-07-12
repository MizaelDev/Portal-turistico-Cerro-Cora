import type { CommercialFeatures } from "@/lib/commercial";

export type AnalyticsEntityType = "restaurant" | "lodging" | "city_service";
export type AnalyticsEventType =
  | "card_view"
  | "page_view"
  | "whatsapp_click"
  | "map_click"
  | "instagram_click"
  | "site_click"
  | "phone_click"
  | "reserve_click"
  | "details_click"
  | "gallery_click"
  | "carousel_click"
  | "cta_click";

export type AnalyticsEntity = {
  id: string;
  name: string;
  category: string;
  plan: "bronze" | "silver" | "gold" | "public_service";
  features: CommercialFeatures;
};

export function isAnalyticsEventAllowed(
  eventType: AnalyticsEventType,
  entity: AnalyticsEntity,
) {
  if (eventType === "page_view" || eventType === "details_click") {
    return entity.features.individualPage;
  }
  if (eventType === "gallery_click") return entity.features.gallery;
  if (eventType === "carousel_click") return entity.features.carousel;
  if (eventType === "reserve_click") return entity.features.bookingButton;
  if (eventType === "instagram_click") return entity.features.instagram;
  if (eventType === "whatsapp_click") return entity.features.whatsapp;
  if (eventType === "map_click") return entity.features.maps;

  return true;
}

export function sanitizeAnalyticsPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value.replace(/[\r\n\0]/g, "").split(/[?#]/, 1)[0].slice(0, 300);
}

export function sanitizeAnalyticsReferrer(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return null;
  }
}
