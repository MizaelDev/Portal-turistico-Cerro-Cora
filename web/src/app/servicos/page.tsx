import type { Metadata } from "next";
import { CityServicesList } from "@/components/city-services-list";
import { getActiveCityServices } from "@/lib/city-services";
import { enableCityServicesPage } from "@/lib/feature-flags";
import { createMetadata } from "@/lib/seo";

const servicesMetadata = createMetadata({
  title: "Serviços em Cerro Corá-RN | Guia Cerro Corá",
  path: "/servicos",
  description:
    "Encontre informações úteis em Cerro Corá-RN, como hospital, delegacia, contatos importantes e serviços essenciais da cidade.",
});

export const metadata: Metadata = {
  ...servicesMetadata,
  robots: enableCityServicesPage
    ? servicesMetadata.robots
    : {
        index: false,
        follow: false,
      },
};

export const revalidate = 300;

export default async function CityServicesPage() {
  const services = await getActiveCityServices();

  return (
    <section className="container py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-alpine-wine">
          Serviços da Cidade
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-normal md:text-5xl">
          Informações úteis em Cerro Corá
        </h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground md:text-lg">
          Contatos e locais importantes para quem mora ou visita a cidade.
        </p>
      </div>

      <CityServicesList services={services} />
    </section>
  );
}
