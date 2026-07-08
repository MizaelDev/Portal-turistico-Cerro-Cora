import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CloudSun, Droplets, ExternalLink, Landmark } from "lucide-react";
import { MotionReveal } from "@/components/motion-reveal";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cityFacts, cityHistory, climateMonths, heroImage } from "@/lib/data";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Sobre a Cidade",
  path: "/sobre-a-cidade",
  description:
    "Conheça a história de Cerro Corá, a Suíça do Seridó, com linha do tempo, identidade local e médias de temperatura durante o ano.",
});

const maxRain = Math.max(...climateMonths.map((month) => month.rain));

export default function AboutCityPage() {
  return (
    <>
      <section className="relative min-h-[68vh] overflow-hidden">
        <Image
          src={heroImage}
          alt="Paisagem de Cerro Corá"
          fill
          priority
          sizes="100vw"
          quality={82}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-background" />
        <div className="container relative flex min-h-[68vh] items-end pb-16 pt-24 text-white">
          <div className="max-w-4xl">
            <Badge className="border-white/25 bg-white/15 text-white backdrop-blur-xl">
              História, clima e identidade
            </Badge>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-tight md:text-7xl">
              Sobre Cerro Corá
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
              A cidade serrana do Seridó reúne história, natureza, altitude e um
              clima ameno que sustenta o apelido de Suíça do Seridó.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {cityFacts.map((fact, index) => {
            const Icon = fact.icon;
            return (
              <MotionReveal key={fact.title} delay={index * 0.06}>
                <Card className="h-full border-0 shadow-premium">
                  <CardContent className="p-6">
                    <Icon className="mb-5 h-8 w-8 text-alpine-wine" />
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {fact.title}
                    </p>
                    <p className="mt-2 font-display text-3xl font-semibold">
                      {fact.value}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {fact.description}
                    </p>
                  </CardContent>
                </Card>
              </MotionReveal>
            );
          })}
        </div>
      </section>

      <section className="bg-[#eaf2ef] py-20 dark:bg-[#10201b]">
        <div className="container grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <MotionReveal>
            <div className="sticky top-28">
              <Badge className="mb-4">Linha do tempo</Badge>
              <h2 className="font-display text-4xl font-semibold md:text-5xl">
                Histórias que formaram a cidade
              </h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                Um resumo com marcos históricos para apresentar a origem
                do município, a mudança de nome e a emancipação política.
              </p>
              <Button asChild variant="warm" className="mt-7">
                <Link href="/o-que-fazer">
                  Ver roteiros <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </MotionReveal>

          <div className="grid gap-4">
            {cityHistory.map((item, index) => (
              <MotionReveal key={`${item.year}-${item.title}`} delay={index * 0.04}>
                <article className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm md:grid-cols-[120px_1fr]">
                  <div className="flex items-center gap-3 md:block">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground md:mb-3">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <p className="font-display text-3xl font-semibold text-alpine-wine">
                      {item.year}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-semibold">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </article>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <SectionHeader
          eyebrow="Clima durante o ano"
          title="Médias de temperatura em Cerro Corá"
          description="Tabela com máximas, médias, mínimas e chuva mensal para te ajudar a escolher a melhor época da sua viagem."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-[#17251f] text-white">
                    <tr>
                      <th className="px-4 py-4 text-left font-semibold">Mês</th>
                      <th className="px-4 py-4 text-left font-semibold">Máxima</th>
                      <th className="px-4 py-4 text-left font-semibold">Média</th>
                      <th className="px-4 py-4 text-left font-semibold">Mínima</th>
                      <th className="px-4 py-4 text-left font-semibold">Chuva</th>
                    </tr>
                  </thead>
                  <tbody>
                    {climateMonths.map((month) => (
                      <tr key={month.month} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-semibold">{month.month}</td>
                        <td className="px-4 py-3">{month.high.toFixed(1)}°C</td>
                        <td className="px-4 py-3">{month.average.toFixed(1)}°C</td>
                        <td className="px-4 py-3">{month.low.toFixed(1)}°C</td>
                        <td className="px-4 py-3">{month.rain} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="border-0 bg-[#18362f] text-white shadow-premium">
              <CardContent className="p-6">
                <CloudSun className="mb-5 h-8 w-8 text-alpine-sunset" />
                <h3 className="font-display text-3xl font-semibold">
                  Inverno mais ameno
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  Junho, julho e agosto concentram as menores médias da tabela,
                  com noites mais frias e clima ideal para cafés, pousadas e
                  roteiros de serra.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Droplets className="mb-5 h-7 w-7 text-alpine-wine" />
                <h3 className="font-display text-2xl font-semibold">
                  Chuva por mês
                </h3>
                <div className="mt-5 grid gap-3">
                  {climateMonths.map((month) => (
                    <div key={month.month} className="grid grid-cols-[44px_1fr_54px] items-center gap-3 text-xs">
                      <span className="font-semibold">{month.month}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-alpine-wine"
                          style={{ width: `${(month.rain / maxRain) * 100}%` }}
                        />
                      </span>
                      <span className="text-right text-muted-foreground">
                        {month.rain}mm
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Fontes de referência
          </p>
          <div className="mt-4 flex flex-col gap-3 text-sm md:flex-row">
            <a
              href="https://cerrocorarn.com.br/sobre-a-cidade/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-primary"
            >
              História da cidade <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="https://cerrocorarn.com.br/clima-em-cerro-cora-rn/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-primary"
            >
              Tabela climática local <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="https://pt.weatherspark.com/y/31292/Clima-caracter%C3%ADstico-em-Cerro-Cor%C3%A1-Rio-Grande-do-Norte-Brasil-durante-o-ano"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-primary"
            >
              Weather Spark <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
