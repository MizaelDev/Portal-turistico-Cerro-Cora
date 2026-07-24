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
  | "share_click"
  | "cta_click";

export type AnalyticsEntity = {
  id: string;
  name: string;
  category: string;
};

export function isAnalyticsEventAllowed(
  eventType: AnalyticsEventType,
  entity: AnalyticsEntity,
) {
  void eventType;
  void entity;
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
