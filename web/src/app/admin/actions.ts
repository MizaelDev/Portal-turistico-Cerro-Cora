"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  attractions as defaultAttractions,
  foodPlaces as defaultFoodPlaces,
  lodgings as defaultLodgings,
} from "@/lib/data";
import { requireAdminSession } from "@/lib/admin-auth";
import { parseBusinessHours, parseLegacyBusinessHours, type BusinessHours } from "@/lib/business-hours";
import { assertSameOriginRequest } from "@/lib/server-request-security";
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

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const maxImageSize = 6 * 1024 * 1024;
const maxUploadFiles = 5;
const maxGalleryImages = 60;
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
  .max(2048, "A URL da imagem é muito longa.")
  .min(1, "Informe uma imagem.")
  .refine(
    isSafeImagePathOrUrl,
    "Use uma imagem local iniciada com / ou uma URL HTTPS permitida.",
  );

const optionalUrl = z
  .string()
  .trim()
  .max(2048, "A URL é muito longa.")
  .nullable()
  .refine(
    (value) => !value || isHttpsUrl(value),
    "Use uma URL HTTPS válida.",
  );

const optionalPathOrUrl = z
  .string()
  .trim()
  .max(2048, "A URL da imagem é muito longa.")
  .nullable()
  .refine(
    (value) => !value || isSafeImagePathOrUrl(value),
    "Use uma imagem local iniciada com / ou uma URL HTTPS permitida.",
  );

const slugSchema = z
  .string()
  .trim()
  .max(180, "O slug deve ter no máximo 180 caracteres.")
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
  .max(15, "Informe um WhatsApp válido, com no máximo 15 dígitos.")
  .regex(/^\d+$/, "Use apenas números no WhatsApp.");
const requiredText = (minimum: number, maximum: number, message: string) =>
  z.string().trim().min(minimum, message).max(maximum, "O texto excede o limite permitido.");
const optionalTextSchema = (maximum: number) =>
  z.string().trim().max(maximum, "O texto excede o limite permitido.").nullable();
