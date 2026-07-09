"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LodgingGalleryProps = {
  images: string[];
  name: string;
};

type ImageSize = {
  width: number;
  height: number;
};

const galleryCategories = [
  "Fachada",
  "Quartos",
  "Banheiro",
  "Café da manhã",
  "Área externa",
  "Lazer",
  "Vista",
  "Recepção",
];

export function LodgingGallery({ images, name }: LodgingGalleryProps) {
  const uniqueImages = useMemo(
    () => Array.from(new Set(images.map((image) => image.trim()).filter(Boolean))),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageSizes, setImageSizes] = useState<Record<string, ImageSize>>({});
  const [isImageLoading, setIsImageLoading] = useState(true);
  const hasMultipleImages = uniqueImages.length > 1;
  const activeImage = uniqueImages[activeIndex] || "";

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

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) => (current === 0 ? uniqueImages.length - 1 : current - 1));
  }, [uniqueImages.length]);

  const goToNext = useCallback(() => {
    setActiveIndex((current) => (current === uniqueImages.length - 1 ? 0 : current + 1));
  }, [uniqueImages.length]);

  if (!uniqueImages.length) return null;

  const activeCategory = galleryCategories[activeIndex % galleryCategories.length];
  const activeSize = imageSizes[activeImage];
  const activeRatio = activeSize ? activeSize.width / activeSize.height : 16 / 10;
  const maxGalleryHeight = 680;
  const maxGalleryWidth = activeSize ? Math.min(1024, Math.round(maxGalleryHeight * activeRatio)) : 1024;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4">
      <div
        className="relative mx-auto w-full overflow-hidden rounded-lg border border-border bg-[#08110e] shadow-premium"
        style={{
          aspectRatio: activeSize ? `${activeSize.width} / ${activeSize.height}` : "16 / 10",
          maxWidth: `${maxGalleryWidth}px`,
        }}
      >
        <Image
          key={activeImage}
          src={activeImage}
          alt={`${activeCategory} de ${name}`}
          fill
          sizes="(min-width: 1280px) 1024px, (min-width: 768px) 90vw, 100vw"
          quality={82}
          loading="lazy"
          onLoad={(event) => {
            registerImageSize(activeImage, event.currentTarget);
            setIsImageLoading(false);
          }}
          className="object-contain"
        />
        {isImageLoading ? (
          <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,rgba(255,255,255,0.05),rgba(255,255,255,0.12),rgba(255,255,255,0.05))]" />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

        <div className="absolute left-4 top-4 rounded-md border border-white/20 bg-black/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
          {activeCategory}
        </div>

        <Button
          type="button"
          variant="glass"
          size="icon"
          aria-label="Abrir foto em tela cheia"
          className="absolute right-4 top-4"
          onClick={() => setIsLightboxOpen(true)}
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

      {hasMultipleImages ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {uniqueImages.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`Abrir foto ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-md border bg-muted transition-all",
                activeIndex === index
                  ? "border-alpine-sunset ring-2 ring-alpine-sunset/30"
                  : "border-border opacity-75 hover:opacity-100",
              )}
            >
              <Image
                src={image}
                alt={`Miniatura ${index + 1} de ${name}`}
                fill
                sizes="120px"
                quality={52}
                loading="lazy"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {isLightboxOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/88 p-4 backdrop-blur-sm">
          <Button
            type="button"
            variant="glass"
            size="icon"
            aria-label="Fechar galeria"
            className="absolute right-4 top-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="relative h-[78vh] w-full max-w-6xl overflow-hidden rounded-lg border border-white/15 bg-black">
            <Image
              src={activeImage}
              alt={`${activeCategory} de ${name}`}
              fill
              sizes="100vw"
              quality={90}
              className="object-contain"
            />
          </div>
          {hasMultipleImages ? (
            <>
              <Button
                type="button"
                variant="glass"
                size="icon"
                aria-label="Foto anterior"
                className="absolute left-4 top-1/2 -translate-y-1/2"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="glass"
                size="icon"
                aria-label="Próxima foto"
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onClick={goToNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
