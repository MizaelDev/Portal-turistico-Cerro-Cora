import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  ExternalLink,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { BusinessStatusBadge } from "@/components/business-status-badge";
import { SafeImage } from "@/components/safe-image";
import { TrackView } from "@/components/track-view";
import { TrackedLink } from "@/components/tracked-link";
import { Button } from "@/components/ui/button";
import {
  getCityServiceBySlug,
  getCityServiceCategoryLabel,
  getServiceCategories,
  type CityService,
} from "@/lib/city-services";
import { createMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/utils";

type ServiceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function phoneHref(value?: string) {
  const digits = value?.replace(/\D/g, "");
  return digits ? `tel:${digits}` : null;
}

function whatsappHref(service: CityService) {
  const digits = service.whatsapp?.replace(/\D/g, "");
  if (!digits) return null;
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const message =
    service.whatsappMessage ||
    `Olá! Encontrei ${service.name} no Portal Turístico de Cerro Corá e gostaria de obter mais informações.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function instagramHref(service: CityService) {
  if (service.instagramUrl) return service.instagramUrl;
  const handle = service.instagram?.replace(/^@/, "").trim();
  return handle ? `https://www.instagram.com/${handle}/` : null;
}

function serviceSchema(service: CityService, category: string) {
  const normalized = `${service.name} ${service.subcategory}`.toLowerCase();
  const type = normalized.includes("hospital")
    ? "Hospital"
    : normalized.includes("delegacia")
      ? "PoliceStation"
      : service.listingType === "public_service"
        ? "GovernmentOffice"
        : "LocalBusiness";

  return {
    "@context": "https://schema.org",
    "@type": type,
    name: service.name,
    description: service.fullDescription || service.shortDescription,
    url: siteUrl(`/servicos/${service.slug}`),
    image: service.photoUrl || service.logoUrl,
    telephone: service.phone || service.whatsapp,
    address: service.address
      ? {
          "@type": "PostalAddress",
          streetAddress: service.address,
          addressLocality: "Cerro Corá",
          addressRegion: "RN",
          addressCountry: "BR",
        }
      : undefined,
    category,
  };
}

export async function generateMetadata({
  params,
}: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getCityServiceBySlug(slug);
  if (!service) notFound();

  return createMetadata({
    title: `${service.name} em Cerro Corá-RN`,
    path: `/servicos/${service.slug}`,
    description:
      service.fullDescription ||
      service.shortDescription ||
      `Informações, contato e localização de ${service.name} em Cerro Corá-RN.`,
    image: service.photoUrl || service.logoUrl,
  });
}

export default async function ServiceDetailPage({
  params,
}: ServiceDetailPageProps) {
  const { slug } = await params;
  const [service, categories] = await Promise.all([
    getCityServiceBySlug(slug),
    getServiceCategories(),
  ]);
  if (!service) notFound();

  const category = getCityServiceCategoryLabel(service.category, categories);
  const callUrl = phoneHref(service.phone || service.whatsapp);
  const whatsappUrl = whatsappHref(service);
  const instagramUrl = instagramHref(service);
  const analyticsMeta = {
    establishmentName: service.name,
    category: service.category,
  };
  const gallery =
    service.galleryEnabled && service.galleryUrls?.length
      ? service.galleryUrls
      : [];

  return (
    <TrackView
      entityType="city_service"
      entityId={service.id}
      eventType="page_view"
      {...analyticsMeta}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema(service, category)).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />

      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="container grid gap-8 py-12 md:grid-cols-[minmax(0,1fr)_320px] md:items-center md:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/65">
              {category} · {service.subcategory}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold md:text-6xl">
              {service.name}
            </h1>
            {service.shortDescription ? (
              <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/80">
                {service.shortDescription}
              </p>
            ) : null}
            <div className="mt-5">
              {service.specialStatus ? (
                <span className="rounded-md border border-white/20 px-3 py-2 text-sm font-semibold">
                  {service.specialStatus}
                </span>
              ) : (
                <BusinessStatusBadge
                  businessHours={service.businessHours}
                  fallbackHours={service.openingHours}
                  context="service"
                />
              )}
            </div>
          </div>
          {service.photoUrl || service.logoUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/15 bg-white/95 shadow-lg">
              <SafeImage
                src={service.photoUrl || service.logoUrl}
                alt={service.altText || service.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 320px"
                className={service.photoUrl ? "object-cover" : "object-contain p-5"}
              />
            </div>
          ) : null}
        </div>
      </section>

      <div className="container grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-10">
          {service.fullDescription ? (
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-alpine-wine">
                Informações
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold">
                Sobre o serviço
              </h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line leading-8 text-muted-foreground">
                {service.fullDescription}
              </p>
            </section>
          ) : null}

          {service.servicesOffered?.length ? (
            <section>
              <h2 className="font-display text-3xl font-semibold">
                Serviços oferecidos
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {service.servicesOffered.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {gallery.length ? (
            <section>
              <h2 className="font-display text-3xl font-semibold">Galeria</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {gallery.map((image, index) => (
                  <div
                    key={image}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border"
                  >
                    <SafeImage
                      src={image}
                      alt={`${service.name}, foto ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <aside className="h-fit rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-2xl font-semibold">
            Informações úteis
          </h2>
          <div className="mt-4 divide-y divide-border text-sm">
            {service.address ? (
              <p className="flex gap-3 py-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-alpine-wine" />
                {[service.address, service.neighborhood].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {service.openingHours ? (
              <p className="flex gap-3 py-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-alpine-wine" />
                {service.openingHours}
              </p>
            ) : null}
            {service.phone || service.whatsapp ? (
              <p className="flex gap-3 py-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-alpine-wine" />
                {service.phone || service.whatsapp}
              </p>
            ) : null}
          </div>
          <div className="mt-5 grid gap-2">
            {callUrl ? (
              <Button asChild variant="warm">
                <TrackedLink
                  href={callUrl}
                  entityType="city_service"
                  entityId={service.id}
                  eventType="phone_click"
                  {...analyticsMeta}
                >
                  <Phone className="h-4 w-4" /> Ligar
                </TrackedLink>
              </Button>
            ) : null}
            {service.googleMapsUrl ? (
              <Button asChild variant="outline">
                <TrackedLink
                  href={service.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  entityType="city_service"
                  entityId={service.id}
                  eventType="map_click"
                  {...analyticsMeta}
                >
                  <MapPin className="h-4 w-4" /> Como chegar
                </TrackedLink>
              </Button>
            ) : null}
            {whatsappUrl ? (
              <Button asChild variant="outline">
                <TrackedLink
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  entityType="city_service"
                  entityId={service.id}
                  eventType="whatsapp_click"
                  {...analyticsMeta}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </TrackedLink>
              </Button>
            ) : null}
            {instagramUrl ? (
              <Button asChild variant="ghost">
                <TrackedLink
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  entityType="city_service"
                  entityId={service.id}
                  eventType="instagram_click"
                  {...analyticsMeta}
                >
                  <Instagram className="h-4 w-4" /> Instagram
                </TrackedLink>
              </Button>
            ) : null}
            {service.siteUrl ? (
              <Button asChild variant="ghost">
                <TrackedLink
                  href={service.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  entityType="city_service"
                  entityId={service.id}
                  eventType="site_click"
                  {...analyticsMeta}
                >
                  <ExternalLink className="h-4 w-4" /> Site
                </TrackedLink>
              </Button>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="container pb-12">
        <Button asChild variant="ghost">
          <Link href="/servicos">Voltar para Serviços da Cidade</Link>
        </Button>
      </div>
    </TrackView>
  );
}
