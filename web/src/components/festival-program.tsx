"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPinned,
  Music,
  Share2,
  Sparkles,
  Star,
  Ticket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FestivalArtistRole, FestivalScheduleItem } from "@/lib/data";
import { cn } from "@/lib/utils";

const roleLabels: Record<FestivalArtistRole, string> = {
  principal: "Atração principal",
  regional: "Atrações regionais",
  convidado: "Artistas convidados",
};

const roleOrder: FestivalArtistRole[] = ["principal", "regional", "convidado"];

const cardStyles = [
  {
    glow: "bg-alpine-sunset/18",
    badge: "bg-alpine-pine text-white dark:bg-alpine-sunset dark:text-[#17251f]",
    panel: "border-alpine-sunset/35 bg-alpine-sunset/12",
  },
  {
    glow: "bg-alpine-wine/18",
    badge: "bg-alpine-wine text-white",
    panel: "border-alpine-wine/25 bg-alpine-wine/10",
  },
  {
    glow: "bg-alpine-pine/18",
    badge: "bg-[#18362f] text-white",
    panel: "border-alpine-pine/25 bg-alpine-pine/10",
  },
];

const calendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=XXII%20Festival%20de%20Inverno%20de%20Cerro%20Cor%C3%A1&dates=20260807T210000Z/20260810T030000Z&details=Programa%C3%A7%C3%A3o%20musical%20na%20Pra%C3%A7a%20P%C3%BAblica%20de%20Cerro%20Cor%C3%A1-RN.&location=Pra%C3%A7a%20P%C3%BAblica%2C%20Cerro%20Cor%C3%A1%20RN";

const mapUrl =
  "https://www.google.com/maps/search/?api=1&query=Pra%C3%A7a%20P%C3%BAblica%20Cerro%20Cor%C3%A1%20RN";

const posterUrl = "/banners/festival-inverno-2026.jpg";

function formatScheduleText(schedule: FestivalScheduleItem[]) {
  return [
    "XXII Festival de Inverno de Cerro Corá-RN",
    "07, 08 e 09 de agosto - Praça Pública",
    "",
    ...schedule.flatMap((day) => [
      `${day.day}, ${day.date} - ${day.subtitle}`,
      ...day.artists.map((artist) => (artist.time ? `• ${artist.time} - ${artist.name}` : `• ${artist.name}`)),
      "",
    ]),
  ].join("\n");
}

function groupedArtists(item: FestivalScheduleItem) {
  return roleOrder
    .map((role) => ({
      role,
      artists: item.artists.filter((artist) => artist.role === role),
    }))
    .filter((group) => group.artists.length > 0);
}

export function FestivalProgram({ schedule }: { schedule: FestivalScheduleItem[] }) {
  const [shareLabel, setShareLabel] = useState("Compartilhar programação");
  const scheduleText = useMemo(() => formatScheduleText(schedule), [schedule]);

  async function shareSchedule() {
    const shareData = {
      title: "Festival de Inverno de Cerro Corá",
      text: scheduleText,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareLabel("Programação compartilhada");
      } else {
        await navigator.clipboard.writeText(`${scheduleText}\n${window.location.href}`);
        setShareLabel("Link copiado");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await navigator.clipboard.writeText(`${scheduleText}\n${window.location.href}`);
      setShareLabel("Link copiado");
    } finally {
      window.setTimeout(() => setShareLabel("Compartilhar programação"), 1800);
    }
  }

  return (
    <motion.section
      id="programacao-musical"
      className="container py-16 md:py-20"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto max-w-4xl text-center">
        <Badge className="mb-4">Programação Musical</Badge>
        <h2 className="font-display text-4xl font-semibold leading-tight text-foreground md:text-5xl">
          Três noites de shows na Praça Pública
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
          A agenda reúne atrações nacionais, artistas regionais e momentos especiais em uma
          leitura organizada por dia.
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-3">
        <Button asChild variant="warm" size="lg" className="min-w-56">
          <a href={posterUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Ver programação completa
          </a>
        </Button>
        <Button type="button" variant="outline" onClick={shareSchedule}>
          <Share2 className="h-4 w-4" />
          {shareLabel}
        </Button>
        <Button asChild variant="outline">
          <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
            <CalendarDays className="h-4 w-4" />
            Adicionar ao calendário
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={mapUrl} target="_blank" rel="noopener noreferrer">
            <MapPinned className="h-4 w-4" />
            Ver localização
          </a>
        </Button>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {schedule.map((item, index) => {
          const style = cardStyles[index % cardStyles.length];
          const groups = groupedArtists(item);

          return (
            <motion.article
              key={item.date}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm md:p-5"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={cn("absolute right-0 top-0 h-32 w-32 rounded-bl-[4.5rem] transition-transform duration-500 group-hover:scale-125", style.glow)} />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge className={style.badge}>{item.day}</Badge>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {item.date}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground/80">{item.subtitle}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#18362f] text-alpine-sunset">
                    {index === 0 ? <Ticket className="h-5 w-5" /> : index === 2 ? <Star className="h-5 w-5" /> : <Music className="h-5 w-5" />}
                  </span>
                </div>

                <p className="mt-5 min-h-12 text-sm leading-6 text-muted-foreground">{item.title}</p>

                <motion.div
                  className={cn("mt-5 rounded-lg border p-4", style.panel)}
                  whileHover={{ scale: 1.015 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-alpine-sunset" />
                    Destaque da noite
                  </p>
                  <h3 className="mt-3 font-display text-3xl font-semibold leading-tight">
                    {item.highlight}
                  </h3>
                </motion.div>

                <div className="mt-5 grid gap-4">
                  {groups.map((group) => (
                    <div key={group.role}>
                      <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {roleLabels[group.role]}
                      </p>
                      <div className="grid gap-2">
                        {group.artists.map((artist) => (
                          <div
                            key={`${item.date}-${artist.name}`}
                            className={cn(
                              "grid items-center gap-3 rounded-md border border-border bg-background/70 px-3 py-2",
                              artist.time ? "grid-cols-[4.5rem_1fr]" : "grid-cols-1",
                            )}
                          >
                            {artist.time ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                <Clock3 className="h-3.5 w-3.5 text-alpine-sunset" />
                                {artist.time}
                              </span>
                            ) : null}
                            <span className="text-sm font-semibold">{artist.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

    </motion.section>
  );
}
