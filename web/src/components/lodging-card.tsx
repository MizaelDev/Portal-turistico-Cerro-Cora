import Image from "next/image";
import { MapPin, MessageCircle, WalletCards, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lodging } from "@/lib/data";
import { googleMapsSearchUrl } from "@/lib/links";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LodgingCard({ lodging }: { lodging: Lodging }) {
  const mapHref = lodging.mapUrl || googleMapsSearchUrl(lodging.name, lodging.location);

  return (
    <article className="grid overflow-hidden rounded-lg border border-border bg-card shadow-sm md:grid-cols-[1.1fr_0.9fr]">
      <div className="relative min-h-80">
        <Image src={lodging.image} alt={lodging.name} fill className="object-cover" />
      </div>
      <div className="p-6">
      <h3 className="font-display text-3xl font-semibold">{lodging.name}</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{lodging.description}</p>
      
        <div className="mt-5 grid grid-cols-3 gap-2">
          {lodging.gallery.map((image) => (
            <div key={image} className="relative aspect-square overflow-hidden rounded-md">
              <Image src={image} alt={`Galeria ${lodging.name}`} fill className="object-cover" />
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <MapPin className="h-4 w-4 text-alpine-wine" /> {lodging.location}
          </a>
          
          <span className="flex items-center gap-2">
            <WalletCards className="h-4 w-4 text-alpine-wine" /> 
            {lodging.priceRange}
            
            {/* INÍCIO DO DISCLAIMER */}
            {lodging.priceDisclaimer && (
  <Tooltip>
    <TooltipTrigger asChild>
      <button className="inline-flex cursor-help items-center outline-none">
        <Info className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[250px] text-xs">
      {lodging.priceDisclaimer}
    </TooltipContent>
  </Tooltip>
)}
            {/* FIM DO DISCLAIMER */}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="flex-1">
            <a href={`https://wa.me/${lodging.whatsapp}`} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </Button>
          <Button asChild variant="warm" className="flex-1">
            <a href={`https://wa.me/${lodging.whatsapp}?text=Quero%20reservar`} target="_blank" rel="noreferrer">
              Reservar
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}