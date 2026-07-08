import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BedDouble, Info, MapPin, MessageCircle, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Lodging } from "@/lib/data";
import { googleMapsSearchUrl } from "@/lib/links";
import { slugify } from "@/lib/slug";

export function LodgingCard({ lodging }: { lodging: Lodging }) {
  const mapHref = lodging.mapUrl || googleMapsSearchUrl(lodging.name, lodging.address || lodging.location);
  const detailHref = `/pousadas/${lodging.slug || slugify(lodging.name)}`;
  const amenities = (lodging.amenities || lodging.highlights || []).slice(0, 4);

  return (
    <article className="grid overflow-hidden rounded-lg border border-border bg-card shadow-sm md:grid-cols-[1.05fr_0.95fr]">
      <div className="relative min-h-80">
        <Image
          src={lodging.image}
          alt={`Foto principal de ${lodging.name}`}
          fill
          sizes="(min-width: 768px) 55vw, 100vw"
          quality={78}
          className="object-cover"
        />
      </div>

      <div className="flex flex-col p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md border border-border bg-accent px-3 py-1 text-xs font-semibold text-muted-foreground">
            {lodging.category || "Pousada"}
          </span>
          {lodging.acceptsReservations === false ? null : (
            <span className="rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Aceita reservas
            </span>
          )}
        </div>

        <h3 className="mt-4 font-display text-3xl font-semibold">{lodging.name}</h3>

        {amenities.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/55 px-2.5 py-1 text-xs font-semibold text-muted-foreground"
              >
                <BedDouble className="h-3.5 w-3.5 text-alpine-wine" />
                {amenity}
              </span>
            ))}
          </div>
        ) : null}

        {lodging.mainDifferential ? (
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{lodging.mainDifferential}</p>
        ) : null}

        <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <MapPin className="h-4 w-4 shrink-0 text-alpine-wine" />
            <span>{lodging.location}</span>
          </a>

          <span className="flex items-center gap-2">
            <WalletCards className="h-4 w-4 shrink-0 text-alpine-wine" />
            {lodging.priceRange}
            {lodging.priceDisclaimer ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex cursor-help items-center outline-none">
                    <Info className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] text-xs">
                  {lodging.priceDisclaimer}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </span>
        </div>

        <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-3">
          <Button asChild variant="outline" className="sm:col-span-3">
            <Link href={detailHref}>
              Conhecer hospedagem <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href={`https://wa.me/${lodging.whatsapp}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </Button>
          <Button asChild variant="warm" className="sm:col-span-2">
            <a href={`https://wa.me/${lodging.whatsapp}?text=Quero%20reservar`} target="_blank" rel="noopener noreferrer">
              Reservar
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
