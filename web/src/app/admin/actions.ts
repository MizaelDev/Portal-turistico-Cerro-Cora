"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  attractions as defaultAttractions,
  foodPlaces as defaultFoodPlaces,
  lodgings as defaultLodgings,
} from "@/lib/data";
import { requireAdminSession } from "@/lib/admin-auth";
import { parseBusinessHours, parseLegacyBusinessHours, type BusinessHours } from "@/lib/business-hours";
import {
  getEffectiveFeatures,
  getPhotoLimits,
  normalizeCommercialPlan,
  type CommercialFeatureKey,
  type CustomCommercialFeatures,
} from "@/lib/commercial";
import { slugify } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseUrl, type AdminEntity } from "@/lib/supabase";

type ActionResult = {
  ok: boolean;
  message: string;
};

type UploadResult = ActionResult & {
  urls: string[];
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 6 * 1024 * 1024;
const maxUploadFiles = 10;
const allowedExternalImageHosts = ["images.unsplash.com", "images.pexels.com"];
const adminEntitySchema = z.enum(["pontos_turisticos", "pousadas", "restaurantes", "city_services"]);
const uuidSchema = z.string().uuid("Identificador invÃ¡lido.");

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isSafeImagePathOrUrl(value: string) {
  if (value.startsWith("/")) {
    const segments = value.split("/");
    return (
      !value.startsWith("//") &&
      !value.includes("\\") &&
      !value.includes("\0") &&
      !segments.includes("..") &&
      !segments.includes(".")
    );
  }

  if (!isHttpsUrl(value)) return false;

  try {
    const hostname = new URL(value).hostname;
    return allowedExternalImageHosts.includes(hostname) || hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

const pathOrUrl = z
  .string()
  .trim()
  .min(1, "Informe uma imagem.")
  .refine(
    isSafeImagePathOrUrl,
    "Use uma imagem local iniciada com / ou uma URL HTTPS permitida.",
  );

const optionalUrl = z
  .string()
  .trim()
  .nullable()
  .refine(
    (value) => !value || isHttpsUrl(value),
    "Use uma URL HTTPS válida.",
  );

const optionalPathOrUrl = z
  .string()
  .trim()
  .nullable()
  .refine(
    (value) => !value || isSafeImagePathOrUrl(value),
    "Use uma imagem local iniciada com / ou uma URL HTTPS permitida.",
  );

const slugSchema = z
  .string()
  .trim()
  .nullable()
  .refine(
    (value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
    "Use um slug amigável, apenas com letras minúsculas, números e hífens. Ex: acai-bistro.",
  );

const optionalInstagramUrl = optionalUrl.refine(
  (value) => {
    if (!value) return true;
    try {
      return new URL(value).hostname.replace(/^www\./, "") === "instagram.com";
    } catch {
      return false;
    }
  },
  "Use um link válido do Instagram.",
);

const optionalGoogleMapsUrl = optionalUrl.refine((value) => {
  if (!value) return true;
  try {
    const hostname = new URL(value).hostname.replace(/^www\./, "");
    return hostname === "google.com" || hostname.endsWith(".google.com") || hostname === "maps.app.goo.gl";
  } catch {
    return false;
  }
}, "Use um link válido do Google Maps.");

const whatsappSchema = z
  .string()
  .trim()
  .min(10, "Informe um WhatsApp com DDD.")
  .regex(/^\d+$/, "Use apenas números no WhatsApp.");
const timeSchema = z
  .string()
  .regex(/^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/, "Use horÃ¡rios entre 00:00 e 24:00.");
const businessDaySchema = z
  .object({
    closed: z.boolean().optional(),
    open: timeSchema.optional(),
    close: timeSchema.optional(),
    secondOpen: timeSchema.optional(),
    secondClose: timeSchema.optional(),
  })
  .superRefine((value, context) => {
    if (!value.closed && (!value.open || !value.close)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Informe abertura e fechamento do dia." });
    }
    if (Boolean(value.secondOpen) !== Boolean(value.secondClose)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Complete o segundo perÃ­odo de atendimento." });
    }
  });
const businessHoursSchema: z.ZodType<BusinessHours | null> = z
  .object({
    mode: z.enum(["regular", "24h", "appointment"]).optional(),
    days: z.record(businessDaySchema).optional(),
  })
  .nullable();
const commercialPlanSchema = z.enum(["bronze", "silver", "gold"]);
const planStatusSchema = z.enum(["active", "inactive", "trial", "expired", "suspended"]);
const customFeaturesSchema = z.record(z.boolean()).default({});

const customizableFeatureKeys: CommercialFeatureKey[] = [
  "instagram",
  "individualPage",
  "carousel",
  "gallery",
  "highlighted",
  "professionalPhotography",
  "socialMediaPromotion",
  "advancedReport",
  "monthlyComparison",
  "prioritySupport",
  "seasonalCampaign",
  "establishmentStory",
  "bookingButton",
];

const pontoTuristicoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome."),
  descricao: z.string().trim().min(10, "Informe uma descrição mais completa."),
  categoria: z.enum(["mirante", "natureza", "geoturismo", "ecoturismo", "trilha", "aventura"]),
  localizacao: z.string().trim().min(2, "Informe a localização."),
  imagem_url: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).default([]),
  ativo: z.boolean(),
});

const pousadaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome."),
  slug: slugSchema,
  descricao: z.string().trim().min(10, "Informe uma descrição mais completa."),
  historia: z.string().trim().nullable(),
  categoria: z.string().trim().nullable(),
  plano: z.enum(["basic", "pro"]).default("basic"),
  plan_type: commercialPlanSchema.default("bronze"),
  plan_status: planStatusSchema.default("active"),
  plan_started_at: z.string().trim().nullable(),
  plan_expires_at: z.string().trim().nullable(),
  custom_features: customFeaturesSchema,
  carousel_photo_limit: z.number().int().min(1).max(30).nullable(),
  gallery_photo_limit: z.number().int().min(0).max(60).nullable(),
  featured_order: z.number().int().min(0).nullable(),
  category_priority: z.number().int().min(0).default(0),
  professional_photography_included: z.boolean(),
  photography_completed_at: z.string().trim().nullable(),
  social_media_promotion_included: z.boolean(),
  social_media_publication_url: optionalUrl,
  advanced_report_enabled: z.boolean(),
  priority_support_enabled: z.boolean(),
  seasonal_campaign_enabled: z.boolean(),
  establishment_story_enabled: z.boolean(),
  commercial_notes: z.string().trim().nullable(),
  plan_change_reason: z.string().trim().nullable(),
  localizacao: z.string().trim().min(2, "Informe a localização."),
  endereco: z.string().trim().nullable(),
  mapa_url: optionalGoogleMapsUrl,
  distancia_centro: z.string().trim().nullable(),
  faixa_preco_min: z.number().nullable(),
  faixa_preco_max: z.number().nullable(),
  whatsapp: whatsappSchema,
  telefone: z.string().trim().nullable(),
  instagram: z.string().trim().nullable(),
  instagram_url: optionalInstagramUrl,
  logo_url: optionalPathOrUrl,
  hero_image_url: optionalPathOrUrl,
  imagens_urls: z.array(pathOrUrl).min(1, "Informe ao menos uma imagem."),
  check_in: z.string().trim().nullable(),
  check_out: z.string().trim().nullable(),
  business_hours: businessHoursSchema,
  capacidade: z.string().trim().nullable(),
  tipos_acomodacao: z.array(z.string().trim().min(1)).default([]),
  formas_pagamento: z.array(z.string().trim().min(1)).default([]),
  comodidades: z.array(z.string().trim().min(1)).default([]),
  diferenciais: z.array(z.string().trim().min(1)).default([]),
  diferencial_principal: z.string().trim().nullable(),
  aceita_reservas: z.boolean(),
  whatsapp_message: z.string().trim().nullable(),
  site_url: optionalUrl,
  pagina_ativa: z.boolean(),
  destaque: z.boolean(),
  ativo: z.boolean(),
});

const restauranteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome."),
  slug: slugSchema,
  descricao: z.string().trim().min(10, "Informe uma descrição mais completa."),
  descricao_completa: z.string().trim().nullable(),
  categoria: z.enum(["restaurante", "almoço", "bar", "café", "lanchonete"]),
  plano: z.enum(["basic", "pro"]).default("basic"),
  plan_type: commercialPlanSchema.default("bronze"),
  plan_status: planStatusSchema.default("active"),
  plan_started_at: z.string().trim().nullable(),
  plan_expires_at: z.string().trim().nullable(),
  custom_features: customFeaturesSchema,
  carousel_photo_limit: z.number().int().min(1).max(30).nullable(),
  gallery_photo_limit: z.number().int().min(0).max(60).nullable(),
  featured_order: z.number().int().min(0).nullable(),
  category_priority: z.number().int().min(0).default(0),
  professional_photography_included: z.boolean(),
  photography_completed_at: z.string().trim().nullable(),
  social_media_promotion_included: z.boolean(),
  social_media_publication_url: optionalUrl,
  advanced_report_enabled: z.boolean(),
  priority_support_enabled: z.boolean(),
  seasonal_campaign_enabled: z.boolean(),
  establishment_story_enabled: z.boolean(),
  commercial_notes: z.string().trim().nullable(),
  plan_change_reason: z.string().trim().nullable(),
  horario_funcionamento: z.string().trim().min(2, "Informe o horário."),
  business_hours: businessHoursSchema,
  endereco: z.string().trim().min(2, "Informe o endereço."),
  localizacao_resumida: z.string().trim().nullable(),
  mapa_url: optionalGoogleMapsUrl,
  instagram: z.string().trim().nullable(),
  instagram_url: optionalInstagramUrl,
  whatsapp: whatsappSchema,
  telefone: z.string().trim().nullable(),
  imagem_url: pathOrUrl,
  logo_url: optionalPathOrUrl,
  imagens_urls: z.array(pathOrUrl).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
  formas_pagamento: z.array(z.string().trim().min(1)).default([]),
  diferenciais: z.array(z.string().trim().min(1)).default([]),
  especialidades: z.array(z.string().trim().min(1)).default([]),
  prato_recomendado: z.string().trim().nullable(),
  dica_turista: z.string().trim().nullable(),
  cardapio_url: optionalUrl,
  faixa_preco: z.enum(["R$", "R$$", "R$$$"]).nullable(),
  whatsapp_message: z.string().trim().nullable(),
  site_url: optionalUrl,
  pagina_ativa: z.boolean(),
  destaque: z.boolean(),
  ativo: z.boolean(),
});

const cityServiceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço."),
  slug: slugSchema,
  category: z.string().trim().min(2, "Informe a categoria."),
  listing_type: z.enum(["public_service", "commercial"]).default("commercial"),
  plan: z.enum(["basic", "pro"]).default("basic"),
  plan_type: commercialPlanSchema.default("bronze"),
  plan_status: planStatusSchema.default("active"),
  plan_started_at: z.string().trim().nullable(),
  plan_expires_at: z.string().trim().nullable(),
  custom_features: customFeaturesSchema,
  carousel_photo_limit: z.number().int().min(1).max(30).nullable(),
  gallery_photo_limit: z.number().int().min(0).max(60).nullable(),
  featured_order: z.number().int().min(0).nullable(),
  category_priority: z.number().int().min(0).default(0),
  professional_photography_included: z.boolean(),
  photography_completed_at: z.string().trim().nullable(),
  social_media_promotion_included: z.boolean(),
  social_media_publication_url: optionalUrl,
  advanced_report_enabled: z.boolean(),
  priority_support_enabled: z.boolean(),
  seasonal_campaign_enabled: z.boolean(),
  establishment_story_enabled: z.boolean(),
  commercial_notes: z.string().trim().nullable(),
  plan_change_reason: z.string().trim().nullable(),
  subcategory: z.string().trim().min(2, "Informe o tipo de serviço."),
  description: z.string().trim().nullable(),
  address: z.string().trim().nullable(),
  neighborhood: z.string().trim().nullable(),
  phone: z.string().trim().nullable(),
  whatsapp: z
    .string()
    .trim()
    .nullable()
    .refine((value) => !value || /^\d{10,15}$/.test(value), "Use apenas números no WhatsApp, com DDD."),
  google_maps_url: optionalGoogleMapsUrl,
  instagram: z.string().trim().nullable(),
  instagram_url: optionalInstagramUrl,
  site_url: optionalUrl,
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  image_url: optionalPathOrUrl,
  logo_url: optionalPathOrUrl,
  tags: z.array(z.string().trim().min(1)).default([]),
  enabled_buttons: z.array(z.string().trim().min(1)).default([]),
  important_message: z.string().trim().nullable(),
  whatsapp_message: z.string().trim().nullable(),
  opening_hours: z.string().trim().nullable(),
  business_hours: businessHoursSchema,
  is_emergency: z.boolean(),
  is_featured: z.boolean(),
  is_24h: z.boolean(),
  is_active: z.boolean(),
  notes: z.string().trim().nullable(),
});

const attractionGallerySchema = z.object({
  attractionId: z.string().uuid("Roteiro inválido."),
  coverUrl: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).default([]),
});

const removeAttractionImageSchema = z.object({
  attractionId: z.string().uuid("Roteiro inválido.").nullable().optional(),
  imageUrl: pathOrUrl,
  coverUrl: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).default([]),
});

const restaurantGallerySchema = z.object({
  restaurantId: z.string().uuid("Restaurante inválido."),
  coverUrl: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).default([]),
});

const removeRestaurantImageSchema = z.object({
  restaurantId: z.string().uuid("Restaurante inválido.").nullable().optional(),
  imageUrl: pathOrUrl,
  coverUrl: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).default([]),
});

