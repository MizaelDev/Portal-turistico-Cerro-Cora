import type { BusinessHours } from "@/lib/business-hours";
import {
  getCommercialFeatures,
  getEffectivePlanStatus,
  normalizeCommercialPlan,
  type CommercialFeatures,
  type CommercialPlan,
  type CustomCommercialFeatures,
  type ListingType,
  type PlanStatus,
} from "@/lib/commercial";
import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  type CityServiceRow,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase";

export type CityServiceCategory = string;

export type CityService = {
  id: string;
  name: string;
  slug: string;
  category: CityServiceCategory;
  subcategory: string;
  description: string;
  address: string;
  neighborhood: string;
  phone?: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  openingHours?: string;
  businessHours?: BusinessHours;
  instagram?: string;
  instagramUrl?: string;
  siteUrl?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  logoUrl?: string;
  listingType?: ListingType;
  plan?: CommercialPlan;
  planStatus?: PlanStatus;
  customFeatures?: CustomCommercialFeatures;
  commercialFeatures?: CommercialFeatures;
  tags?: string[];
  enabledButtons?: string[];
  importantMessage?: string;
  is24h?: boolean;
  whatsappMessage?: string;
  isEmergency: boolean;
  isFeatured: boolean;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const cityServiceCategories: Array<{
  value: CityServiceCategory;
  label: string;
  description: string;
}> = [
  {
    value: "saude",
    label: "Saúde",
    description: "Hospital, UBS, postos de saúde e farmácias.",
  },
  {
    value: "seguranca",
    label: "Segurança",
    description: "Delegacia, Polícia Militar e apoio público.",
  },
  {
    value: "transporte_apoio",
    label: "Transporte e apoio",
    description: "Postos de combustível, oficinas, borracharias, táxi e mototáxi.",
  },
  {
    value: "comercio_essencial",
    label: "Comércio essencial",
    description: "Mercados, bancos, lotéricas e caixas eletrônicos.",
  },
  {
    value: "emergencia",
    label: "Emergência",
    description: "SAMU, Polícia, Bombeiros e contatos importantes.",
  },
];

export const cityServices: CityService[] = [
  {
    id: "hospital-maternidade-cerro-cora",
    listingType: "public_service",
    name: "Hospital/Maternidade de Cerro Corá",
    slug: "hospital-maternidade-cerro-cora",
    category: "saude",
    subcategory: "Hospital",
    description: "Atendimento de saúde para moradores e visitantes.",
    address: "Informação a confirmar",
    neighborhood: "",
    openingHours: "Atendimento conforme funcionamento da unidade.",
    isEmergency: false,
    isFeatured: true,
    isActive: true,
    notes: "Em caso de emergência, confirme o atendimento pelo telefone informado.",
  },
  {
    id: "delegacia-policia-cerro-cora",
    listingType: "public_service",
    name: "Delegacia de Polícia de Cerro Corá",
    slug: "delegacia-policia-cerro-cora",
    category: "seguranca",
    subcategory: "Delegacia",
    description: "Atendimento policial e registro de ocorrências.",
    address: "Informação a confirmar",
    neighborhood: "",
    openingHours: "Atendimento conforme funcionamento da unidade.",
    isEmergency: false,
    isFeatured: true,
    isActive: true,
    notes: "Para emergências policiais, acione os canais oficiais de segurança pública.",
  },
];

export const cityServiceAdminFields = [
  "name",
  "slug",
  "category",
  "subcategory",
  "description",
  "address",
  "neighborhood",
  "phone",
  "whatsapp",
  "googleMapsUrl",
  "openingHours",
  "isEmergency",
  "isFeatured",
  "isActive",
  "notes",
] as const;

const legacyCityServiceColumns =
  "id,name,slug,category,subcategory,description,address,neighborhood,phone,whatsapp,google_maps_url,opening_hours,business_hours,instagram,instagram_url,site_url,latitude,longitude,image_url,logo_url,plan,tags,enabled_buttons,important_message,is_24h,whatsapp_message,is_emergency,is_featured,is_active,notes,created_at,updated_at";
const cityServiceColumns = `${legacyCityServiceColumns},listing_type,plan_type,plan_status,plan_started_at,plan_expires_at,custom_features,carousel_photo_limit,gallery_photo_limit,featured_order,category_priority,professional_photography_included,photography_completed_at,social_media_promotion_included,social_media_publication_url,advanced_report_enabled,priority_support_enabled,seasonal_campaign_enabled,establishment_story_enabled,commercial_notes,plan_change_reason`;

function mapCityService(row: CityServiceRow): CityService {
  const listingType = row.listing_type || "commercial";
  const plan = normalizeCommercialPlan(row.plan_type || row.plan);
  const planStatus = getEffectivePlanStatus(row.plan_status, row.plan_expires_at);
  const commercialFeatures = getCommercialFeatures(plan, {
    listingType,
    status: planStatus,
    customFeatures: row.custom_features,
    highlighted: row.is_featured,
  });

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description || "",
    address: row.address || "",
    neighborhood: row.neighborhood || "",
    phone: row.phone || undefined,
    whatsapp: row.whatsapp || undefined,
    googleMapsUrl: row.google_maps_url || undefined,
    openingHours: row.opening_hours || undefined,
    businessHours: row.business_hours || undefined,
    instagram: row.instagram || undefined,
    instagramUrl: row.instagram_url || undefined,
    siteUrl: row.site_url || undefined,
    latitude: row.latitude || undefined,
    longitude: row.longitude || undefined,
    imageUrl: row.image_url || undefined,
    logoUrl: row.logo_url || undefined,
    listingType,
    plan,
    planStatus,
    customFeatures: row.custom_features || undefined,
    commercialFeatures,
    tags: row.tags || undefined,
    enabledButtons: row.enabled_buttons || undefined,
    importantMessage: row.important_message || undefined,
    is24h: Boolean(row.is_24h),
    whatsappMessage: row.whatsapp_message || undefined,
    isEmergency: row.is_emergency,
    isFeatured: listingType === "commercial" && commercialFeatures.highlighted,
    isActive: row.is_active,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

export async function getActiveCityServices() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return cityServices.filter((service) => service.isActive);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const result = await supabase
    .from("city_services")
    .select(cityServiceColumns)
    .eq("is_active", true)
    .order("is_emergency", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("name");
  let data = result.data as CityServiceRow[] | null;
  let error = result.error;

  if (error?.message?.toLowerCase().includes("column")) {
    const legacyResult = await supabase
      .from("city_services")
      .select(legacyCityServiceColumns)
      .eq("is_active", true)
      .order("is_emergency", { ascending: false })
      .order("is_featured", { ascending: false })
      .order("name");
    data = legacyResult.data as CityServiceRow[] | null;
    error = legacyResult.error;
  }

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[city-services]", error);
    }

    return cityServices.filter((service) => service.isActive);
  }

  return ((data || []) as CityServiceRow[]).map(mapCityService);
}

export function getCityServiceCategoryLabel(category: CityServiceCategory) {
  return cityServiceCategories.find((item) => item.value === category)?.label || "Serviço";
}
