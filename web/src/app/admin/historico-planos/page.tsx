import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/admin-auth";
import { planDefinitions, normalizeCommercialPlan } from "@/lib/commercial";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Histórico de planos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PlanHistoryRow = {
  id: string;
  entity_type: "restaurant" | "lodging" | "city_service";
  entity_id: string;
  previous_plan: string | null;
  new_plan: string;
  previous_status: string | null;
  new_status: string;
  changed_at: string;
  reason: string | null;
  notes: string | null;
  started_at: string | null;
  ended_at: string | null;
};

function planLabel(plan?: string | null) {
  if (!plan) return "Sem plano anterior";
  return planDefinitions[normalizeCommercialPlan(plan)].label;
}

const entityLabels: Record<PlanHistoryRow["entity_type"], string> = {
  restaurant: "Restaurante",
  lodging: "Hospedagem",
  city_service: "Serviço da cidade",
};

export default async function PlanHistoryPage() {
  const supabase = await createSupabaseServerClient();
  await requireAdminSession(supabase);

  const { data, error } = await supabase
    .from("plan_history")
    .select("id,entity_type,entity_id,previous_plan,new_plan,previous_status,new_status,changed_at,reason,notes,started_at,ended_at")
    .order("changed_at", { ascending: false })
    .limit(100);
  const rows = (data || []) as PlanHistoryRow[];
  const [restaurantsResult, lodgingsResult, servicesResult] = await Promise.all([
    supabase.from("restaurantes").select("id,nome"),
    supabase.from("pousadas").select("id,nome"),
    supabase.from("city_services").select("id,name"),
  ]);
  const entityNames = new Map<string, string>([
    ...(restaurantsResult.data || []).map((item) => [`restaurant:${item.id}`, item.nome] as const),
    ...(lodgingsResult.data || []).map((item) => [`lodging:${item.id}`, item.nome] as const),
    ...(servicesResult.data || []).map((item) => [`city_service:${item.id}`, item.name] as const),
  ]);

  return (
    <main className="container min-h-screen py-16">
      <Button asChild variant="outline"><Link href="/admin"><ArrowLeft className="h-4 w-4" /> Voltar ao painel</Link></Button>
      <div className="mt-8 flex items-center gap-3">
        <History className="h-6 w-6 text-alpine-wine" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Assinaturas</p>
          <h1 className="font-display text-4xl font-semibold">Histórico de planos</h1>
        </div>
      </div>

      {error ? (
        <Card className="mt-8 border-destructive/30 bg-destructive/10"><CardContent className="p-5 text-sm text-destructive">Execute o arquivo supabase/three-tier-plans.sql para habilitar o histórico.</CardContent></Card>
      ) : null}

      <Card className="mt-8">
        <CardHeader><CardTitle>Alterações recentes</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {rows.length ? rows.map((row) => (
            <article key={row.id} className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-semibold">
                  {entityNames.get(`${row.entity_type}:${row.entity_id}`) || "Cadastro removido"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {entityLabels[row.entity_type]} · {row.entity_id}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {planLabel(row.previous_plan)} → {planLabel(row.new_plan)} · {row.previous_status || "novo"} → {row.new_status}
                </p>
                {row.reason || row.notes ? <p className="mt-2 text-sm">{row.reason || row.notes}</p> : null}
              </div>
              <time className="text-xs text-muted-foreground" dateTime={row.changed_at}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Fortaleza" }).format(new Date(row.changed_at))}</time>
            </article>
          )) : <p className="text-sm text-muted-foreground">Nenhuma alteração de plano registrada ainda.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
