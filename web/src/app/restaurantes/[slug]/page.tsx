import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Instagram,
  MapPin,
  MessageCircle,
  Sparkles,
  Utensils,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { FoodCard } from "@/components/food-card";
import { JsonLd } from "@/components/json-ld";
import { RestaurantGallery } from "@/components/restaurant-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FoodPlace } from "@/lib/data";
import { googleMapsSearchUrl, instagramUrlFromHandle } from "@/lib/links";
import { getPublicFoodPlaces, getPublicRestaurantPage } from "@/lib/public-content";
import { createMetadata, restaurantDetailSchema } from "@/lib/seo";
import { slugify } from "@/lib/slug";

type RestaurantPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 300;

function restaurantSlug(place: FoodPlace) {
  return place.slug || slugify(place.name);
}

function restaurantMapUrl(place: FoodPlace) {
  return place.mapUrl || googleMapsSearchUrl(place.name, place.address || place.location);
}

function restaurantInstagramUrl(place: FoodPlace) {
  return place.instagramUrl || instagramUrlFromHandle(place.instagram);
}

function detailDescription(place: FoodPlace) {
  const specialty = place.specialties?.[0] || place.tags[0] || place.category;
  return `ConheÃ§a ${place.name} em Cerro CorÃ¡-RN: ${specialty.toLowerCase()}, horÃ¡rios, fotos, localizaÃ§Ã£o e contato para visitantes.`;
}

export async function generateStaticParams() {
  const { items } = await getPublicFoodPlaces();
  return items.map((place) => ({ slug: restaurantSlug(place) }));
}

export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await getPublicRestaurantPage(slug);

  if (!item) {
    return createMetadata({
      title: "Restaurante nÃ£o encontrado",
      path: `/restaurantes/${slug}`,
      description: "Restaurante nÃ£o encontrado no guia gastronÃ´mico de Cerro CorÃ¡-RN.",
    });
  }

  return createMetadata({
    title: `${item.name} em Cerro CorÃ¡-RN`,
    path: `/restaurantes/${restaurantSlug(item)}`,
    description: detailDescription(item),
    image: item.image,
  });
}

function InfoItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
  href?: string;
}) {
  if (!value) return null;

  const content = (
    <>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-alpine-wine" />
      <span>
        <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span className="mt-1 block leading-6 text-foreground">{value}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-3 rounded-md border border-border bg-background/55 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-accent/60"
      >
        {content}
      </a>
    );
  }

  return <div className="flex gap-3 rounded-md border border-border bg-background/55 p-3 text-sm">{content}</div>;
}

