"use client";

import { useMemo, useState } from "react";
import { FoodCard } from "@/components/food-card";
import { Card, CardContent } from "@/components/ui/card";
import { getCommercialFeatures, getPlanPriority } from "@/lib/commercial";
import type { FoodPlace } from "@/lib/data";
import { cn } from "@/lib/utils";

type GastronomyDirectoryProps = {
  places: FoodPlace[];
};

const INITIAL_FEATURED_LIMIT = 6;
const INITIAL_LIST_LIMIT = 12;
const LIST_PAGE_SIZE = 12;

type CategoryId =
  | "all"
  | "restaurants"
  | "pizzerias"
  | "burger"
  | "cafes"
  | "bars"
  | "ice-cream"
  | "bakeries"
  | "snack-bars";

type CategoryOption = {
  id: CategoryId;
  label: string;
  listTitle: string;
  matches: (place: FoodPlace) => boolean;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function hasAnyTag(place: FoodPlace, values: string[]) {
  const normalizedTags = [...place.tags, ...(place.specialties || [])].map(normalize);
  return values.some((value) => normalizedTags.includes(normalize(value)));
}

const categories: CategoryOption[] = [
  {
    id: "all",
    label: "Todos",
    listTitle: "Todos os estabelecimentos",
    matches: () => true,
  },
  {
    id: "restaurants",
    label: "Restaurantes",
    listTitle: "Todos os restaurantes",
    matches: (place) => ["Restaurante", "Almoço"].includes(place.category),
  },
  {
    id: "pizzerias",
    label: "Pizzarias",
    listTitle: "Todas as pizzarias",
    matches: (place) => hasAnyTag(place, ["Pizza", "Pizzaria"]),
  },
  {
    id: "burger",
    label: "Hamburguerias",
    listTitle: "Todas as hamburguerias",
    matches: (place) =>
      place.category === "Hamburgueria" || hasAnyTag(place, ["Hambúrguer", "Hambúrgueres"]),
  },
  {
    id: "cafes",
    label: "Cafés",
    listTitle: "Todos os cafés",
    matches: (place) => place.category === "Cafeteria" || hasAnyTag(place, ["Café", "Cafeteria"]),
  },
  {
    id: "bars",
    label: "Bares",
    listTitle: "Todos os bares",
    matches: (place) => place.category === "Bar" || hasAnyTag(place, ["Bar"]),
  },
  {
    id: "ice-cream",
    label: "Sorveterias",
    listTitle: "Todas as sorveterias",
    matches: (place) => hasAnyTag(place, ["Sorvete", "Sorvetes", "Sorveteria"]),
  },
  {
    id: "bakeries",
    label: "Padarias",
    listTitle: "Todas as padarias",
    matches: (place) => hasAnyTag(place, ["Padaria", "Pães", "Pães e bolos"]),
  },
  {
    id: "snack-bars",
    label: "Lanchonetes",
    listTitle: "Todas as lanchonetes",
    matches: (place) => place.category === "Lanchonete" || hasAnyTag(place, ["Lanches"]),
  },
];

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-10 shrink-0 rounded-md border px-3.5 py-1.5 text-sm font-semibold transition-colors sm:min-h-9",
        active
          ? "border-alpine-pine bg-alpine-pine text-white dark:border-alpine-sunset dark:bg-alpine-sunset dark:text-[#17251f]"
          : "border-border bg-background text-foreground hover:border-primary/45 hover:bg-accent/55",
      )}
    >
      {children}
    </button>
  );
}

function PlacesGrid({ places, keyPrefix }: { places: FoodPlace[]; keyPrefix: string }) {
  return (
    <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
      {places.map((place) => (
        <FoodCard key={`${keyPrefix}-${place.id || place.slug || place.name}`} place={place} compact />
      ))}
    </div>
  );
}

function sortFeaturedPlaces(first: FoodPlace, second: FoodPlace) {
  const planDifference = getPlanPriority(second.plan, second.planStatus) - getPlanPriority(first.plan, first.planStatus);
  if (planDifference) return planDifference;
  const firstOrder = first.featuredOrder ?? Number.MAX_SAFE_INTEGER;
  const secondOrder = second.featuredOrder ?? Number.MAX_SAFE_INTEGER;

  if (firstOrder !== secondOrder) return firstOrder - secondOrder;
  if (Boolean(first.isFeatured) !== Boolean(second.isFeatured)) return first.isFeatured ? -1 : 1;

  const firstUpdatedAt = first.updatedAt ? new Date(first.updatedAt).getTime() : 0;
  const secondUpdatedAt = second.updatedAt ? new Date(second.updatedAt).getTime() : 0;
  if (firstUpdatedAt !== secondUpdatedAt) return secondUpdatedAt - firstUpdatedAt;

  return first.name.localeCompare(second.name, "pt-BR");
}

