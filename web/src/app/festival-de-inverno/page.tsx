import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  LockKeyhole,
  MapPinned,
  MessageCircle,
  Music,
  Sparkles,
  Utensils,
} from "lucide-react";
import { Countdown } from "@/components/countdown";
import { MapEmbed } from "@/components/map-embed";
import { PhotoGallery } from "@/components/photo-gallery";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { festivalArtists, festivalSchedule } from "@/lib/data";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Festival de Inverno",
  path: "/festival-de-inverno",
  description:
    "Festival de Inverno de Cerro Corá com countdown, programação, atrações, gastronomia, galeria e mapa do evento.",
});

export default function FestivalPage() {
  return (
    <>
      <section className="relative min-h-[72vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=2200&q=85"
          alt="Público em evento noturno de inverno"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-[#17251f]" />
        <div className="container relative flex min-h-[72vh] flex-col justify-center py-20 text-white">
          <Badge className="w-fit border-white/25 bg-white/15 text-white backdrop-blur-xl">
            Agosto 2026
          </Badge>
          <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-tight md:text-7xl">
            Festival de Inverno de Cerro Corá
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
            Música, gastronomia, cultura e noites frias na Suíça do Seridó.
          </p>
          <div className="mt-9 max-w-3xl">
            <Countdown />
          </div>
        </div>
      </section>

      <section className="container py-20">
        <SectionHeader
          eyebrow="Programação"
          title="Três dias para curtir a cidade"
          description="A programação oficial está sendo preparada para uma edição inesquecível."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {festivalSchedule.map((item) => (
            <div
              key={`${item.day}-${item.time}`}
              className="group relative overflow-hidden rounded-lg border border-alpine-pine/20 bg-[#14251f] p-5 text-white shadow-premium"
            >
              {!item.revealed ? (
                <>
                  <div className="absolute inset-0 bg-[linear-gradient(150deg,transparent,rgba(232,167,96,0.18),transparent)] opacity-70 transition-transform duration-700 group-hover:translate-x-full" />
                  <div className="absolute inset-0 bg-black/55 backdrop-blur-xl backdrop-saturate-0" />
                  <div className="absolute inset-0 bg-gradient-to-br from-alpine-pine/55 via-[#08110e]/60 to-alpine-wine/35" />
                  <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/25 p-2 backdrop-blur-xl">
                    <LockKeyhole className="h-4 w-4 text-alpine-sunset" />
                  </div>
                </>
              ) : null}

              <div className="relative flex items-center gap-3 text-sm font-semibold text-alpine-sunset">
                <Calendar className="h-4 w-4" />
                <span
                  className={
                    item.revealed
                      ? ""
                      : "inline-block select-none blur-xl brightness-75 contrast-50 opacity-30 scale-105"
                  }
                >
                  {item.day} - {item.time}
                </span>
              </div>
              <p
                className={
                  item.revealed
                    ? "relative mt-3 font-display text-2xl font-semibold"
                    : "relative mt-3 select-none font-display text-2xl font-semibold text-white/35 blur-xl brightness-75 contrast-50 opacity-30 scale-105"
                }
              >
                {item.title}
              </p>
              {!item.revealed ? (
                <div className="relative mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-xl">
                    Em breve
                  </span>
                  <span className="text-xs font-medium text-white/55 transition-colors group-hover:text-alpine-sunset">
                    Aguardando anúncio oficial
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#eaf2ef] py-20 dark:bg-[#10201b]">
        <div className="container grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader
              className="text-left"
              eyebrow="Atrações"
              title="Line-up será revelado"
              description="O line-up oficial permanece confidencial até o anúncio oficial do festival."
            />
            <div className="mt-8 grid gap-3">
              {festivalArtists.map((artist) => (
                <div
                  key={artist.name}
                  className="group relative overflow-hidden rounded-lg border border-alpine-pine/20 bg-[#14251f] p-4 text-white shadow-sm"
                >
                  {!artist.revealed ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-alpine-sunset/15 to-white/0 opacity-80 transition-transform duration-700 group-hover:translate-x-full" />
                      <div className="absolute inset-0 bg-black/55 backdrop-blur-xl backdrop-saturate-0" />
                      <div className="absolute inset-0 bg-gradient-to-r from-alpine-pine/50 via-[#08110e]/55 to-alpine-wine/30" />
                    </>
                  ) : null}
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Music className="h-5 w-5 text-alpine-sunset" />
                      <span
                        className={
                          artist.revealed
                            ? "font-semibold"
                            : "inline-block select-none font-semibold text-white/35 blur-xl brightness-75 contrast-50 opacity-30 scale-105"
                        }
                      >
                        {artist.name}
                      </span>
                    </div>
                    {!artist.revealed ? (
                      <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-xl">
                        <Sparkles className="h-3.5 w-3.5 text-alpine-sunset" />
                        Em breve
                      </span>
                    ) : null}
                  </div>
                  {!artist.revealed ? (
                    <p className="relative mt-3 text-xs font-medium uppercase tracking-[0.2em] text-white/45 group-hover:text-alpine-sunset">
                      Line-up será revelado
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader
              className="text-left"
              eyebrow="Área gastronômica"
              title="Sabores para noites frias"
              description="Praça de alimentação com cafés, caldos, massas, doces, queijos e pratos regionais."
            />
            <div className="mt-8 rounded-lg border border-border bg-card p-6 shadow-sm">
              <Utensils className="mb-4 h-7 w-7 text-alpine-wine" />
              <p className="text-sm leading-7 text-muted-foreground">
                O espaço gastronômico pode exibir expositores, cardápios,
                horários, cupons e links para WhatsApp dos participantes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-10 py-20 lg:grid-cols-2">
        <div>
          <SectionHeader
            className="mb-8 text-left"
            eyebrow="Mapa do evento"
            title="Chegue sem complicação"
            description="Mapa embed preparado para palco, área gastronômica e rotas de acesso."
          />
          <MapEmbed title="Mapa do Festival de Inverno" />
        </div>
        <div>
          <SectionHeader
            className="mb-8 text-left"
            eyebrow="Galeria"
            title="Memórias do inverno"
            description="Galeria visual para valorizar público, shows e gastronomia."
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
              Quer participar ou expor?
            </h2>
          </div>
          <Button asChild variant="warm" size="lg">
            <Link href="https://wa.me/5584999999999" target="_blank">
              <MessageCircle className="h-4 w-4" /> Entrar em contato
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
