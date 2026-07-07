import type { MetadataRoute } from "next";
import { navItems } from "@/lib/navigation";
import { siteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  return navItems.map((item) => ({
    url: siteUrl(item.href),
    lastModified: new Date(),
    changeFrequency: item.href === "/" ? "weekly" : "monthly",
    priority: item.href === "/" ? 1 : 0.8,
  }));
}
