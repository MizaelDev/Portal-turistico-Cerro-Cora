"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Images, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Attraction } from "@/lib/data";
import { googleMapsSearchUrl } from "@/lib/links";
import { cn } from "@/lib/utils";

function uniqueImages(images: string[]) {
  return Array.from(new Set(images.map((image) => image.trim()).filter(Boolean)));
}

export function AttractionCard({ attraction }: { attraction: Attraction }) {
  const images = useMemo(
    () => uniqueImages([attraction.image, ...(attraction.gallery || [])]),
    [attraction.gallery, attraction.image],
  );
  const [currentImage, setCurrentImage] = useState(0);
  const mapHref =
    attraction.mapUrl || googleMapsSearchUrl(attraction.name, attraction.location);
  const hasCarousel = images.length > 1;

  function showPreviousImage() {
    setCurrentImage((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function showNextImage() {
    setCurrentImage((current) => (current + 1) % images.length);
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-premium">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={images[currentImage] || attraction.image}
          alt={`${attraction.name} - foto ${currentImage + 1}`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge className="bg-white/86 backdrop-blur">{attraction.category}</Badge>
        </div>
        {hasCarousel ? (
          <>
            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-md border border-white/25 bg-black/35 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              <Images className="h-3.5 w-3.5" />
              {currentImage + 1}/{images.length}
            </div>
            <button
              type="button"
              onClick={showPreviousImage}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white opacity-90 shadow-sm backdrop-blur transition hover:bg-black/55"
              aria-label={`Foto anterior de ${attraction.name}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white opacity-90 shadow-sm backdrop-blur transition hover:bg-black/55"
              aria-label={`Próxima foto de ${attraction.name}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setCurrentImage(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    currentImage === index ? "w-6 bg-white" : "w-1.5 bg-white/55",
                  )}
                  aria-label={`Ver foto ${index + 1} de ${attraction.name}`}
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
}
