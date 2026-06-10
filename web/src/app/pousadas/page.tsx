import type { Metadata } from "next";
import { LodgingCard } from "@/components/lodging-card";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicLodgings } from "@/lib/public-content";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Pousadas e Chalés",
  path: "/pousadas",
  description:
    "Pousadas e chalés em Cerro Corá com galeria, descrição, WhatsApp, reserva, localização e faixa de preço.",
});

export const dynamic = "force-dynamic";

export default async function LodgingsPage() {
  const { items: lodgings, error } = await getPublicLodgings();

  return (
    <section className="container py-20">
      <SectionHeader
        eyebrow="Hospedagem"
        title="Pousadas e chalés em Cerro Corá"
        description="Cards com reserva por WhatsApp, galeria, localização e faixa de preço para você planejar sua estadia."
      />

      {error ? (
        <Card className="mt-10 border-destructive/30 bg-destructive/10">
          <CardContent className="text-sm text-destructive">
            Não foi possível carregar as pousadas no momento. Tente novamente em alguns instantes.
          </CardContent>
        </Card>
      ) : null}

      {lodgings.length ? (
        <div className="mt-12 grid gap-8">
          {lodgings.map((lodging) => (
            <LodgingCard key={lodging.name} lodging={lodging} />
          ))}
        </div>
      ) : (
        <Card className="mt-12">
          <CardContent className="text-center text-sm text-muted-foreground">
            Nenhuma pousada ativa foi encontrada.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