function DetailSection({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5">
      <div>
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-alpine-wine">{eyebrow}</span>
        ) : null}
        <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default async function RestaurantDetailPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const { item: place, related } = await getPublicRestaurantPage(slug);

  if (!place) {
    notFound();
  }

  const mapUrl = restaurantMapUrl(place);
  const instagramUrl = restaurantInstagramUrl(place);
  const galleryImages = [place.image, ...(place.galleryImages || [])].filter(Boolean);
  const specialties = place.specialties?.length ? place.specialties : place.tags;
  const features = place.features || [];
  const paymentMethods = place.paymentMethods || [];

  return (
    <>
      <JsonLd data={restaurantDetailSchema({ ...place, slug: restaurantSlug(place) })} />

      <section className="relative min-h-[68vh] overflow-hidden bg-[#10201b] text-white">
        <Image
          src={place.image}
          alt={`Foto de ${place.name}`}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/48 to-black/16" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1814] via-transparent to-transparent" />

        <div className="container relative z-10 flex min-h-[68vh] items-end py-16">
          <div className="max-w-3xl">
            <Button asChild variant="glass" size="sm" className="mb-8">
              <Link href="/gastronomia">
                <ArrowLeft className="h-4 w-4" /> Voltar para Gastronomia
              </Link>
            </Button>

            <div className="flex flex-wrap gap-2">
              <Badge className="border-white/20 bg-white/15 text-white backdrop-blur-md">{place.category}</Badge>
              {place.priceRange ? (
                <Badge className="border-white/20 bg-white/15 text-white backdrop-blur-md">{place.priceRange}</Badge>
              ) : null}
              {place.isFeatured ? (
                <Badge className="border-alpine-sunset/40 bg-alpine-sunset text-[#17251f]">Destaque</Badge>
              ) : null}
            </div>

            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] md:text-7xl">{place.name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">
              {place.locationLabel || place.location} em Cerro CorÃ¡, com informaÃ§Ãµes de contato, horÃ¡rios e dicas para
              quem visita a cidade.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="warm" size="lg">
                <a href={`https://wa.me/${place.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
              <Button asChild variant="glass" size="lg">
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              </Button>
              <Button asChild variant="glass" size="lg">
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-4 w-4" /> Como chegar
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="container grid gap-16 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <DetailSection title="Sobre o restaurante" eyebrow="ExperiÃªncia">
            <Card>
              <CardContent className="grid gap-6 p-6 md:p-8">
                <p className="text-base leading-8 text-muted-foreground">{place.story || place.description}</p>

                {specialties.length ? (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Especialidades da casa
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {specialties.map((specialty) => (
                        <Badge key={specialty} className="bg-background/70">
                          <Utensils className="h-3.5 w-3.5" /> {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </DetailSection>

          <DetailSection title="InformaÃ§Ãµes Ãºteis" eyebrow="Planeje a visita">
            <Card>
              <CardContent className="grid gap-3 p-5">
                <InfoItem icon={Clock} label="HorÃ¡rio" value={place.hours} />
                <InfoItem icon={MapPin} label="EndereÃ§o" value={place.address || place.location} href={mapUrl} />
                <InfoItem icon={MessageCircle} label="WhatsApp" value={place.phone || `+${place.whatsapp}`} href={`https://wa.me/${place.whatsapp}`} />
                <InfoItem icon={Instagram} label="Instagram" value={place.instagram} href={instagramUrl} />
                <InfoItem icon={WalletCards} label="Faixa de preÃ§o" value={place.priceRange || "Consulte valores"} />
              </CardContent>
            </Card>
          </DetailSection>
        </div>

        {(paymentMethods.length || features.length) ? (
          <section className="grid gap-5 md:grid-cols-2">
            {paymentMethods.length ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-alpine-wine" />
                    <h2 className="font-display text-2xl font-semibold">Formas de pagamento</h2>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {paymentMethods.map((method) => (
                      <Badge key={method} className="bg-background/70">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {features.length ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-alpine-wine" />
                    <h2 className="font-display text-2xl font-semibold">Diferenciais</h2>
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {features.map((feature) => (
                      <span key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> {feature}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </section>
        ) : null}

        <DetailSection title="Galeria" eyebrow="Ambiente e pratos">
          <RestaurantGallery images={galleryImages} name={place.name} />
        </DetailSection>

        <div className="grid gap-8 lg:grid-cols-2">
          {(place.recommendedDish || place.firstVisitTip) ? (
            <Card className="border-alpine-sunset/30 bg-alpine-sunset/10">
              <CardContent className="grid gap-4 p-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-alpine-sunset" />
                  <h2 className="font-display text-2xl font-semibold">RecomendaÃ§Ã£o da casa</h2>
                </div>
                {place.recommendedDish ? (
                  <p className="text-lg font-semibold">{place.recommendedDish}</p>
                ) : null}
                {place.firstVisitTip ? (
                  <p className="leading-7 text-muted-foreground">{place.firstVisitTip}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="grid gap-5 p-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-alpine-wine" />
                <h2 className="font-display text-2xl font-semibold">Mapa e cardÃ¡pio</h2>
              </div>
              <p className="leading-7 text-muted-foreground">
                Para manter a pÃ¡gina leve, o mapa abre direto no Google Maps em uma nova aba.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="outline">
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                    Abrir no Google Maps <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                {place.menuUrl ? (
                  <Button asChild variant="warm">
                    <a href={place.menuUrl} target="_blank" rel="noopener noreferrer">
                      Ver cardÃ¡pio <CalendarCheck2 className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {related.length ? (
          <DetailSection title="Restaurantes relacionados" eyebrow="Veja tambÃ©m">
            <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedPlace) => (
                <FoodCard key={restaurantSlug(relatedPlace)} place={relatedPlace} />
              ))}
            </div>
          </DetailSection>
        ) : null}

        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/gastronomia">
              Ver todos os estabelecimentos <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </>
  );
}
