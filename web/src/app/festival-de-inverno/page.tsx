import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChefHat,
  Coffee,
  Cookie,
  MapPinned,
  MessageCircle,
  Soup,
  Utensils,
  Wheat,
} from "lucide-react";
import { Countdown } from "@/components/countdown";
import { FestivalProgram } from "@/components/festival-program";
import { JsonLd } from "@/components/json-ld";
import { MapEmbed } from "@/components/map-embed";
import { PhotoGallery } from "@/components/photo-gallery";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { festivalSchedule } from "@/lib/data";
import { createMetadata, festivalEventSchema } from "@/lib/seo";

const festivalPoster = "/banners/festival-inverno-2026.jpg";

const foodHighlights = [
  { label: "Cafés", icon: Coffee },
  { label: "Caldos", icon: Soup },
  { label: "Massas", icon: Utensils },
  { label: "Doces", icon: Cookie },
  { label: "Queijos", icon: ChefHat },
  { label: "Pratos regionais", icon: Wheat },
];

export const metadata: Metadata = createMetadata({
  title: "Festival de Inverno",
  path: "/festival-de-inverno",
  description:
    "XXII Festival de Inverno de Cerro Corá-RN com line-up oficial, programação musical, gastronomia, galeria e mapa do evento.",
});

export default function FestivalPage() {
  return (
    <>
      <JsonLd data={festivalEventSchema} />

      <section className="relative overflow-hidden bg-[#10201b] text-white">
        <Image
          src={festivalPoster}
          alt=""
          fill
          sizes="100vw"
          quality={45}
          className="object-cover opacity-25 blur-sm"
        />
        <div className="absolute inset-0 hidden bg-gradient-to-b from-[#08110e]/86 via-[#10201b]/82 to-[#10201b] dark:block" />
        <div className="container relative grid min-h-[78vh] gap-10 py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,34rem)] lg:items-center">
          <div>
            <Badge className="border-white/25 bg-white/15 text-white backdrop-blur-xl">
              Line-up oficial
            </Badge>
            <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-tight md:text-7xl">
              XXII Festival de Inverno de Cerro Corá
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
              De 07 a 09 de agosto, a Praça Pública recebe shows, artistas regionais,
              comidas e bebidas em uma das noites mais aguardadas da cidade.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur">
                <CalendarDays className="h-4 w-4 text-alpine-sunset" />
                07, 08 e 09 de agosto
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur">
                <MapPinned className="h-4 w-4 text-alpine-sunset" />
                Praça Pública
              </span>
            </div>
            <div className="mt-9 max-w-3xl">
              <Countdown />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-[34rem]">
            <div className="absolute -inset-5 rounded-lg bg-alpine-sunset/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-lg border border-white/20 bg-white/10 p-2 shadow-premium backdrop-blur-xl">
              <Image
                src={festivalPoster}
                alt="Programação oficial do Festival de Inverno de Cerro Corá"
                width={1080}
                height={1350}
                priority
                sizes="(min-width: 1024px) 34rem, 100vw"
                quality={82}
                className="h-auto w-full rounded-md object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <FestivalProgram schedule={festivalSchedule} />

      <section className="bg-[#eaf2ef] py-16 dark:bg-[#10201b] md:py-20">
        <div className="container">
          <SectionHeader
            eyebrow="Área gastronômica"
            title="Sabores para acompanhar as noites frias"
            description="Comidas, bebidas quentes e opções regionais para quem vai acompanhar os shows na Praça Pública."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {foodHighlights.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#18362f] text-alpine-sunset">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="font-semibold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-10 py-20 lg:grid-cols-2">
        <div>
          <SectionHeader
            className="mb-8 text-left"
            eyebrow="Mapa do evento"
            title="Chegue sem complicação"
            description="Localização da Praça Pública para abrir a rota no celular."
          />
          <MapEmbed title="Mapa do Festival de Inverno" />
        </div>
        <div>
          <SectionHeader
            className="mb-8 text-left"
            eyebrow="Galeria"
            title="Fotos da cidade"
            description="Registros de eventos, cafés, paisagens e pontos conhecidos de Cerro Corá."
          />
          <PhotoGallery />
        </div>
      </section>

      <section className="container pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-[#17251f] p-8 text-white shadow-premium md:flex-row md:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-white/55">
              <MapPinned className="h-4 w-4" /> Turismo e eventos
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              Quer tirar dúvidas sobre o festival?
            </h2>
          </div>
          <Button asChild variant="warm" size="lg">
            <Link href="https://wa.me/5584988791401" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Entrar em contato
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
