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

const pathOrUrl = z
  .string()
  .trim()
  .min(1, "Informe uma imagem.")
  .refine(
    (value) => value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://"),
    "Use uma URL completa ou um caminho iniciado com /.",
  );

const optionalUrl = z
  .string()
  .trim()
  .nullable()
  .refine(
    (value) => !value || value.startsWith("http://") || value.startsWith("https://"),
    "Use uma URL iniciada com http:// ou https://.",
  );

const optionalPathOrUrl = z
  .string()
  .trim()
  .nullable()
  .refine(
    (value) => !value || value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://"),
    "Use uma URL completa ou um caminho iniciado com /.",
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
  descricao: z.string().trim().min(10, "Informe uma descrição mais completa."),
  localizacao: z.string().trim().min(2, "Informe a localização."),
  distancia_centro: z.string().trim().nullable(),
  faixa_preco_min: z.number().nullable(),
  faixa_preco_max: z.number().nullable(),
  whatsapp: whatsappSchema,
  imagens_urls: z.array(pathOrUrl).min(1, "Informe ao menos uma imagem."),
  ativo: z.boolean(),
});

const restauranteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome."),
  slug: slugSchema,
  descricao: z.string().trim().min(10, "Informe uma descrição mais completa."),
  descricao_completa: z.string().trim().nullable(),
  categoria: z.enum(["restaurante", "almoço", "bar", "café", "lanchonete"]),
  horario_funcionamento: z.string().trim().min(2, "Informe o horário."),
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
  destaque: z.boolean(),
  ativo: z.boolean(),
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
  const headersList = await headers();
  const origin = headersList.get("origin");
  const host = headersList.get("host");

  if (!origin || !host) return;

  const allowedOrigins = new Set(
    [`https://${host}`, `http://${host}`, process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean),
  );

  if (!allowedOrigins.has(origin)) {
    throw new Error("Invalid server action origin.");
  }
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

  if (entity === "pousadas") {
    return pousadaSchema.parse({
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
      localizacao: formData.get("localizacao"),
      distancia_centro: optionalText(formData.get("distancia_centro")),
      faixa_preco_min: optionalNumber(formData.get("faixa_preco_min")),
      faixa_preco_max: optionalNumber(formData.get("faixa_preco_max")),
      whatsapp: formData.get("whatsapp"),
      imagens_urls: imageList(formData.get("imagens_urls")),
      ativo: formData.get("ativo") === "on",
    });
  }

  return restauranteSchema.parse({
    nome: formData.get("nome"),
    slug: optionalText(formData.get("slug")) || slugify(String(formData.get("nome") || "")),
    descricao: formData.get("descricao"),
    descricao_completa: optionalText(formData.get("descricao_completa")),
    categoria: formData.get("categoria"),
    horario_funcionamento: formData.get("horario_funcionamento"),
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
    destaque: formData.get("destaque") === "on",
    ativo: formData.get("ativo") === "on",
  });
}

function revalidatePublicPages() {
  revalidatePath("/admin");
  revalidatePath("/o-que-fazer");
  revalidatePath("/pousadas");
  revalidatePath("/gastronomia");
  revalidatePath("/restaurantes/[slug]", "page");
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
    const payload = parsePayload(entity, formData);

    if (entity === "restaurantes") {
      const restaurantPayload = payload as z.infer<typeof restauranteSchema>;
      if (restaurantPayload.slug) {
        let slugQuery = supabase.from("restaurantes").select("id").eq("slug", restaurantPayload.slug);
        if (id) {
          slugQuery = slugQuery.neq("id", id);
        }

        const { data: existingSlug, error: slugError } = await slugQuery.maybeSingle();
        if (slugError) {
          logAdminError("slug-check", slugError);
          return { ok: false, message: "Não foi possível validar o slug. Tente novamente." };
        }

        if (existingSlug) {
          return { ok: false, message: "Este slug já está sendo usado por outro restaurante." };
        }
      }
    }

    const query = id
      ? supabase.from(entity).update(payload as never).eq("id", id).select("id,nome,ativo").single()
      : supabase.from(entity).insert(payload as never).select("id,nome,ativo").single();

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

      logAdminError("delete", error);
      return { ok: false, message: "Não foi possível salvar. Verifique os dados e tente novamente." };
    }

    if (!data) {
      return {
        ok: false,
        message: "O Supabase não retornou o item salvo. Verifique as políticas RLS de leitura autenticada.",
      };
    }

    revalidatePublicPages();
    return {
      ok: true,
      message: id
        ? `Item atualizado com sucesso: ${data.nome}.`
        : `Item cadastrado com sucesso: ${data.nome}.`,
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
    const { error } = await supabase.from(entity).delete().eq("id", id);

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
        descricao: lodging.description,
        localizacao: location.localizacao,
        distancia_centro: location.distancia_centro,
        faixa_preco_min: price.faixa_preco_min,
        faixa_preco_max: price.faixa_preco_max,
        whatsapp: lodging.whatsapp,
        imagens_urls: [lodging.image, ...lodging.gallery],
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

    const urls: string[] = [];

    for (const file of files) {
      if (!allowedImageTypes.includes(file.type)) {
        return { ok: false, message: "Use apenas imagens JPG, PNG ou WebP.", urls };
      }

      if (file.size > maxImageSize) {
        return { ok: false, message: "Cada imagem deve ter no máximo 6 MB.", urls };
      }

      const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      if (!hasImageSignature(file.type, bytes)) {
        return { ok: false, message: "O arquivo enviado não parece ser uma imagem válida.", urls };
      }

      const safeName = sanitizeFileName(file.name);
      const extension = extensionFromType(file.type);
      const path = `${entity}/${Date.now()}-${crypto.randomUUID()}-${safeName}.${extension}`;
      const { error } = await supabase.storage.from("tourism").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });

      if (error) {
        if (error.message.toLowerCase().includes("bucket not found")) {
          return {
            ok: false,
            message: "O bucket 'tourism' não existe no Supabase. Rode o arquivo web/supabase/schema.sql no SQL Editor.",
            urls,
          };
        }

        if (error.message.toLowerCase().includes("row-level security")) {
          return {
            ok: false,
            message: "O Storage bloqueou o upload por RLS. Rode novamente web/supabase/schema.sql para criar as policies.",
            urls,
          };
        }

        logAdminError("upload", error);
        return { ok: false, message: "Não foi possível enviar a imagem para o Supabase Storage.", urls };
      }

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
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
