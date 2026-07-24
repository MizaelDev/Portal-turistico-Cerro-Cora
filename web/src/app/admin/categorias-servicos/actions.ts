"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { assertSameOriginRequest } from "@/lib/server-request-security";
import { slugifyServiceCategory } from "@/lib/city-service-catalog";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const categorySchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).nullable(),
  icon: z.string().trim().max(80).nullable(),
  accent: z.enum([
    "green",
    "blue",
    "amber",
    "terracotta",
    "teal",
    "olive",
    "wine",
  ]),
  listing_type: z.enum(["public_service", "commercial", "mixed"]),
  parent_id: z.string().uuid().nullable(),
  sort_order: z.number().int().min(0).max(100000),
  is_active: z.boolean(),
});

type ActionFeedback = { type: "success" | "error"; message: string };

async function getAdminClient() {
  await assertSameOriginRequest("Invalid service category origin.");
  const supabase = await createSupabaseServerClient();
  await requireAdminSession(supabase);
  return supabase;
}

function redirectWithFeedback(feedback: ActionFeedback): never {
  const params = new URLSearchParams({
    status: feedback.type,
    message: feedback.message,
  });
  redirect(`/admin/categorias-servicos?${params.toString()}`);
}

export async function saveServiceCategoryAction(
  formData: FormData,
): Promise<void> {
  let feedback: ActionFeedback;

  try {
    const name = String(formData.get("name") || "").trim();
    const parsed = categorySchema.parse({
      id: String(formData.get("id") || "").trim() || null,
      name,
      slug:
        String(formData.get("slug") || "").trim() ||
        slugifyServiceCategory(name),
      description: String(formData.get("description") || "").trim() || null,
      icon: String(formData.get("icon") || "").trim() || null,
      accent: formData.get("accent") || "green",
      listing_type: formData.get("listing_type") || "commercial",
      parent_id: String(formData.get("parent_id") || "").trim() || null,
      sort_order: Number(formData.get("sort_order") || 0),
      is_active: formData.get("is_active") === "on",
    });
    const supabase = await getAdminClient();
    const parent = parsed.parent_id
      ? await supabase
          .from("service_categories")
          .select("slug")
          .eq("id", parsed.parent_id)
          .maybeSingle()
      : { data: null, error: null };

    if (parent.error) {
      feedback = {
        type: "error",
        message: "Não foi possível validar a categoria principal.",
      };
    } else {
      const payload = {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description,
        icon: parsed.icon,
        accent: parsed.accent,
        listing_type: parsed.listing_type,
        parent_id: parsed.parent_id,
        parent_slug: parent.data?.slug || null,
        sort_order: parsed.sort_order,
        is_active: parsed.is_active,
        updated_at: new Date().toISOString(),
      };
      const result = parsed.id
        ? await supabase
            .from("service_categories")
            .update(payload)
            .eq("id", parsed.id)
        : await supabase.from("service_categories").insert(payload);

      feedback = result.error
        ? {
            type: "error",
            message:
              "Não foi possível salvar a categoria. Verifique o slug e tente novamente.",
          }
        : { type: "success", message: "Categoria salva com sucesso." };
    }
  } catch {
    feedback = {
      type: "error",
      message: "Revise os campos informados.",
    };
  }

  revalidatePath("/admin/categorias-servicos");
  revalidatePath("/servicos");
  redirectWithFeedback(feedback);
}

export async function deactivateServiceCategoryAction(
  formData: FormData,
): Promise<void> {
  let feedback: ActionFeedback;

  try {
    const id = z.string().uuid().parse(formData.get("id"));
    const supabase = await getAdminClient();
    const [{ count: children }, { count: mainUsage }, { count: subUsage }] =
      await Promise.all([
        supabase
          .from("service_categories")
          .select("id", { count: "exact", head: true })
          .eq("parent_id", id),
        supabase
          .from("city_services")
          .select("id", { count: "exact", head: true })
          .eq("category_id", id),
        supabase
          .from("city_services")
          .select("id", { count: "exact", head: true })
          .eq("subcategory_id", id),
      ]);

    const inUse = Boolean(children || mainUsage || subUsage);
    const result = inUse
      ? await supabase
          .from("service_categories")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
      : await supabase.from("service_categories").delete().eq("id", id);

    feedback = result.error
      ? { type: "error", message: "Não foi possível alterar a categoria." }
      : {
          type: "success",
          message: inUse
            ? "Categoria em uso desativada com segurança."
            : "Categoria removida.",
        };
  } catch {
    feedback = { type: "error", message: "Categoria inválida." };
  }

  revalidatePath("/admin/categorias-servicos");
  revalidatePath("/servicos");
  redirectWithFeedback(feedback);
}