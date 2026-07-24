import dynamic from "next/dynamic";
import { BedDouble, CalendarCheck, CalendarX, Info, Instagram, MapPin, Phone, WalletCards } from "lucide-react";
import { BusinessStatusBadge } from "@/components/business-status-badge";
import { EstablishmentCardActions } from "@/components/establishment-card-actions";
import { SafeImage } from "@/components/safe-image";
import { TrackedLink } from "@/components/tracked-link";
import { TrackView } from "@/components/track-view";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Lodging } from "@/lib/data";
import { googleMapsSearchUrl, instagramLabel, instagramUrlFromHandle } from "@/lib/links";
import { slugify } from "@/lib/slug";

const CardMediaCarousel = dynamic(() =>
  import("@/components/card-media-carousel").then((module) => module.CardMediaCarousel),
);

function stayTimeLabel(kind: "check-in" | "check-out", value: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  if (/a partir|até/i.test(normalized)) return `${kind === "check-in" ? "Check-in" : "Check-out"}: ${normalized}`;
  return kind === "check-in"
    ? `Check-in: a partir das ${normalized}`
    : `Check-out: até ${normalized}`;
}

export function LodgingCard({ lodging }: { lodging: Lodging }) {
  const location = lodging.address || lodging.location;
  const mapHref = lodging.mapUrl || (location ? googleMapsSearchUrl(lodging.name, location) : undefined);
  const detailHref = `/pousadas/${lodging.slug || slugify(lodging.name)}`;
  const amenities = (lodging.amenities || lodging.highlights || []).slice(0, 4);
  const showDetails = true;
  const cardImages = Array.from(new Set([lodging.image, ...lodging.gallery].filter(Boolean)));
  const entityId = lodging.id;
  const instagramHref = lodging.instagram
    ? lodging.instagramUrl || instagramUrlFromHandle(lodging.instagram)
    : null;
  const phoneHref = lodging.phone ? `tel:${lodging.phone.replace(/[^\d+]/g, "")}` : null;
  const analyticsMeta = {
    establishmentName: lodging.name,
    category: lodging.category || "Pousada",
  };

  return (
    <TrackView entityType="lodging" entityId={entityId} {...analyticsMeta}>
    <article
      className="relative grid overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md md:grid-cols-[1.05fr_0.95fr]"
    >
      <div className="relative min-h-80">
        {lodging.carouselEnabled !== false && cardImages.length > 1 ? (
          <CardMediaCarousel
            images={cardImages}
            name={lodging.name}
            entityType="lodging"
            entityId={entityId}
            category={lodging.category || "Pousada"}
            limit={10}
          />
        ) : (
          <SafeImage
            src={lodging.image}
            alt={`Foto principal de ${lodging.name}`}
            fill
            sizes="(min-width: 768px) 55vw, 100vw"
            quality={78}
            className={lodging.imageIsLogo ? "bg-white object-contain p-8" : "object-cover"}
          />
        )}
      </div>

      <div className="flex flex-col p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md border border-border bg-accent px-3 py-1 text-xs font-semibold text-muted-foreground">
            {lodging.category || "Pousada"}
          </span>
        </div>

        <h3 className="mt-4 font-display text-3xl font-semibold">{lodging.name}</h3>

        {showDetails && amenities.length ? (
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

        {showDetails && lodging.mainDifferential ? (
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{lodging.mainDifferential}</p>
        ) : null}

        <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
          <BusinessStatusBadge
            businessHours={lodging.businessHours}
            context="lodging"
            className="mb-1 w-fit max-w-full"
          />
          <TrackedLink
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            entityType="lodging"
            entityId={entityId}
            eventType="map_click"
            {...analyticsMeta}
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <MapPin className="h-4 w-4 shrink-0 text-alpine-wine" />
            <span>{lodging.location}</span>
          </TrackedLink>

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
          {lodging.checkIn ? (
            <span className="flex items-start gap-2">
              <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-alpine-wine" />
              <span>{stayTimeLabel("check-in", lodging.checkIn)}</span>
            </span>
          ) : null}
          {lodging.checkOut ? (
            <span className="flex items-start gap-2">
              <CalendarX className="mt-0.5 h-4 w-4 shrink-0 text-alpine-wine" />
              <span>{stayTimeLabel("check-out", lodging.checkOut)}</span>
            </span>
          ) : null}
          {instagramHref && lodging.instagram ? (
            <TrackedLink
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              entityType="lodging"
              entityId={entityId}
              eventType="instagram_click"
              {...analyticsMeta}
              className="flex min-w-0 items-center gap-2 transition-colors hover:text-primary"
            >
              <Instagram className="h-4 w-4 shrink-0 text-alpine-wine" />
              <span className="min-w-0 truncate">{instagramLabel(lodging.instagram)}</span>
            </TrackedLink>
          ) : null}
          {phoneHref && lodging.phone ? (
            <TrackedLink
              href={phoneHref}
              entityType="lodging"
              entityId={entityId}
              eventType="phone_click"
              {...analyticsMeta}
              className="flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Phone className="h-4 w-4 shrink-0 text-alpine-wine" />
              <span>{lodging.phone}</span>
            </TrackedLink>
          ) : null}
        </div>

        <EstablishmentCardActions
          entityType="lodging"
          entityId={entityId}
          establishmentName={lodging.name}
          category={lodging.category || "Pousada"}
          detailsUrl={showDetails ? detailHref : undefined}
          mapsUrl={mapHref}
          whatsappNumber={lodging.whatsapp}
          whatsappMessage={lodging.whatsappMessage}
          className="pt-5"
        />
      </div>
    </article>
    </TrackView>
  );
}
