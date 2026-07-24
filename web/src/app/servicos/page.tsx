import type { Metadata } from "next";
import { Info } from "lucide-react";
import { CityServicesList } from "@/components/city-services-list";
import { getActiveCityServices, getServiceCategories } from "@/lib/city-services";
import { enableCityServicesPage } from "@/lib/feature-flags";
import { createMetadata } from "@/lib/seo";

const servicesMetadata = createMetadata({
  title: "Serviços em Cerro Corá-RN | Guia Cerro Corá",
  path: "/servicos",
  description:
    "Consulte contatos, horários e localizações de serviços da cidade de Cerro Corá-RN.",
});

export const metadata: Metadata = {
  ...servicesMetadata,
  robots: enableCityServicesPage
    ? servicesMetadata.robots
    : { index: false, follow: false },
};

export const revalidate = 300;

type ServiceFilter = "all" | "public" | "health" | "security" | "commerce" | "open";

type CityServicesPageProps = {
  searchParams: Promise<{ filtro?: string }>;
};

const validFilters = new Set<ServiceFilter>([
  "all",
  "public",
  "health",
  "security",
  "commerce",
  "open",
]);

export default async function CityServicesPage({ searchParams }: CityServicesPageProps) {
  const [services, categories, params] = await Promise.all([
    getActiveCityServices(),
    getServiceCategories(),
    searchParams,
  ]);
  const initialFilter = params.filtro && validFilters.has(params.filtro as ServiceFilter)
    ? params.filtro as ServiceFilter
    : "all";

  return (
    <section className="container py-10 md:py-14">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold tracking-normal md:text-5xl">
          Serviços da Cidade
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          Consulte contatos, horários e localizações de serviços de Cerro Corá.
        </p>
      </div>

      <CityServicesList
        services={services}
        categories={categories}
        initialFilter={initialFilter}
      />

      <aside className="mt-5 flex items-start gap-3 border-t border-border pt-5 text-sm leading-6 text-muted-foreground">
        <Info aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-alpine-wine" />
        <p>
          Horários e contatos podem mudar. Confirme as informações antes do deslocamento.
        </p>
      </aside>
    </section>
  );
}