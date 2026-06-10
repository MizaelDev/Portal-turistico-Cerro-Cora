import type { Metadata } from "next";
import { MapPin, MessageCircle } from "lucide-react";
import { AttractionCard } from "@/components/attraction-card";
import { MapEmbed } from "@/components/map-embed";
import { MotionReveal } from "@/components/motion-reveal";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { tourGuides } from "@/lib/data";
import { getPublicAttractions } from "@/lib/public-content";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Roteiros",
  path: "/o-que-fazer",
  description:
    "Conheça Mirante do Cruzeiro, Nascente do Rio Potengi, Vale Vulcânico, Tanques Naturais, Escorrego, Serra Verde, Pinturas Rupestres e Casa Grande.",
});

export const dynamic = "force-dynamic";

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;

  return `https://wa.me/${number}`;
}

export default async function RoutesPage() {
  const { items: attractions, error } = await getPublicAttractions();

  return (
    <>
      <section className="bg-[#17251f] py-20 text-white">
        <div className="container">
          <SectionHeader
            className="text-white"
            eyebrow="Roteiros"
            title="Roteiros em Cerro Corá"
            description="Atrativos para montar uma viagem de fim de semana com natureza, história, fotos e experiências de serra."
          />
        </div>
      </section>

      <section className="container py-16">
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
              <MotionReveal key={attraction.slug} delay={index * 0.04}>
                <div id={attraction.slug}>
                  <AttractionCard attraction={attraction} />
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
            eyebrow="Acompanhamento local"
            title="Guias Turísticos Locais"
            description="Contatos para quem quer conhecer trilhas, mirantes e histórias da cidade com apoio local."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {tourGuides.map((guide) => (
              <article
                key={guide.whatsapp}
                className="rounded-lg border border-white/12 bg-white/8 p-6 shadow-glass backdrop-blur"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-alpine-sunset text-[#17251f]">
                    <MapPin className="h-5 w-5" />
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
                  <a href={whatsappUrl(guide.whatsapp)} target="_blank" rel="noreferrer">
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
          description="Mapa com os pontos turísticos"
        />
        <MapEmbed title="Mapa de atrativos turísticos em Cerro Corá" />
      </section>
    </>
  );
}
