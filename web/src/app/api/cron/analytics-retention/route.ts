import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const retentionDays = Number(process.env.ANALYTICS_RETENTION_DAYS);
  const authorization = request.headers.get("authorization") || "";

  if (!cronSecret || cronSecret.length < 16 || !secureEquals(authorization, `Bearer ${cronSecret}`)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !Number.isInteger(retentionDays) ||
    retentionDays < 30 ||
    retentionDays > 1825
  ) {
    return Response.json({ ok: false, unavailable: true }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("purge_old_analytics_events", {
    p_retention_days: retentionDays,
  });

  if (error) {
    console.error("[analytics-retention] purge failed", { code: error.code });
    return Response.json({ ok: false, unavailable: true }, { status: 503 });
  }

  return Response.json(
    { ok: true, deleted: typeof data === "number" ? data : Number(data || 0) },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
