import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Accessibility,
  Baby,
  Beer,
  CakeSlice,
  Car,
  CheckCircle2,
  ChefHat,
  Clock,
  Coffee,
  CreditCard,
  CupSoda,
  ExternalLink,
  GlassWater,
  IceCreamBowl,
  Instagram,
  MapPin,
  MessageCircle,
  Martini,
  Music,
  PawPrint,
  Pizza,
  Snowflake,
  Sparkles,
  Sandwich,
  Soup,
  Trees,
  Truck,
  Utensils,
  WalletCards,
  Wifi,
  Wine,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { FoodCard } from "@/components/food-card";
import { JsonLd } from "@/components/json-ld";
import { RestaurantGallery } from "@/components/restaurant-gallery";
import { SafeImage } from "@/components/safe-image";
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

const logoImageSignals = ["logo", "marca", "brand", "avatar", "profile"];
const fallbackHeroImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=85";

function restaurantSlug(place: FoodPlace) {
  return place.slug || slugify(place.name);
}

function restaurantMapUrl(place: FoodPlace) {
  return place.mapUrl || googleMapsSearchUrl(place.name, place.address || place.location);
}

function restaurantInstagramUrl(place: FoodPlace) {
  return place.instagramUrl || instagramUrlFromHandle(place.instagram);
}

function isLogoImage(image?: string) {
  if (!image) return false;
  const normalized = image.toLowerCase();
  return logoImageSignals.some((signal) => normalized.includes(signal));
}

function uniqueImages(images: string[]) {
  return Array.from(new Set(images.map((image) => image.trim()).filter(Boolean)));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getHeroImage(place: FoodPlace) {
  const candidates = uniqueImages([...(place.galleryImages || []), place.image]);
  return candidates.find((image) => !isLogoImage(image)) || fallbackHeroImage;
}

function getLogoImage(place: FoodPlace) {
  return place.logo || (isLogoImage(place.image) ? place.image : null);
}

function getRecommendedImage(place: FoodPlace, heroImage: string) {
  const candidates = uniqueImages([...(place.galleryImages || []), place.image]);
  return candidates.find((image) => image !== heroImage && !isLogoImage(image)) || heroImage;
}

function detailDescription(place: FoodPlace) {
  const specialty = place.specialties?.[0] || place.tags[0] || place.category;
  return `Conheça ${place.name} em Cerro Corá-RN: ${specialty.toLowerCase()}, horários, fotos, localização e contato para visitantes.`;
}

function formatPriceRange(priceRange?: FoodPlace["priceRange"]) {
  return priceRange || "R$ - R$$$";
}

type HouseOffering = {
  label: string;
  icon: LucideIcon;
};

const offeringRules: Array<{
  label: string;
  icon: LucideIcon;
  matches: string[];
}> = [
  { label: "Wi-Fi", icon: Wifi, matches: ["wi-fi", "wifi", "internet"] },
  { label: "Delivery", icon: Truck, matches: ["delivery", "entrega"] },
  { label: "Pizza", icon: Pizza, matches: ["pizza", "pizzas", "pizzaria"] },
  { label: "Hambúrgueres", icon: Sandwich, matches: ["hamburguer", "hambúrguer", "hamburgueres", "hambúrgueres"] },
  { label: "Bebidas", icon: CupSoda, matches: ["bebida", "bebidas", "refrigerante", "sucos", "suco"] },
  { label: "Drinks", icon: Martini, matches: ["drink", "drinks", "coquetel", "bar"] },
  { label: "Cafés", icon: Coffee, matches: ["cafe", "cafes", "cafeteria", "chocolate quente"] },
  { label: "Sorvetes/açaí", icon: IceCreamBowl, matches: ["sorvete", "sorvetes", "acai", "açaí"] },
  { label: "Sobremesas", icon: CakeSlice, matches: ["sobremesa", "sobremesas", "doce", "doces"] },
  { label: "Pratos", icon: Soup, matches: ["prato", "pratos", "refeicao", "refeição", "almoco", "almoço", "jantar"] },
  { label: "Petiscos", icon: Utensils, matches: ["petisco", "petiscos", "espetinho"] },
  { label: "Cervejas", icon: Beer, matches: ["cerveja", "cervejas"] },
  { label: "Vinhos", icon: Wine, matches: ["vinho", "vinhos"] },
  { label: "Ambiente climatizado", icon: Snowflake, matches: ["climatizado", "ar condicionado"] },
  { label: "Ambiente externo", icon: Trees, matches: ["ambiente externo", "area externa", "área externa", "ao ar livre"] },
  { label: "Música ao vivo", icon: Music, matches: ["musica", "música", "ao vivo"] },
  { label: "Estacionamento", icon: Car, matches: ["estacionamento"] },
  { label: "Espaço Kids", icon: Baby, matches: ["kids", "crianca", "criança", "infantil"] },
  { label: "Pet Friendly", icon: PawPrint, matches: ["pet", "animal"] },
  { label: "Acessibilidade", icon: Accessibility, matches: ["acessibilidade", "acessivel", "acessível"] },
  { label: "Vista panorâmica", icon: GlassWater, matches: ["vista", "panoramica", "panorâmica", "mirante"] },
];

function iconForOffering(label: string) {
  const normalized = normalizeText(label);
  return offeringRules.find((rule) => rule.matches.some((match) => normalized.includes(normalizeText(match))))?.icon;
}

function getHouseOfferings(place: FoodPlace, specialties: string[], features: string[]): HouseOffering[] {
  const textPool = [...features, ...specialties, ...place.tags, place.category];
  const offerings = new Map<string, HouseOffering>();

  for (const feature of features) {
    const label = feature.trim();
    if (label) {
      offerings.set(normalizeText(label), {
        label,
        icon: iconForOffering(label) || CheckCircle2,
      });
    }
  }

  const normalizedText = textPool.map(normalizeText).join(" ");
  for (const rule of offeringRules) {
    if (rule.matches.some((match) => normalizedText.includes(normalizeText(match)))) {
      offerings.set(normalizeText(rule.label), {
        label: rule.label,
        icon: rule.icon,
      });
    }
  }

  return Array.from(offerings.values()).slice(0, 10);
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
      title: "Restaurante não encontrado",
      path: `/restaurantes/${slug}`,
      description: "Restaurante não encontrado no guia gastronômico de Cerro Corá-RN.",
    });
  }

  return createMetadata({
    title: `${item.name} em Cerro Corá-RN`,
    path: `/restaurantes/${restaurantSlug(item)}`,
    description: detailDescription(item),
    image: getHeroImage(item),
  });
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
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
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
  helper,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
  href?: string;
  helper?: string | null;
}) {
  if (!value) return null;

  const inner = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-accent/55 text-alpine-wine">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold leading-6 text-foreground">{value}</p>
        {helper ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p> : null}
      </div>
    </>
  );

  const className =
    "flex min-h-24 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-premium";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return <div className={className}>{inner}</div>;
}

