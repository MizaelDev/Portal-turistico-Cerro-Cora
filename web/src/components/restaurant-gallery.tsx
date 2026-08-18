"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdjacentImagePreload } from "@/hooks/use-adjacent-image-preload";
import { analyticsService, type CommercialEntityType } from "@/lib/analytics";
import { useCarouselSwipe } from "@/hooks/use-carousel-swipe";
import { cn } from "@/lib/utils";

type RestaurantGalleryProps = {
  images: string[];
  name: string;
  entityId?: string;
  category?: string;
  entityType?: CommercialEntityType;
  altTexts?: string[];
  mainImageFit?: "cover" | "contain";
  enableLightbox?: boolean;
};

const fallbackImage = "/images/cerro-cora.jpg";
const imageSizes = "(min-width: 1024px) 960px, 100vw";
const galleryQuality = 90;

export function RestaurantGallery({
  images,
  name,
  entityId,
  category,
  entityType = "restaurant",
  altTexts = [],
  mainImageFit = "cover",
  enableLightbox = false,
}: RestaurantGalleryProps) {
  const uniqueImages = useMemo(
    () => Array.from(new Set(images.map((image) => image.trim()).filter(Boolean))),
    [images],
  );
  const imageAltTexts = useMemo(
    () => uniqueImages.map((image) => altTexts[images.indexOf(image)]?.trim() || ""),
    [altTexts, images, uniqueImages],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const hasMultipleImages = uniqueImages.length > 1;
  const activeImage = uniqueImages[activeIndex] || "";
  const activeSrc = failedImages.has(activeImage) ? fallbackImage : activeImage;

  useAdjacentImagePreload({
    images: uniqueImages,
    activeIndex,
    sizes: imageSizes,
    quality: galleryQuality,
    enabled: hasMultipleImages,
  });

  const markImageAsFailed = useCallback((src: string) => {
    setFailedImages((current) => {
      if (!src || current.has(src)) return current;

      const next = new Set(current);
      next.add(src);
      return next;
    });
  }, []);

  const trackGalleryInteraction = useCallback(
    (eventType: "gallery_click" | "carousel_click") => {
      analyticsService.track({
        entityType,
        entityId,
        eventType,
        establishmentName: name,
        category,
      });
    },
    [category, entityId, entityType, name],
  );

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

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLightboxOpen(false);
      if (event.key === "ArrowLeft" && hasMultipleImages) goToPrevious();
      if (event.key === "ArrowRight" && hasMultipleImages) goToNext();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [goToNext, goToPrevious, hasMultipleImages, isLightboxOpen]);

  if (!uniqueImages.length) return null;

  return (
    <div className="grid gap-4">
      <div
        className={cn(
          "relative touch-pan-y overflow-hidden rounded-lg border border-border",
          mainImageFit === "contain"
            ? "h-[70vh] min-h-[320px] max-h-[620px] bg-muted/70 dark:bg-black/25"
            : "aspect-[16/10] bg-muted",
        )}
        {...swipeHandlers}
      >
        <Image
          key={activeSrc}
          src={activeSrc}
          alt={imageAltTexts[activeIndex] || `Foto ${activeIndex + 1} de ${name}`}
          fill
          sizes={imageSizes}
          quality={galleryQuality}
          loading="lazy"
          onError={() => markImageAsFailed(activeImage)}
          className={cn(
            "object-center",
            mainImageFit === "contain"
              ? "object-contain"
              : "object-cover transition-transform duration-500 hover:scale-[1.02]",
          )}
        />

        {mainImageFit === "cover" ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        ) : null}

        {enableLightbox ? (
          <Button
            type="button"
            variant="glass"
            size="icon"
            aria-label="Ampliar foto"
            className="absolute right-3 top-3"
            onClick={() => {
              trackGalleryInteraction("gallery_click");
              setIsLightboxOpen(true);
            }}
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        ) : null}

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
                alt={imageAltTexts[index] || `Miniatura ${index + 1} de ${name}`}
                fill
                sizes="120px"
                quality={75}
                loading="lazy"
                onError={() => markImageAsFailed(image)}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {enableLightbox && isLightboxOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galeria ampliada de ${name}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            aria-label="Fechar galeria ampliada"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-black/70 text-white transition-colors hover:bg-black sm:right-6 sm:top-6"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="relative h-full w-full max-w-[1600px]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              key={`lightbox-${activeSrc}`}
              src={activeSrc}
              alt={imageAltTexts[activeIndex] || `Foto ${activeIndex + 1} de ${name}`}
              fill
              sizes="100vw"
              quality={92}
              onError={() => markImageAsFailed(activeImage)}
              className="object-contain object-center"
            />
          </div>

          {hasMultipleImages ? (
            <>
              <Button
                type="button"
                variant="glass"
                size="icon"
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 sm:left-6"
                onClick={(event) => {
                  event.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                type="button"
                variant="glass"
                size="icon"
                aria-label="Próxima foto"
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 sm:right-6"
                onClick={(event) => {
                  event.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          ) : null}

          <span className="absolute bottom-4 right-4 z-20 rounded-md border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white sm:bottom-6 sm:right-6">
            {activeIndex + 1}/{uniqueImages.length}
          </span>
        </div>
      ) : null}
    </div>
  );
}