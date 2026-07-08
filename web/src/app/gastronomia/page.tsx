import type { Metadata } from "next";
import { FoodCard } from "@/components/food-card";
import { JsonLd } from "@/components/json-ld";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicFoodPlaces } from "@/lib/public-content";
import { createMetadata, restaurantsSchema } from "@/lib/seo";
import type { FoodPlace } from "@/lib/data";

export const metadata: Metadata = createMetadata({
  title: "Gastronomia",
  path: "/gastronomia",
  description:
    "Restaurantes, cafés, bares e lanchonetes em Cerro Corá com horário, WhatsApp, Instagram e localização.",
});

export const revalidate = 300;

const foodFilters = [
  {
    title: "Restaurantes",
    description: "Casas com refeições completas, pratos regionais, almoço ou jantar.",
    matches: (place: FoodPlace) => place.category === "Restaurante",
  },
  {
    title: "Almoço",
    description: "Locais com foco em almoço, comida regional e refeições completas durante o dia.",
    matches: (place: FoodPlace) => place.category === "Almoço" || place.tags.includes("Almoço"),
  },
  {
    title: "Cafés e sobremesas",
    description: "Cafeterias, açaí, doces, chocolate quente e paradas rápidas.",
    matches: (place: FoodPlace) =>
      place.category === "Cafeteria" ||
      place.tags.some((tag) => ["Café", "Sobremesas", "Açai", "Açaí", "Chocolate quente"].includes(tag)),
  },
  {
    title: "Bares e petiscos",
    description: "Opções para petiscos, bebidas e encontros à noite.",
    matches: (place: FoodPlace) =>
      place.category === "Bar" || place.tags.some((tag) => ["Bar", "Petiscos", "Espetinho"].includes(tag)),
  },
  {
    title: "Lanchonetes",
    description: "Lanches rápidos, sanduíches, hambúrgueres e opções de delivery.",
    matches: (place: FoodPlace) =>
      place.category === "Lanchonete" ||
      place.tags.some((tag) => ["Hambúrguer", "Lanches", "Delivery"].includes(tag)),
  },
  {
    title: "Pizzas",
    description: "Locais que servem pizza, mesmo quando também funcionam como restaurante.",
    matches: (place: FoodPlace) => place.tags.includes("Pizza"),
  },
];

export default async function GastronomyPage() {
  const { items: foodPlaces, error } = await getPublicFoodPlaces();

  return (
    <section className="container py-20">
      {foodPlaces.length ? <JsonLd data={restaurantsSchema(foodPlaces)} /> : null}

      <SectionHeader
        eyebrow="Gastronomia"
        as="h1"
        title="Onde comer em Cerro Corá"
        description="Restaurantes, cafés, bares e lanchonetes com horário, contato e localização."
      />

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {["Restaurante", "Café", "Bar", "Lanchonete", "Pizza", "Petiscos", "Almoço"].map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      {error ? (
        <Card className="mt-10 border-destructive/30 bg-destructive/10">
          <CardContent className="text-sm text-destructive">
            Não foi possível carregar os estabelecimentos no momento. Tente novamente em alguns instantes.
          </CardContent>
        </Card>
      ) : null}

      {foodPlaces.length ? (
        <div className="mt-12 grid gap-14">
          {foodFilters.map((filter) => {
            const places = foodPlaces.filter(filter.matches);

            if (!places.length) return null;

            return (
              <section key={filter.title}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-3xl font-semibold">{filter.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                      {filter.description}
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 rounded-md border border-border bg-background/70 px-3 py-1 text-right text-sm font-semibold text-muted-foreground">
                    {places.length} opções
                  </span>
                </div>
                <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {places.map((place) => (
                    <FoodCard key={`${filter.title}-${place.name}`} place={place} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
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
