import type { Metadata } from "next";
import { LoginForm } from "@/components/admin-login-form";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { createMetadata } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = createMetadata({
  title: "Login Admin",
  path: "/admin/login",
  description: "Acesso seguro ao painel administrativo do portal turístico.",
});

export default function AdminLoginPage() {
  return (
    <section className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-20">
      <div className="w-full max-w-md">
        <SectionHeader
          eyebrow="Área restrita"
          title="Entrar no painel"
          description="Use o email e senha cadastrados no Supabase Auth."
        />

        <Card className="mt-8">
          <CardContent>
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