function OfferingPill({ offering }: { offering: HouseOffering }) {
  const Icon = offering.icon;

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/20">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-alpine-wine">
        <Icon className="h-4 w-4" />
      </span>
      {offering.label}
    </span>
  );
}

export default async function RestaurantDetailPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const { item: place, related } = await getPublicRestaurantPage(slug);

  if (!place) {
    notFound();
  }

  const mapUrl = restaurantMapUrl(place);
  const instagramUrl = place.instagram ? restaurantInstagramUrl(place) : null;
  const heroImage = getHeroImage(place);
  const logoImage = getLogoImage(place);
  const recommendedImage = getRecommendedImage(place, heroImage);
  const galleryImages = uniqueImages(place.galleryImages || []).filter((image) => image !== logoImage);
  const specialties = place.specialties?.length ? place.specialties : place.tags;
  const features = place.features || [];
  const houseOfferings = getHouseOfferings(place, specialties, features);
  const paymentMethods = place.paymentMethods || [];
  const priceRange = formatPriceRange(place.priceRange);

  return (
    <>
      <JsonLd data={restaurantDetailSchema({ ...place, slug: restaurantSlug(place) })} />

      <section className="relative overflow-hidden border-b border-border bg-[#10201b] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(234,169,90,0.10),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_55%)]" />
        <div className="container relative z-10 grid min-h-[280px] content-center py-14 md:min-h-[340px] md:py-16">
          <div className="mx-auto grid max-w-4xl justify-items-center gap-4 text-center md:gap-5">
            {logoImage ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/20 bg-white/95 p-2.5 shadow-glass ring-1 ring-black/5 md:h-28 md:w-28 md:p-3">
                <SafeImage
                  src={logoImage}
                  alt={`Logo de ${place.name}`}
                  fill
                  sizes="(min-width: 768px) 112px, 80px"
                  className="object-contain p-2"
                />
              </div>
            ) : null}

            <h1 className="font-display text-5xl font-semibold leading-[0.95] md:text-7xl">{place.name}</h1>
          </div>
        </div>
      </section>

      <main className="container grid gap-10 py-12 md:gap-12 md:py-14">
        {(place.recommendedDish || place.firstVisitTip) ? (
          <Card className="overflow-hidden border-alpine-sunset/30 bg-card shadow-premium">
            <CardContent className="grid gap-0 p-0 md:grid-cols-[220px_1fr_auto] md:items-center">
              <div className="relative aspect-[4/3] min-h-44 bg-muted md:aspect-auto md:h-full">
                <SafeImage
                  src={recommendedImage}
                  alt={`Sugestão da casa em ${place.name}`}
                  fill
                  sizes="(min-width: 768px) 220px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5 md:p-6">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-alpine-wine">
                  <ChefHat className="h-4 w-4" /> Prato recomendado
                </span>
                <h2 className="mt-3 font-display text-2xl font-semibold md:text-3xl">
                  {place.recommendedDish || "Sugestão da casa"}
                </h2>
                {place.firstVisitTip ? (
                  <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">{place.firstVisitTip}</p>
                ) : null}
              </div>
              <div className="px-5 pb-5 md:px-6 md:pb-0">
                <Button asChild variant="warm">
                  <a href={`https://wa.me/${place.whatsapp}`} target="_blank" rel="noopener noreferrer">
                    Chamar no WhatsApp <MessageCircle className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <SectionShell title="Sobre o restaurante" eyebrow="Experiência gastronômica">
            <Card>
              <CardContent className="grid gap-5 p-5 md:p-6">
                <p className="max-w-3xl text-base leading-8 text-muted-foreground">
                  {place.story || place.description}
                </p>

                {houseOfferings.length ? (
                  <div className="grid gap-3 border-t border-border pt-5">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        A casa oferece
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Estrutura e opções que ajudam a escolher a melhor parada para o seu roteiro.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {houseOfferings.map((offering) => (
                        <OfferingPill key={offering.label} offering={offering} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </SectionShell>

          <SectionShell title="Informações úteis" eyebrow="Planeje a visita">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                icon={Clock}
                label="Horário"
                value={place.hours}
              />
              <InfoCard icon={WalletCards} label="Faixa de preço" value={priceRange} />
              <InfoCard icon={MapPin} label="Endereço" value={place.address || place.location} href={mapUrl} />
              <InfoCard
                icon={MessageCircle}
                label="WhatsApp"
                value={place.phone || `+${place.whatsapp}`}
                href={`https://wa.me/${place.whatsapp}`}
              />
              <InfoCard icon={Instagram} label="Instagram" value={place.instagram} href={instagramUrl || undefined} />
              {paymentMethods.length ? (
                <InfoCard icon={CreditCard} label="Pagamento" value={paymentMethods.join(", ")} />
              ) : null}
            </div>
          </SectionShell>
        </div>

        {galleryImages.length ? (
          <SectionShell
            title="Fotos do restaurante"
            eyebrow="Ambiente e pratos"
            description="Imagens cadastradas pelo estabelecimento para ajudar na escolha da visita."
          >
            <RestaurantGallery images={galleryImages} name={place.name} />
          </SectionShell>
        ) : null}

        <Card>
          <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-alpine-wine" />
                <h2 className="font-display text-2xl font-semibold">{place.menuUrl ? "Mapa e cardápio" : "Mapa"}</h2>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  Abrir no Google Maps <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              {place.menuUrl ? (
                <Button asChild variant="warm">
                  <a href={place.menuUrl} target="_blank" rel="noopener noreferrer">
                    Ver cardápio <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <section className="overflow-hidden rounded-xl border border-border bg-[#10201b] text-white shadow-premium">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-alpine-sunset">
                <Sparkles className="h-4 w-4" /> Gostou deste restaurante?
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold">Entre em contato com o restaurante.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-white/72">
                Fale com o estabelecimento, veja a rota no mapa ou acompanhe as novidades pelo Instagram.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <Button asChild variant="warm">
                <a href={`https://wa.me/${place.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
              <Button asChild variant="glass">
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-4 w-4" /> Como chegar
                </a>
              </Button>
              {instagramUrl ? (
                <Button asChild variant="glass">
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        {related.length ? (
          <SectionShell title="Conheça também" eyebrow="Restaurantes relacionados">
            <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedPlace) => (
                <FoodCard key={restaurantSlug(relatedPlace)} place={relatedPlace} />
              ))}
            </div>
          </SectionShell>
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
