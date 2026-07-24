import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/admin-auth";
import { createMetadata } from "@/lib/seo";
import {
  isSupabaseConfigured,
  type AdminData,
  type ServiceCategoryRow,
} from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const adminMetadata = createMetadata({
  title: "Painel Admin",
  path: "/admin",
  description:
    "Painel administrativo seguro para gerenciar os conteúdos do portal turístico.",
});

export const metadata: Metadata = {
  ...adminMetadata,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
const adminQueryLimit = 500;

type AdminLoadResult = {
  data: AdminData;
  serviceCategories: ServiceCategoryRow[];
  errors: string[];
};

async function getAdminData(): Promise<AdminLoadResult> {
  const supabase = await createSupabaseServerClient();
  await requireAdminSession(supabase);

  const [pontos, pousadas, restaurantes, cityServices, serviceCategories, bucket] =
    await Promise.all([
      supabase
        .from("pontos_turisticos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(adminQueryLimit),
      supabase
        .from("pousadas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(adminQueryLimit),
      supabase
        .from("restaurantes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(adminQueryLimit),
      supabase
        .from("city_services")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(adminQueryLimit),
      supabase
        .from("service_categories")
        .select("*")
        .order("sort_order")
        .limit(300),
      supabase.storage.getBucket("tourism"),
    ]);

  const errors = [
    pontos.error ? "Não foi possível carregar os pontos turísticos." : null,
    pousadas.error ? "Não foi possível carregar as pousadas." : null,
    restaurantes.error ? "Não foi possível carregar os restaurantes." : null,
    cityServices.error
      ? "Não foi possível carregar os serviços da cidade. Rode web/supabase/city-services-guide.sql."
      : null,
    serviceCategories.error
      ? "As categorias de serviços ainda não foram carregadas. Rode web/supabase/city-services-guide.sql."
      : null,
    bucket.error ? "Não foi possível verificar o bucket de imagens." : null,
  ].filter(Boolean) as string[];

  return {
    data: {
      pontos_turisticos: pontos.data || [],
      pousadas: pousadas.data || [],
      restaurantes: restaurantes.data || [],
      city_services: cityServices.data || [],
    } as AdminData,
    serviceCategories: (serviceCategories.data || []) as ServiceCategoryRow[],
    errors,
  };
}

export default async function AdminPage() {
  if (!isSupabaseConfigured) {
    return (
      <section className="container py-20">
        <SectionHeader
          eyebrow="Configuração"
          title="Supabase não configurado"
          description="Configure as variáveis de ambiente para habilitar o painel administrativo."
        />
        <Card className="mx-auto mt-10 max-w-2xl">
          <CardContent className="text-sm leading-7 text-muted-foreground">
            Adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no
            `.env.local` e na Vercel.
          </CardContent>
        </Card>
      </section>
    );
  }

  const { data: initialData, serviceCategories, errors } = await getAdminData();

  return (
    <section className="container py-20">
      <SectionHeader title="Painel administrativo" />
      <div className="mt-12">
        {errors.length ? (
          <Card className="mb-8 border-destructive/30 bg-destructive/10">
            <CardContent className="grid gap-3 text-sm text-destructive">
              <p className="font-semibold">Alguns dados não foram carregados</p>
              <p>Confira as configurações do Supabase e tente atualizar a página.</p>
              <ul className="list-inside list-disc">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
        <AdminDashboard
          initialData={initialData}
          serviceCategories={serviceCategories}
        />
      </div>
    </section>
  );
}