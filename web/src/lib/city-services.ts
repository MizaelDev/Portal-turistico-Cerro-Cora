import type { BusinessHours } from "@/lib/business-hours";
import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  type CityServiceRow,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase";

export type CityServiceCategory =
  | "saude"
  | "seguranca"
  | "transporte_apoio"
  | "comercio_essencial"
  | "emergencia";

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

const cityServiceColumns =
  "id,name,slug,category,subcategory,description,address,neighborhood,phone,whatsapp,google_maps_url,opening_hours,business_hours,is_emergency,is_featured,is_active,notes,created_at,updated_at";

function mapCityService(row: CityServiceRow): CityService {
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
    isEmergency: row.is_emergency,
    isFeatured: row.is_featured,
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

  const { data, error } = await supabase
    .from("city_services")
    .select(cityServiceColumns)
    .eq("is_active", true)
    .order("is_emergency", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("name");

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