const restaurantAssetSchema = z.object({
  restaurantId: z.string().uuid("Restaurante inválido.").nullable().optional(),
  field: z.enum(["logo_url", "imagem_url"]),
  imageUrl: pathOrUrl.nullable(),
  nextUrl: optionalPathOrUrl,
});

const lodgingGallerySchema = z.object({
  lodgingId: z.string().uuid("Pousada inválida."),
  imagens_urls: z.array(pathOrUrl).min(1, "Mantenha pelo menos uma foto na pousada."),
});

const removeLodgingImageSchema = z.object({
  lodgingId: z.string().uuid("Pousada inválida.").nullable().optional(),
  imageUrl: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).min(1, "Mantenha pelo menos uma foto na pousada."),
});

const lodgingAssetSchema = z.object({
  field: z.enum(["logo_url", "hero_image_url"]).default("logo_url"),
  lodgingId: z.string().uuid("Pousada inválida.").nullable().optional(),
  imageUrl: pathOrUrl.nullable(),
  nextUrl: optionalPathOrUrl,
});

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value || "").replace(",", ".").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function imageList(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalDateTime(value: FormDataEntryValue | null) {
  const text = optionalText(value);
  if (!text) return null;
  const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(text) ? text : `${text}:00-03:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function textList(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueImageList(images: string[]) {
  return Array.from(new Set(images.map((image) => image.trim()).filter(Boolean)));
}

function storagePathFromPublicUrl(url: string) {
  if (!supabaseUrl || !url.startsWith("http")) return null;

  try {
    const publicUrl = new URL(url);
    const projectUrl = new URL(supabaseUrl);

    if (publicUrl.hostname !== projectUrl.hostname) return null;

    const publicPrefix = "/storage/v1/object/public/tourism/";
    if (!publicUrl.pathname.startsWith(publicPrefix)) return null;

    return decodeURIComponent(publicUrl.pathname.slice(publicPrefix.length));
  } catch {
    return null;
  }
}

function logAdminError(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[admin:${scope}]`, error);
  }
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  await requireAdminSession(supabase);
  return supabase;
}

async function assertSameOrigin() {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");
  const host = headersList.get("host");
  const source = origin || referer;

  if (!host || !source) {
    throw new Error("Invalid server action origin.");
  }

  const allowedOrigins = new Set(
    [`https://${host}`, `http://${host}`, process.env.NEXT_PUBLIC_SITE_URL]
      .filter(Boolean)
      .map((value) => String(value).replace(/\/$/, "")),
  );

  const sourceOrigin = new URL(source).origin;
  if (!allowedOrigins.has(sourceOrigin)) {
    throw new Error("Invalid server action origin.");
  }
}

