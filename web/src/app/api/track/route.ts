import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";
import {
  resolveAnalyticsEntity,
} from "@/lib/analytics-server";
import {
  isAnalyticsEventAllowed,
  sanitizeAnalyticsPath,
  sanitizeAnalyticsReferrer,
} from "@/lib/analytics-policy";

const maxPayloadBytes = 16 * 1024;
const maxEventsPerMinute = 120;
const requestCounters = new Map<string, { count: number; resetAt: number }>();

const trackSchema = z.object({
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
    "cta_click",
  ]),
  sourcePath: z.string().trim().max(300).optional(),
  sessionId: z.string().trim().regex(/^[A-Za-z0-9_-]{8,120}$/).optional(),
});

function isAllowedRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  const allowedOrigins = new Set([
    new URL(request.url).origin,
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, ""),
  ].filter(Boolean));

  return allowedOrigins.has(origin.replace(/\/$/, ""));
}

function isRateLimited(key: string) {
  const now = Date.now();

  if (requestCounters.size > 5_000) {
    for (const [counterKey, counter] of requestCounters) {
      if (counter.resetAt <= now) requestCounters.delete(counterKey);
    }
  }

  if (requestCounters.size > 10_000) requestCounters.clear();
  const current = requestCounters.get(key);

  if (!current || current.resetAt <= now) {
    requestCounters.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  current.count += 1;
  return current.count > maxEventsPerMinute;
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || null;
}

function hashClientIp(ip: string | null) {
  const salt = process.env.ANALYTICS_HASH_SALT;

  if (!ip || !salt) return null;

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (!isAllowedRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxPayloadBytes) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  const clientIp = getClientIp(request);
  const ipHash = hashClientIp(clientIp);
  const rateLimitKey = clientIp
    ? createHash("sha256").update(`rate-limit:${clientIp}`).digest("hex")
    : "anonymous";
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const parsed = trackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serverKey) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = createClient(supabaseUrl, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { entityType, entityId, eventType, sourcePath, sessionId } = parsed.data;
  const entity = await resolveAnalyticsEntity(supabase, entityType, entityId);
  if (!entity || !isAnalyticsEventAllowed(eventType, entity)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const distributedIdentifier = ipHash || `session:${sessionId || "anonymous"}`;
  const { data: distributedLimit, error: distributedLimitError } = await supabase.rpc(
    "consume_analytics_rate_limit",
    {
      p_identifier: distributedIdentifier,
      p_max_events: maxEventsPerMinute,
      p_window_seconds: 60,
    },
  );
  if (!distributedLimitError && distributedLimit === false) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const dedupeWindow = eventType.endsWith("_view") ? 86_400_000 : 2_000;
  const dedupeKey = createHash("sha256")
    .update(
      [sessionId || ipHash || "anonymous", entityType, entityId, eventType, Math.floor(Date.now() / dedupeWindow)].join(":"),
    )
    .digest("hex");
  const eventRecord = {
    entity_type: entityType,
    establishment_id: entityId,
    event_type: eventType,
    source_path: sanitizeAnalyticsPath(sourcePath),
    session_id: sessionId || null,
    establishment_name: entity.name,
    category: entity.category,
    plan_type: entity.plan,
    dedupe_key: dedupeKey,
    ip_hash: ipHash,
    user_agent: request.headers.get("user-agent")?.slice(0, 300) || null,
    referrer: sanitizeAnalyticsReferrer(request.headers.get("referer")),
  };
  let { error } = await supabase.from("analytics_events").insert(eventRecord);

  // Mantém o deploy compatível durante a janela entre código e migration.
  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    const legacyRecord: Partial<typeof eventRecord> = { ...eventRecord };
    delete legacyRecord.dedupe_key;
    const legacyInsert = await supabase.from("analytics_events").insert(legacyRecord);
    error = legacyInsert.error;
  }

  if (error?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (error) {
    console.error("[track] insert failed", { code: error.code });
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
