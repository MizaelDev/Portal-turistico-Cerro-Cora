import type { MetadataRoute } from "next";
import { navItems } from "@/lib/navigation";
import { getPublicFoodPlaces, getPublicLodgings } from "@/lib/public-content";
import { getCommercialFeatures } from "@/lib/commercial";
import { slugify } from "@/lib/slug";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ items: restaurants }, { items: lodgings }] = await Promise.all([
    getPublicFoodPlaces(),
    getPublicLodgings(),
  ]);
  const baseRoutes = navItems.map((item) => ({
    url: siteUrl(item.href),
    lastModified: new Date(),
    changeFrequency: item.href === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: item.href === "/" ? 1 : 0.8,
  }));

  const restaurantRoutes = restaurants
    .filter((place) => getCommercialFeatures(place.plan, {
      status: place.planStatus,
      customFeatures: place.customFeatures,
      pageEnabled: place.pageEnabled,
    }).individualPage)
    .map((place) => ({
    url: siteUrl(`/restaurantes/${place.slug || slugify(place.name)}`),
    lastModified: place.updatedAt ? new Date(place.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.65,
    }));

  const lodgingRoutes = lodgings
    .filter((lodging) => getCommercialFeatures(lodging.plan, {
      status: lodging.planStatus,
      customFeatures: lodging.customFeatures,
      pageEnabled: lodging.pageEnabled,
    }).individualPage)
    .map((lodging) => ({
    url: siteUrl(`/pousadas/${lodging.slug || slugify(lodging.name)}`),
    lastModified: lodging.updatedAt ? new Date(lodging.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.65,
    }));

  return [...baseRoutes, ...restaurantRoutes, ...lodgingRoutes];
}
