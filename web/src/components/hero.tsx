import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CloudSun, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { heroImage } from "@/lib/data";

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <Image
        src={heroImage}
        alt="Paisagem serrana com neblina representando Cerro Corá"
        fill
        priority
        sizes="100vw"
        quality={82}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.55)_58%,rgba(0,0,0,0.24)_100%)] md:bg-[linear-gradient(90deg,rgba(0,0,0,0.58)_0%,rgba(0,0,0,0.38)_42%,rgba(0,0,0,0.12)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/40 to-transparent" />

      <div className="container relative flex min-h-[calc(100vh-5rem)] items-center pb-20 pt-16">
        <div className="max-w-[700px] text-white">
          <Badge className="border-white/45 bg-[#10201b]/60 text-white shadow-glass backdrop-blur-md">
            <Sparkles className="mr-2 h-3.5 w-3.5" /> Suiça do Seridó
          </Badge>
          <h1 className="mt-6 max-w-[680px] font-display text-5xl font-semibold leading-[1.02] tracking-normal [text-shadow:0_4px_24px_rgba(0,0,0,0.45)] md:text-7xl">
            Cerro Corá, onde o frio da serra encontra o calor do Seridó.
          </h1>
          <p className="mt-6 max-w-[620px] text-lg leading-8 text-white/88 [text-shadow:0_4px_24px_rgba(0,0,0,0.45)] md:text-xl">
            Um portal para planejar roteiros, hospedagens, gastronomia e
            experiências de inverno em uma das cidades mais charmosas do RN.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="warm">
              <Link href="/o-que-fazer">
                Explorar roteiros <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="glass"
              className="border-white/45 bg-[#10201b]/45 text-white shadow-glass hover:border-white/70 hover:bg-white/20"
            >
              <Link href="/festival-de-inverno">
                Festival de Inverno
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-8 top-24 hidden rounded-lg border border-white/35 bg-[#10201b]/55 p-4 text-white shadow-glass backdrop-blur-md xl:block">
        <div className="flex items-center gap-3">
          <CloudSun className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold">Clima serrano</p>
            <p className="text-xs text-white/82">Neblina, cafés e pôr do sol</p>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-40 right-10 hidden items-center gap-2 rounded-full border border-white/35 bg-[#10201b]/55 px-4 py-2 text-sm font-medium text-white shadow-glass backdrop-blur-md lg:flex">
        <MapPin className="h-4 w-4" /> Rio Grande do Norte, Brasil
      </div>
    </section>
  );
}
