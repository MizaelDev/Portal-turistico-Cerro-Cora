"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getBusinessStatus,
  parseBusinessHours,
  parseLegacyBusinessHours,
  type BusinessHours,
  type BusinessStatusKind,
} from "@/lib/business-hours";
import { cn } from "@/lib/utils";

type BusinessStatusBadgeProps = {
  businessHours?: BusinessHours | string | null;
  fallbackHours?: string | null;
  className?: string;
  compact?: boolean;
};

const statusStyles: Record<BusinessStatusKind, string> = {
  open: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  closing_soon: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  closed: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  always_open: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  appointment: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  unknown: "border-border bg-muted/35 text-muted-foreground",
};

const dotStyles: Record<BusinessStatusKind, string> = {
  open: "bg-emerald-500",
  closing_soon: "bg-amber-500",
  closed: "bg-rose-500",
  always_open: "bg-emerald-500",
  appointment: "bg-sky-500",
  unknown: "bg-muted-foreground/60",
};

const statusLabels: Record<BusinessStatusKind, string> = {
  open: "Aberto agora",
  closing_soon: "Fecha em breve",
  closed: "Fechado",
  always_open: "Atendimento 24 horas",
  appointment: "Somente agendamento",
  unknown: "Horário a confirmar",
};

const minuteSubscribers = new Set<() => void>();
let minuteInterval: number | null = null;

function subscribeToMinuteTicker(callback: () => void) {
  minuteSubscribers.add(callback);

  if (!minuteInterval) {
    minuteInterval = window.setInterval(() => {
      minuteSubscribers.forEach((subscriber) => subscriber());
    }, 60_000);
  }

  return () => {
    minuteSubscribers.delete(callback);

    if (!minuteSubscribers.size && minuteInterval) {
      window.clearInterval(minuteInterval);
      minuteInterval = null;
    }
  };
}

export function BusinessStatusBadge({
  businessHours,
  fallbackHours,
  className,
  compact = false,
}: BusinessStatusBadgeProps) {
  const [now, setNow] = useState<Date | null>(null);
  const parsedHours = useMemo(() => {
    return parseBusinessHours(businessHours) || parseLegacyBusinessHours(fallbackHours);
  }, [businessHours, fallbackHours]);

  useEffect(() => {
    setNow(new Date());

    if (!parsedHours) return undefined;

    return subscribeToMinuteTicker(() => setNow(new Date()));
  }, [parsedHours]);

  if (!parsedHours || !now) return null;

  const status = getBusinessStatus(parsedHours, { now });

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold",
        statusStyles[status.status],
        className,
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dotStyles[status.status])} />
      <span className="min-w-0">
        <span className="whitespace-nowrap">{statusLabels[status.status]}</span>
        {!compact && status.message !== statusLabels[status.status] ? (
          <span className="ml-2 font-medium opacity-80">{status.message}</span>
        ) : null}
      </span>
    </div>
  );
}
