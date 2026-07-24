import type { MetadataRoute } from "next";
import { getActiveCityServices } from "@/lib/city-services";
import { enableCityServicesPage } from "@/lib/feature-flags";
import { navItems } from "@/lib/navigation";
import { getPublicFoodPlaces, getPublicLodgings } from "@/lib/public-content";
import { slugify } from "@/lib/slug";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ items: restaurants }, { items: lodgings }, cityServices] =
    await Promise.all([
      getPublicFoodPlaces(),
      getPublicLodgings(),
      enableCityServicesPage ? getActiveCityServices() : Promise.resolve([]),
    ]);

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

  const lodgingRoutes = lodgings.map((lodging) => ({
    url: siteUrl(`/pousadas/${lodging.slug || slugify(lodging.name)}`),
    lastModified: lodging.updatedAt ? new Date(lodging.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  const serviceRoutes = cityServices
    .filter(
      (service) =>
        service.isActive && service.isPublished && service.detailsEnabled,
    )
    .map((service) => ({
      url: siteUrl(`/servicos/${service.slug}`),
      lastModified: service.updatedAt
        ? new Date(service.updatedAt)
        : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    }));

  return [
    ...baseRoutes,
    ...restaurantRoutes,
    ...lodgingRoutes,
    ...serviceRoutes,
  ];
}