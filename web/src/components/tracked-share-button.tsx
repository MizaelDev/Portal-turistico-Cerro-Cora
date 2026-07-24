"use client";

import { useState, type ComponentProps } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyticsService, type CommercialEntityType } from "@/lib/analytics";

type TrackedShareButtonProps = {
  entityType: CommercialEntityType;
  entityId?: string;
  establishmentName: string;
  category: string;
  variant?: ComponentProps<typeof Button>["variant"];
};

export function TrackedShareButton({
  entityType,
  entityId,
  establishmentName,
  category,
  variant = "outline",
}: TrackedShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    analyticsService.track({
      entityType,
      entityId,
      eventType: "share_click",
      establishmentName,
      category,
    });

    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: establishmentName, url });
        return;
      } catch {
        // Cancelamentos e navegadores sem suporte usam a copia como fallback.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Falha de clipboard nao interrompe a pagina.
    }
  }

  return (
    <Button type="button" variant={variant} onClick={share}>
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Link copiado" : "Compartilhar"}
    </Button>
  );
}
