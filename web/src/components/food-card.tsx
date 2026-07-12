import dynamic from "next/dynamic";
import { ArrowRight, Clock, Instagram, MapPin, MessageCircle, Sparkles, Utensils } from "lucide-react";
import { BusinessStatusBadge } from "@/components/business-status-badge";
import { SafeImage } from "@/components/safe-image";
import { TrackedLink } from "@/components/tracked-link";
import { TrackView } from "@/components/track-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FoodPlace } from "@/lib/data";
import { getCommercialFeatures, isGoldPlan, whatsappUrl } from "@/lib/commercial";
import { googleMapsSearchUrl, instagramUrlFromHandle } from "@/lib/links";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

const CardMediaCarousel = dynamic(() =>
  import("@/components/card-media-carousel").then((module) => module.CardMediaCarousel),
);

const logoImageSignals = [
  "logo",
  "marca",
  "brand",
  "avatar",
  "profile",
  "/banners/",
  "/images/encontro.webp",
];
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
    visibleTags: orderedTags.slice(0, 3),
    hiddenCount: Math.max(orderedTags.length - 3, 0),
  };
}

function FoodImage({ place }: { place: FoodPlace }) {
  const image = place.image?.trim();
  const logo = place.logo?.trim();
  const galleryPhoto = place.commercialFeatures?.gallery
    ? place.galleryImages?.find((galleryImage) => {
        const normalizedImage = galleryImage.trim();
        return normalizedImage !== logo && shouldShowPhoto(normalizedImage);
      })
    : undefined;
  const displayImage = galleryPhoto || image || logo;
  const displaysLogo = Boolean(displayImage && (displayImage === logo || !shouldShowPhoto(displayImage)));

  if (displayImage) {
    return (
      <SafeImage
        src={displayImage}
        alt={`Imagem de ${place.name}`}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        quality={84}
        className={cn(displaysLogo ? "bg-white object-contain" : "object-cover")}
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

export function FoodCard({ place, compact = false }: { place: FoodPlace; compact?: boolean }) {
  const instagramHref = place.instagram ? place.instagramUrl || instagramUrlFromHandle(place.instagram) : null;
  const mapHref = place.mapUrl || googleMapsSearchUrl(place.name, place.location);
  const detailHref = `/restaurantes/${place.slug || slugify(place.name)}`;
  const { visibleTags, hiddenCount } = getVisibleTags(place);
  const features = place.commercialFeatures || getCommercialFeatures(place.plan, {
    status: place.planStatus,
    customFeatures: place.customFeatures,
    pageEnabled: place.pageEnabled,
    galleryEnabled: Boolean(place.galleryImages?.length),
    carouselEnabled: (place.galleryImages?.length || 0) > 1,
    highlighted: place.isFeatured,
  });
  const isGold = isGoldPlan(place.plan);
  const showDetails = features.individualPage;
  const cardImages = Array.from(new Set([
    place.image,
    ...(place.galleryImages || []),
    place.logo || "",
  ].filter(Boolean)));
  const entityId = place.id;
  const analyticsMeta = {
    establishmentName: place.name,
    category: place.category,
    planType: place.plan || "bronze",
  };

  return (
    <TrackView entityType="restaurant" entityId={entityId} className="h-full" {...analyticsMeta}>
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 ease-out",
        features.highlighted
          ? "border-2 border-[#d7aa58]/75 bg-[#FCF8F5] shadow-[0_14px_40px_rgba(90,67,0,0.10)] hover:-translate-y-1 hover:border-[#c89539] hover:shadow-[0_20px_52px_rgba(90,67,0,0.14)] dark:border-alpine-sunset/60 dark:bg-card dark:shadow-[0_18px_45px_rgba(236,171,92,0.13)] dark:hover:border-alpine-sunset/80 dark:hover:shadow-[0_20px_54px_rgba(236,171,92,0.18)]"
          : "border-border hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      {features.highlighted ? (
        <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 bg-gradient-to-r from-transparent via-[#d7aa58] to-transparent dark:via-alpine-sunset/75" />
      ) : null}
      <div
        className={cn(
          "relative overflow-hidden bg-[#1a2e1a]",
          compact ? "aspect-[3/2]" : "aspect-[4/3]",
        )}
      >
        {features.carousel && cardImages.length > 1 ? (
          <CardMediaCarousel
            images={cardImages}
            name={place.name}
            entityType="restaurant"
            entityId={entityId}
            category={place.category}
            planType={place.plan}
            limit={place.carouselPhotoLimit || 5}
            logoImage={place.logo}
          />
        ) : (
          <FoodImage place={place} />
        )}
        {features.highlighted ? (
          <span className="pointer-events-none absolute left-3 top-3 inline-flex select-none items-center gap-1.5 rounded-full border border-[#dfc277] bg-[#f4e5c4] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5a4300] shadow-sm backdrop-blur-md dark:border-alpine-sunset/45 dark:bg-alpine-sunset/15 dark:text-alpine-sunset">
            <Sparkles className="h-3 w-3" />
            {isGold ? "Ouro" : "Destaque"}
          </span>
        ) : null}
      </div>
      <div className={cn("flex flex-1 flex-col", compact ? "gap-4 p-4 lg:p-5" : "gap-5 p-5")}>
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
          <h3 className={cn("font-display text-2xl font-semibold leading-tight", compact ? "mt-4" : "mt-5")}>
            {place.name}
          </h3>
        </div>
        <div className="grid gap-2 rounded-md border border-border/70 bg-background/45 p-3 text-sm text-muted-foreground">
          <BusinessStatusBadge
            businessHours={place.businessHours}
            fallbackHours={place.hours}
            compact
            className="mb-1 w-fit"
          />
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-alpine-wine" />
            <span>{place.hours}</span>
          </span>
          <TrackedLink
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            entityType="restaurant"
            entityId={entityId}
            eventType="map_click"
            {...analyticsMeta}
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <MapPin className="h-4 w-4 shrink-0 text-alpine-wine" />
            <span className="line-clamp-1">{place.location}</span>
          </TrackedLink>
          {instagramHref && features.instagram ? (
            <TrackedLink
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              entityType="restaurant"
              entityId={entityId}
              eventType="instagram_click"
              {...analyticsMeta}
              className="flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Instagram className="h-4 w-4 shrink-0 text-alpine-wine" />
              <span className="line-clamp-1">{place.instagram}</span>
            </TrackedLink>
          ) : null}
        </div>
        <div className={cn("mt-auto grid gap-2", showDetails ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {showDetails ? (
            <Button asChild variant="outline">
              <TrackedLink href={detailHref} entityType="restaurant" entityId={entityId} eventType="details_click" {...analyticsMeta}>
                Ver detalhes <ArrowRight className="h-4 w-4" />
              </TrackedLink>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <TrackedLink
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              entityType="restaurant"
              entityId={entityId}
              eventType="map_click"
              {...analyticsMeta}
            >
              <MapPin className="h-4 w-4" /> Como chegar
            </TrackedLink>
          </Button>
          <Button asChild variant="warm">
            <TrackedLink
              href={whatsappUrl(place.whatsapp, place.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              entityType="restaurant"
              entityId={entityId}
              eventType="whatsapp_click"
              {...analyticsMeta}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </TrackedLink>
          </Button>
        </div>
      </div>
    </article>
    </TrackView>
  );
}
