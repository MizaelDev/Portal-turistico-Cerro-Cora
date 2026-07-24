import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Accessibility,
  Baby,
  Bath,
  BedDouble,
  Car,
  CheckCircle2,
  ChefHat,
  Clock,
  Coffee,
  CreditCard,
  ExternalLink,
  Hotel,
  House,
  Instagram,
  MapPin,
  MessageCircle,
  Mountain,
  PawPrint,
  Snowflake,
  Sparkles,
  Trees,
  Tv,
  Utensils,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { BusinessStatusBadge } from "@/components/business-status-badge";
import { JsonLd } from "@/components/json-ld";
import { LodgingCard } from "@/components/lodging-card";
import { LodgingGallery } from "@/components/lodging-gallery";
import { SafeImage } from "@/components/safe-image";
import { TrackedLink } from "@/components/tracked-link";
import { TrackView } from "@/components/track-view";
import { TrackedShareButton } from "@/components/tracked-share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Lodging } from "@/lib/data";
import { googleMapsSearchUrl, instagramUrlFromHandle, whatsappUrl } from "@/lib/links";
import { getPublicLodgingPage, getPublicLodgings } from "@/lib/public-content";
import { createMetadata, lodgingDetailSchema } from "@/lib/seo";
import { slugify } from "@/lib/slug";

type LodgingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 300;

function lodgingSlug(lodging: Lodging) {
  return lodging.slug || slugify(lodging.name);
}

function lodgingMapUrl(lodging: Lodging) {
  return lodging.mapUrl || googleMapsSearchUrl(lodging.name, lodging.address || lodging.location);
}

function lodgingInstagramUrl(lodging: Lodging) {
  if (!lodging.instagram) return null;
  return lodging.instagramUrl || instagramUrlFromHandle(lodging.instagram);
}

function allImages(lodging: Lodging) {
  return Array.from(new Set([lodging.image, ...(lodging.gallery || [])].map((image) => image?.trim()).filter(Boolean)));
}

function detailDescription(lodging: Lodging) {
  const category = lodging.category || "Pousada";
  return `${lodging.name} em Cerro Corá-RN: ${category.toLowerCase()}, localização, fotos, valores e contato para reserva.`;
}

type Amenity = {
  label: string;
  icon: LucideIcon;
};

const amenityRules: Array<{ label: string; icon: LucideIcon; matches: string[] }> = [
  { label: "Café da manhã", icon: Coffee, matches: ["cafe", "café", "cafe da manha", "café da manhã"] },
  { label: "Piscina", icon: Bath, matches: ["piscina"] },
  { label: "Wi-Fi", icon: Wifi, matches: ["wifi", "wi-fi", "internet"] },
  { label: "Ar-condicionado", icon: Snowflake, matches: ["ar", "climatizado", "condicionado"] },
  { label: "TV", icon: Tv, matches: ["tv", "televisao", "televisão"] },
  { label: "Estacionamento", icon: Car, matches: ["estacionamento", "garagem"] },
  { label: "Área Kids", icon: Baby, matches: ["kids", "crianca", "criança", "infantil"] },
  { label: "Pet Friendly", icon: PawPrint, matches: ["pet"] },
  { label: "Vista panorâmica", icon: Mountain, matches: ["vista", "panoramica", "panorâmica", "serra"] },
  { label: "Restaurante", icon: Utensils, matches: ["restaurante", "refeicao", "refeição"] },
  { label: "Cozinha", icon: ChefHat, matches: ["cozinha"] },
  { label: "Acessibilidade", icon: Accessibility, matches: ["acessibilidade", "acessivel", "acessível"] },
  { label: "Área verde", icon: Trees, matches: ["verde", "jardim", "natureza"] },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function iconForAmenity(label: string) {
  const normalized = normalizeText(label);
  return amenityRules.find((rule) => rule.matches.some((match) => normalized.includes(normalizeText(match))))?.icon;
}

function lodgingAmenities(lodging: Lodging): Amenity[] {
  const source = lodging.amenities?.length ? lodging.amenities : lodging.highlights || [];
  return source
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({
      label,
      icon: iconForAmenity(label) || CheckCircle2,
    }))
    .slice(0, 15);
}

function SectionShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid content-start gap-5">
      <div className="max-w-2xl">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-alpine-wine">{eyebrow}</span>
        ) : null}
        <h2
          className={`${eyebrow ? "mt-2 " : ""}font-display text-3xl font-semibold leading-tight md:text-4xl`}
        >
          {title}
        </h2>
        {description ? <p className="mt-3 leading-7 text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
  href?: string | null;
}) {
  if (!value) return null;

  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-accent/55 text-alpine-wine">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold leading-6 text-foreground">{value}</p>
      </div>
    </>
  );

  const className =
    "flex min-h-24 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-premium";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

function AmenityCard({ amenity }: { amenity: Amenity }) {
  const Icon = amenity.icon;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-alpine-wine">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold">{amenity.label}</p>
    </div>
  );
}

export async function generateStaticParams() {
  const { items } = await getPublicLodgings();
  return items.map((lodging) => ({ slug: lodgingSlug(lodging) }));
}

export async function generateMetadata({ params }: LodgingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await getPublicLodgingPage(slug);

  if (!item) {
    notFound();
  }

  return createMetadata({
    title: `${item.name} em Cerro Corá-RN`,
    path: `/pousadas/${lodgingSlug(item)}`,
    description: detailDescription(item),
    image: item.heroImage || item.image,
  });
}