async function getMediaPolicy(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: "restaurantes" | "pousadas",
  id: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select(
      "plan_type,plano,plan_status,plan_expires_at,custom_features,pagina_ativa,carousel_photo_limit,gallery_photo_limit",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  const plan = normalizeCommercialPlan(data.plan_type || data.plano);
  return {
    features: getEffectiveFeatures(plan, {
      status: data.plan_status,
      customFeatures: data.custom_features || undefined,
      pageEnabled: data.pagina_ativa,
    }),
    limits: getPhotoLimits(plan, data.carousel_photo_limit, data.gallery_photo_limit),
  };
}

function commercialPayloadFromForm(formData: FormData) {
  const planType = normalizeCommercialPlan(String(formData.get("plan_type") || "bronze"));
  const customFeatures: CustomCommercialFeatures = {};

  if (formData.get("custom_features_enabled") === "on") {
    for (const feature of customizableFeatureKeys) {
      customFeatures[feature] = formData.get(`feature_${feature}`) === "on";
    }
  }

  return {
    plan_type: planType,
    plan_status: formData.get("plan_status") || "active",
    plan_started_at: optionalDateTime(formData.get("plan_started_at")),
    plan_expires_at: optionalDateTime(formData.get("plan_expires_at")),
    custom_features: customFeatures,
    carousel_photo_limit: optionalNumber(formData.get("carousel_photo_limit")),
    gallery_photo_limit: optionalNumber(formData.get("gallery_photo_limit")),
    featured_order: optionalNumber(formData.get("featured_order")),
    category_priority: optionalNumber(formData.get("category_priority")) || 0,
    professional_photography_included: formData.get("professional_photography_included") === "on",
    photography_completed_at: optionalDateTime(formData.get("photography_completed_at")),
    social_media_promotion_included: formData.get("social_media_promotion_included") === "on",
    social_media_publication_url: optionalText(formData.get("social_media_publication_url")),
    advanced_report_enabled: formData.get("advanced_report_enabled") === "on",
    priority_support_enabled: formData.get("priority_support_enabled") === "on",
    seasonal_campaign_enabled: formData.get("seasonal_campaign_enabled") === "on",
    establishment_story_enabled: formData.get("establishment_story_enabled") === "on",
    commercial_notes: optionalText(formData.get("commercial_notes")),
    plan_change_reason: optionalText(formData.get("plan_change_reason")),
  };
}

function parsePayload(entity: AdminEntity, formData: FormData) {
  if (entity === "pontos_turisticos") {
    return pontoTuristicoSchema.parse({
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
      categoria: formData.get("categoria"),
      localizacao: formData.get("localizacao"),
      imagem_url: formData.get("imagem_url"),
      imagens_urls: imageList(formData.get("imagens_urls")),
      ativo: formData.get("ativo") === "on",
    });
  }

  if (entity === "city_services") {
    const name = String(formData.get("nome") || "");
    const commercial = commercialPayloadFromForm(formData);

    return cityServiceSchema.parse({
      name,
      slug: optionalText(formData.get("slug")) || slugify(name),
      category: formData.get("categoria"),
      listing_type: formData.get("listing_type") || "commercial",
      plan: commercial.plan_type === "bronze" ? "basic" : "pro",
      ...commercial,
      subcategory: formData.get("subcategory"),
      description: optionalText(formData.get("descricao")),
      address: optionalText(formData.get("address")),
      neighborhood: optionalText(formData.get("neighborhood")),
      phone: optionalText(formData.get("phone")),
      whatsapp: optionalText(formData.get("whatsapp")),
      instagram: optionalText(formData.get("instagram")),
      instagram_url: optionalText(formData.get("instagram_url")),
      site_url: optionalText(formData.get("site_url")),
      latitude: optionalNumber(formData.get("latitude")),
      longitude: optionalNumber(formData.get("longitude")),
      image_url: optionalText(formData.get("image_url")),
      logo_url: optionalText(formData.get("logo_url")),
      tags: textList(formData.get("tags")),
      enabled_buttons: textList(formData.get("enabled_buttons")),
      important_message: optionalText(formData.get("important_message")),
      whatsapp_message: optionalText(formData.get("whatsapp_message")),
      google_maps_url: optionalText(formData.get("google_maps_url")),
      opening_hours: optionalText(formData.get("opening_hours")),
      business_hours: parseBusinessHours(optionalText(formData.get("business_hours"))),
      is_emergency: formData.get("is_emergency") === "on",
      is_featured: formData.get("is_featured") === "on",
      is_24h: formData.get("is_24h") === "on",
      is_active: formData.get("ativo") === "on",
      notes: optionalText(formData.get("notes")),
    });
  }

  if (entity === "pousadas") {
    const commercial = commercialPayloadFromForm(formData);
    return pousadaSchema.parse({
      nome: formData.get("nome"),
      slug: optionalText(formData.get("slug")) || slugify(String(formData.get("nome") || "")),
      descricao: formData.get("descricao"),
      historia: optionalText(formData.get("historia")),
      categoria: optionalText(formData.get("categoria")) || "Pousada",
      plano: commercial.plan_type === "bronze" ? "basic" : "pro",
      ...commercial,
      localizacao: formData.get("localizacao"),
      endereco: optionalText(formData.get("endereco")),
      mapa_url: optionalText(formData.get("mapa_url")),
      distancia_centro: optionalText(formData.get("distancia_centro")),
      faixa_preco_min: optionalNumber(formData.get("faixa_preco_min")),
      faixa_preco_max: optionalNumber(formData.get("faixa_preco_max")),
      whatsapp: formData.get("whatsapp"),
      telefone: optionalText(formData.get("telefone")),
      instagram: optionalText(formData.get("instagram")),
      instagram_url: optionalText(formData.get("instagram_url")),
      logo_url: optionalText(formData.get("logo_url")),
      hero_image_url: optionalText(formData.get("hero_image_url")),
      imagens_urls: imageList(formData.get("imagens_urls")),
      check_in: optionalText(formData.get("check_in")),
      check_out: optionalText(formData.get("check_out")),
      business_hours: parseBusinessHours(optionalText(formData.get("business_hours"))),
      capacidade: optionalText(formData.get("capacidade")),
      tipos_acomodacao: textList(formData.get("tipos_acomodacao")),
      formas_pagamento: textList(formData.get("formas_pagamento")),
      comodidades: formData.getAll("comodidades").map((item) => String(item).trim()).filter(Boolean),
      diferenciais: formData.getAll("diferenciais").map((item) => String(item).trim()).filter(Boolean),
      diferencial_principal: optionalText(formData.get("diferencial_principal")),
      aceita_reservas: formData.get("aceita_reservas") === "on",
      whatsapp_message: optionalText(formData.get("whatsapp_message")),
      site_url: optionalText(formData.get("site_url")),
      pagina_ativa: formData.get("pagina_ativa") === "on",
      destaque: formData.get("destaque") === "on",
      ativo: formData.get("ativo") === "on",
    });
  }

  const commercial = commercialPayloadFromForm(formData);
  return restauranteSchema.parse({
    nome: formData.get("nome"),
    slug: optionalText(formData.get("slug")) || slugify(String(formData.get("nome") || "")),
    descricao: formData.get("descricao"),
    descricao_completa: optionalText(formData.get("descricao_completa")),
    categoria: formData.get("categoria"),
    plano: commercial.plan_type === "bronze" ? "basic" : "pro",
    ...commercial,
    horario_funcionamento: formData.get("horario_funcionamento"),
    business_hours: parseBusinessHours(optionalText(formData.get("business_hours"))),
    endereco: formData.get("endereco"),
    localizacao_resumida: optionalText(formData.get("localizacao_resumida")),
    mapa_url: optionalText(formData.get("mapa_url")),
    instagram: optionalText(formData.get("instagram")),
    instagram_url: optionalText(formData.get("instagram_url")),
    whatsapp: formData.get("whatsapp"),
    telefone: optionalText(formData.get("telefone")),
    imagem_url: formData.get("imagem_url"),
    logo_url: optionalText(formData.get("logo_url")),
    imagens_urls: imageList(formData.get("imagens_urls")),
    tags: formData.getAll("tags").map((tag) => String(tag).trim()).filter(Boolean),
    formas_pagamento: textList(formData.get("formas_pagamento")),
    diferenciais: formData.getAll("diferenciais").map((item) => String(item).trim()).filter(Boolean),
    especialidades: textList(formData.get("especialidades")),
    prato_recomendado: optionalText(formData.get("prato_recomendado")),
    dica_turista: optionalText(formData.get("dica_turista")),
    cardapio_url: optionalText(formData.get("cardapio_url")),
    faixa_preco: optionalText(formData.get("faixa_preco")),
    whatsapp_message: optionalText(formData.get("whatsapp_message")),
    site_url: optionalText(formData.get("site_url")),
    pagina_ativa: formData.get("pagina_ativa") === "on",
    destaque: formData.get("destaque") === "on",
    ativo: formData.get("ativo") === "on",
  });
}

function enforceCommercialRules(entity: AdminEntity, payload: ReturnType<typeof parsePayload>) {
  if (entity === "pontos_turisticos") return payload;

  const commercialPayload = payload as Exclude<ReturnType<typeof parsePayload>, z.infer<typeof pontoTuristicoSchema>>;
  if (entity === "city_services" && "listing_type" in commercialPayload && commercialPayload.listing_type === "public_service") {
    return commercialPayload;
  }

  const features = getEffectiveFeatures(commercialPayload.plan_type, {
    status: commercialPayload.plan_status,
    customFeatures: commercialPayload.custom_features,
    pageEnabled: "pagina_ativa" in commercialPayload ? commercialPayload.pagina_ativa : undefined,
    bookingEnabled: "aceita_reservas" in commercialPayload ? commercialPayload.aceita_reservas : undefined,
  });
  const photoLimits = getPhotoLimits(
    commercialPayload.plan_type,
    commercialPayload.carousel_photo_limit,
    commercialPayload.gallery_photo_limit,
  );

  return {
    ...commercialPayload,
    carousel_photo_limit: photoLimits.carousel,
    gallery_photo_limit: photoLimits.gallery,
    ...(entity === "city_services"
      ? { is_featured: features.highlighted }
      : { pagina_ativa: features.individualPage, destaque: features.highlighted }),
    professional_photography_included: features.professionalPhotography,
    social_media_promotion_included: features.socialMediaPromotion,
    advanced_report_enabled: features.advancedReport,
    priority_support_enabled: features.prioritySupport,
    seasonal_campaign_enabled: features.seasonalCampaign,
    establishment_story_enabled: features.establishmentStory,
  };
}

function revalidatePublicPages() {
  revalidatePath("/admin");
  revalidatePath("/o-que-fazer");
  revalidatePath("/pousadas");
  revalidatePath("/pousadas/[slug]", "page");
  revalidatePath("/gastronomia");
  revalidatePath("/restaurantes/[slug]", "page");
  revalidatePath("/servicos");
  revalidatePath("/");
}

function attractionCategory(category: string) {
  const normalized = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (["mirante", "natureza", "geoturismo", "ecoturismo", "trilha", "aventura"].includes(normalized)) {
    return normalized;
  }

  return "natureza";
}

function restaurantCategory(category: string) {
  const normalized = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "bar") return "bar";
  if (normalized === "almoco") return "almoço";
  if (normalized === "cafeteria" || normalized === "cafe") return "café";
  if (normalized === "hamburgueria" || normalized === "lanchonete") return "lanchonete";
  return "restaurante";
}

