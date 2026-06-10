import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Attraction } from "@/lib/data";
import { googleMapsSearchUrl } from "@/lib/links";

export function AttractionCard({ attraction }: { attraction: Attraction }) {
  const mapHref =
    attraction.mapUrl || googleMapsSearchUrl(attraction.name, attraction.location);

  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-premium">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={attraction.image}
          alt={attraction.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4">
          <Badge className="bg-white/86 backdrop-blur">{attraction.category}</Badge>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-2xl font-semibold">{attraction.name}</h3>
        <p className="mt-3 min-h-24 text-sm leading-7 text-muted-foreground">
          {attraction.description}
        </p>
        <a
          href={mapHref}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          <MapPin className="h-4 w-4 text-alpine-wine" /> {attraction.location}
        </a>
        <Button asChild className="mt-5 w-full" variant="outline">
          <a
            href={attraction.infoUrl || `/o-que-fazer#${attraction.slug}`}
            target={attraction.infoUrl ? "_blank" : undefined}
            rel={attraction.infoUrl ? "noreferrer" : undefined}
          >
            Saiba mais <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </article>
  );
}
