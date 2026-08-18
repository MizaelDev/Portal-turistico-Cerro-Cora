import dynamic from "next/dynamic";
import { Instagram, MapPin, Phone, WalletCards } from "lucide-react";
import { BusinessStatusBadge } from "@/components/business-status-badge";
import { EstablishmentCardActions } from "@/components/establishment-card-actions";
import { SafeImage } from "@/components/safe-image";
import { TrackedLink } from "@/components/tracked-link";
import { TrackView } from "@/components/track-view";
import type { Lodging } from "@/lib/data";
import { googleMapsSearchUrl, instagramLabel, instagramUrlFromHandle } from "@/lib/links";
import { slugify } from "@/lib/slug";

const CardMediaCarousel = dynamic(() =>
  import("@/components/card-media-carousel").then((module) => module.CardMediaCarousel),
);

export function LodgingCard({ lodging, priority = false }: { lodging: Lodging; priority?: boolean }) {
  const location = lodging.address || lodging.location;
  const mapHref = lodging.mapUrl || (location ? googleMapsSearchUrl(lodging.name, location) : undefined);
  const detailHref = `/pousadas/${lodging.slug || slugify(lodging.name)}`;
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
      <div className="relative aspect-[4/3] min-h-56 md:aspect-auto md:min-h-[280px]">
        {lodging.carouselEnabled !== false && cardImages.length > 1 ? (
          <CardMediaCarousel
            images={cardImages}
            name={lodging.name}
            entityType="lodging"
            entityId={entityId}
            category={lodging.category || "Pousada"}
            limit={10}
            priority={priority}
            sizes="(min-width: 1280px) 640px, (min-width: 768px) 52vw, 100vw"
            quality={88}
          />
        ) : (
          <SafeImage
            src={lodging.image}
            alt={`Foto principal de ${lodging.name}`}
            fill
            sizes="(min-width: 1280px) 640px, (min-width: 768px) 52vw, 100vw"
            quality={88}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            className={lodging.imageIsLogo ? "bg-white object-contain p-8" : "object-cover"}
          />
        )}
      </div>

      <div className="flex flex-col p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md border border-border bg-accent px-3 py-1 text-xs font-semibold text-muted-foreground">
            {lodging.category || "Pousada"}
          </span>
        </div>

        <h3 className="mt-3 font-display text-2xl font-semibold md:text-3xl">{lodging.name}</h3>
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
            Consulte valores
          </span>
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
          className="pt-4"
        />
      </div>
    </article>
    </TrackView>
  );
}
