import { cn } from "@/lib/utils";
import type { Lodging, ReservationAvailability } from "@/lib/data";

const availabilityLabels: Record<ReservationAvailability, string> = {
  available: "Disponível",
  limited: "Poucas vagas",
  unavailable: "Indisponível para reservas",
  consult: "Consultar disponibilidade",
};

const availabilityStyles: Record<ReservationAvailability, string> = {
  available:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  limited: "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  unavailable: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  consult: "border-border bg-muted/50 text-muted-foreground",
};

function todayInCerroCora() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function activeAvailability(lodging: Lodging) {
  const status = lodging.reservationAvailability;
  if (!status) return null;

  const today = todayInCerroCora();
  if (lodging.reservationAvailabilityStart && today < lodging.reservationAvailabilityStart) {
    return null;
  }
  if (lodging.reservationAvailabilityEnd && today > lodging.reservationAvailabilityEnd) {
    return null;
  }

  return status;
}

type LodgingAvailabilityProps = {
  lodging: Lodging;
  showNote?: boolean;
  className?: string;
};

export function LodgingAvailability({
  lodging,
  showNote = false,
  className,
}: LodgingAvailabilityProps) {
  const status = activeAvailability(lodging);
  if (!status) return null;

  return (
    <div className={cn("grid w-fit max-w-full gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex w-fit max-w-full items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold",
          availabilityStyles[status],
        )}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
        {availabilityLabels[status]}
      </span>
      {showNote && lodging.reservationAvailabilityNote ? (
        <p className="max-w-md text-xs leading-5 text-muted-foreground">
          {lodging.reservationAvailabilityNote}
        </p>
      ) : null}
    </div>
  );
}
