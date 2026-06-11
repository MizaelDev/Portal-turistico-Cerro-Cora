import type { Metadata } from "next";
import { LoginForm } from "@/components/admin-login-form";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { createMetadata } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/supabase";

const loginMetadata = createMetadata({
  title: "Login Admin",
  path: "/admin/login",
  description: "Acesso seguro ao painel administrativo do portal turístico.",
});

export const metadata: Metadata = {
  ...loginMetadata,
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ unauthorized?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-20">
      <div className="w-full max-w-md">
        <SectionHeader
          eyebrow="Área restrita"
          title="Painel administrativo"
          description=""
        />

        <Card className="mt-8">
          <CardContent>
            {params.unauthorized ? (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                Este usuário não tem permissão de administrador.
              </div>
            ) : null}
            {isSupabaseConfigured ? (
              <LoginForm />
            ) : (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                Configure `NEXT_PUBLIC_SUPABASE_URL` e
                `NEXT_PUBLIC_SUPABASE_ANON_KEY` para habilitar o login.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
