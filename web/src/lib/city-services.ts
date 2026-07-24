import type { BusinessHours } from "@/lib/business-hours";
import {
  fallbackServiceCategories,
  findCategoryForLegacyValue,
  getFallbackServiceCategory,
  type ServiceCategoryDefinition,
} from "@/lib/city-service-catalog";
import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  type CityServiceRow,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase";

export type CityServiceCategory = string;
export type ListingType = "public_service" | "commercial";
export type ServiceImageType = "photo" | "logo" | "auto";

export type CityService = {
  id: string;
  name: string;
  slug: string;
  category: CityServiceCategory;
  categoryId?: string;
  subcategory: string;
  subcategoryId?: string;
  shortDescription: string;
  fullDescription?: string;
  description: string;
  servicesOffered?: string[];
  address: string;
  neighborhood: string;
  phone?: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  openingHours?: string;
  businessHours?: BusinessHours;
  specialStatus?: string;
  instagram?: string;
  instagramUrl?: string;
  siteUrl?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  imageUrl?: string;
  logoUrl?: string;
  imageType: ServiceImageType;
  altText?: string;
  listingType: ListingType;
  tags?: string[];
  enabledButtons?: string[];
  importantMessage?: string;
  is24h: boolean;
  whatsappMessage?: string;
  detailsEnabled: boolean;
  galleryEnabled: boolean;
  galleryUrls?: string[];
  isEmergency: boolean;
  isFeatured: boolean;
  isActive: boolean;
  isPublished: boolean;
  sortOrder?: number;
  lastConfirmedAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ExtendedCityServiceRow = CityServiceRow & {
  category_id?: string | null;
  subcategory_id?: string | null;
  short_description?: string | null;
  full_description?: string | null;
  services_offered?: string[] | null;
  special_status?: string | null;
  photo_url?: string | null;
  image_type?: ServiceImageType | null;
  alt_text?: string | null;
  details_enabled?: boolean | null;
  gallery_enabled?: boolean | null;
  gallery_urls?: string[] | null;
  is_published?: boolean | null;
  sort_order?: number | null;
  last_confirmed_at?: string | null;
  public_notice?: string | null;
};

type ServiceCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  accent?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  listing_type?: ServiceCategoryDefinition["listingType"] | null;
  parent_id?: string | null;
  parent_slug?: string | null;
};

export const cityServiceCategories = fallbackServiceCategories
  .filter((category) => !category.parentSlug)
  .map((category) => ({
    value: category.slug,
    label: category.name,
    description: category.description,
  }));

export const cityServices: CityService[] = [
  {
    id: "hospital-maternidade-cerro-cora",
    listingType: "public_service",
    name: "Hospital/Maternidade de Cerro Corá",
    slug: "hospital-maternidade-cerro-cora",
    category: "saude",
    subcategory: "Hospital e maternidade",
    shortDescription: "Atendimento de saúde para moradores e visitantes.",
    description: "Atendimento de saúde para moradores e visitantes.",
    address: "",
    neighborhood: "",
    imageType: "auto",
    is24h: false,
    detailsEnabled: false,
    galleryEnabled: false,
    isEmergency: false,
    isFeatured: true,
    isActive: true,
    isPublished: true,
  },
  {
    id: "delegacia-policia-cerro-cora",
    listingType: "public_service",
    name: "Delegacia de Polícia de Cerro Corá",
    slug: "delegacia-policia-cerro-cora",
    category: "servicos-publicos",
    subcategory: "Delegacia",
    shortDescription: "Atendimento policial e registro de ocorrências.",
    description: "Atendimento policial e registro de ocorrências.",
    address: "",
    neighborhood: "",
    imageType: "auto",
    is24h: false,
    detailsEnabled: false,
    galleryEnabled: false,
    isEmergency: false,
    isFeatured: true,
    isActive: true,
    isPublished: true,
  },
];

const legacyCityServiceColumns =
  "id,name,slug,category,subcategory,description,address,neighborhood,phone,whatsapp,google_maps_url,opening_hours,business_hours,instagram,instagram_url,site_url,latitude,longitude,image_url,logo_url,tags,enabled_buttons,important_message,is_24h,whatsapp_message,is_emergency,is_featured,is_active,notes,created_at,updated_at,listing_type";
const extendedCityServiceColumns = `${legacyCityServiceColumns},category_id,subcategory_id,short_description,full_description,services_offered,special_status,photo_url,image_type,alt_text,details_enabled,gallery_enabled,gallery_urls,is_published,sort_order,last_confirmed_at,public_notice`;
const cityServicesTimeoutMs = 8_000;

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const upstreamSignal = init?.signal;
  const abortRequest = () => controller.abort();
  const timeout = setTimeout(abortRequest, cityServicesTimeoutMs);
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

function getPublicClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetchWithTimeout },
  });
}

function mapCityService(row: ExtendedCityServiceRow): CityService {
  const category = findCategoryForLegacyValue(row.category || "").slug;
  const shortDescription = row.short_description || row.description || "";
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category,
    categoryId: row.category_id || undefined,
    subcategory: row.subcategory,
    subcategoryId: row.subcategory_id || undefined,
    shortDescription,
    fullDescription: row.full_description || undefined,
    servicesOffered: row.services_offered || undefined,
    description: shortDescription,
    address: row.address || "",
    neighborhood: row.neighborhood || "",
    phone: row.phone || undefined,
    whatsapp: row.whatsapp || undefined,
    googleMapsUrl: row.google_maps_url || undefined,
    openingHours: row.opening_hours || undefined,
    businessHours: row.business_hours || undefined,
    specialStatus: row.special_status || undefined,
    instagram: row.instagram || undefined,
    instagramUrl: row.instagram_url || undefined,
    siteUrl: row.site_url || undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    photoUrl: row.photo_url || row.image_url || undefined,
    imageUrl: row.photo_url || row.image_url || undefined,
    logoUrl: row.logo_url || undefined,
    imageType: row.image_type || "auto",
    altText: row.alt_text || undefined,
    listingType: row.listing_type || "commercial",
    tags: row.tags || undefined,
    enabledButtons: row.enabled_buttons || undefined,
    importantMessage: row.public_notice || row.important_message || undefined,
    is24h: Boolean(row.is_24h),
    whatsappMessage: row.whatsapp_message || undefined,
    detailsEnabled: Boolean(row.details_enabled),
    galleryEnabled: Boolean(row.gallery_enabled),
    galleryUrls: row.gallery_urls || undefined,
    isEmergency: row.is_emergency,
    isFeatured: Boolean(row.is_featured),
    isActive: row.is_active,
    isPublished: row.is_published !== false,
    sortOrder: row.sort_order ?? undefined,
    lastConfirmedAt: row.last_confirmed_at || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

function mapCategory(row: ServiceCategoryRow): ServiceCategoryDefinition {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    icon: row.icon || "building-2",
    accent: row.accent || "green",
    sortOrder: row.sort_order || 0,
    isActive: row.is_active !== false,
    listingType: row.listing_type || "mixed",
    parentId: row.parent_id || null,
    parentSlug: row.parent_slug || null,
  };
}

export async function getServiceCategories() {
  const supabase = getPublicClient();
  if (!supabase) return fallbackServiceCategories;
  const extended = await supabase
    .from("service_categories")
    .select("id,name,slug,description,icon,accent,sort_order,is_active,listing_type,parent_id,parent_slug")
    .eq("is_active", true)
    .order("sort_order")
    .limit(300);
  if (!extended.error && extended.data?.length) {
    return (extended.data as ServiceCategoryRow[]).map(mapCategory);
  }
  const legacy = await supabase
    .from("service_categories")
    .select("id,name,slug,icon,sort_order,is_active,parent_slug")
    .eq("is_active", true)
    .order("sort_order")
    .limit(300);
  if (!legacy.error && legacy.data?.length) {
    return (legacy.data as ServiceCategoryRow[]).map(mapCategory);
  }
  return fallbackServiceCategories;
}

export async function getActiveCityServices() {
  const supabase = getPublicClient();
  if (!supabase) return cityServices;
  const extendedResult = await supabase
    .from("city_services")
    .select(extendedCityServiceColumns)
    .eq("is_active", true)
    .eq("is_published", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name")
    .limit(500);
  if (!extendedResult.error) {
    return ((extendedResult.data || []) as ExtendedCityServiceRow[]).map(mapCityService);
  }
  const legacyResult = await supabase
    .from("city_services")
    .select(legacyCityServiceColumns)
    .eq("is_active", true)
    .order("is_emergency", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("name")
    .limit(500);
  if (legacyResult.error) {
    if (process.env.NODE_ENV !== "production") console.error("[city-services]", legacyResult.error);
    return cityServices;
  }
  return ((legacyResult.data || []) as ExtendedCityServiceRow[]).map(mapCityService);
}

export async function getCityServiceBySlug(slug: string) {
  const services = await getActiveCityServices();
  return services.find((service) => service.slug === slug && service.detailsEnabled) || null;
}

export function getCityServiceCategoryLabel(
  category: CityServiceCategory,
  categories: ServiceCategoryDefinition[] = fallbackServiceCategories,
) {
  return (
    categories.find((item) => item.slug === category && !item.parentSlug)?.name ||
    getFallbackServiceCategory(category)?.name ||
    "Serviço"
  );
}