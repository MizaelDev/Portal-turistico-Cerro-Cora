import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Instagram, MapPin, MessageCircle, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FoodPlace } from "@/lib/data";
import { googleMapsSearchUrl, instagramUrlFromHandle } from "@/lib/links";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

const logoImageSignals = ["logo", "marca", "brand", "avatar", "profile"];
const secondaryTagPriority = [
  "Almoço",
  "Pizza",
  "Hambúrguer",
  "Açaí",
  "Café",
  "Petiscos",
  "Pratos regionais",
  "Sobremesas",
  "Jantar",
  "Delivery",
  "Bar",
  "Lanches",
];

function shouldShowPhoto(image?: string) {
  if (!image?.trim()) return false;
  const normalized = image.toLowerCase();
  return !logoImageSignals.some((signal) => normalized.includes(signal));
}

function normalizeTag(tag: string) {
  return tag
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getVisibleTags(place: FoodPlace) {
  const tags = [place.category, ...place.tags].filter(Boolean);
  const uniqueTags = Array.from(
    new Map(tags.map((tag) => [normalizeTag(tag), tag])).values(),
  );
  const categoryKey = normalizeTag(place.category);
  const secondaryTags = uniqueTags
    .filter((tag) => normalizeTag(tag) !== categoryKey)
    .sort((first, second) => {
      const firstIndex = secondaryTagPriority.indexOf(first);
      const secondIndex = secondaryTagPriority.indexOf(second);
      return (
        (firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex) -
        (secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex)
      );
    });
  const orderedTags = [place.category, ...secondaryTags];

  return {
    visibleTags: orderedTags.slice(0, 2),
    hiddenCount: Math.max(orderedTags.length - 2, 0),
  };
}

function FoodImage({ place }: { place: FoodPlace }) {
  if (shouldShowPhoto(place.image)) {
    return (
      <Image
        src={place.image}
        alt={`Foto de ${place.name}`}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        quality={74}
        className="object-cover"
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#1a2e1a] px-6 text-center text-white">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-white/15 bg-white/10 text-alpine-sunset">
        <Utensils className="h-6 w-6" />
      </div>
      <p className="font-display text-2xl font-semibold leading-tight">{place.name}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
        Gastronomia local
      </p>
    </div>
  );
}

export function FoodCard({ place }: { place: FoodPlace }) {
  const instagramHref = place.instagramUrl || instagramUrlFromHandle(place.instagram);
  const mapHref = place.mapUrl || googleMapsSearchUrl(place.name, place.location);
  const detailHref = `/restaurantes/${place.slug || slugify(place.name)}`;
  const { visibleTags, hiddenCount } = getVisibleTags(place);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-premium">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1a2e1a]">
        <FoodImage place={place} />
      </div>
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div>
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag, index) => (
              <Badge
                key={`${place.name}-${tag}`}
                className={cn(
                  index === 0
                    ? "border-alpine-pine/20 bg-alpine-pine text-white dark:bg-alpine-sunset dark:text-[#17251f]"
                    : "bg-accent/70 text-foreground",
                )}
              >
                {tag}
              </Badge>
            ))}
            {hiddenCount ? (
              <Badge className="border-border bg-background/70 text-muted-foreground">
                +{hiddenCount}
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-5 font-display text-2xl font-semibold leading-tight">{place.name}</h3>
        </div>
        <div className="grid gap-2 rounded-md border border-border/70 bg-background/45 p-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-alpine-wine" />
            <span>{place.hours}</span>
          </span>
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <MapPin className="h-4 w-4 shrink-0 text-alpine-wine" />
            <span className="line-clamp-1">{place.location}</span>
          </a>
          <a
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <Instagram className="h-4 w-4 shrink-0 text-alpine-wine" />
            <span className="line-clamp-1">{place.instagram}</span>
          </a>
        </div>
        <div className="mt-auto grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline">
            <Link href={detailHref}>
              Ver detalhes <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="warm">
            <a href={`https://wa.me/${place.whatsapp}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
