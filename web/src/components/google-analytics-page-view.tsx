"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function GoogleAnalyticsPageView({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      send_to: measurementId,
    });
  }, [measurementId, pathname]);

  return null;
}
