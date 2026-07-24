import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsEntity, AnalyticsEntityType } from "@/lib/analytics-policy";

const entityConfig = {
  restaurant: {
    table: "restaurantes",
    columns: "id,nome,categoria,ativo",
  },
  lodging: {
    table: "pousadas",
    columns: "id,nome,categoria,ativo",
  },
  city_service: {
    table: "city_services",
    columns: "id,name,category,is_active",
  },
} as const;

export async function resolveAnalyticsEntity(
  supabase: SupabaseClient,
  entityType: AnalyticsEntityType,
  entityId: string,
): Promise<AnalyticsEntity | null> {
  const config = entityConfig[entityType];
  const table: string = config.table;
  const columns: string = config.columns;
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq("id", entityId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as Record<string, unknown>;
  const isActive = entityType === "city_service" ? row.is_active === true : row.ativo === true;
  if (!isActive) return null;

  return {
    id: String(row.id),
    name: String(row.nome || row.name || "Estabelecimento").slice(0, 180),
    category: String(row.categoria || row.category || entityType).slice(0, 100),
  };
}