const textListSchema = (maximumItems = 60, maximumLength = 120) =>
  z
    .array(z.string().trim().min(1).max(maximumLength))
    .max(maximumItems, "A lista excede o limite de itens permitido.");
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
  .strict()
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
    days: z
      .object({
        monday: businessDaySchema.optional(),
        tuesday: businessDaySchema.optional(),
        wednesday: businessDaySchema.optional(),
        thursday: businessDaySchema.optional(),
        friday: businessDaySchema.optional(),
        saturday: businessDaySchema.optional(),
        sunday: businessDaySchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .nullable();

const pontoTuristicoSchema = z.object({
  nome: requiredText(2, 160, "Informe o nome."),
  descricao: requiredText(10, 5000, "Informe uma descrição mais completa."),
  categoria: z.enum(["mirante", "natureza", "geoturismo", "ecoturismo", "trilha", "aventura"]),
  info_url: optionalUrl,
  localizacao: requiredText(2, 300, "Informe a localização."),
  imagem_url: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).max(maxGalleryImages).default([]),
  ativo: z.boolean(),
});

const pousadaSchema = z.object({
  nome: requiredText(2, 160, "Informe o nome."),
  slug: slugSchema,
  descricao: requiredText(10, 5000, "Informe uma descrição mais completa."),
  historia: optionalTextSchema(10000),
  categoria: optionalTextSchema(100),
  gallery_enabled: z.boolean(),
  carousel_enabled: z.boolean(),
  featured_order: z.number().int().min(0).nullable(),
  localizacao: requiredText(2, 300, "Informe a localização."),
  endereco: optionalTextSchema(300),
  mapa_url: optionalGoogleMapsUrl,
  distancia_centro: optionalTextSchema(120),
  faixa_preco_min: z.number().min(0).max(1000000).nullable(),
  faixa_preco_max: z.number().min(0).max(1000000).nullable(),
  whatsapp: whatsappSchema,
  telefone: optionalTextSchema(30),
  instagram: optionalTextSchema(120),
  instagram_url: optionalInstagramUrl,
  logo_url: optionalPathOrUrl,
  hero_image_url: optionalPathOrUrl,
  imagens_urls: z.array(pathOrUrl).max(maxGalleryImages).default([]),
  check_in: optionalTextSchema(20),
  check_out: optionalTextSchema(20),
  business_hours: businessHoursSchema,
  capacidade: optionalTextSchema(120),
  tipos_acomodacao: textListSchema(30).default([]),
  formas_pagamento: textListSchema(30).default([]),
  comodidades: textListSchema(60).default([]),
  diferenciais: textListSchema(60).default([]),
  diferencial_principal: optionalTextSchema(300),
  aceita_reservas: z.boolean(),
  whatsapp_message: optionalTextSchema(800),
  site_url: optionalUrl,
  ativo: z.boolean(),
});

const restauranteSchema = z.object({
  nome: requiredText(2, 160, "Informe o nome."),
  slug: slugSchema,
  descricao: requiredText(10, 5000, "Informe uma descrição mais completa."),
  descricao_completa: optionalTextSchema(10000),
  categoria: z.enum(["restaurante", "almoço", "bar", "café", "lanchonete"]),
  gallery_enabled: z.boolean(),
  carousel_enabled: z.boolean(),
  featured_order: z.number().int().min(0).nullable(),
  horario_funcionamento: requiredText(2, 500, "Informe o horário."),
  business_hours: businessHoursSchema,
  endereco: requiredText(2, 300, "Informe o endereço."),
  localizacao_resumida: optionalTextSchema(160),
  mapa_url: optionalGoogleMapsUrl,
  instagram: optionalTextSchema(120),
  instagram_url: optionalInstagramUrl,
  whatsapp: whatsappSchema,
  telefone: optionalTextSchema(30),
  imagem_url: pathOrUrl,
  logo_url: optionalPathOrUrl,
  imagens_urls: z.array(pathOrUrl).max(maxGalleryImages).default([]),
  tags: textListSchema(30).default([]),
  formas_pagamento: textListSchema(30).default([]),
  diferenciais: textListSchema(60).default([]),
  especialidades: textListSchema(60).default([]),
  prato_recomendado: optionalTextSchema(500),
  dica_turista: optionalTextSchema(1000),
  cardapio_url: optionalUrl,
  faixa_preco: z.enum(["R$", "R$$", "R$$$"]).nullable(),
  whatsapp_message: optionalTextSchema(800),
  site_url: optionalUrl,
  ativo: z.boolean(),
});

const cityServiceSchema = z.object({
  name: requiredText(2, 160, "Informe o nome do serviço."),
  slug: slugSchema,
  category: requiredText(2, 100, "Informe a categoria."),
  category_id: z.string().uuid().nullable(),
  listing_type: z.enum(["public_service", "commercial"]).default("commercial"),
  featured_order: z.number().int().min(0).nullable(),
  subcategory: requiredText(2, 100, "Informe o tipo de serviço."),
  subcategory_id: z.string().uuid().nullable(),
  short_description: optionalTextSchema(500),
  full_description: optionalTextSchema(8000),
  services_offered: textListSchema(60).default([]),
  special_status: optionalTextSchema(160),
  description: optionalTextSchema(5000),
  address: optionalTextSchema(300),
  neighborhood: optionalTextSchema(120),
  phone: optionalTextSchema(30),
  whatsapp: z
    .string()
    .trim()
    .nullable()
    .refine((value) => !value || /^\d{10,15}$/.test(value), "Use apenas números no WhatsApp, com DDD."),
  google_maps_url: optionalGoogleMapsUrl,
  instagram: optionalTextSchema(120),
  instagram_url: optionalInstagramUrl,
  site_url: optionalUrl,
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  image_url: optionalPathOrUrl,
  photo_url: optionalPathOrUrl,
  logo_url: optionalPathOrUrl,
  image_type: z.enum(["photo", "logo", "auto"]).default("auto"),
  alt_text: optionalTextSchema(240),
  details_enabled: z.boolean(),
  gallery_enabled: z.boolean(),
  gallery_urls: z.array(pathOrUrl).max(maxGalleryImages).default([]),
  is_published: z.boolean(),
  sort_order: z.number().int().min(0).nullable(),
  last_confirmed_at: z.string().trim().max(40).nullable(),
  public_notice: optionalTextSchema(1000),
  tags: textListSchema(30).default([]),
  enabled_buttons: textListSchema(20, 60).default([]),
  important_message: optionalTextSchema(1000),
  whatsapp_message: optionalTextSchema(800),
  opening_hours: optionalTextSchema(500),
  business_hours: businessHoursSchema,
  is_emergency: z.boolean(),
  is_featured: z.boolean(),
  is_24h: z.boolean(),
  is_active: z.boolean(),
  notes: optionalTextSchema(2000),
});

const attractionGallerySchema = z.object({
  attractionId: z.string().uuid("Roteiro inválido."),
  coverUrl: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).max(maxGalleryImages).default([]),
});