function parsePriceRange(priceRange: string) {
  const values = priceRange.match(/\d+/g)?.map(Number) || [];
  return {
    faixa_preco_min: values[0] || null,
    faixa_preco_max: values[1] || null,
  };
}

function splitLocation(location: string) {
  const [localizacao, ...distanceParts] = location.split(" - ");
  return {
    localizacao: localizacao.trim(),
    distancia_centro: distanceParts.join(" - ").trim() || null,
  };
}

async function insertOrUpdateByName(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: AdminEntity,
  payload: Record<string, unknown>,
) {
  const { data } = await supabase
    .from(table)
    .select("id")
    .eq("nome", payload.nome)
    .maybeSingle();

  if (data?.id) {
    return supabase.from(table).update(payload as never).eq("id", data.id);
  }

  return supabase.from(table).insert(payload as never);
}

export async function saveAdminItem(
  entity: AdminEntity,
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const safeEntity = adminEntitySchema.parse(entity) as AdminEntity;
    const safeId = id ? uuidSchema.parse(id) : null;
    const payload = enforceCommercialRules(safeEntity, parsePayload(safeEntity, formData));

    if (safeEntity === "restaurantes" || safeEntity === "pousadas") {
      const mediaPayload = payload as z.infer<typeof restauranteSchema> | z.infer<typeof pousadaSchema>;
      const features = getEffectiveFeatures(mediaPayload.plan_type, {
        status: mediaPayload.plan_status,
        customFeatures: mediaPayload.custom_features,
        pageEnabled: mediaPayload.pagina_ativa,
      });
      const limits = getPhotoLimits(
        mediaPayload.plan_type,
        mediaPayload.carousel_photo_limit,
        mediaPayload.gallery_photo_limit,
      );
      const submittedImages = uniqueImageList(mediaPayload.imagens_urls);
      let existingImages: string[] = [];

      if (safeId) {
        const { data: currentMedia, error: currentMediaError } = await supabase
          .from(safeEntity)
          .select("imagens_urls")
          .eq("id", safeId)
          .maybeSingle();
        if (currentMediaError) {
          logAdminError("media-plan-check", currentMediaError);
          return { ok: false, message: "NÃ£o foi possÃ­vel validar as fotos atuais antes de salvar." };
        }
        existingImages = uniqueImageList((currentMedia?.imagens_urls as string[] | null) || []);
      }

      const addedImages = submittedImages.filter((image) => !existingImages.includes(image));
      const maximumStoredImages = safeEntity === "pousadas" ? Math.max(1, limits.gallery) : limits.gallery;
      if (addedImages.length && (!features.gallery || submittedImages.length > maximumStoredImages)) {
        return {
          ok: false,
          message: `O plano ${mediaPayload.plan_type} nÃ£o permite adicionar essa quantidade de fotos. Os arquivos existentes foram preservados.`,
        };
      }
    }

    if (safeEntity === "restaurantes" || safeEntity === "pousadas" || safeEntity === "city_services") {
      const slugPayload = payload as
        | z.infer<typeof restauranteSchema>
        | z.infer<typeof pousadaSchema>
        | z.infer<typeof cityServiceSchema>;
      if (slugPayload.slug) {
        let slugQuery = supabase.from(safeEntity).select("id").eq("slug", slugPayload.slug);
        if (safeId) {
          slugQuery = slugQuery.neq("id", safeId);
        }

        const { data: existingSlugs, error: slugError } = await slugQuery.limit(1);
        if (slugError) {
          logAdminError("slug-check", slugError);
          return { ok: false, message: "Não foi possível validar o slug. Tente novamente." };
        }

        if (existingSlugs?.length) {
          return { ok: false, message: "Este slug já está sendo usado por outro cadastro." };
        }
      }
    }

    const selectColumns = safeEntity === "city_services" ? "id,name,is_active" : "id,nome,ativo";
    const query = safeId
      ? supabase.from(safeEntity).update(payload as never).eq("id", safeId).select(selectColumns).single()
      : supabase.from(safeEntity).insert(payload as never).select(selectColumns).single();

    const { data, error } = await query;

    if (error) {
      if (error.message.toLowerCase().includes("could not find the table")) {
        return {
          ok: false,
          message: "As tabelas do Supabase ainda não existem. Rode web/supabase/schema.sql no SQL Editor do Supabase.",
        };
      }

      const errorMessage = error.message.toLowerCase();

      if (
        (errorMessage.includes("column") && errorMessage.includes("does not exist")) ||
        (errorMessage.includes("could not find") && errorMessage.includes("column")) ||
        errorMessage.includes("schema cache")
      ) {
        return {
          ok: false,
          message:
            "Falta atualizar o Supabase. Rode web/supabase/schema.sql no SQL Editor e tente salvar novamente.",
        };
      }

      if (error.message.toLowerCase().includes("row-level security")) {
        return {
          ok: false,
          message: "O Supabase bloqueou a operação por RLS. Rode novamente web/supabase/schema.sql e confirme que você está logado.",
        };
      }

      logAdminError("save", error);
      return { ok: false, message: "Não foi possível salvar. Verifique os dados e tente novamente." };
    }

    if (!data) {
      return {
        ok: false,
        message: "O Supabase não retornou o item salvo. Verifique as políticas RLS de leitura autenticada.",
      };
    }

    revalidatePublicPages();
    const savedName = "nome" in data ? data.nome : data.name;

    return {
      ok: true,
      message: id
        ? `Item atualizado com sucesso: ${savedName}.`
        : `Item cadastrado com sucesso: ${savedName}.`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0]?.message || "Dados inválidos." };
    }

    return { ok: false, message: "Não foi possível salvar. Verifique o Supabase e tente novamente." };
  }
}

export async function deleteAdminItem(
  entity: AdminEntity,
  id: string,
): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const safeEntity = adminEntitySchema.parse(entity) as AdminEntity;
    const safeId = uuidSchema.parse(id);
    const { error } = await supabase.from(safeEntity).delete().eq("id", safeId);

    if (error) {
      logAdminError("gallery-update", error);
      return { ok: false, message: "Não foi possível excluir o item." };
    }

    revalidatePublicPages();
    return { ok: true, message: "Item excluído com sucesso." };
  } catch {
    return { ok: false, message: "Não foi possível excluir o item." };
  }
}

