import type { Metadata } from "next";
import { siteUrl } from "./utils";

type SeoInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
};

const defaultDescription =
  "Portal turístico de Cerro Corá, RN: a Suiça do Seridó, com atrativos naturais, pousadas, gastronomia, festival de inverno e experiências serranas.";

export function createMetadata({
  title,
  description = defaultDescription,
  path = "",
  image = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
}: SeoInput = {}): Metadata {
  const pageTitle = title
    ? `${title} | Cerro Corá Turismo`
    : "Cerro Corá Turismo | Suiça do Seridó";

  return {
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
      "Suiça do Seridó",
      "turismo no Rio Grande do Norte",
      "Festival de Inverno Cerro Corá",
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
  alternateName: "Suiça do Seridó",
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
  telephone: "+55 84 99999-9999",
  priceRange: "$$",
  url: siteUrl("/"),
};
