import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { createMetadata } from "@/lib/seo";
import { isSupabaseConfigured, type AdminData } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = createMetadata({
  title: "Painel Admin",
  path: "/admin",
  description:
    "Painel administrativo seguro para cadastrar pontos turísticos, pousadas e restaurantes com Supabase.",
});

export const dynamic = "force-dynamic";

type AdminLoadResult = {
  data: AdminData;
  errors: string[];
};

async function getAdminData(): Promise<AdminLoadResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [pontos, pousadas, restaurantes, bucket] = await Promise.all([
    supabase.from("pontos_turisticos").select("*").order("created_at", { ascending: false }),
    supabase.from("pousadas").select("*").order("created_at", { ascending: false }),
    supabase.from("restaurantes").select("*").order("created_at", { ascending: false }),
    supabase.storage.getBucket("tourism"),
  ]);

  const errors = [
    pontos.error ? `pontos_turisticos: ${pontos.error.message}` : null,
    pousadas.error ? `pousadas: ${pousadas.error.message}` : null,
    restaurantes.error ? `restaurantes: ${restaurantes.error.message}` : null,
    bucket.error ? `bucket tourism: ${bucket.error.message}` : null,
  ].filter(Boolean) as string[];

  return {
    data: {
      pontos_turisticos: pontos.data || [],
      pousadas: pousadas.data || [],
      restaurantes: restaurantes.data || [],
    } as AdminData,
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
            Adicione `NEXT_PUBLIC_SUPABASE_URL` e
            `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local` e na Vercel.
          </CardContent>
        </Card>
      </section>
    );
  }

  const { data: initialData, errors } = await getAdminData();

  return (
    <section className="container py-20">
      <SectionHeader
        
        title="Painel administrativo"
        
      />
      <div className="mt-12">
        {errors.length ? (
          <Card className="mb-8 border-destructive/30 bg-destructive/10">
            <CardContent className="grid gap-3 text-sm text-destructive">
              <p className="font-semibold">Configuração incompleta do Supabase.</p>
              <p>
                Rode `web/supabase/schema.sql` no SQL Editor do Supabase. Depois,
                se quiser restaurar os dados iniciais, rode `web/supabase/seed.sql`
                ou use o botão Repor dados padrão.
              </p>
              <ul className="list-inside list-disc">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
        <AdminDashboard initialData={initialData} />
      </div>
    </section>
  );
}