export async function updateAttractionGallery(input: unknown): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const payload = attractionGallerySchema.parse(input);
    const gallery = uniqueImageList(payload.imagens_urls).filter((image) => image !== payload.coverUrl);

    const { data, error } = await supabase
      .from("pontos_turisticos")
      .update({
        imagem_url: payload.coverUrl,
        imagens_urls: gallery,
      })
      .eq("id", payload.attractionId)
      .select("id,nome")
      .single();

    if (error) {
      logAdminError("save", error);
      return { ok: false, message: "Não foi possível atualizar a galeria do roteiro." };
    }

    if (!data) {
      return { ok: false, message: "Roteiro não encontrado para atualizar a galeria." };
    }

    revalidatePublicPages();
    return { ok: true, message: "Galeria do roteiro atualizada com sucesso." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0]?.message || "Dados inválidos." };
    }

    return { ok: false, message: "Não foi possível atualizar a galeria do roteiro." };
  }
}

export async function removeAttractionGalleryImage(input: unknown): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const payload = removeAttractionImageSchema.parse(input);
    const gallery = uniqueImageList(payload.imagens_urls).filter((image) => image !== payload.coverUrl);
    const storagePath = storagePathFromPublicUrl(payload.imageUrl);
    let previousRow: { imagem_url: string; imagens_urls: string[] | null } | null = null;

    if (payload.attractionId) {
      const { data: currentRow, error: currentError } = await supabase
        .from("pontos_turisticos")
        .select("imagem_url,imagens_urls")
        .eq("id", payload.attractionId)
        .single();

      if (currentError || !currentRow) {
        logAdminError("gallery-current", currentError);
        return { ok: false, message: "Não foi possível localizar o roteiro antes de remover a foto." };
      }

      previousRow = currentRow as { imagem_url: string; imagens_urls: string[] | null };

      const { error: updateError } = await supabase
        .from("pontos_turisticos")
        .update({
          imagem_url: payload.coverUrl,
          imagens_urls: gallery,
        })
        .eq("id", payload.attractionId);

      if (updateError) {
        logAdminError("gallery-remove-update", updateError);
        return { ok: false, message: "Não foi possível atualizar o roteiro antes de remover a foto." };
      }
    }

    if (storagePath) {
      const { error: storageError } = await supabase.storage.from("tourism").remove([storagePath]);

      if (storageError) {
        if (payload.attractionId && previousRow) {
          await supabase
            .from("pontos_turisticos")
            .update({
              imagem_url: previousRow.imagem_url,
              imagens_urls: previousRow.imagens_urls || [],
            })
            .eq("id", payload.attractionId);
        }

        logAdminError("gallery-storage-remove", storageError);
        return {
          ok: false,
          message:
            "Não foi possível remover a foto do Supabase Storage. A galeria foi preservada para não quebrar o site.",
        };
      }
    }

    revalidatePublicPages();
    return { ok: true, message: "Foto removida do carrossel com sucesso." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0]?.message || "Dados inválidos." };
    }

    return { ok: false, message: "Não foi possível remover a foto do carrossel." };
  }
}

export async function updateRestaurantGallery(input: unknown): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const payload = restaurantGallerySchema.parse(input);
    const gallery = uniqueImageList(payload.imagens_urls).filter((image) => image !== payload.coverUrl);
    const mediaPolicy = await getMediaPolicy(supabase, "restaurantes", payload.restaurantId);
    if (!mediaPolicy) return { ok: false, message: "NÃ£o foi possÃ­vel validar o plano do restaurante." };
    if (!mediaPolicy.features.gallery || gallery.length > mediaPolicy.limits.gallery) {
      return { ok: false, message: "A galeria excede os recursos ou o limite de fotos do plano atual." };
    }

    const { data, error } = await supabase
      .from("restaurantes")
      .update({
        imagem_url: payload.coverUrl,
        imagens_urls: gallery,
      })
      .eq("id", payload.restaurantId)
      .select("id,nome")
      .single();

    if (error) {
      logAdminError("restaurant-gallery-update", error);
      return { ok: false, message: "Não foi possível atualizar as fotos do restaurante." };
    }

    if (!data) {
      return { ok: false, message: "Restaurante não encontrado para atualizar as fotos." };
    }

    revalidatePublicPages();
    return { ok: true, message: "Fotos do restaurante atualizadas com sucesso." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0]?.message || "Dados inválidos." };
    }

    return { ok: false, message: "Não foi possível atualizar as fotos do restaurante." };
  }
}

export async function removeRestaurantGalleryImage(input: unknown): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const payload = removeRestaurantImageSchema.parse(input);
    const gallery = uniqueImageList(payload.imagens_urls).filter((image) => image !== payload.coverUrl);
    const storagePath = storagePathFromPublicUrl(payload.imageUrl);
    let previousRow: { imagem_url: string; imagens_urls: string[] | null } | null = null;

    if (payload.restaurantId) {
      const { data: currentRow, error: currentError } = await supabase
        .from("restaurantes")
        .select("imagem_url,imagens_urls")
        .eq("id", payload.restaurantId)
        .single();

      if (currentError || !currentRow) {
        logAdminError("restaurant-gallery-current", currentError);
        return { ok: false, message: "Não foi possível localizar o restaurante antes de remover a foto." };
      }

      previousRow = currentRow as { imagem_url: string; imagens_urls: string[] | null };

      const { error: updateError } = await supabase
        .from("restaurantes")
        .update({
          imagem_url: payload.coverUrl,
          imagens_urls: gallery,
        })
        .eq("id", payload.restaurantId);

      if (updateError) {
        logAdminError("restaurant-gallery-remove-update", updateError);
        return { ok: false, message: "Não foi possível atualizar o restaurante antes de remover a foto." };
      }
    }

    if (storagePath) {
      const { error: storageError } = await supabase.storage.from("tourism").remove([storagePath]);

      if (storageError) {
        if (payload.restaurantId && previousRow) {
          await supabase
            .from("restaurantes")
            .update({
              imagem_url: previousRow.imagem_url,
              imagens_urls: previousRow.imagens_urls || [],
            })
            .eq("id", payload.restaurantId);
        }

        logAdminError("restaurant-gallery-storage-remove", storageError);
        return {
          ok: false,
          message:
            "Não foi possível remover a foto do Supabase Storage. As fotos foram preservadas para não quebrar o site.",
        };
      }
    }

    revalidatePublicPages();
    return { ok: true, message: "Foto removida do restaurante com sucesso." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0]?.message || "Dados inválidos." };
    }

    return { ok: false, message: "Não foi possível remover a foto do restaurante." };
  }
}

