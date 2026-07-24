"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { analyticsService, type CommercialEntityType } from "@/lib/analytics";
import { useCarouselSwipe } from "@/hooks/use-carousel-swipe";
import { cn } from "@/lib/utils";

type CardMediaCarouselProps = {
  images: string[];
  name: string;
  entityType: CommercialEntityType;
  entityId?: string;
  category?: string;
  limit: number;
  logoImage?: string;
  className?: string;
};

const logoSignals = ["logo", "marca", "brand", "avatar", "profile", "/banners/", "encontro.webp"];

function isLikelyLogo(src: string) {
  const normalized = src.toLowerCase();
  return logoSignals.some((signal) => normalized.includes(signal));
}

export function CardMediaCarousel({
  images,
  name,
  entityType,
  entityId,
  category,
  limit,
  logoImage,
  className,
}: CardMediaCarouselProps) {
  const availableImages = useMemo(() => {
    const uniqueImages = Array.from(new Set(images.map((image) => image.trim()).filter(Boolean)));
    const normalizedLogo = logoImage?.trim();

    if (!normalizedLogo || !uniqueImages.includes(normalizedLogo) || limit < 2) {
      return uniqueImages.slice(0, limit);
    }

    return [
      ...uniqueImages.filter((image) => image !== normalizedLogo).slice(0, limit - 1),
      normalizedLogo,
    ];
  }, [images, limit, logoImage]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const hasMultipleImages = availableImages.length > 1;
  const activeImage = availableImages[activeIndex] || "/images/cerro-cora.jpg";
  const activeSrc = failedImages.has(activeImage) ? "/images/cerro-cora.jpg" : activeImage;

  const trackCarousel = useCallback(() => {
    analyticsService.track({
      entityType,
      entityId,
      eventType: "carousel_click",
      establishmentName: name,
      category,
    });
  }, [category, entityId, entityType, name]);

  const goToPrevious = useCallback(() => {
    trackCarousel();
    setActiveIndex((current) => (current === 0 ? availableImages.length - 1 : current - 1));
  }, [availableImages.length, trackCarousel]);

  const goToNext = useCallback(() => {
    trackCarousel();
    setActiveIndex((current) => (current === availableImages.length - 1 ? 0 : current + 1));
  }, [availableImages.length, trackCarousel]);

  const swipeHandlers = useCarouselSwipe({
    enabled: hasMultipleImages,
    onPrevious: goToPrevious,
    onNext: goToNext,
  });

  return (
    <div className={cn("relative h-full w-full touch-pan-y overflow-hidden bg-[#1a2e1a]", className)} {...swipeHandlers}>
      <Image
        key={activeSrc}
        src={activeSrc}
        alt={`Foto ${activeIndex + 1} de ${name}`}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        quality={82}
        loading="lazy"
        onError={() => {
          setFailedImages((current) => new Set(current).add(activeImage));
        }}
        className={cn(
          activeSrc === logoImage || isLikelyLogo(activeSrc)
            ? "bg-white object-contain"
            : "object-cover",
        )}
      />

      {hasMultipleImages ? (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            onClick={goToNext}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
            {availableImages.map((image, index) => (
              <span
                key={image}
                className={cn("h-1.5 rounded-full bg-white/65 transition-all", index === activeIndex ? "w-5" : "w-1.5")}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
