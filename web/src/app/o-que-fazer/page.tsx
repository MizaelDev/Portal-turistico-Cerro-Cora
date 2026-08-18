import type { Metadata } from "next";
import { Compass, Info, MessageCircle } from "lucide-react";
import { AttractionCard } from "@/components/attraction-card";
import { JsonLd } from "@/components/json-ld";
import { MapEmbed } from "@/components/map-embed";
import { MotionReveal } from "@/components/motion-reveal";
import { RouteLeafletSection } from "@/components/route-leaflet-section";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { tourGuides } from "@/lib/data";
import { getPublicAttractions } from "@/lib/public-content";
import { getRouteLeafletSettings } from "@/lib/route-leaflet";
import { createMetadata, touristAttractionsSchema } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Roteiros",
  path: "/o-que-fazer",
  description:
    "Conheça Mirante do Cruzeiro, Nascente do Rio Potengi, Vale Vulcânico, Tanques Naturais, Escorrego, Serra Verde, Pinturas Rupestres e Casa Grande.",
});

export const revalidate = 3600;

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;

  return `https://wa.me/${number}`;
}

export default async function RoutesPage() {
  const [{ items: attractions, error }, routeLeaflet] = await Promise.all([
    getPublicAttractions(),
    getRouteLeafletSettings(),
  ]);

  return (
    <>
      {attractions.length ? <JsonLd data={touristAttractionsSchema(attractions)} /> : null}

      <section className="bg-[#17251f] py-20 text-white">
        <div className="container">
          <SectionHeader
            className="text-white"
            inverted
            eyebrow="Roteiros"
            as="h1"
            title="Roteiros em Cerro Corá"
            description="Mirantes, nascentes, trilhas e pontos históricos para organizar sua visita."
          />
        </div>
      </section>

      <RouteLeafletSection settings={routeLeaflet} />

      <section className="container py-16">
        <div className="mb-6 flex max-w-4xl items-start gap-3 rounded-md border border-border bg-muted/35 px-4 py-3 text-sm leading-6 text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-alpine-wine" aria-hidden="true" />
          <p>
            Algumas atrações possuem regras específicas de acesso. Verifique a necessidade de
            guia, agendamento ou pagamento de entrada nas informações de cada ponto turístico.
          </p>
        </div>
        <div className="mb-9 max-w-3xl">
          <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Principais roteiros
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Conheça os lugares que fazem parte dos roteiros e consulte fotos,
            localização e informações de cada parada.
          </p>
        </div>

        {error ? (
          <Card className="mb-8 border-destructive/30 bg-destructive/10">
            <CardContent className="text-sm text-destructive">
              Não foi possível carregar os roteiros no momento. Tente novamente em alguns instantes.
            </CardContent>
          </Card>
        ) : null}

        {attractions.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {attractions.map((attraction, index) => (
              <MotionReveal key={`${attraction.slug}-${index}`} delay={index * 0.04}>
                <div id={attraction.slug}>
                  <AttractionCard attraction={attraction} priority={index === 0} />
                </div>
              </MotionReveal>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center text-sm text-muted-foreground">
              Nenhum roteiro ativo foi encontrado.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="bg-[#10201b] py-20 text-white">
        <div className="container">
          <SectionHeader
            className="text-white"
            inverted
            eyebrow="Acompanhamento local"
            title="Guias de turismo local"
            description="Contatos para quem prefere conhecer trilhas, mirantes e histórias da cidade com apoio de quem mora na região."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {tourGuides.map((guide) => (
              <article
                key={guide.whatsapp}
                className="rounded-lg border border-white/12 bg-white/8 p-6 shadow-glass backdrop-blur"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-alpine-sunset text-[#17251f]">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-semibold">{guide.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-white/68">{guide.description}</p>
                    <p className="mt-3 text-sm font-semibold text-white/78">
                      WhatsApp: {guide.whatsapp}
                    </p>
                  </div>
                </div>
                <Button asChild variant="warm" className="mt-6 w-full">
                  <a href={whatsappUrl(guide.whatsapp)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Falar com guia
                  </a>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <SectionHeader
          className="mb-10"
          eyebrow="Mapa"
          title="Localize os roteiros"
          description="Mapa com os principais pontos turísticos cadastrados."
        />
        <MapEmbed title="Mapa de atrativos turísticos em Cerro Corá" />
      </section>
    </>
  );
}