export async function updateRestaurantAssetImage(input: unknown): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const payload = restaurantAssetSchema.parse(input);
    const storagePath = payload.imageUrl && payload.imageUrl !== payload.nextUrl
      ? storagePathFromPublicUrl(payload.imageUrl)
      : null;
    let previousValue: string | null = null;

    if (payload.restaurantId) {
      const { data: currentRow, error: currentError } = await supabase
        .from("restaurantes")
        .select(payload.field)
        .eq("id", payload.restaurantId)
        .single();

      if (currentError || !currentRow) {
        logAdminError("restaurant-asset-current", currentError);
        return { ok: false, message: "Não foi possível localizar o restaurante antes de atualizar a imagem." };
      }

      previousValue = String((currentRow as Record<string, unknown>)[payload.field] || "") || null;

      const { error: updateError } = await supabase
        .from("restaurantes")
        .update({ [payload.field]: payload.nextUrl })
        .eq("id", payload.restaurantId);

      if (updateError) {
        logAdminError("restaurant-asset-update", updateError);
        return { ok: false, message: "Não foi possível atualizar a imagem do restaurante." };
      }
    }

    if (storagePath) {
      const { error: storageError } = await supabase.storage.from("tourism").remove([storagePath]);

      if (storageError) {
        if (payload.restaurantId) {
          await supabase
            .from("restaurantes")
            .update({ [payload.field]: previousValue })
            .eq("id", payload.restaurantId);
        }

        logAdminError("restaurant-asset-storage-remove", storageError);
        return {
          ok: false,
          message: "Não foi possível remover a imagem antiga do Storage. A alteração foi desfeita.",
        };
      }
    }

    revalidatePublicPages();
    return { ok: true, message: "Imagem do restaurante atualizada com sucesso." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0]?.message || "Dados inválidos." };
    }

    return { ok: false, message: "Não foi possível atualizar a imagem do restaurante." };
  }
}

export async function updateLodgingGallery(input: unknown): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const payload = lodgingGallerySchema.parse(input);
    const gallery = uniqueImageList(payload.imagens_urls);
    const mediaPolicy = await getMediaPolicy(supabase, "pousadas", payload.lodgingId);
    if (!mediaPolicy) return { ok: false, message: "NÃ£o foi possÃ­vel validar o plano da pousada." };
    if (!mediaPolicy.features.gallery || gallery.length > Math.max(1, mediaPolicy.limits.gallery)) {
      return { ok: false, message: "A galeria excede os recursos ou o limite de fotos do plano atual." };
    }

    const { data, error } = await supabase
      .from("pousadas")
      .update({ imagens_urls: gallery })
      .eq("id", payload.lodgingId)
      .select("id,nome")
      .single();

    if (error) {
      logAdminError("lodging-gallery-update", error);
      return { ok: false, message: "Não foi possível atualizar as fotos da pousada." };
    }

    if (!data) {
      return { ok: false, message: "Pousada não encontrada para atualizar as fotos." };
    }

    revalidatePublicPages();
    return { ok: true, message: "Fotos da pousada atualizadas com sucesso." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0]?.message || "Dados inválidos." };
    }

    return { ok: false, message: "Não foi possível atualizar as fotos da pousada." };
  }
}

export async function removeLodgingGalleryImage(input: unknown): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const payload = removeLodgingImageSchema.parse(input);
    const gallery = uniqueImageList(payload.imagens_urls);
    const storagePath = storagePathFromPublicUrl(payload.imageUrl);
    let previousRow: { imagens_urls: string[] | null } | null = null;

    if (payload.lodgingId) {
      const { data: currentRow, error: currentError } = await supabase
        .from("pousadas")
        .select("imagens_urls")
        .eq("id", payload.lodgingId)
        .single();

      if (currentError || !currentRow) {
        logAdminError("lodging-gallery-current", currentError);
        return { ok: false, message: "Não foi possível localizar a pousada antes de remover a foto." };
      }

      previousRow = currentRow as { imagens_urls: string[] | null };

      const { error: updateError } = await supabase
        .from("pousadas")
        .update({ imagens_urls: gallery })
        .eq("id", payload.lodgingId);

      if (updateError) {
        logAdminError("lodging-gallery-remove-update", updateError);
        return { ok: false, message: "Não foi possível atualizar a pousada antes de remover a foto." };
      }
    }

    if (storagePath) {
      const { error: storageError } = await supabase.storage.from("tourism").remove([storagePath]);

      if (storageError) {
        if (payload.lodgingId && previousRow) {
          await supabase
            .from("pousadas")
            .update({ imagens_urls: previousRow.imagens_urls || [] })
            .eq("id", payload.lodgingId);
        }

        logAdminError("lodging-gallery-storage-remove", storageError);
        return {
          ok: false,
          message:
            "Não foi possível remover a foto do Supabase Storage. As fotos foram preservadas para não quebrar o site.",
        };
      }
    }

    revalidatePublicPages();
    return { ok: true, message: "Foto removida da pousada com sucesso." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0]?.message || "Dados inválidos." };
    }

    return { ok: false, message: "Não foi possível remover a foto da pousada." };
  }
}

export async function updateLodgingLogoImage(input: unknown): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const payload = lodgingAssetSchema.parse(input);
    const field = payload.field;
    const label = field === "hero_image_url" ? "imagem principal do Hero" : "logo";
    const storagePath = payload.imageUrl && payload.imageUrl !== payload.nextUrl
      ? storagePathFromPublicUrl(payload.imageUrl)
      : null;
    let previousValue: string | null = null;

    if (payload.lodgingId) {
      const { data: currentRow, error: currentError } = await supabase
        .from("pousadas")
        .select(field)
        .eq("id", payload.lodgingId)
        .single();

      if (currentError || !currentRow) {
        logAdminError("lodging-logo-current", currentError);
        return { ok: false, message: `Não foi possível localizar a pousada antes de atualizar a ${label}.` };
      }

      previousValue = String((currentRow as Record<string, unknown>)[field] || "") || null;

      const { error: updateError } = await supabase
        .from("pousadas")
        .update({ [field]: payload.nextUrl })
        .eq("id", payload.lodgingId);

      if (updateError) {
        logAdminError("lodging-logo-update", updateError);
        return { ok: false, message: `Não foi possível atualizar a ${label} da pousada.` };
      }
    }

    if (storagePath) {
      const { error: storageError } = await supabase.storage.from("tourism").remove([storagePath]);

      if (storageError) {
        if (payload.lodgingId) {
          await supabase.from("pousadas").update({ [field]: previousValue }).eq("id", payload.lodgingId);
        }

        logAdminError("lodging-logo-storage-remove", storageError);
        return {
          ok: false,
          message: `Não foi possível remover a ${label} antiga do Storage. A alteração foi desfeita.`,
        };
      }
    }

    revalidatePublicPages();
    return { ok: true, message: `${label.charAt(0).toUpperCase() + label.slice(1)} da pousada atualizada com sucesso.` };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0]?.message || "Dados inválidos." };
    }

    return { ok: false, message: "Não foi possível atualizar a imagem da pousada." };
  }
}