function isHighlightedPlace(place: FoodPlace) {
  return (place.commercialFeatures || getCommercialFeatures(place.plan, {
    status: place.planStatus,
    customFeatures: place.customFeatures,
    highlighted: place.isFeatured,
  })).highlighted;
}

export function GastronomyDirectory({ places }: GastronomyDirectoryProps) {
  const [categoryId, setCategoryId] = useState<CategoryId>("all");
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [visibleListCount, setVisibleListCount] = useState(INITIAL_LIST_LIMIT);

  const selectedCategory = categories.find((category) => category.id === categoryId) || categories[0];

  const availableCategories = useMemo(
    () => categories.filter((category) => category.id === "all" || places.some(category.matches)),
    [places],
  );

  const categoryPlaces = useMemo(
    () => places.filter(selectedCategory.matches),
    [places, selectedCategory],
  );

  const featuredPlaces = useMemo(
    () => categoryPlaces
      .filter(isHighlightedPlace)
      .sort(sortFeaturedPlaces),
    [categoryPlaces],
  );

  const regularPlaces = useMemo(
    () => categoryPlaces.filter((place) => !isHighlightedPlace(place)),
    [categoryPlaces],
  );

  const visibleFeaturedPlaces = showAllFeatured
    ? featuredPlaces
    : featuredPlaces.slice(0, INITIAL_FEATURED_LIMIT);
  const visibleCategoryPlaces = regularPlaces.slice(0, visibleListCount);

  function selectCategory(nextCategory: CategoryId) {
    setCategoryId(nextCategory);
    setShowAllFeatured(false);
    setVisibleListCount(INITIAL_LIST_LIMIT);
  }

  return (
    <div className="mt-7">
      <div className="rounded-lg border border-border/70 bg-card/35 p-3.5 sm:p-4">
        <nav aria-label="Categorias de gastronomia">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Tipo de estabelecimento
          </p>
          <div className="sm:hidden">
            <label htmlFor="gastronomy-category" className="sr-only">
              Escolha o tipo de estabelecimento
            </label>
            <select
              id="gastronomy-category"
              value={categoryId}
              onChange={(event) => selectCategory(event.target.value as CategoryId)}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden flex-wrap gap-2 sm:flex">
            {availableCategories.map((category) => (
              <FilterButton
                key={category.id}
                active={categoryId === category.id}
                onClick={() => selectCategory(category.id)}
              >
                {category.label}
              </FilterButton>
            ))}
          </div>
        </nav>
      </div>

      {featuredPlaces.length ? (
        <section className="mt-9 border-t-2 border-[#d7aa58]/45 pt-5" aria-labelledby="gastronomy-highlights-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="gastronomy-highlights-title" className="font-display text-2xl font-semibold sm:text-3xl">
                Destaques da gastronomia
              </h2>
            </div>
          </div>
          <PlacesGrid places={visibleFeaturedPlaces} keyPrefix="featured" />
          {featuredPlaces.length > INITIAL_FEATURED_LIMIT ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllFeatured((current) => !current)}
                className="min-h-10 rounded-md border border-border bg-background px-4 text-sm font-semibold transition-colors hover:border-primary/45 hover:bg-accent/55"
              >
                {showAllFeatured ? "Mostrar menos destaques" : "Ver todos os destaques"}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-11" aria-labelledby="gastronomy-list-title">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-border/70 pb-3.5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Guia gastronômico
            </p>
            <h2 id="gastronomy-list-title" className="font-display text-2xl font-semibold sm:text-3xl">
              {selectedCategory.listTitle}
            </h2>
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {regularPlaces.length} {regularPlaces.length === 1 ? "opção" : "opções"}
          </span>
        </div>

        {regularPlaces.length ? (
          <>
            <PlacesGrid places={visibleCategoryPlaces} keyPrefix="all" />
            {regularPlaces.length > visibleListCount ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleListCount((current) => current + LIST_PAGE_SIZE)}
                  className="min-h-10 rounded-md border border-border bg-background px-4 text-sm font-semibold transition-colors hover:border-primary/45 hover:bg-accent/55"
                >
                  Carregar mais estabelecimentos
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {featuredPlaces.length
                ? "Os estabelecimentos desta categoria já estão apresentados nos destaques."
                : "Nenhum estabelecimento combina com os filtros selecionados."}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
