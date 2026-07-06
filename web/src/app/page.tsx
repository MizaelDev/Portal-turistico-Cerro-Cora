import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AttractionCard } from "@/components/attraction-card";
import { Hero } from "@/components/hero";
import { MotionReveal } from "@/components/motion-reveal";
import { PhotoGallery } from "@/components/photo-gallery";
import { SectionHeader } from "@/components/section-header";
import { WeatherWidget } from "@/components/weather-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { homeHighlights } from "@/lib/data";
import {
  getPublicAttractions,
  getPublicFoodPlaces,
  getPublicLodgings,
} from "@/lib/public-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    { items: attractions, error: attractionsError },
    { items: lodgings, error: lodgingsError },
    { items: foodPlaces, error: foodPlacesError },
  ] = await Promise.all([
    getPublicAttractions(),
    getPublicLodgings(),
    getPublicFoodPlaces(),
  ]);

  return (
    <>
      <Hero />

      <section className="container py-20">
        <SectionHeader
          eyebrow="Planeje sua viagem"
          title="Experiências para viver Cerro Corá em todos os sentidos."
          description="Roteiros naturais, noites frias, cafés, pousadas e eventos pensados para transformar a visita em memória."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {homeHighlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <MotionReveal key={item.title} delay={index * 0.06}>
                <Link
                  href={item.href}
                  className="group block h-full rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-premium"
                >
                  <Icon className="mb-5 h-7 w-7 text-alpine-wine" />
                  <h3 className="font-display text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Ver detalhes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </MotionReveal>
            );
          })}
        </div>
      </section>

      <section className="bg-[#eaf2ef] py-20 dark:bg-[#10201b]">
        <div className="container">
          <SectionHeader
            eyebrow="Roteiros"
            title="Atrativos naturais e culturais."
            description="Um recorte dos pontos que conectam altitude, história, natureza e paisagem cinematográfica."
          />
          {attractionsError ? (
            <Card className="mt-10 border-destructive/30 bg-destructive/10">
              <CardContent className="text-sm text-destructive">
                Não foi possível carregar os roteiros no momento.
              </CardContent>
            </Card>
          ) : attractions.length ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {attractions.slice(0, 3).map((attraction, index) => (
                <MotionReveal key={attraction.slug} delay={index * 0.06}>
                  <AttractionCard attraction={attraction} />
                </MotionReveal>
              ))}
            </div>
          ) : (
            <Card className="mt-10">
              <CardContent className="text-center text-sm text-muted-foreground">
                Nenhum roteiro ativo foi cadastrado ainda.
              </CardContent>
            </Card>
          )}
          <div className="mt-10 text-center">
            <Button asChild variant="warm">
              <Link href="/o-que-fazer">
                Ver todos os roteiros <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container grid gap-10 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <MotionReveal>
          <SectionHeader
            className="text-left"
            eyebrow="Clima da cidade"
            title="Frio, neblina e noites para desacelerar."
            description=" integração com OpenWeather"
          />
        </MotionReveal>
        <MotionReveal delay={0.08}>
          <WeatherWidget />
        </MotionReveal>
      </section>

      <section className="container py-20">
        <SectionHeader
          eyebrow="Onde ficar"
          title="Pousadas e chalés para respirar a serra."
          description="Hospedagens demonstrativas com galeria, reserva por WhatsApp e faixa de preço."
        />
        {lodgingsError ? (
          <Card className="mt-10 border-destructive/30 bg-destructive/10">
            <CardContent className="text-sm text-destructive">
              Não foi possível carregar as pousadas no momento.
            </CardContent>
          </Card>
        ) : lodgings.length ? (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {lodgings.map((lodging) => (
              <Link
                key={lodging.name}
                href="/pousadas"
                className="rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-premium"
              >
                <p className="font-display text-2xl font-semibold">{lodging.name}</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{lodging.description}</p>
                <p className="mt-4 text-sm font-semibold text-primary">{lodging.priceRange}</p>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="mt-10">
            <CardContent className="text-center text-sm text-muted-foreground">
              Nenhuma pousada ativa foi cadastrada ainda.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="bg-[#17251f] py-20 text-white">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeader
            className="text-left text-white"
            eyebrow="Gastronomia"
            title="Cafés, massas, e sabores regionais."
            description="A cidade ganha outro ritmo quando a temperatura cai. Descubra paradas gastronômicas para aproveitar o frio serrano."
          />
          {foodPlacesError ? (
            <div className="rounded-lg border border-white/12 bg-white/8 p-5 text-sm text-white/70 backdrop-blur">
              Não foi possível carregar os estabelecimentos no momento.
            </div>
          ) : foodPlaces.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {foodPlaces.slice(0, 4).map((place) => (
                <div key={place.name} className="rounded-lg border border-white/12 bg-white/8 p-5 backdrop-blur">
                  <p className="font-display text-xl font-semibold">{place.name}</p>
                  <p className="mt-2 text-sm text-white/65">{place.category}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/12 bg-white/8 p-5 text-sm text-white/70 backdrop-blur">
              Nenhum estabelecimento ativo foi cadastrado ainda.
            </div>
          )}
        </div>
      </section>

      <section className="container py-20">
        <SectionHeader
          eyebrow="Galeria"
          title="Um visual de inverno no coração do RN."
          description="Imagens grandes e cinematográficas para valorizar pôr do sol, cafés e natureza."
        />
        <div className="mt-12">
          <PhotoGallery />
        </div>
      </section>
    </>
  );
}
