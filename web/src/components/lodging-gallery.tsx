"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { useAdjacentImagePreload } from "@/hooks/use-adjacent-image-preload";
import { analyticsService } from "@/lib/analytics";
import { useCarouselSwipe } from "@/hooks/use-carousel-swipe";
import { cn } from "@/lib/utils";

type LodgingGalleryProps = {
  images: string[];
  name: string;
  entityId?: string;
  category?: string;
};

type ImageSize = {
  width: number;
  height: number;
};

const fallbackImage = "/images/cerro-cora.jpg";
const responsiveImageSizes = "(min-width: 1280px) 1024px, (min-width: 768px) 90vw, 100vw";
const galleryQuality = 90;

export function LodgingGallery({ images, name, entityId, category }: LodgingGalleryProps) {
  const uniqueImages = useMemo(
    () => Array.from(new Set(images.map((image) => image.trim()).filter(Boolean))),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageSizes, setImageSizes] = useState<Record<string, ImageSize>>({});
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const lightboxTriggerRef = useRef<HTMLButtonElement | null>(null);
  const hasMultipleImages = uniqueImages.length > 1;
  const activeImage = uniqueImages[activeIndex] || "";
  const activeSrc = failedImages.has(activeImage) ? fallbackImage : activeImage;
  const thumbnailImages = uniqueImages.slice(0, 4);
  const remainingImageCount = Math.max(0, uniqueImages.length - thumbnailImages.length);

  useAdjacentImagePreload({
    images: uniqueImages,
    activeIndex,
    sizes: responsiveImageSizes,
    quality: galleryQuality,
    enabled: hasMultipleImages,
  });

  useEffect(() => {
    if (activeImage) {
      setIsImageLoading(true);
    }
  }, [activeImage]);

  const registerImageSize = useCallback((src: string, image: HTMLImageElement) => {
    if (!image.naturalWidth || !image.naturalHeight) return;

    setImageSizes((current) => {
      if (current[src]?.width === image.naturalWidth && current[src]?.height === image.naturalHeight) {
        return current;
      }

      return {
        ...current,
        [src]: {
          width: image.naturalWidth,
          height: image.naturalHeight,
        },
      };
    });
  }, []);

  const markImageAsFailed = useCallback((src: string) => {
    setIsImageLoading(false);
    setFailedImages((current) => {
      if (!src || current.has(src)) return current;

      const next = new Set(current);
      next.add(src);
      return next;
    });
  }, []);

  const trackGalleryInteraction = useCallback((eventType: "gallery_click" | "carousel_click") => {
    analyticsService.track({
      entityType: "lodging",
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

  const activeSize = imageSizes[activeSrc] || imageSizes[activeImage];
  const activeRatio = activeSize ? activeSize.width / activeSize.height : 16 / 10;
  const maxGalleryHeight = 680;
  const maxGalleryWidth = activeSize ? Math.min(1024, Math.round(maxGalleryHeight * activeRatio)) : 1024;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4">
      <div
        className="relative mx-auto w-full touch-pan-y overflow-hidden rounded-lg border border-border bg-[#08110e] shadow-premium"
        {...swipeHandlers}
        style={{
          aspectRatio: activeSize ? `${activeSize.width} / ${activeSize.height}` : "16 / 10",
          maxWidth: `${maxGalleryWidth}px`,
        }}
      >
        <Image
          key={activeSrc}
          src={activeSrc}
          alt={`Foto ${activeIndex + 1} da hospedagem ${name}`}
          fill
          sizes={responsiveImageSizes}
          quality={galleryQuality}
          loading="lazy"
          onLoad={(event) => {
            registerImageSize(activeSrc, event.currentTarget);
            setIsImageLoading(false);
          }}
          onError={() => markImageAsFailed(activeImage)}
          className="object-contain"
        />
        {isImageLoading ? (
          <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,rgba(255,255,255,0.05),rgba(255,255,255,0.12),rgba(255,255,255,0.05))]" />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

        <Button
          type="button"
          variant="glass"
          size="icon"
          aria-label="Abrir foto em tela cheia"
          className="absolute right-4 top-4"
          onClick={(event) => {
            lightboxTriggerRef.current = event.currentTarget;
            trackGalleryInteraction("gallery_click");
            setIsLightboxOpen(true);
          }}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

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

        <span className="absolute bottom-3 right-3 rounded-md border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
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
                alt={`Miniatura ${index + 1} de ${name}`}
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
        title={`Galeria de fotos de ${name}`}
        hasMultipleImages={hasMultipleImages}
        onPrevious={goToPrevious}
        onNext={goToNext}
        counter={`${activeIndex + 1}/${uniqueImages.length}`}
        imageContainerClassName="h-[78vh] max-w-6xl overflow-hidden rounded-lg border border-white/15 bg-black"
        returnFocusRef={lightboxTriggerRef}
      >
        <Image
          src={activeSrc}
          alt={`Foto ${activeIndex + 1} da hospedagem ${name}`}
          fill
          sizes="100vw"
          quality={92}
          onError={() => markImageAsFailed(activeImage)}
          className="object-contain"
        />
      </GalleryLightbox>
    </div>
  );
}