export async function seedDefaultContent(): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();

    for (const attraction of defaultAttractions) {
      const payload = {
        nome: attraction.name,
        descricao: attraction.description,
        categoria: attractionCategory(attraction.category),
        localizacao: attraction.location,
        imagem_url: attraction.image,
        imagens_urls: [attraction.image, ...(attraction.gallery || [])],
        ativo: true,
      };

      const { error } = await insertOrUpdateByName(supabase, "pontos_turisticos", payload);
      if (error) {
        logAdminError("seed-attractions", error);
        return { ok: false, message: "Não foi possível repor os roteiros padrão." };
      }
    }

    for (const lodging of defaultLodgings) {
      const price = parsePriceRange(lodging.priceRange);
      const location = splitLocation(lodging.location);
      const payload = {
        nome: lodging.name,
        slug: lodging.slug || slugify(lodging.name),
        descricao: lodging.description,
        historia: lodging.story || null,
        categoria: lodging.category || "Pousada",
        localizacao: location.localizacao,
        endereco: lodging.address || location.localizacao,
        mapa_url: lodging.mapUrl || null,
        distancia_centro: location.distancia_centro,
        faixa_preco_min: price.faixa_preco_min,
        faixa_preco_max: price.faixa_preco_max,
        whatsapp: lodging.whatsapp,
        telefone: lodging.phone || null,
        instagram: lodging.instagram || null,
        instagram_url: lodging.instagramUrl || null,
        logo_url: lodging.logo || null,
        hero_image_url: lodging.heroImage || null,
        imagens_urls: [lodging.image, ...lodging.gallery],
        check_in: lodging.checkIn || null,
        check_out: lodging.checkOut || null,
        business_hours: lodging.businessHours || null,
        capacidade: lodging.capacity || null,
        tipos_acomodacao: lodging.accommodationTypes || [],
        formas_pagamento: lodging.paymentMethods || [],
        comodidades: lodging.amenities || [],
        diferenciais: lodging.highlights || [],
        diferencial_principal: lodging.mainDifferential || null,
        aceita_reservas: lodging.acceptsReservations ?? true,
        destaque: Boolean(lodging.isFeatured),
        ativo: true,
      };

      const { error } = await insertOrUpdateByName(supabase, "pousadas", payload);
      if (error) {
        logAdminError("seed-lodgings", error);
        return { ok: false, message: "Não foi possível repor as pousadas padrão." };
      }
    }

    for (const place of defaultFoodPlaces) {
      const payload = {
        nome: place.name,
        slug: place.slug || slugify(place.name),
        descricao: place.description,
        descricao_completa: place.story || null,
        categoria: restaurantCategory(place.category),
        horario_funcionamento: place.hours,
        business_hours: place.businessHours || parseLegacyBusinessHours(place.hours),
        endereco: place.location,
        localizacao_resumida: place.locationLabel || place.location,
        mapa_url: place.mapUrl || null,
        instagram: place.instagram,
        instagram_url: place.instagramUrl || null,
        whatsapp: place.whatsapp,
        telefone: place.phone || null,
        imagem_url: place.image,
        logo_url: place.logo || null,
        imagens_urls: place.galleryImages || [],
        tags: place.tags,
        formas_pagamento: place.paymentMethods || [],
        diferenciais: place.features || [],
        especialidades: place.specialties || [],
        prato_recomendado: place.recommendedDish || null,
        dica_turista: place.firstVisitTip || null,
        cardapio_url: place.menuUrl || null,
        faixa_preco: place.priceRange || null,
        destaque: Boolean(place.isFeatured),
        ativo: true,
      };

      const { error } = await insertOrUpdateByName(supabase, "restaurantes", payload);
      if (error) {
        logAdminError("seed-restaurants", error);
        return { ok: false, message: "Não foi possível repor os restaurantes padrão." };
      }
    }

    revalidatePublicPages();

    return {
      ok: true,
      message: "Dados padrão repostos no Supabase com sucesso.",
    };
  } catch {
    return {
      ok: false,
      message: "Não foi possível repor os dados padrão. Verifique se você está logado.",
    };
  }
}

function sanitizeFileName(name: string) {
  const base = name
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return base || "imagem";
}

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function hasImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (type === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }

  if (type === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  return false;
}

export async function uploadAdminImages(
  entity: AdminEntity,
  formData: FormData,
): Promise<UploadResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const files = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File && file.size > 0);

    if (!files.length) {
      return { ok: false, message: "Selecione ao menos uma imagem.", urls: [] };
    }

    if (files.length > maxUploadFiles) {
      return { ok: false, message: `Envie no máximo ${maxUploadFiles} imagens por vez.`, urls: [] };
    }

    const validatedFiles: Array<{ file: File; safeName: string; extension: string }> = [];
    for (const file of files) {
      if (!allowedImageTypes.includes(file.type)) {
        return { ok: false, message: "Use apenas imagens JPG, PNG ou WebP.", urls: [] };
      }

      if (file.size > maxImageSize) {
        return { ok: false, message: "Cada imagem deve ter no máximo 6 MB.", urls: [] };
      }

      const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      if (!hasImageSignature(file.type, bytes)) {
        return { ok: false, message: "O arquivo enviado não parece ser uma imagem válida.", urls: [] };
      }

      validatedFiles.push({
        file,
        safeName: sanitizeFileName(file.name),
        extension: extensionFromType(file.type),
      });
    }

    const urls: string[] = [];
    const uploadedPaths: string[] = [];

    for (const { file, safeName, extension } of validatedFiles) {
      const path = `${entity}/${Date.now()}-${crypto.randomUUID()}-${safeName}.${extension}`;
      const { error } = await supabase.storage.from("tourism").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });

      if (error) {
        if (uploadedPaths.length) {
          const { error: rollbackError } = await supabase.storage.from("tourism").remove(uploadedPaths);
          if (rollbackError) logAdminError("upload-rollback", rollbackError);
        }

        if (error.message.toLowerCase().includes("bucket not found")) {
          return {
            ok: false,
            message: "O bucket 'tourism' não existe no Supabase. Rode o arquivo web/supabase/schema.sql no SQL Editor.",
            urls: [],
          };
        }

        if (error.message.toLowerCase().includes("row-level security")) {
          return {
            ok: false,
            message: "O Storage bloqueou o upload por RLS. Rode novamente web/supabase/schema.sql para criar as policies.",
            urls: [],
          };
        }

        logAdminError("upload", error);
        return { ok: false, message: "Não foi possível enviar a imagem para o Supabase Storage.", urls: [] };
      }

      uploadedPaths.push(path);
      const { data } = supabase.storage.from("tourism").getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    return {
      ok: true,
      message: `${urls.length} imagem${urls.length === 1 ? "" : "s"} enviada${urls.length === 1 ? "" : "s"} com sucesso.`,
      urls,
    };
  } catch {
    return { ok: false, message: "Não foi possível enviar as imagens.", urls: [] };
  }
}

export async function logoutAction() {
  await assertSameOrigin();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
