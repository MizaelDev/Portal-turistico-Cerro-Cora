"use client";

export type CommercialEntityType = "restaurant" | "lodging" | "city_service";

export type CommercialEventType =
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

export type AnalyticsPayload = {
  entityType: CommercialEntityType;
  entityId?: string;
  eventType: CommercialEventType;
  establishmentName?: string;
  category?: string;
};

type TrackOptions = {
  dedupe?: "session" | "debounce" | "none";
};

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: Record<string, unknown>) => void;
  }
}

const sessionKey = "portal_commercial_session_id";
const viewDedupePrefix = "portal_commercial_seen";
const clickDebounceMs = 1500;
const lastClickMap = new Map<string, number>();

const gaEventNames: Record<CommercialEventType, string> = {
  card_view: "view_establishment_card",
  page_view: "view_establishment_page",
  whatsapp_click: "click_whatsapp",
  map_click: "click_maps",
  instagram_click: "click_instagram",
  site_click: "click_site",
  phone_click: "click_phone",
  reserve_click: "click_reserve",
  details_click: "click_details",
  gallery_click: "click_gallery",
  carousel_click: "click_carousel",
  share_click: "share_establishment",
  cta_click: "click_cta",
};

function getSessionId() {
  if (typeof window === "undefined") return "";

  try {
    const current = window.sessionStorage.getItem(sessionKey);
    if (current) return current;

    const value = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(sessionKey, value);
    return value;
  } catch {
    return window.crypto?.randomUUID?.() || "anonymous";
  }
}

function shouldSkip(payload: AnalyticsPayload, dedupe: TrackOptions["dedupe"]) {
  if (!payload.entityId || typeof window === "undefined") return true;

  const key = `${payload.entityType}:${payload.entityId}:${payload.eventType}`;

  if (dedupe === "session") {
    const storageKey = `${viewDedupePrefix}:${key}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return true;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Ambientes com storage bloqueado ainda podem registrar o evento nesta navegação.
    }
    return false;
  }

  if (dedupe === "debounce") {
    const now = Date.now();
    const last = lastClickMap.get(key) || 0;
    if (now - last < clickDebounceMs) return true;
    if (lastClickMap.size > 1_000) lastClickMap.clear();
    lastClickMap.set(key, now);
  }

  return false;
}

function sendToGoogleAnalytics(payload: Required<Pick<AnalyticsPayload, "entityId">> & AnalyticsPayload) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  try {
    window.gtag("event", gaEventNames[payload.eventType], {
      establishment_id: payload.entityId,
      establishment_name: payload.establishmentName,
      entity_type: payload.entityType,
      category: payload.category,
      page_path: window.location.pathname,
    });
  } catch {
    // Bloqueadores e falhas do GA4 nunca devem interromper o clique do visitante.
  }
}

function sendToSupabase(payload: Required<Pick<AnalyticsPayload, "entityId">> & AnalyticsPayload) {
  const body = JSON.stringify({
    ...payload,
    sourcePath: window.location.pathname,
    sessionId: getSessionId(),
  });

  if (navigator.sendBeacon) {
    const queued = navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    if (queued) return;
  }

  void fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export const analyticsService = {
  trackDirectoryEvent(eventName: "search" | "category_select" | "subcategory_select" | "quick_access_click", value: string) {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    try {
      window.gtag("event", `city_services_${eventName}`, {
        filter_value: value.slice(0, 120),
        page_path: window.location.pathname,
      });
    } catch {
      // Falhas ou bloqueadores do GA4 não podem afetar os filtros do diretório.
    }
  },
  track(payload: AnalyticsPayload, options: TrackOptions = { dedupe: "debounce" }) {
    if (shouldSkip(payload, options.dedupe)) return;

    const normalizedPayload = {
      ...payload,
      entityId: payload.entityId,
    } as Required<Pick<AnalyticsPayload, "entityId">> & AnalyticsPayload;

    sendToGoogleAnalytics(normalizedPayload);
    sendToSupabase(normalizedPayload);
  },
  trackCardView(payload: Omit<AnalyticsPayload, "eventType">) {
    this.track({ ...payload, eventType: "card_view" }, { dedupe: "session" });
  },
  trackPageView(payload: Omit<AnalyticsPayload, "eventType">) {
    this.track({ ...payload, eventType: "page_view" }, { dedupe: "session" });
  },
  trackWhatsApp(payload: Omit<AnalyticsPayload, "eventType">) {
    this.track({ ...payload, eventType: "whatsapp_click" });
  },
  trackInstagram(payload: Omit<AnalyticsPayload, "eventType">) {
    this.track({ ...payload, eventType: "instagram_click" });
  },
  trackDetails(payload: Omit<AnalyticsPayload, "eventType">) {
    this.track({ ...payload, eventType: "details_click" });
  },
  trackGallery(payload: Omit<AnalyticsPayload, "eventType">) {
    this.track({ ...payload, eventType: "gallery_click" });
  },
  trackPhone(payload: Omit<AnalyticsPayload, "eventType">) {
    this.track({ ...payload, eventType: "phone_click" });
  },
  trackMaps(payload: Omit<AnalyticsPayload, "eventType">) {
    this.track({ ...payload, eventType: "map_click" });
  },
  trackReserve(payload: Omit<AnalyticsPayload, "eventType">) {
    this.track({ ...payload, eventType: "reserve_click" });
  },
};
