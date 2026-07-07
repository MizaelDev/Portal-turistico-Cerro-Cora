"use client";

import Image from "next/image";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Images, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Attraction } from "@/lib/data";
import { googleMapsSearchUrl } from "@/lib/links";
import { cn } from "@/lib/utils";

const fallbackImage = "/images/cerro-cora.jpg";
const imageSizes = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

function uniqueImages(images: string[]) {
  return Array.from(new Set(images.map((image) => image.trim()).filter(Boolean)));
}

type AttractionCardProps = {
  attraction: Attraction;
  priority?: boolean;
};

export const AttractionCard = memo(function AttractionCard({
  attraction,
  priority = false,
}: AttractionCardProps) {
  const images = useMemo(
    () => {
      const list = uniqueImages([attraction.image, ...(attraction.gallery || [])]);
      return list.length ? list : [fallbackImage];
    },
    [attraction.gallery, attraction.image],
  );
  const [currentImage, setCurrentImage] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const pointerStartX = useRef<number | null>(null);
  const visibleIndex = Math.min(currentImage, images.length - 1);
  const activeImage = images[visibleIndex] || fallbackImage;
  const activeSrc = failedImages.has(activeImage) ? fallbackImage : activeImage;
  const mapHref =
    attraction.mapUrl || googleMapsSearchUrl(attraction.name, attraction.location);
  const hasCarousel = images.length > 1;
  const isActiveLoaded = loadedImages.has(activeSrc);

  const showPreviousImage = useCallback(() => {
    setCurrentImage((current) => (current === 0 ? images.length - 1 : current - 1));
  }, [images.length]);

  const showNextImage = useCallback(() => {
    setCurrentImage((current) => (current + 1) % images.length);
  }, [images.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentImage(index);
  }, []);

  const markLoaded = useCallback((src: string) => {
    setLoadedImages((current) => {
      if (current.has(src)) return current;
      const next = new Set(current);
      next.add(src);
      return next;
    });
  }, []);

  const markFailed = useCallback((src: string) => {
    setFailedImages((current) => {
      if (current.has(src)) return current;
      const next = new Set(current);
      next.add(src);
      return next;
    });
  }, []);

  const preloadImages = useMemo(() => {
    if (!hasCarousel) return [];

    const previous = visibleIndex === 0 ? images.length - 1 : visibleIndex - 1;
    const next = (visibleIndex + 1) % images.length;

    return uniqueImages([images[previous], images[next]]).filter(
      (image) => image !== activeImage && !failedImages.has(image),
    );
  }, [activeImage, failedImages, hasCarousel, images, visibleIndex]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
  }, []);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerStartX.current === null || !hasCarousel) return;

      const distance = event.clientX - pointerStartX.current;
      pointerStartX.current = null;

      if (Math.abs(distance) < 44) return;
      if (distance > 0) {
        showPreviousImage();
      } else {
        showNextImage();
      }
    },
    [hasCarousel, showNextImage, showPreviousImage],
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-premium">
      <div
        className="relative aspect-[4/3] touch-pan-y overflow-hidden bg-accent"
        onPointerDown={handlePointerDown}
        onPointerLeave={() => {
          pointerStartX.current = null;
        }}
        onPointerUp={handlePointerUp}
      >
        {!isActiveLoaded ? (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-alpine-pine/20 via-accent to-alpine-sunset/20" />
        ) : null}
        <Image
          src={activeSrc}
          alt={`${attraction.name} - foto ${visibleIndex + 1}`}
          fill
          sizes={imageSizes}
          priority={priority && visibleIndex === 0}
          loading={priority && visibleIndex === 0 ? "eager" : "lazy"}
          quality={76}
          className={cn(
            "object-cover transition-[opacity,transform] duration-300 group-hover:scale-[1.025]",
            isActiveLoaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => markLoaded(activeSrc)}
          onError={() => markFailed(activeImage)}
        />
        {preloadImages.map((image) => (
          <Image
            key={`preload-${image}`}
            src={image}
            alt=""
            width={32}
            height={24}
            sizes="32px"
            loading="lazy"
            aria-hidden="true"
            className="pointer-events-none absolute h-px w-px opacity-0"
            onLoad={() => markLoaded(image)}
            onError={() => markFailed(image)}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge className="bg-white/86 backdrop-blur">{attraction.category}</Badge>
        </div>
        {hasCarousel ? (
          <>
            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-md border border-white/25 bg-black/35 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              <Images className="h-3.5 w-3.5" />
              {visibleIndex + 1}/{images.length}
            </div>
            <button
              type="button"
              onClick={showPreviousImage}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white opacity-90 shadow-sm backdrop-blur transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={`Foto anterior de ${attraction.name}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white opacity-90 shadow-sm backdrop-blur transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={`Próxima foto de ${attraction.name}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => goToImage(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                    visibleIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/55",
                  )}
                  aria-label={`Ver foto ${index + 1} de ${attraction.name}`}
                  aria-current={visibleIndex === index ? "true" : undefined}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl font-semibold">{attraction.name}</h3>
        <p className="mt-3 min-h-24 text-sm leading-7 text-muted-foreground">
          {attraction.description}
        </p>
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          <MapPin className="h-4 w-4 text-alpine-wine" /> {attraction.location}
        </a>
        <Button asChild className="mt-auto w-full" variant="outline">
          <a
            href={attraction.infoUrl || `/o-que-fazer#${attraction.slug}`}
            target={attraction.infoUrl ? "_blank" : undefined}
            rel={attraction.infoUrl ? "noopener noreferrer" : undefined}
          >
            Saiba mais <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </article>
  );
});
