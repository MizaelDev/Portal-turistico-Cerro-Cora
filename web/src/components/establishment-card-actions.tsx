import { ArrowRight, MapPin, MessageCircle } from "lucide-react";
import { TrackedLink } from "@/components/tracked-link";
import { Button } from "@/components/ui/button";
import type { CommercialEntityType } from "@/lib/analytics";
import { whatsappUrl } from "@/lib/links";
import { cn } from "@/lib/utils";

type EstablishmentCardActionsProps = {
  entityType: CommercialEntityType;
  entityId?: string;
  establishmentName: string;
  category: string;
  detailsUrl?: string;
  mapsUrl?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  className?: string;
};

const secondaryButtonClass =
  "h-12 min-w-0 rounded-[10px] border-border/90 bg-background/70 px-3 text-foreground shadow-[0_1px_2px_rgba(15,35,29,0.04)] transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-px hover:border-alpine-sunset/55 hover:bg-accent/80 hover:shadow-sm motion-reduce:transform-none motion-reduce:transition-none dark:bg-background/35 dark:hover:bg-accent/55";

const primaryButtonClass =
  "group/details col-span-2 h-12 min-w-0 rounded-[10px] px-4 shadow-[0_2px_7px_rgba(88,54,11,0.12)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(88,54,11,0.16)] motion-reduce:transform-none motion-reduce:transition-none";

export function EstablishmentCardActions({
  entityType,
  entityId,
  establishmentName,
  category,
  detailsUrl,
  mapsUrl,
  whatsappNumber,
  whatsappMessage,
  className,
}: EstablishmentCardActionsProps) {
  const hasDetails = Boolean(detailsUrl);
  const hasMaps = Boolean(mapsUrl);
  const hasWhatsapp = Boolean(whatsappNumber?.trim());
  const hasSingleSecondaryAction = Number(hasMaps) + Number(hasWhatsapp) === 1;
  const analyticsMeta = { establishmentName, category };

  if (!hasDetails && !hasMaps && !hasWhatsapp) return null;

  return (
    <div className={cn("mt-auto pt-4", className)}>
      <div className="grid grid-cols-2 gap-2.5">
        {detailsUrl ? (
          <Button
            asChild
            variant="warm"
            className={primaryButtonClass}
          >
            <TrackedLink
              href={detailsUrl}
              entityType={entityType}
              entityId={entityId}
              eventType="details_click"
              aria-label={`Ver detalhes de ${establishmentName}`}
              {...analyticsMeta}
            >
              Ver detalhes
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/details:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
            </TrackedLink>
          </Button>
        ) : null}

        {mapsUrl ? (
          <Button
            asChild
            variant="outline"
            className={cn(secondaryButtonClass, hasSingleSecondaryAction && "col-span-2")}
          >
            <TrackedLink
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              entityType={entityType}
              entityId={entityId}
              eventType="map_click"
              aria-label={`Como chegar a ${establishmentName}`}
              {...analyticsMeta}
            >
              <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" /> Como chegar
            </TrackedLink>
          </Button>
        ) : null}

        {hasWhatsapp ? (
          <Button
            asChild
            variant="outline"
            className={cn(secondaryButtonClass, hasSingleSecondaryAction && "col-span-2")}
          >
            <TrackedLink
              href={whatsappUrl(whatsappNumber!, whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              entityType={entityType}
              entityId={entityId}
              eventType="whatsapp_click"
              aria-label={`Falar com ${establishmentName} no WhatsApp`}
              {...analyticsMeta}
            >
              <MessageCircle aria-hidden="true" className="h-4 w-4 shrink-0" /> WhatsApp
            </TrackedLink>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
