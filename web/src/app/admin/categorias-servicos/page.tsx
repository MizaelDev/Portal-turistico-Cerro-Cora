import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { saveServiceCategoryAction } from "@/app/admin/categorias-servicos/actions";
import { ServiceCategoryDeleteButton } from "@/components/admin/service-category-delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdminSession } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { ServiceCategoryRow } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Categorias de Serviços",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function CategoryForm({
  category,
  parents,
}: {
  category?: ServiceCategoryRow;
  parents: ServiceCategoryRow[];
}) {
  return (
    <form
      action={saveServiceCategoryAction}
      className="grid gap-4 rounded-lg border border-border bg-card p-4"
    >
      <input type="hidden" name="id" value={category?.id || ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Nome</Label>
          <Input name="name" defaultValue={category?.name || ""} required />
        </div>
        <div className="grid gap-2">
          <Label>Slug</Label>
          <Input
            name="slug"
            defaultValue={category?.slug || ""}
            placeholder="gerado-pelo-nome"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Descrição</Label>
        <Textarea
          name="description"
          defaultValue={category?.description || ""}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="grid gap-2">
          <Label>Categoria principal</Label>
          <select
            name="parent_id"
            defaultValue={category?.parent_id || ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Esta é uma categoria principal</option>
            {parents
              .filter((parent) => parent.id !== category?.id)
              .map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label>Tipo</Label>
          <select
            name="listing_type"
            defaultValue={category?.listing_type || "commercial"}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="mixed">Misto</option>
            <option value="public_service">Serviço público</option>
            <option value="commercial">Comercial</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label>Cor de acento</Label>
          <select
            name="accent"
            defaultValue={category?.accent || "green"}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {["green", "blue", "amber", "terracotta", "teal", "olive", "wine"].map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="grid gap-2">
          <Label>Ordem</Label>
          <Input
            name="sort_order"
            type="number"
            min="0"
            defaultValue={category?.sort_order || 0}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Ícone Lucide</Label>
        <Input
          name="icon"
          defaultValue={category?.icon || ""}
          placeholder="heart-pulse"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={category?.is_active ?? true}
        />
        Categoria ativa
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">
          <Save className="h-4 w-4" /> Salvar
        </Button>
        {category ? <ServiceCategoryDeleteButton /> : null}
      </div>
    </form>
  );
}

export default async function ServiceCategoriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  await requireAdminSession(supabase);
  const [{ data, error }, params] = await Promise.all([
    supabase.from("service_categories").select("*").order("sort_order").limit(300),
    searchParams,
  ]);
  const categories = (data || []) as ServiceCategoryRow[];
  const parents = categories.filter((item) => !item.parent_id && !item.parent_slug);
  const feedbackType = params.status === "success" ? "success" : "error";

  return (
    <section className="container py-14">
      <Button asChild variant="ghost">
        <Link href="/admin">
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>
      </Button>
      <div className="mt-5 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-alpine-wine">
          Serviços da Cidade
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold">
          Categorias e subcategorias
        </h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Cadastre, ordene ou desative opções sem alterar o código. Categorias em
          uso são desativadas em vez de excluídas.
        </p>
      </div>
      {params.message ? (
        <p
          className={`mt-6 rounded-md border p-4 text-sm ${
            feedbackType === "success"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
          role="status"
        >
          {params.message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Rode a migration `supabase/city-services-guide.sql` antes de gerenciar
          categorias.
        </p>
      ) : null}
      <div className="mt-8 grid gap-8">
        <div>
          <h2 className="mb-3 font-display text-2xl font-semibold">
            Nova categoria ou subcategoria
          </h2>
          <CategoryForm parents={parents} />
        </div>
        <div className="grid gap-3">
          <h2 className="font-display text-2xl font-semibold">Itens cadastrados</h2>
          {categories.map((category) => (
            <details key={category.id} className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                {category.parent_id || category.parent_slug ? "↳ " : ""}
                {category.name}
                {!category.is_active ? " · inativa" : ""}
              </summary>
              <div className="border-t border-border p-4">
                <CategoryForm category={category} parents={parents} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}