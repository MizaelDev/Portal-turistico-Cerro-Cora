import { createHash } from "node:crypto";
import { z } from "zod";
import {
  isAnalyticsEventAllowed,
  sanitizeAnalyticsPath,
  sanitizeAnalyticsReferrer,
  type AnalyticsEntity,
  type AnalyticsEntityType,
} from "@/lib/analytics-policy";

export const analyticsPayloadLimitBytes = 16 * 1024;
export const analyticsEventsPerMinute = 120;

export const analyticsTrackSchema = z.object({
  entityType: z.enum(["restaurant", "lodging", "city_service"]),
  entityId: z.string().uuid(),
  eventType: z.enum([
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
  ]),
  sourcePath: z.string().trim().max(300).optional(),
  sessionId: z.string().trim().regex(/^[A-Za-z0-9_-]{8,120}$/).optional(),
});

export type AnalyticsEventRecord = {
  entity_type: AnalyticsEntityType;
  establishment_id: string;
  event_type: z.infer<typeof analyticsTrackSchema>["eventType"];
  source_path: string | null;
  session_id: string | null;
  establishment_name: string;
  category: string;
  plan_type: null;
  dedupe_key: string;
  ip_hash: string;
  user_agent: string | null;
  referrer: string | null;
};

export type AnalyticsTrackDependencies = {
  resolveEntity: (
    entityType: AnalyticsEntityType,
    entityId: string,
  ) => Promise<AnalyticsEntity | null>;
  consumeRateLimit: (identifier: string) => Promise<{
    allowed: boolean | null;
    errorCode?: string;
  }>;
  insertEvent: (record: AnalyticsEventRecord) => Promise<{
    errorCode?: string;
  }>;
  reportError?: (scope: "rate-limit" | "entity" | "insert", errorCode?: string) => void;
};

export type AnalyticsTrackConfig = {
  siteUrl?: string;
  salt?: string;
  production: boolean;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isAllowedRequest(request: Request, siteUrl?: string) {
  const fetchSite = request.headers.get("sec-fetch-site");
  const origin = normalizeOrigin(request.headers.get("origin"));
  if (!origin) return fetchSite === "same-origin";

  const allowedOrigins = new Set(
    [normalizeOrigin(request.url), normalizeOrigin(siteUrl)].filter(
      (value): value is string => Boolean(value),
    ),
  );
  return allowedOrigins.has(origin);
}

async function readLimitedJson(request: Request) {
  if (!request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > analyticsPayloadLimitBytes) {
      await reader.cancel();
      throw new RangeError("Payload too large.");
    }
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return JSON.parse(text);
}

export function getTrustedClientIp(request: Request, production: boolean) {
  if (production) {
    if (!request.headers.get("x-vercel-id")) return null;
    return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || null;
  }

  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

export function isValidAnalyticsSalt(value: string | undefined) {
  return Boolean(value && value.trim().length >= 32);
}

function hashIdentifier(salt: string, value: string) {
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function createAnalyticsTrackHandler(
  config: AnalyticsTrackConfig,
  dependencies: AnalyticsTrackDependencies,
) {
  const localCounters = new Map<string, { count: number; resetAt: number }>();

  function isLocallyRateLimited(key: string) {
    const now = Date.now();
    const current = localCounters.get(key);
    if (!current || current.resetAt <= now) {
      localCounters.set(key, { count: 1, resetAt: now + 60_000 });
      return false;
    }
    current.count += 1;
    return current.count > analyticsEventsPerMinute;
  }

  return async function handleAnalyticsTrack(request: Request) {
    if (!isAllowedRequest(request, config.siteUrl)) {
      return jsonResponse({ ok: false }, 403);
    }
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return jsonResponse({ ok: false }, 415);
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (!Number.isFinite(contentLength) || contentLength > analyticsPayloadLimitBytes) {
      return jsonResponse({ ok: false }, 413);
    }

    if (!isValidAnalyticsSalt(config.salt)) {
      return jsonResponse({ ok: false, unavailable: true }, 503);
    }

    const clientIp = getTrustedClientIp(request, config.production);
    if (!clientIp) {
      return jsonResponse({ ok: false, unavailable: true }, 503);
    }

    let requestBody: unknown;
    try {
      requestBody = await readLimitedJson(request);
    } catch (error) {
      return jsonResponse({ ok: false }, error instanceof RangeError ? 413 : 400);
    }

    const parsed = analyticsTrackSchema.safeParse(requestBody);
    if (!parsed.success) return jsonResponse({ ok: false }, 400);

    const ipHash = hashIdentifier(config.salt!.trim(), clientIp);
    if (isLocallyRateLimited(ipHash)) return jsonResponse({ ok: false }, 429);

    let distributedLimit: Awaited<ReturnType<AnalyticsTrackDependencies["consumeRateLimit"]>>;
    try {
      distributedLimit = await dependencies.consumeRateLimit(ipHash);
    } catch {
      dependencies.reportError?.("rate-limit", "request_failed");
      return jsonResponse({ ok: false, unavailable: true }, 503);
    }
    if (distributedLimit.errorCode) {
      dependencies.reportError?.("rate-limit", distributedLimit.errorCode);
      return jsonResponse({ ok: false, unavailable: true }, 503);
    }
    if (distributedLimit.allowed !== true) return jsonResponse({ ok: false }, 429);

    const { entityType, entityId, eventType, sourcePath, sessionId } = parsed.data;
    let entity: AnalyticsEntity | null;
    try {
      entity = await dependencies.resolveEntity(entityType, entityId);
    } catch {
      dependencies.reportError?.("entity", "request_failed");
      return jsonResponse({ ok: false, unavailable: true }, 503);
    }
    if (!entity || !isAnalyticsEventAllowed(eventType, entity)) {
      return jsonResponse({ ok: false }, 404);
    }

    const dedupeWindow = eventType.endsWith("_view") ? 86_400_000 : 2_000;
    const dedupeKey = createHash("sha256")
      .update(
        [sessionId || ipHash, entityType, entityId, eventType, Math.floor(Date.now() / dedupeWindow)].join(":"),
      )
      .digest("hex");

    let result: Awaited<ReturnType<AnalyticsTrackDependencies["insertEvent"]>>;
    try {
      result = await dependencies.insertEvent({
        entity_type: entityType,
        establishment_id: entityId,
        event_type: eventType,
        source_path: sanitizeAnalyticsPath(sourcePath),
        session_id: sessionId || null,
        establishment_name: entity.name,
        category: entity.category,
        plan_type: null,
        dedupe_key: dedupeKey,
        ip_hash: ipHash,
        user_agent: request.headers.get("user-agent")?.slice(0, 300) || null,
        referrer: sanitizeAnalyticsReferrer(request.headers.get("referer")),
      });
    } catch {
      dependencies.reportError?.("insert", "request_failed");
      return jsonResponse({ ok: false, unavailable: true }, 503);
    }

    if (result.errorCode === "23505") {
      return jsonResponse({ ok: true, duplicate: true });
    }
    if (result.errorCode) {
      dependencies.reportError?.("insert", result.errorCode);
      return jsonResponse({ ok: false, unavailable: true }, 503);
    }

    return jsonResponse({ ok: true });
  };
}
