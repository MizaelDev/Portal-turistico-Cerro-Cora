"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyticsService } from "@/lib/analytics";
import { useCarouselSwipe } from "@/hooks/use-carousel-swipe";
import { cn } from "@/lib/utils";

type RestaurantGalleryProps = {
  images: string[];
  name: string;
  entityId?: string;
  category?: string;
};

const fallbackImage = "/images/cerro-cora.jpg";

export function RestaurantGallery({ images, name, entityId, category }: RestaurantGalleryProps) {
  const uniqueImages = useMemo(
    () => Array.from(new Set(images.map((image) => image.trim()).filter(Boolean))),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const hasMultipleImages = uniqueImages.length > 1;
  const activeImage = uniqueImages[activeIndex] || "";
  const activeSrc = failedImages.has(activeImage) ? fallbackImage : activeImage;

  const markImageAsFailed = useCallback((src: string) => {
    setFailedImages((current) => {
      if (!src || current.has(src)) return current;

      const next = new Set(current);
      next.add(src);
      return next;
    });
  }, []);

  const trackGalleryInteraction = useCallback((eventType: "gallery_click" | "carousel_click") => {
    analyticsService.track({
      entityType: "restaurant",
      entityId,
      eventType,
      establishmentName: name,
      category,
    });
  }, [category, entityId, name]);

  const goToPrevious = useCallback(() => {
    trackGalleryInteraction("carousel_click");
    setActiveIndex((current) => (current === 0 ? uniqueImages.length - 1 : current - 1));
  }, [trackGalleryInteraction, uniqueImages.length]);

  const goToNext = useCallback(() => {
    trackGalleryInteraction("carousel_click");
    setActiveIndex((current) => (current === uniqueImages.length - 1 ? 0 : current + 1));
  }, [trackGalleryInteraction, uniqueImages.length]);
  const swipeHandlers = useCarouselSwipe({
    enabled: hasMultipleImages,
    onPrevious: goToPrevious,
    onNext: goToNext,
  });

  if (!uniqueImages.length) return null;

  return (
    <div className="grid gap-4">
      <div
        className="relative aspect-[16/10] touch-pan-y overflow-hidden rounded-lg border border-border bg-muted"
        {...swipeHandlers}
      >
        <Image
          key={activeSrc}
          src={activeSrc}
          alt={`Foto ${activeIndex + 1} de ${name}`}
          fill
          sizes="(min-width: 1024px) 960px, 100vw"
          quality={78}
          loading="lazy"
          onError={() => markImageAsFailed(activeImage)}
          className="object-cover transition-transform duration-500 hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        {hasMultipleImages ? (
          <>
            <Button
              type="button"
              variant="glass"
              size="icon"
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="glass"
              size="icon"
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        ) : null}

        <span className="absolute bottom-3 right-3 rounded-md border border-white/20 bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
          {activeIndex + 1}/{uniqueImages.length}
        </span>
      </div>

      {hasMultipleImages ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {uniqueImages.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`Abrir foto ${index + 1}`}
              onClick={() => {
                trackGalleryInteraction("gallery_click");
                setActiveIndex(index);
              }}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-md border bg-muted transition-all",
                activeIndex === index
                  ? "border-alpine-sunset ring-2 ring-alpine-sunset/30"
                  : "border-border opacity-75 hover:opacity-100",
              )}
            >
              <Image
                src={failedImages.has(image) ? fallbackImage : image}
                alt={`Miniatura ${index + 1} de ${name}`}
                fill
                sizes="120px"
                quality={52}
                loading="lazy"
                onError={() => markImageAsFailed(image)}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
