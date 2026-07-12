"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { analyticsService, type CommercialEntityType, type CommercialEventType } from "@/lib/analytics";

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  entityType: CommercialEntityType;
  entityId?: string;
  eventType: CommercialEventType;
  establishmentName?: string;
  category?: string;
  planType?: string;
};

export function TrackedLink({
  children,
  entityType,
  entityId,
  eventType,
  establishmentName,
  category,
  planType,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        analyticsService.track({
          entityType,
          entityId,
          eventType,
          establishmentName,
          category,
          planType,
        });
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
