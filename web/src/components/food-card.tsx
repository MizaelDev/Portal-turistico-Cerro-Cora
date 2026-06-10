import Image from "next/image";
import { Clock, Instagram, MapPin, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FoodPlace } from "@/lib/data";
import { googleMapsSearchUrl, instagramUrlFromHandle } from "@/lib/links";

export function FoodCard({ place }: { place: FoodPlace }) {
  const instagramHref = place.instagramUrl || instagramUrlFromHandle(place.instagram);
  const mapHref = place.mapUrl || googleMapsSearchUrl(place.name, place.location);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-premium">
      <div className="relative aspect-[16/10]">
        <Image src={place.image} alt={place.name} fill className="object-cover" />
        <Badge className="absolute left-4 top-4 border-alpine-pine/20 bg-alpine-pine text-white shadow-sm backdrop-blur dark:bg-alpine-sunset dark:text-[#17251f]">
          {place.category}
        </Badge>
      </div>
      <div className="grid gap-4 p-5">
        <div>
          <h3 className="font-display text-2xl font-semibold">{place.name}</h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{place.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {place.tags.map((tag) => (
            <Badge key={tag} className="bg-accent/70 text-foreground">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-alpine-wine" /> {place.hours}
          </span>
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <MapPin className="h-4 w-4 text-alpine-wine" /> {place.location}
          </a>
          <a
            href={instagramHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <Instagram className="h-4 w-4 text-alpine-wine" /> {place.instagram}
          </a>
        </div>
        <Button asChild variant="warm">
          <a href={`https://wa.me/${place.whatsapp}`} target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </Button>
      </div>
    </article>
  );
}
