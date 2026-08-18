import type { BusinessHours } from "@/lib/business-hours";
import {
  fallbackServiceCategories,
  findCategoryForLegacyValue,
  getFallbackServiceCategory,
  type ServiceCategoryDefinition,
} from "@/lib/city-service-catalog";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  PUBLIC_CACHE_TAGS,
  PUBLIC_CONTENT_CACHE_SECONDS,
} from "@/lib/cache-tags";
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
  coverUrl?: string;
  galleryEnabled: boolean;
  galleryUrls?: string[];
  galleryAltTexts?: string[];
  differentials?: string[];
  additionalInformation?: string;
  seoTitle?: string;
  seoDescription?: string;
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
  cover_url?: string | null;
  gallery_enabled?: boolean | null;
  gallery_urls?: string[] | null;
  gallery_alt_texts?: string[] | null;
  differentials?: string[] | null;
  additional_information?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
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
const extendedCityServiceColumns =
  legacyCityServiceColumns +
  ",category_id,subcategory_id,short_description,full_description,services_offered,special_status,photo_url,image_type,alt_text,details_enabled,gallery_enabled,gallery_urls,is_published,sort_order,last_confirmed_at,public_notice";
const detailCityServiceColumns =
  extendedCityServiceColumns +
  ",cover_url,gallery_alt_texts,differentials,additional_information,seo_title,seo_description";
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
    coverUrl: row.cover_url || undefined,
    galleryEnabled: Boolean(row.gallery_enabled),
    galleryUrls: row.gallery_urls || undefined,
    galleryAltTexts: row.gallery_alt_texts || undefined,
    differentials: row.differentials || undefined,
    additionalInformation: row.additional_information || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
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

function normalizeStoredCategory(category: ServiceCategoryDefinition) {
  if (category.parentSlug || category.parentId) return category;
  const local = getFallbackServiceCategory(category.slug);
  return local
    ? { ...category, name: local.name, description: local.description }
    : category;
}
async function fetchServiceCategories() {
  const supabase = getPublicClient();
  if (!supabase) return fallbackServiceCategories;
  const extended = await supabase
    .from("service_categories")
    .select("id,name,slug,description,icon,accent,sort_order,is_active,listing_type,parent_id,parent_slug")
    .eq("is_active", true)
    .order("sort_order")
    .limit(300);
  if (!extended.error && extended.data?.length) {
    return (extended.data as ServiceCategoryRow[]).map(mapCategory).map(normalizeStoredCategory);
  }
  const legacy = await supabase
    .from("service_categories")
    .select("id,name,slug,icon,sort_order,is_active,parent_slug")
    .eq("is_active", true)
    .order("sort_order")
    .limit(300);
  if (!legacy.error && legacy.data?.length) {
    return (legacy.data as ServiceCategoryRow[]).map(mapCategory).map(normalizeStoredCategory);
  }
  return fallbackServiceCategories;
}

export const getServiceCategories = unstable_cache(
  fetchServiceCategories,
  [PUBLIC_CACHE_TAGS.serviceCategories],
  {
    revalidate: PUBLIC_CONTENT_CACHE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.serviceCategories],
  },
);

async function fetchActiveCityServices() {
  const supabase = getPublicClient();
  if (!supabase) return cityServices;

  const detailResult = await supabase
    .from("city_services")
    .select(detailCityServiceColumns)
    .eq("is_active", true)
    .eq("is_published", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name")
    .limit(500);
  if (!detailResult.error) {
    return ((detailResult.data || []) as unknown as ExtendedCityServiceRow[]).map(mapCityService);
  }

  const extendedResult = await supabase
    .from("city_services")
    .select(extendedCityServiceColumns)
    .eq("is_active", true)
    .eq("is_published", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name")
    .limit(500);
  if (!extendedResult.error) {
    return ((extendedResult.data || []) as unknown as ExtendedCityServiceRow[]).map(mapCityService);
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
  return ((legacyResult.data || []) as unknown as ExtendedCityServiceRow[]).map(mapCityService);
}

export const getActiveCityServices = unstable_cache(
  fetchActiveCityServices,
  [PUBLIC_CACHE_TAGS.cityServices],
  {
    revalidate: PUBLIC_CONTENT_CACHE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.cityServices],
  },
);

async function fetchCityServiceBySlug(slug: string) {
  const supabase = getPublicClient();
  if (!supabase) {
    return cityServices.find((service) => service.slug === slug && service.detailsEnabled) || null;
  }

  const detailResult = await supabase
    .from("city_services")
    .select(detailCityServiceColumns)
    .eq("is_active", true)
    .eq("is_published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (!detailResult.error) {
    if (!detailResult.data) return null;
    const service = mapCityService(detailResult.data as unknown as ExtendedCityServiceRow);
    return service.detailsEnabled ? service : null;
  }

  const extendedResult = await supabase
    .from("city_services")
    .select(extendedCityServiceColumns)
    .eq("is_active", true)
    .eq("is_published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (!extendedResult.error) {
    if (!extendedResult.data) return null;
    const service = mapCityService(extendedResult.data as unknown as ExtendedCityServiceRow);
    return service.detailsEnabled ? service : null;
  }

  const legacyResult = await supabase
    .from("city_services")
    .select(legacyCityServiceColumns)
    .eq("is_active", true)
    .eq("slug", slug)
    .maybeSingle();

  if (legacyResult.error) {
    if (process.env.NODE_ENV !== "production") console.error("[city-service]", legacyResult.error);
    return (
      cityServices.find((service) => service.slug === slug && service.detailsEnabled) ||
      null
    );
  }
  if (!legacyResult.data) return null;
  const service = mapCityService(legacyResult.data as unknown as ExtendedCityServiceRow);
  return service.detailsEnabled ? service : null;
}

const getCachedCityServiceBySlug = unstable_cache(
  fetchCityServiceBySlug,
  ["public-city-service-page"],
  {
    revalidate: PUBLIC_CONTENT_CACHE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.cityServices],
  },
);

export const getCityServiceBySlug = cache(getCachedCityServiceBySlug);

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