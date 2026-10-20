import type { Metadata } from "next";
import { AnalyticsPreferencesButton } from "@/components/analytics-consent-provider";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Política de privacidade",
  description: "Informações sobre as medições opcionais e o tratamento de dados no Portal de Turismo de Cerro Corá.",
  path: "/politica-de-privacidade",
});

export default function PrivacyPolicyPage() {
  return (
    <section className="container py-16 sm:py-20">
      <article className="mx-auto max-w-3xl text-foreground">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-alpine-wine">Privacidade</p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Política de privacidade</h1>
        <p className="mt-6 leading-8 text-muted-foreground">
          Esta página descreve a implementação técnica atual do portal. Ela não substitui a revisão jurídica nem define, por conta própria, a base legal do tratamento.
        </p>

        <div className="mt-10 grid gap-9 leading-7 text-muted-foreground">
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">Medições opcionais</h2>
            <p className="mt-3">
              As medições ficam desligadas até uma escolha do visitante. Quando autorizadas, podem ser usados Google Analytics, Vercel Web Analytics e métricas próprias do portal.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">Dados técnicos envolvidos</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Página ou estabelecimento acessado e tipo de interação.</li>
              <li>Caminho da página e origem da navegação, sem parâmetros de consulta nas métricas próprias.</li>
              <li>Identificador temporário da sessão, navegador e user-agent.</li>
              <li>Hash pseudônimo do IP, criado no servidor com um segredo privado.</li>
              <li>Informações agregadas de dispositivo, navegador e localização aproximada fornecidas pelos serviços de analytics.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-foreground">Sua escolha</h2>
            <p className="mt-3">
              É possível aceitar, recusar ou alterar a decisão. Ao recusar ou revogar, novas métricas opcionais deixam de ser enviadas e os identificadores de sessão controlados pelo portal são removidos deste navegador.
            </p>
            <AnalyticsPreferencesButton className="mt-4 inline-flex min-h-11 items-center rounded-md border border-border px-4 font-semibold text-foreground hover:bg-accent" />
          </section>
          <section className="rounded-lg border border-alpine-sunset/30 bg-alpine-sunset/10 p-5">
            <h2 className="font-display text-2xl font-semibold text-foreground">Informações institucionais pendentes</h2>
            <p className="mt-3">
              Antes da publicação definitiva desta política, o responsável pelo portal precisa informar e aprovar: identidade e contato do controlador, canal do encarregado, finalidade institucional, base legal, prazo de retenção e procedimento para solicitações dos titulares.
            </p>
          </section>
        </div>
      </article>
    </section>
  );
}