const removeAttractionImageSchema = z.object({
  attractionId: z.string().uuid("Roteiro inválido.").nullable().optional(),
  imageUrl: pathOrUrl,
  coverUrl: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).max(maxGalleryImages).default([]),
});

const restaurantGallerySchema = z.object({
  restaurantId: z.string().uuid("Restaurante inválido."),
  coverUrl: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).max(maxGalleryImages).default([]),
});

const removeRestaurantImageSchema = z.object({
  restaurantId: z.string().uuid("Restaurante inválido.").nullable().optional(),
  imageUrl: pathOrUrl,
  coverUrl: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).max(maxGalleryImages).default([]),
});

const restaurantAssetSchema = z.object({
  restaurantId: z.string().uuid("Restaurante inválido.").nullable().optional(),
  field: z.enum(["logo_url", "imagem_url"]),
  imageUrl: pathOrUrl.nullable(),
  nextUrl: optionalPathOrUrl,
});

const cityServiceAssetSchema = z.object({
  serviceId: z.string().uuid("Serviço inválido.").nullable().optional(),
  field: z.enum(["photo_url", "logo_url"]),
  imageUrl: pathOrUrl.nullable(),
  nextUrl: optionalPathOrUrl,
});

const removeCityServiceImageSchema = z.object({
  serviceId: z.string().uuid("Serviço inválido.").nullable().optional(),
  imageUrl: pathOrUrl,
  gallery_urls: z.array(pathOrUrl).max(maxGalleryImages).default([]),
});

const lodgingGallerySchema = z.object({
  lodgingId: z.string().uuid("Pousada inválida."),
  imagens_urls: z.array(pathOrUrl).max(maxGalleryImages).default([]),
});

