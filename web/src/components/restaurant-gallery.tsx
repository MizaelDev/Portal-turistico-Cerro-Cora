"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryLightbox } from "@/components/gallery-lightbox";
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
  const lightboxTriggerRef = useRef<HTMLButtonElement | null>(null);
  const hasMultipleImages = uniqueImages.length > 1;
  const activeImage = uniqueImages[activeIndex] || "";
  const activeSrc = failedImages.has(activeImage) ? fallbackImage : activeImage;
  const thumbnailImages = uniqueImages.slice(0, 4);
  const remainingImageCount = Math.max(0, uniqueImages.length - thumbnailImages.length);

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
            onClick={(event) => {
              lightboxTriggerRef.current = event.currentTarget;
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

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {thumbnailImages.map((image, index) => {
          const isOverflowThumbnail = index === 3 && remainingImageCount > 0;
          const isActiveThumbnail =
            activeIndex === index || (isOverflowThumbnail && activeIndex >= index);
          const remainingLabel = `+${remainingImageCount} ${remainingImageCount === 1 ? "foto" : "fotos"}`;

          return (
            <button
              key={image}
              type="button"
              aria-label={
                isOverflowThumbnail
                  ? `Abrir galeria com mais ${remainingImageCount} ${remainingImageCount === 1 ? "foto" : "fotos"}`
                  : `Abrir foto ${index + 1}`
              }
              onClick={(event) => {
                trackGalleryInteraction("gallery_click");
                setActiveIndex(index);
                if (isOverflowThumbnail) {
                  lightboxTriggerRef.current = event.currentTarget;
                  setIsLightboxOpen(true);
                }
              }}
              className={cn(
                "relative aspect-[4/3] min-w-0 overflow-hidden rounded-md border bg-muted transition-all",
                isActiveThumbnail
                  ? "border-alpine-sunset ring-2 ring-alpine-sunset/30"
                  : "border-border opacity-75 hover:opacity-100",
              )}
            >
              <Image
                src={failedImages.has(image) ? fallbackImage : image}
                alt={imageAltTexts[index] || `Miniatura ${index + 1} de ${name}`}
                fill
                sizes="(min-width: 640px) 180px, 25vw"
                quality={75}
                loading="lazy"
                onError={() => markImageAsFailed(image)}
                className="object-cover"
              />
              {isOverflowThumbnail ? (
                <span className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-2 text-xs font-semibold text-white drop-shadow-sm sm:p-3">
                  {remainingLabel}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <GalleryLightbox
        open={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
        title={`Galeria ampliada de ${name}`}
        hasMultipleImages={hasMultipleImages}
        onPrevious={goToPrevious}
        onNext={goToNext}
        counter={`${activeIndex + 1}/${uniqueImages.length}`}
        returnFocusRef={lightboxTriggerRef}
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
      </GalleryLightbox>
    </div>
  );
}
