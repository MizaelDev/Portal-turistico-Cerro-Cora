import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getEffectiveFeatures,
  getEffectivePlanStatus,
  normalizeCommercialPlan,
  type CustomCommercialFeatures,
} from "@/lib/commercial";
import type { AnalyticsEntity, AnalyticsEntityType } from "@/lib/analytics-policy";

const entityConfig = {
  restaurant: {
    table: "restaurantes",
    columns:
      "id,nome,categoria,ativo,plan_type,plano,plan_status,plan_expires_at,custom_features,pagina_ativa,destaque",
  },
  lodging: {
    table: "pousadas",
    columns:
      "id,nome,categoria,ativo,plan_type,plano,plan_status,plan_expires_at,custom_features,pagina_ativa,destaque",
  },
  city_service: {
    table: "city_services",
    columns:
      "id,name,category,is_active,listing_type,plan_type,plan,plan_status,plan_expires_at,custom_features,page_enabled,is_featured",
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

  const listingType = row.listing_type === "public_service" ? "public_service" : "commercial";
  const normalizedPlan = normalizeCommercialPlan(String(row.plan_type || row.plano || row.plan || "bronze"));
  const status = getEffectivePlanStatus(
    typeof row.plan_status === "string" ? row.plan_status : null,
    typeof row.plan_expires_at === "string" ? row.plan_expires_at : null,
  );
  const customFeatures =
    row.custom_features && typeof row.custom_features === "object"
      ? (row.custom_features as CustomCommercialFeatures)
      : undefined;
  const features = getEffectiveFeatures(normalizedPlan, {
    status,
    listingType,
    customFeatures,
    pageEnabled: row.pagina_ativa !== false && row.page_enabled !== false,
    highlighted: row.destaque === true || row.is_featured === true,
  });

  return {
    id: String(row.id),
    name: String(row.nome || row.name || "Estabelecimento").slice(0, 180),
    category: String(row.categoria || row.category || entityType).slice(0, 100),
    plan: listingType === "public_service" ? "public_service" : normalizedPlan,
    features,
  };
}
