"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { analyticsService, type CommercialEntityType } from "@/lib/analytics";
import { useAnalyticsConsent } from "@/components/analytics-consent-provider";

type TrackViewProps = {
  children: ReactNode;
  entityType: CommercialEntityType;
  entityId?: string;
  eventType?: "card_view" | "page_view";
  className?: string;
  establishmentName?: string;
  category?: string;
};

export function TrackView({
  children,
  entityType,
  entityId,
  eventType = "card_view",
  className,
  establishmentName,
  category,
}: TrackViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const sentRef = useRef(false);
  const { consent } = useAnalyticsConsent();

  useEffect(() => {
    if (consent !== "granted" || !entityId || sentRef.current || !ref.current) return;

    const send = () => {
      if (sentRef.current) return;
      sentRef.current = true;

      analyticsService.track({
        entityType,
        entityId,
        eventType,
        establishmentName,
        category,
      }, { dedupe: "session" });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          send();
          observer.disconnect();
        }
      },
      { threshold: 0.45 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [category, consent, entityId, entityType, establishmentName, eventType]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
