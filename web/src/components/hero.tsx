import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CloudSun, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { heroImage, quickStats } from "@/lib/data";

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <Image
        src={heroImage}
        alt="Paisagem serrana com neblina representando Cerro Corá"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/28 to-background" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="container relative flex min-h-[calc(100vh-5rem)] items-center pb-20 pt-16">
        <div className="max-w-4xl text-white">
          <Badge className="border-white/25 bg-white/15 text-white backdrop-blur-xl">
            <Sparkles className="mr-2 h-3.5 w-3.5" /> Suiça do Seridó
          </Badge>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-normal md:text-7xl">
            Cerro Corá, onde o frio da serra encontra o calor do Seridó.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82 md:text-xl">
            Um portal para planejar roteiros, hospedagens, gastronomia e
            experiências de inverno em uma das cidades mais charmosas do RN.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="warm">
              <Link href="/o-que-fazer">
                Explorar roteiros <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="glass">
              <Link href="/festival-de-inverno">
                Festival de Inverno
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container relative -mt-24 pb-10">
        <div className="grid gap-3 rounded-lg border border-white/20 bg-white/14 p-3 shadow-glass backdrop-blur-xl md:grid-cols-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-md bg-white/82 p-4 text-[#17251f] dark:bg-black/35 dark:text-white">
                <Icon className="mb-3 h-5 w-5 text-alpine-wine" />
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-[#52635d] dark:text-white/70">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute right-8 top-24 hidden rounded-lg border border-white/20 bg-white/12 p-4 text-white shadow-glass backdrop-blur-xl xl:block">
        <div className="flex items-center gap-3">
          <CloudSun className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold">Clima serrano</p>
            <p className="text-xs text-white/70">Neblina, cafés e pôr do sol</p>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-40 right-10 hidden items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm text-white backdrop-blur-xl lg:flex">
        <MapPin className="h-4 w-4" /> Rio Grande do Norte, Brasil
      </div>
    </section>
  );
}
