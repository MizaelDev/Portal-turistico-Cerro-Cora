import dynamic from "next/dynamic";
import { ArrowRight, BedDouble, CalendarCheck, CalendarX, Info, Instagram, MapPin, MessageCircle, Phone, Sparkles, WalletCards } from "lucide-react";
import { BusinessStatusBadge } from "@/components/business-status-badge";
import { SafeImage } from "@/components/safe-image";
import { TrackedLink } from "@/components/tracked-link";
import { TrackView } from "@/components/track-view";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Lodging } from "@/lib/data";
import { getCommercialFeatures, isGoldPlan, whatsappUrl } from "@/lib/commercial";
import { googleMapsSearchUrl, instagramLabel, instagramUrlFromHandle } from "@/lib/links";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

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
  const mapHref = lodging.mapUrl || googleMapsSearchUrl(lodging.name, lodging.address || lodging.location);
  const detailHref = `/pousadas/${lodging.slug || slugify(lodging.name)}`;
  const amenities = (lodging.amenities || lodging.highlights || []).slice(0, 4);
  const features = lodging.commercialFeatures || getCommercialFeatures(lodging.plan, {
    status: lodging.planStatus,
    customFeatures: lodging.customFeatures,
    pageEnabled: lodging.pageEnabled,
    galleryEnabled: Boolean(lodging.gallery.length),
    carouselEnabled: lodging.gallery.length > 1,
    highlighted: lodging.isFeatured,
    bookingEnabled: lodging.acceptsReservations,
  });
  const isGold = isGoldPlan(lodging.plan);
  const showDetails = features.individualPage;
  const cardImages = Array.from(new Set([lodging.image, ...lodging.gallery].filter(Boolean)));
  const entityId = lodging.id;
  const instagramHref = lodging.instagram
    ? lodging.instagramUrl || instagramUrlFromHandle(lodging.instagram)
    : null;
  const phoneHref = lodging.phone ? `tel:${lodging.phone.replace(/[^\d+]/g, "")}` : null;
  const analyticsMeta = {
    establishmentName: lodging.name,
    category: lodging.category || "Pousada",
    planType: lodging.plan || "bronze",
  };

  return (
    <TrackView entityType="lodging" entityId={entityId} {...analyticsMeta}>
    <article
      className={cn(
        "relative grid overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 ease-out md:grid-cols-[1.05fr_0.95fr]",
        features.highlighted
          ? "border-2 border-[#d7aa58]/75 bg-[#FCF8F5] shadow-[0_14px_40px_rgba(90,67,0,0.10)] hover:-translate-y-1 hover:border-[#c89539] hover:shadow-[0_20px_52px_rgba(90,67,0,0.14)] dark:border-alpine-sunset/60 dark:bg-card dark:shadow-[0_18px_45px_rgba(236,171,92,0.13)] dark:hover:border-alpine-sunset/80 dark:hover:shadow-[0_20px_54px_rgba(236,171,92,0.18)]"
          : "border-border hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      {features.highlighted ? (
        <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 bg-gradient-to-r from-transparent via-[#d7aa58] to-transparent dark:via-alpine-sunset/75" />
      ) : null}
      <div className="relative min-h-80">
        {features.carousel && cardImages.length > 1 ? (
          <CardMediaCarousel
            images={cardImages}
            name={lodging.name}
            entityType="lodging"
            entityId={entityId}
            category={lodging.category || "Pousada"}
            planType={lodging.plan}
            limit={lodging.carouselPhotoLimit || 5}
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
        {features.highlighted ? (
          <span className="pointer-events-none absolute left-4 top-4 inline-flex select-none items-center gap-1.5 rounded-full border border-[#dfc277] bg-[#f4e5c4] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5a4300] shadow-sm backdrop-blur-md dark:border-alpine-sunset/45 dark:bg-alpine-sunset/15 dark:text-alpine-sunset">
            <Sparkles className="h-3 w-3" />
            {isGold ? "Ouro" : "Destaque"}
          </span>
        ) : null}
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
          {features.instagram && instagramHref && lodging.instagram ? (
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

        <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-2">
          {showDetails ? (
            <Button asChild variant="outline" className="sm:col-span-2">
              <TrackedLink href={detailHref} entityType="lodging" entityId={entityId} eventType="details_click" {...analyticsMeta}>
                Conhecer hospedagem <ArrowRight className="h-4 w-4" />
              </TrackedLink>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <TrackedLink
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              entityType="lodging"
              entityId={entityId}
              eventType="map_click"
              {...analyticsMeta}
            >
              <MapPin className="h-4 w-4" /> Como chegar
            </TrackedLink>
          </Button>
          <Button asChild variant="outline">
            <TrackedLink
              href={whatsappUrl(lodging.whatsapp, lodging.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              entityType="lodging"
              entityId={entityId}
              eventType="whatsapp_click"
              {...analyticsMeta}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </TrackedLink>
          </Button>
          {features.bookingButton ? (
          <Button asChild variant="warm" className="sm:col-span-2">
            <TrackedLink
              href={whatsappUrl(lodging.whatsapp, lodging.whatsappMessage || "Olá! Encontrei sua hospedagem pelo Portal Turístico de Cerro Corá e gostaria de saber sobre disponibilidade.")}
              target="_blank"
              rel="noopener noreferrer"
              entityType="lodging"
              entityId={entityId}
              eventType="reserve_click"
              {...analyticsMeta}
            >
              Reservar
            </TrackedLink>
          </Button>
          ) : null}
        </div>
      </div>
    </article>
    </TrackView>
  );
}
