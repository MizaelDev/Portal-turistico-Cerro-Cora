import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/admin-auth";
import { isGoldPlan, normalizeCommercialPlan, planDefinitions } from "@/lib/commercial";
import { createMetadata } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  ...createMetadata({
    title: "Relatórios",
    path: "/admin/relatorios",
    description: "Relatórios administrativos do portal.",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type MetricRow = {
  entity_type: "restaurant" | "lodging" | "city_service";
  establishment_id: string;
  event_type: string;
  created_at: string;
  establishment_name: string | null;
  category: string | null;
  plan_type: string | null;
};

type ReportSummary = {
  totalsPeriod: { total: number; views: number; clicks: number };
  previousTotals?: { total: number; views: number; clicks: number };
  byEvent: Array<{ event: string; count: number }>;
  byDay: Array<{ day: string; count: number }>;
  byHour?: Array<{ hour: number; count: number }>;
  byEstablishment: Array<{
    id: string;
    name: string;
    category: string;
    plan: string;
    views: number;
    clicks: number;
    total: number;
    previousTotal?: number;
    busiestHour?: number | null;
    busiestDay?: string | null;
  }>;
};

const eventLabels: Record<string, string> = {
  card_view: "Visualizações de card",
  page_view: "Visualizações de página",
  whatsapp_click: "WhatsApp",
  map_click: "Como chegar",
  instagram_click: "Instagram",
  site_click: "Site/Cardápio",
  phone_click: "Telefone",
  reserve_click: "Reservas",
  details_click: "Detalhes",
  gallery_click: "Galeria",
  carousel_click: "Carrossel",
  cta_click: "CTA",
};

function countBy<T extends string>(items: MetricRow[], getKey: (item: MetricRow) => T) {
  return items.reduce<Record<T, number>>(
    (acc, item) => {
      const key = getKey(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<T, number>,
  );
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function buildFallbackSummary(metrics: MetricRow[]): ReportSummary {
  const views = metrics.filter((item) => item.event_type.endsWith("_view")).length;
  const byEvent = Object.entries(countBy(metrics, (item) => item.event_type))
    .map(([event, count]) => ({ event, count }))
    .sort((first, second) => second.count - first.count);
  const byDay = Object.entries(
    countBy(metrics, (item) => new Date(item.created_at).toISOString().slice(0, 10)),
  ).map(([day, count]) => ({ day, count }));
  const byEstablishment = Object.entries(
    metrics.reduce<Record<string, Omit<ReportSummary["byEstablishment"][number], "id">>>(
      (acc, item) => {
        const key = item.establishment_id;
        const current = acc[key] || {
          name: item.establishment_name || "Estabelecimento",
          category: item.category || item.entity_type,
          plan: item.plan_type || "basic",
          views: 0,
          clicks: 0,
          total: 0,
        };

        if (item.event_type.endsWith("_view")) current.views += 1;
        else current.clicks += 1;
        current.total += 1;
        acc[key] = current;
        return acc;
      },
      {},
    ),
  ).map(([id, item]) => ({ id, ...item }));

  return {
    totalsPeriod: { total: metrics.length, views, clicks: metrics.length - views },
    previousTotals: { total: 0, views: 0, clicks: 0 },
    byEvent,
    byDay,
    byHour: [],
    byEstablishment,
  };
}

function isReportSummary(value: unknown): value is ReportSummary {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<ReportSummary> & { totals30?: ReportSummary["totalsPeriod"] };
  return Boolean((report.totalsPeriod || report.totals30) && Array.isArray(report.byEvent) && Array.isArray(report.byDay) && Array.isArray(report.byEstablishment));
}

function normalizeReportSummary(value: unknown): ReportSummary | null {
  if (!isReportSummary(value)) return null;
  const legacy = value as ReportSummary & { totals30?: ReportSummary["totalsPeriod"] };
  return {
    ...legacy,
    totalsPeriod: legacy.totalsPeriod || legacy.totals30 || { total: 0, views: 0, clicks: 0 },
  };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  await requireAdminSession(supabase);

  const params = await searchParams;
  const period = params.period === "7" || params.period === "90" ? Number(params.period) : 30;
  const sinceDate = daysAgo(period).toISOString().slice(0, 10);
  const summaryResult = await supabase.rpc("analytics_report_summary", { p_since: sinceDate });
  let reportError = summaryResult.error;
  let summary = normalizeReportSummary(summaryResult.data);

  if (!summary) {
    const fallbackResult = await supabase
      .from("analytics_events")
      .select("entity_type,establishment_id,event_type,created_at,establishment_name,category,plan_type")
      .gte("created_at", daysAgo(period).toISOString())
      .order("created_at", { ascending: false })
      .limit(5000);
    reportError = fallbackResult.error;
    summary = buildFallbackSummary((fallbackResult.data || []) as MetricRow[]);
  }

  const { totalsPeriod } = summary;
  const ctr = totalsPeriod.views ? Math.round((totalsPeriod.clicks / totalsPeriod.views) * 1000) / 10 : 0;
  const byEvent = summary.byEvent.sort((first, second) => second.count - first.count);
  const byDay = summary.byDay.sort((first, second) => second.count - first.count).slice(0, 7);
  const byEstablishment = summary.byEstablishment
    .map((item) => ({
      ...item,
      ctr: item.views ? Math.round((item.clicks / item.views) * 1000) / 10 : 0,
      evolution: item.previousTotal
        ? Math.round(((item.total - item.previousTotal) / item.previousTotal) * 1000) / 10
        : null,
    }))
    .sort((first, second) => second.total - first.total)
    .slice(0, 10);
  const maxEvent = Math.max(...byEvent.map((item) => item.count), 1);

  return (
    <section className="container py-20">
      <div className="mb-8">
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" /> Voltar ao painel
          </Link>
        </Button>
      </div>

      <SectionHeader
        eyebrow="Marketing"
        title="Relatórios"
        description="Acompanhe visualizações e cliques dos estabelecimentos divulgados no portal."
      />

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Período do relatório">
        {[7, 30, 90].map((days) => (
          <Button key={days} asChild variant={period === days ? "default" : "outline"} size="sm">
            <Link href={`/admin/relatorios?period=${days}`}>Últimos {days} dias</Link>
          </Button>
        ))}
      </nav>

      {reportError ? (
        <Card className="mt-10 border-destructive/30 bg-destructive/10">
          <CardContent className="text-sm text-destructive">
            Não foi possível carregar as métricas. Rode o arquivo web/supabase/commercial-platform.sql no Supabase.
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {[
          [`Últimos ${period} dias`, totalsPeriod.total],
          ["Visualizações", totalsPeriod.views],
          ["Cliques", totalsPeriod.clicks],
          ["CTR", `${ctr}%`],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
              <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Desempenho por estabelecimento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {byEstablishment.length ? (
            byEstablishment.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-md border border-border bg-background/50 p-3 text-sm md:grid-cols-[1fr_repeat(4,90px)] md:items-center"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.category} · plano {planDefinitions[normalizeCommercialPlan(item.plan)].label}
                  </p>
                  {isGoldPlan(item.plan) && item.evolution !== null ? (
                    <p className="mt-1 text-xs font-semibold text-alpine-wine">
                      {item.evolution >= 0 ? "+" : ""}{item.evolution}% em relação ao período anterior
                    </p>
                  ) : null}
                  {isGoldPlan(item.plan) && (item.busiestHour != null || item.busiestDay) ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.busiestDay ? `Dia de maior procura: ${item.busiestDay.split("-").reverse().join("/")}. ` : ""}
                      {item.busiestHour !== null && item.busiestHour !== undefined
                        ? `Horário: ${String(item.busiestHour).padStart(2, "0")}h–${String((item.busiestHour + 1) % 24).padStart(2, "0")}h.`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <span>{item.views} views</span>
                <span>{item.clicks} cliques</span>
                <span>{item.ctr}% CTR</span>
                <span className="font-semibold">{item.total} eventos</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Os estabelecimentos aparecerão aqui quando houver eventos.</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-alpine-wine" /> Cliques por ação
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {byEvent.length ? (
              byEvent.map(({ event, count }) => (
                <div key={event} className="grid gap-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span>{eventLabels[event] || event}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-alpine-sunset" style={{ width: `${(count / maxEvent) * 100}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Ainda não há eventos registrados.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dias com maior movimento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {byDay.length ? (
              byDay.map(({ day, count }) => (
                <div key={day} className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-sm">
                  <span>{day.split("-").reverse().join("/")}</span>
                  <span className="font-semibold">{count} eventos</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Os dias aparecerão aqui quando houver tráfego.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
