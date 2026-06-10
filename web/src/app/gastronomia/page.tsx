import type { Metadata } from "next";
import { FoodCard } from "@/components/food-card";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicFoodPlaces } from "@/lib/public-content";
import { createMetadata } from "@/lib/seo";
import type { FoodPlace } from "@/lib/data";

export const metadata: Metadata = createMetadata({
  title: "Gastronomia",
  path: "/gastronomia",
  description:
    "Restaurantes, cafés, bares e lanchonetes em Cerro Corá com horário, WhatsApp, Instagram e localização.",
});

export const dynamic = "force-dynamic";

const foodFilters = [
  {
    title: "Restaurantes",
    description: "Casas com refeições completas, pratos regionais, almoço ou jantar.",
    matches: (place: FoodPlace) => place.category === "Restaurante",
  },
  {
    title: "Cafés e sobremesas",
    description: "Cafeterias, açaí, doces, chocolate quente e paradas leves.",
    matches: (place: FoodPlace) =>
      place.category === "Cafeteria" ||
      place.tags.some((tag) => ["Café", "Sobremesas", "Açai", "Açaí", "Chocolate quente"].includes(tag)),
  },
  {
    title: "Bares e petiscos",
    description: "Opções para petiscar, beber algo e aproveitar a noite.",
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
      <SectionHeader
        eyebrow="Gastronomia"
        title="Onde comer em Cerro Corá"
        description="Estabelecimentos com categoria principal, horário, WhatsApp, Instagram e localização clicável."
      />

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {["Restaurante", "Café", "Bar", "Lanchonete", "Pizza", "Petiscos"].map((tag) => (
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
                <div className="mb-5 flex flex-col justify-between gap-2 md:flex-row md:items-end">
                  <div>
                    <h2 className="font-display text-3xl font-semibold">{filter.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                      {filter.description}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {places.length} opções
                  </span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
