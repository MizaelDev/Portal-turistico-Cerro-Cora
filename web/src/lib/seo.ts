import type { Metadata } from "next";
import type { Attraction, FoodPlace, Lodging } from "@/lib/data";
import { siteUrl } from "./utils";

type SeoInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
};

const defaultDescription =
  "Portal turístico de Cerro Corá-RN, a Suíça do Seridó, com roteiros, pousadas, gastronomia e Festival de Inverno.";

export function createMetadata({
  title,
  description = defaultDescription,
  path = "",
  image = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
}: SeoInput = {}): Metadata {
  const pageTitle = title
    ? `${title} | Cerro Corá Turismo`
    : "Cerro Corá Turismo | Suíça do Seridó";

  return {
    metadataBase: new URL(siteUrl("/")),
    title: pageTitle,
    description,
    alternates: {
      canonical: siteUrl(path),
    },
    openGraph: {
      title: pageTitle,
      description,
      url: siteUrl(path),
      siteName: "Cerro Corá Turismo",
      locale: "pt_BR",
      type: "website",
      images: [
        {
          url: image.startsWith("http") ? image : siteUrl(image),
          width: 1200,
          height: 630,
          alt: "Paisagem serrana de Cerro Corá, RN",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [image.startsWith("http") ? image : siteUrl(image)],
    },
    keywords: [
      "Cerro Corá RN",
      "Suíça do Seridó",
      "turismo no Rio Grande do Norte",
      "Festival de Inverno Cerro Corá",
      "Turismo em Cerro Corá",
      "O que fazer em Cerro Corá",
      "Onde comer em Cerro Corá",
      "pousadas em Cerro Corá",
      "gastronomia serrana",
      "Seridó",
    ],
  };
}

export const tourismSchema = {
  "@context": "https://schema.org",
  "@type": "TouristDestination",
  name: "Cerro Corá",
  alternateName: "Suíça do Seridó",
  description: defaultDescription,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cerro Corá",
    addressRegion: "RN",
    addressCountry: "BR",
  },
  touristType: ["Casais", "Famílias", "Turismo de natureza", "Turismo gastronomico"],
  url: siteUrl("/"),
};

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Portal Cerro Corá Turismo",
  image:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cerro Corá",
    addressRegion: "RN",
    addressCountry: "BR",
  },
  areaServed: "Cerro Corá, Rio Grande do Norte",
  telephone: "+55 84 98879-1401",
  priceRange: "$$",
  url: siteUrl("/"),
};

function itemListSchema(name: string, items: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item,
    })),
  };
}

export function touristAttractionsSchema(attractions: Attraction[]) {
  return itemListSchema(
    "Roteiros e pontos turísticos em Cerro Corá RN",
    attractions.map((attraction) => ({
      "@type": "TouristAttraction",
      name: attraction.name,
      description: attraction.description,
      image: attraction.image.startsWith("http") ? attraction.image : siteUrl(attraction.image),
      touristType: attraction.category,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Cerro Corá",
        addressRegion: "RN",
        addressCountry: "BR",
      },
      url: siteUrl(`/o-que-fazer#${attraction.slug}`),
    })),
  );
}

export function restaurantsSchema(places: FoodPlace[]) {
  return itemListSchema(
    "Onde comer em Cerro Corá RN",
    places.map((place) => ({
      "@type": "Restaurant",
      name: place.name,
      servesCuisine: place.tags,
      image: place.image.startsWith("http") ? place.image : siteUrl(place.image),
      telephone: `+${place.whatsapp}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: place.location,
        addressLocality: "Cerro Corá",
        addressRegion: "RN",
        addressCountry: "BR",
      },
      sameAs: place.instagramUrl ? [place.instagramUrl] : undefined,
    })),
  );
}

export function restaurantDetailSchema(place: FoodPlace) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: place.name,
    description: place.story || place.description,
    servesCuisine: place.specialties?.length ? place.specialties : place.tags,
    image: [place.image, ...(place.galleryImages || [])].map((image) =>
      image.startsWith("http") ? image : siteUrl(image),
    ),
    telephone: `+${place.whatsapp}`,
    priceRange: place.priceRange || "R$$",
    url: siteUrl(`/restaurantes/${place.slug}`),
    sameAs: place.instagramUrl ? [place.instagramUrl] : undefined,
    menu: place.menuUrl || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: place.address || place.location,
      addressLocality: "Cerro Corá",
      addressRegion: "RN",
      addressCountry: "BR",
    },
    hasMap: place.mapUrl || undefined,
    openingHours: place.hours,
  };
}

export function lodgingsSchema(lodgings: Lodging[]) {
  return itemListSchema(
    "Pousadas em Cerro Corá RN",
    lodgings.map((lodging) => ({
      "@type": "LodgingBusiness",
      name: lodging.name,
      description: lodging.description,
      image: lodging.image.startsWith("http") ? lodging.image : siteUrl(lodging.image),
      telephone: `+${lodging.whatsapp}`,
      priceRange: lodging.priceRange,
      address: {
        "@type": "PostalAddress",
        streetAddress: lodging.location,
        addressLocality: "Cerro Corá",
        addressRegion: "RN",
        addressCountry: "BR",
      },
    })),
  );
}

export const festivalEventSchema = {
  "@context": "https://schema.org",
  "@type": "Festival",
  name: "XXII Festival de Inverno de Cerro Corá",
  description:
    "Festival de Inverno de Cerro Corá-RN com shows, gastronomia, cultura e programação musical na Praça Pública.",
  startDate: "2026-08-07T18:00:00-03:00",
  endDate: "2026-08-09T23:59:00-03:00",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  image: siteUrl("/banners/festival-inverno-2026.jpg"),
  location: {
    "@type": "Place",
    name: "Praça Pública de Cerro Corá",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Cerro Corá",
      addressRegion: "RN",
      addressCountry: "BR",
    },
  },
  organizer: {
    "@type": "Organization",
    name: "Prefeitura de Cerro Corá",
  },
  url: siteUrl("/festival-de-inverno"),
};
