import { createClient } from "@supabase/supabase-js";
import { resolveAnalyticsEntity } from "@/lib/analytics-server";
import {
  analyticsEventsPerMinute,
  createAnalyticsTrackHandler,
  type AnalyticsEventRecord,
} from "@/lib/analytics-track-handler";
import { supabaseUrl } from "@/lib/supabase";

const analyticsRequestTimeoutMs = 5_000;

const analyticsFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const upstreamSignal = init?.signal;
  const abortRequest = () => controller.abort();
  const timeout = setTimeout(abortRequest, analyticsRequestTimeoutMs);

  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort();
    else upstreamSignal.addEventListener("abort", abortRequest, { once: true });
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    upstreamSignal?.removeEventListener("abort", abortRequest);
  }
};

const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && serverKey ? createClient(supabaseUrl, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: analyticsFetch,
    },
  }) : null;

const handleTrack = createAnalyticsTrackHandler(
  {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    salt: process.env.ANALYTICS_HASH_SALT,
    production: process.env.NODE_ENV === "production",
  },
  {
    async resolveEntity(entityType, entityId) {
      if (!supabase) return null;
      return resolveAnalyticsEntity(supabase, entityType, entityId);
    },
    async consumeRateLimit(identifier) {
      if (!supabase) return { allowed: null, errorCode: "analytics_not_configured" };
      const { data, error } = await supabase.rpc("consume_analytics_rate_limit", {
        p_identifier: identifier,
        p_max_events: analyticsEventsPerMinute,
        p_window_seconds: 60,
      });
      return { allowed: error ? null : data === true, errorCode: error?.code };
    },
    async insertEvent(record: AnalyticsEventRecord) {
      if (!supabase) return { errorCode: "analytics_not_configured" };
      const { error } = await supabase.from("analytics_events").insert(record);
      return { errorCode: error?.code };
    },
    reportError(scope, errorCode) {
      console.error("[analytics] operation failed", { scope, code: errorCode || "unknown" });
    },
  },
);

export async function POST(request: Request) {
  return handleTrack(request);
}
