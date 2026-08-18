"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { requireAdminSession } from "@/lib/admin-auth";
import { assertSameOriginRequest } from "@/lib/server-request-security";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type RouteLeafletActionResult = {
  ok: boolean;
  message: string;
};

const assetUrlSchema = z
  .string()
  .trim()
  .min(1, "Informe a imagem do panfleto.")
  .max(2_000, "O endereço da imagem é muito longo.")
  .refine(
    (value) =>
      (value.startsWith("/") && !value.startsWith("//")) ||
      value.startsWith("https://"),
    "Use um caminho local iniciado por / ou um endereço HTTPS.",
  );

const optionalAssetUrlSchema = z
  .string()
  .trim()
  .max(2_000, "O endereço do arquivo é muito longo.")
  .refine(
    (value) =>
      !value ||
      (value.startsWith("/") && !value.startsWith("//")) ||
      value.startsWith("https://"),
    "Use um caminho local iniciado por / ou um endereço HTTPS.",
  );

const routeLeafletSchema = z.object({
  image_url: assetUrlSchema,
  alt_text: z
    .string()
    .trim()
    .min(10, "Descreva brevemente o conteúdo do panfleto.")
    .max(220, "O texto alternativo deve ter no máximo 220 caracteres."),
  download_url: optionalAssetUrlSchema,
  is_active: z.boolean(),
});

export async function saveRouteLeafletSettings(
  formData: FormData,
): Promise<RouteLeafletActionResult> {
  try {
    await assertSameOriginRequest();
    const supabase = await createSupabaseServerClient();
    await requireAdminSession(supabase);

    const payload = routeLeafletSchema.parse({
      image_url: String(formData.get("image_url") || ""),
      alt_text: String(formData.get("alt_text") || ""),
      download_url: String(formData.get("download_url") || ""),
      is_active: formData.get("is_active") === "true",
    });

    const { error } = await supabase.from("route_leaflet_settings").upsert(
      {
        id: 1,
        image_url: payload.image_url,
        alt_text: payload.alt_text,
        download_url: payload.download_url || null,
        is_active: payload.is_active,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("could not find the table") ||
        message.includes("schema cache")
      ) {
        return {
          ok: false,
          message:
            "Falta criar a configuração do panfleto. Rode web/supabase/schema.sql no SQL Editor do Supabase.",
        };
      }

      if (message.includes("row-level security")) {
        return {
          ok: false,
          message:
            "O Supabase bloqueou a alteração. Rode web/supabase/schema.sql e confirme que você está logado como administrador.",
        };
      }

      return {
        ok: false,
        message: "Não foi possível salvar a configuração do panfleto.",
      };
    }

    revalidatePath("/admin");
    revalidateTag(PUBLIC_CACHE_TAGS.routeLeaflet);
    revalidatePath("/o-que-fazer");

    return {
      ok: true,
      message: "Configuração do panfleto salva com sucesso.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        message: error.errors[0]?.message || "Revise os dados informados.",
      };
    }

    return {
      ok: false,
      message: "Não foi possível salvar a configuração do panfleto.",
    };
  }
}