const removeLodgingImageSchema = z.object({
  lodgingId: z.string().uuid("Pousada inválida.").nullable().optional(),
  imageUrl: pathOrUrl,
  imagens_urls: z.array(pathOrUrl).max(maxGalleryImages).default([]),
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
  return assertSameOriginRequest("Invalid server action origin.");
}

function contentSettingsFromForm(formData: FormData) {
  return {
    gallery_enabled: formData.get("gallery_enabled") === "on",
    carousel_enabled: formData.get("carousel_enabled") === "on",
    featured_order: optionalNumber(formData.get("featured_order")),
  };
}

function parsePayload(entity: AdminEntity, formData: FormData) {
  if (entity === "pontos_turisticos") {
    return pontoTuristicoSchema.parse({
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
      categoria: formData.get("categoria"),
      info_url: optionalText(formData.get("info_url")),
      localizacao: formData.get("localizacao"),
      imagem_url: formData.get("imagem_url"),
      imagens_urls: imageList(formData.get("imagens_urls")),
      ativo: formData.get("ativo") === "on",
    });
  }

  if (entity === "city_services") {
    const name = String(formData.get("nome") || "");

    return cityServiceSchema.parse({
      name,
      slug: optionalText(formData.get("slug")) || slugify(name),
      category: formData.get("categoria"),
      category_id: optionalText(formData.get("category_id")),
      listing_type: formData.get("listing_type") || "commercial",
      featured_order: optionalNumber(formData.get("featured_order")),
      subcategory: formData.get("subcategory"),
      subcategory_id: optionalText(formData.get("subcategory_id")),
      short_description: optionalText(formData.get("descricao")),
      full_description: optionalText(formData.get("full_description")),
      services_offered: textList(formData.get("services_offered")),
      special_status: optionalText(formData.get("special_status")),
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
      photo_url: optionalText(formData.get("photo_url")) || optionalText(formData.get("image_url")),
      logo_url: optionalText(formData.get("logo_url")),
      image_type: formData.get("image_type") || "auto",
      alt_text: optionalText(formData.get("alt_text")),
      details_enabled: formData.get("details_enabled") === "on",
      gallery_enabled: formData.get("gallery_enabled") === "on",
      gallery_urls: imageList(formData.get("gallery_urls")),
      is_published: formData.get("is_published") === "on",
      sort_order: optionalNumber(formData.get("sort_order")),
      last_confirmed_at: optionalText(formData.get("last_confirmed_at")),
      public_notice: optionalText(formData.get("public_notice")),
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
    return pousadaSchema.parse({
      nome: formData.get("nome"),
      slug: optionalText(formData.get("slug")) || slugify(String(formData.get("nome") || "")),
      descricao: formData.get("descricao"),
      historia: optionalText(formData.get("historia")),
      categoria: optionalText(formData.get("categoria")) || "Pousada",
      ...contentSettingsFromForm(formData),
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
      ativo: formData.get("ativo") === "on",
    });
  }

  return restauranteSchema.parse({
    nome: formData.get("nome"),
    slug: optionalText(formData.get("slug")) || slugify(String(formData.get("nome") || "")),
    descricao: formData.get("descricao"),
    descricao_completa: optionalText(formData.get("descricao_completa")),
    categoria: formData.get("categoria"),
    ...contentSettingsFromForm(formData),
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
    ativo: formData.get("ativo") === "on",
  });
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
    const payload = parsePayload(safeEntity, formData);

    if (safeEntity === "restaurantes" || safeEntity === "pousadas") {
      const mediaPayload = payload as z.infer<typeof restauranteSchema> | z.infer<typeof pousadaSchema>;
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
      if (addedImages.length && submittedImages.length > maxGalleryImages) {
        return {
          ok: false,
          message: `O limite tecnico e de ${maxGalleryImages} fotos por estabelecimento. Os arquivos existentes foram preservados.`,
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
          message: safeEntity === "city_services"
            ? "Falta atualizar os Serviços da Cidade. Rode web/supabase/city-services-guide.sql no SQL Editor e tente salvar novamente."
            : "Falta atualizar o Supabase. Rode web/supabase/schema.sql no SQL Editor e tente salvar novamente.",
        };
      }

      if (error.message.toLowerCase().includes("row-level security")) {
        return {
          ok: false,
          message: safeEntity === "city_services"
            ? "O Supabase bloqueou Serviços da Cidade por RLS. Rode web/supabase/city-services-guide.sql e confirme que seu usuário está autorizado como administrador."
            : "O Supabase bloqueou a operação por RLS. Rode novamente web/supabase/schema.sql e confirme que você está logado.",
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
    if (gallery.length > maxGalleryImages) {
      return { ok: false, message: `A galeria pode ter no maximo ${maxGalleryImages} fotos.` };
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

export async function updateCityServiceAssetImage(input: unknown): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const payload = cityServiceAssetSchema.parse(input);
    const storagePath =
      payload.imageUrl && payload.imageUrl !== payload.nextUrl
        ? storagePathFromPublicUrl(payload.imageUrl)
        : null;
    let previousValue: string | null = null;

    if (payload.serviceId) {
      const { data: currentRow, error: currentError } = await supabase
        .from("city_services")
        .select(payload.field)
        .eq("id", payload.serviceId)
        .single();

      if (currentError || !currentRow) {
        logAdminError("city-service-asset-current", currentError);
        return { ok: false, message: "Não foi possível localizar o serviço antes de alterar a imagem." };
      }

      const currentAsset = currentRow as { photo_url?: string | null; logo_url?: string | null };
      previousValue = String(currentAsset[payload.field] || "") || null;
      const updatePayload =
        payload.field === "photo_url"
          ? { photo_url: payload.nextUrl, image_url: payload.nextUrl }
          : { logo_url: payload.nextUrl };
      const { error: updateError } = await supabase
        .from("city_services")
        .update(updatePayload)
        .eq("id", payload.serviceId);

      if (updateError) {
        logAdminError("city-service-asset-update", updateError);
        return { ok: false, message: "Não foi possível atualizar a imagem do serviço." };
      }
    }

    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from("tourism")
        .remove([storagePath]);

      if (storageError) {
        if (payload.serviceId) {
          const rollbackPayload =
            payload.field === "photo_url"
              ? { photo_url: previousValue, image_url: previousValue }
              : { logo_url: previousValue };
          await supabase
            .from("city_services")
            .update(rollbackPayload)
            .eq("id", payload.serviceId);
        }
        logAdminError("city-service-asset-storage-remove", storageError);
        return {
          ok: false,
          message: "Não foi possível remover a imagem antiga do Storage. A alteração foi desfeita.",
        };
      }
    }

    revalidatePath("/admin");
    revalidatePath("/servicos");
    return { ok: true, message: "Imagem do serviço atualizada com sucesso." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0]?.message || "Dados inválidos." };
    }
    return { ok: false, message: "Não foi possível atualizar a imagem do serviço." };
  }
}

export async function removeCityServiceGalleryImage(input: unknown): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const payload = removeCityServiceImageSchema.parse(input);
    const gallery = uniqueImageList(payload.gallery_urls);
    const storagePath = storagePathFromPublicUrl(payload.imageUrl);
    let previousGallery: string[] = [];

    if (payload.serviceId) {
      const { data: currentRow, error: currentError } = await supabase
        .from("city_services")
        .select("gallery_urls")
        .eq("id", payload.serviceId)
        .single();
      if (currentError || !currentRow) {
        logAdminError("city-service-gallery-current", currentError);
        return { ok: false, message: "Não foi possível localizar o serviço antes de remover a foto." };
      }
      previousGallery = (currentRow.gallery_urls || []) as string[];
      const { error: updateError } = await supabase
        .from("city_services")
        .update({ gallery_urls: gallery, gallery_enabled: gallery.length > 0 })
        .eq("id", payload.serviceId);
      if (updateError) {
        logAdminError("city-service-gallery-update", updateError);
        return { ok: false, message: "Não foi possível atualizar a galeria do serviço." };
      }
    }

    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from("tourism")
        .remove([storagePath]);
      if (storageError) {
        if (payload.serviceId) {
          await supabase
            .from("city_services")
            .update({ gallery_urls: previousGallery, gallery_enabled: previousGallery.length > 0 })
            .eq("id", payload.serviceId);
        }
        logAdminError("city-service-gallery-storage-remove", storageError);
        return {
          ok: false,
          message: "Não foi possível remover a foto do Storage. A galeria foi preservada.",
        };
      }
    }

    revalidatePath("/admin");
    revalidatePath("/servicos");
    return { ok: true, message: "Foto removida da galeria do serviço." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.errors[0]?.message || "Dados inválidos." };
    }
    return { ok: false, message: "Não foi possível remover a foto da galeria." };
  }
}

export async function updateLodgingGallery(input: unknown): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const supabase = await requireAdmin();
    const payload = lodgingGallerySchema.parse(input);
    const gallery = uniqueImageList(payload.imagens_urls);
    if (gallery.length > maxGalleryImages) {
      return { ok: false, message: `A galeria pode ter no maximo ${maxGalleryImages} fotos.` };
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
        info_url: attraction.infoUrl || null,
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
