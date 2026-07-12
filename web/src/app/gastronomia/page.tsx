import type { Metadata } from "next";
import { GastronomyDirectory } from "@/components/gastronomy-directory";
import { JsonLd } from "@/components/json-ld";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicFoodPlaces } from "@/lib/public-content";
import { createMetadata, restaurantsSchema } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Gastronomia",
  path: "/gastronomia",
  description:
    "Restaurantes, cafés, bares e lanchonetes em Cerro Corá com horário, WhatsApp, Instagram e localização.",
});

export const revalidate = 300;

export default async function GastronomyPage() {
  const { items: foodPlaces, error } = await getPublicFoodPlaces();

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-11 sm:px-6 md:pb-20 md:pt-14 lg:px-8">
      {foodPlaces.length ? <JsonLd data={restaurantsSchema(foodPlaces)} /> : null}

      <SectionHeader
        eyebrow="Gastronomia"
        as="h1"
        title="Onde comer em Cerro Corá"
        description="Restaurantes, cafés, bares e lanchonetes com horário, contato e localização."
        className="max-w-2xl [&>p]:mt-3 [&>p]:leading-7"
      />

      {error ? (
        <Card className="mt-10 border-destructive/30 bg-destructive/10">
          <CardContent className="text-sm text-destructive">
            Não foi possível carregar os estabelecimentos no momento. Tente novamente em alguns instantes.
          </CardContent>
        </Card>
      ) : null}

      {foodPlaces.length ? (
        <GastronomyDirectory places={foodPlaces} />
      ) : (
        <Card className="mt-12">
          <CardContent className="text-center text-sm text-muted-foreground">
            Nenhum estabelecimento ativo foi encontrado.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
