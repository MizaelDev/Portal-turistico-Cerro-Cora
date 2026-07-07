import type { MetadataRoute } from "next";
import { navItems } from "@/lib/navigation";
import { getPublicFoodPlaces } from "@/lib/public-content";
import { slugify } from "@/lib/slug";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { items: restaurants } = await getPublicFoodPlaces();
  const baseRoutes = navItems.map((item) => ({
    url: siteUrl(item.href),
    lastModified: new Date(),
    changeFrequency: item.href === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: item.href === "/" ? 1 : 0.8,
  }));

  const restaurantRoutes = restaurants.map((place) => ({
    url: siteUrl(`/restaurantes/${place.slug || slugify(place.name)}`),
    lastModified: place.updatedAt ? new Date(place.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  return [...baseRoutes, ...restaurantRoutes];
}