export default async function LodgingDetailPage({ params }: LodgingPageProps) {
  const { slug } = await params;
  const { item: lodging, related } = await getPublicLodgingPage(slug);

  if (!lodging) {
    notFound();
  }

  const images = lodging.galleryEnabled === false ? [] : allImages(lodging);
  const mapUrl = lodgingMapUrl(lodging);
  const instagramUrl = lodgingInstagramUrl(lodging);
  const amenities = lodgingAmenities(lodging);
  const highlights = lodging.highlights || [];
  const accommodationTypes = lodging.accommodationTypes || [];
  const paymentMethods = lodging.paymentMethods || [];
  const reservationMessage = lodging.whatsappMessage || `Olá! Quero saber sobre reserva na ${lodging.name}.`;
  const heroImage = lodging.heroImage?.trim() || null;
  const analyticsMeta = {
    establishmentName: lodging.name,
    category: lodging.category || "Pousada",
  };

  return (
    <>
      <JsonLd data={lodgingDetailSchema({ ...lodging, slug: lodgingSlug(lodging) })} />

      <TrackView entityType="lodging" entityId={lodging.id} eventType="page_view" {...analyticsMeta}>
      <section className="relative min-h-[520px] overflow-hidden border-b border-border bg-[#10201b] text-white md:min-h-[560px]">
        {heroImage ? (
          <SafeImage
            src={heroImage}
            alt={`Foto principal de ${lodging.name}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}

        <div className="container relative z-10 grid min-h-[520px] content-end py-12 md:min-h-[560px] md:py-14">
          <div className="max-w-4xl">
            {lodging.logo ? (
              <div className="relative mb-5 h-16 w-16 overflow-hidden rounded-xl border border-white/20 bg-white/95 p-2 shadow-glass sm:h-20 sm:w-20 md:h-24 md:w-24">
                <SafeImage
                  src={lodging.logo}
                  alt={`Logo de ${lodging.name}`}
                  fill
                  priority={!heroImage}
                  sizes="96px"
                  className="object-contain p-2"
                />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Badge className="border-white/20 bg-white/12 text-white backdrop-blur-md">
                {lodging.category || "Pousada"}
              </Badge>
              {amenities.slice(0, 3).map((amenity) => {
                const Icon = amenity.icon;
                return (
                  <Badge key={amenity.label} className="border-white/20 bg-white/12 text-white backdrop-blur-md">
                    <Icon className="h-3.5 w-3.5" /> {amenity.label}
                  </Badge>
                );
              })}
              <Badge className="border-white/20 bg-white/12 text-white backdrop-blur-md">
                <MapPin className="h-3.5 w-3.5" /> {lodging.location}
              </Badge>
            </div>

            <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[0.95] md:text-7xl">
              {lodging.name}
            </h1>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="warm">
                <TrackedLink
                  href={whatsappUrl(lodging.whatsapp, reservationMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  entityType="lodging"
                  entityId={lodging.id}
                  eventType="reserve_click"
                  {...analyticsMeta}
                >
                  <MessageCircle className="h-4 w-4" /> Reservar
                </TrackedLink>
              </Button>
              <Button asChild variant="glass">
                <TrackedLink
                  href={whatsappUrl(lodging.whatsapp, lodging.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  entityType="lodging"
                  entityId={lodging.id}
                  eventType="whatsapp_click"
                  {...analyticsMeta}
                >
                  WhatsApp
                </TrackedLink>
              </Button>
              <Button asChild variant="glass">
                <TrackedLink
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  entityType="lodging"
                  entityId={lodging.id}
                  eventType="map_click"
                  {...analyticsMeta}
                >
                  <MapPin className="h-4 w-4" /> Como chegar
                </TrackedLink>
              </Button>
              {instagramUrl ? (
                <Button asChild variant="glass">
                  <TrackedLink
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    entityType="lodging"
                    entityId={lodging.id}
                    eventType="instagram_click"
                    {...analyticsMeta}
                  >
                    <Instagram className="h-4 w-4" /> Instagram
                  </TrackedLink>
                </Button>
              ) : null}
              <TrackedShareButton
                entityType="lodging"
                entityId={lodging.id}
                establishmentName={lodging.name}
                category={analyticsMeta.category}
                variant="glass"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="container grid gap-10 py-12 md:gap-14 md:py-16">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <SectionShell title="Sobre a hospedagem">
            <div className="grid gap-5 border-l-2 border-alpine-wine/35 pl-5 md:pl-6">
              <p className="max-w-3xl text-base leading-8 text-muted-foreground">
                {lodging.description}
              </p>
              {lodging.mainDifferential ? (
                <div className="grid gap-1.5 border-t border-border/70 pt-4">
                  <p className="text-xs font-semibold text-alpine-wine">Destaque da hospedagem</p>
                  <p className="font-display text-2xl font-semibold">{lodging.mainDifferential}</p>
                </div>
              ) : null}
            </div>
          </SectionShell>

          <SectionShell title="Informações úteis" eyebrow="Planeje sua reserva">
            <BusinessStatusBadge businessHours={lodging.businessHours} context="lodging" className="w-fit" />
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard icon={Clock} label="Check-in" value={lodging.checkIn || "A combinar"} />
              <InfoCard icon={Clock} label="Check-out" value={lodging.checkOut || "A combinar"} />
              <InfoCard icon={Users} label="Capacidade" value={lodging.capacity} />
              <InfoCard icon={BedDouble} label="Acomodações" value={accommodationTypes.slice(0, 3).join(", ")} />
              <InfoCard icon={CreditCard} label="Faixa de preço" value={lodging.priceRange} />
              <InfoCard icon={CreditCard} label="Pagamento" value={paymentMethods.join(", ")} />
              <InfoCard icon={MessageCircle} label="WhatsApp" value={lodging.phone || `+${lodging.whatsapp}`} href={`https://wa.me/${lodging.whatsapp}`} />
              <InfoCard icon={Instagram} label="Instagram" value={lodging.instagram} href={instagramUrl} />
            </div>
          </SectionShell>
        </div>

        {lodging.story && lodging.story !== lodging.description ? (
          <SectionShell title="Nossa história">
            <Card>
              <CardContent className="p-5 md:p-6">
                <p className="max-w-4xl text-base leading-8 text-muted-foreground">{lodging.story}</p>
              </CardContent>
            </Card>
          </SectionShell>
        ) : null}

        {amenities.length ? (
          <SectionShell title="Comodidades">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {amenities.map((amenity) => (
                <AmenityCard key={amenity.label} amenity={amenity} />
              ))}
            </div>
          </SectionShell>
        ) : null}

        {highlights.length ? (
          <SectionShell title="Por que escolher esta hospedagem?">
            <div className="grid gap-x-7 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((highlight) => (
                <div key={highlight} className="flex min-h-14 items-center gap-3 border-b border-border/70 py-4">
                  <Sparkles className="h-5 w-5 shrink-0 text-alpine-sunset" />
                  <p className="text-sm font-semibold">{highlight}</p>
                </div>
              ))}
            </div>
          </SectionShell>
        ) : null}

        {images.length ? (
          <SectionShell
            title="Galeria"
            description="Quartos, áreas comuns e outros detalhes da hospedagem."
          >
            <LodgingGallery
              images={images}
              name={lodging.name}
              entityId={lodging.id}
              category={analyticsMeta.category}
            />
          </SectionShell>
        ) : null}

        {accommodationTypes.length ? (
          <SectionShell title="Acomodações" eyebrow="Opções de estadia">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accommodationTypes.map((item) => (
                <Card key={item}>
                  <CardContent className="grid gap-3 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent text-alpine-wine">
                      <BedDouble className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold">{item}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Consulte disponibilidade, capacidade e configuração diretamente com a hospedagem.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </SectionShell>
        ) : null}

        <Card>
          <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-alpine-wine" />
                <h2 className="font-display text-2xl font-semibold">Localização</h2>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                {lodging.address || lodging.location}
              </p>
            </div>
            <Button asChild variant="outline">
              <TrackedLink
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                entityType="lodging"
                entityId={lodging.id}
                eventType="map_click"
                {...analyticsMeta}
              >
                Abrir rota <ExternalLink className="h-4 w-4" />
              </TrackedLink>
            </Button>
          </CardContent>
        </Card>

        <section className="overflow-hidden rounded-xl border border-border bg-[#10201b] text-white shadow-premium">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-alpine-sunset">
                <House className="h-4 w-4" /> Gostou desta hospedagem?
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold">Reserve sua estadia em Cerro Corá.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-white/72">
                Fale com a hospedagem, confirme disponibilidade e veja a melhor rota para chegar.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <Button asChild variant="warm">
                <TrackedLink
                  href={whatsappUrl(lodging.whatsapp, reservationMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  entityType="lodging"
                  entityId={lodging.id}
                  eventType="reserve_click"
                  {...analyticsMeta}
                >
                  <MessageCircle className="h-4 w-4" /> Reservar pelo WhatsApp
                </TrackedLink>
              </Button>
              <Button asChild variant="glass">
                <TrackedLink
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  entityType="lodging"
                  entityId={lodging.id}
                  eventType="map_click"
                  {...analyticsMeta}
                >
                  <MapPin className="h-4 w-4" /> Como chegar
                </TrackedLink>
              </Button>
              {instagramUrl ? (
                <Button asChild variant="glass">
                  <TrackedLink
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    entityType="lodging"
                    entityId={lodging.id}
                    eventType="instagram_click"
                    {...analyticsMeta}
                  >
                    <Instagram className="h-4 w-4" /> Instagram
                  </TrackedLink>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        {related.length ? (
          <SectionShell title="Você também pode gostar" eyebrow="Hospedagens relacionadas">
            <div className="grid gap-6">
              {related.map((relatedLodging) => (
                <LodgingCard key={lodgingSlug(relatedLodging)} lodging={relatedLodging} />
              ))}
            </div>
          </SectionShell>
        ) : null}

        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/pousadas">
              Ver todas as pousadas <Hotel className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
      </TrackView>
    </>
  );
}
