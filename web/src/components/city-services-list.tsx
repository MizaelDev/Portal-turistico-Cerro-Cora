"use client";

import Image from "next/image";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Building2,
  ChevronRight,
  Clock,
  Fuel,
  Hospital,
  Info,
  Instagram,
  Landmark,
  MapPin,
  MessageCircle,
  Phone,
  Pill,
  Search,
  Shield,
  Store,
  X,
  type LucideIcon,
} from "lucide-react";
import { BusinessStatusBadge } from "@/components/business-status-badge";
import { TrackedLink } from "@/components/tracked-link";
import { TrackView } from "@/components/track-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getBusinessStatus,
  parseBusinessHours,
  parseLegacyBusinessHours,
} from "@/lib/business-hours";
import type { ServiceCategoryDefinition } from "@/lib/city-service-catalog";
import { analyticsService } from "@/lib/analytics";
import type { CityService } from "@/lib/city-services";
import { cn } from "@/lib/utils";

type QuickFilter = "all" | "public" | "health" | "security" | "commerce" | "open";
type ServiceGroup = "health" | "security" | "commerce";

type CityServicesListProps = {
  services: CityService[];
  categories: ServiceCategoryDefinition[];
  initialFilter?: QuickFilter;
};

type AccentStyle = {
  side: string;
  icon: string;
  badge: string;
};

type ServiceGroupDefinition = {
  id: ServiceGroup;
  label: string;
  accent: keyof typeof accentStyles;
};

const accentStyles: Record<string, AccentStyle> = {
  green: {
    side: "border-l-[#5f8558]",
    icon: "text-[#4d7448] dark:text-[#92b88b]",
    badge: "border-[#5f8558]/25 bg-[#5f8558]/10 text-[#405f3c] dark:text-[#a5c79f]",
  },
  blue: {
    side: "border-l-[#4d7898]",
    icon: "text-[#3f6887] dark:text-[#86adca]",
    badge: "border-[#4d7898]/25 bg-[#4d7898]/10 text-[#365b77] dark:text-[#96bad3]",
  },
  amber: {
    side: "border-l-[#b58a45]",
    icon: "text-[#8b682e] dark:text-[#ddb979]",
    badge: "border-[#b58a45]/25 bg-[#b58a45]/10 text-[#745526] dark:text-[#e3c38d]",
  },
};

const serviceGroups: ServiceGroupDefinition[] = [
  { id: "health", label: "Saúde", accent: "green" },
  { id: "security", label: "Segurança e serviços públicos", accent: "blue" },
  { id: "commerce", label: "Comércio e utilidades", accent: "amber" },
];

const quickAccessTerms = [
  { label: "Hospital", term: "hospital", icon: Hospital },
  { label: "Delegacia", term: "delegacia", icon: Shield },
  { label: "Farmácias", term: "farmacia", icon: Pill },
  { label: "Postos de combustível", term: "combustivel", icon: Fuel },
  { label: "Lotéricas", term: "loterica", icon: Landmark },
];

const excludedTerms = [
  "restaurante",
  "lanchonete",
  "pizzaria",
  "hamburgueria",
  "acai",
  "sorveteria",
  "hotel",
  "pousada",
  "hospedagem",
  "guia turistico",
];

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function hasRealValue(value?: string) {
  const normalized = normalizeText(value?.trim() || "");
  return Boolean(normalized && !normalized.includes("informacao a confirmar"));
}

function getServiceGroup(service: CityService): ServiceGroup | null {
  const identity = normalizeText(`${service.name} ${service.subcategory}`);
  if (excludedTerms.some((term) => identity.includes(term))) return null;

  if (["hospital", "maternidade", "ubs", "posto de saude", "farmacia"].some((term) => identity.includes(term))) {
    return "health";
  }

  if (["delegacia", "policia militar", "correios", "prefeitura", "secretaria", "orgao publico", "servico publico", "conselho tutelar", "cartorio"].some((term) => identity.includes(term))) {
    return "security";
  }

  if (["banco", "loterica", "mercado", "supermercado", "padaria", "combustivel", "oficina", "borracharia", "academia", "material de construcao", "materiais de construcao", "loja de construcao"].some((term) => identity.includes(term))) {
    return "commerce";
  }

  return service.listingType === "public_service" ? "security" : null;
}

function phoneHref(phone?: string) {
  const digits = phone?.replace(/\D/g, "");
  return digits ? `tel:${digits}` : null;
}

function whatsappHref(service: CityService) {
  const digits = service.whatsapp?.replace(/\D/g, "");
  if (!digits) return null;
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const message = service.whatsappMessage ||
    `Olá! Encontrei ${service.name} no Portal Turístico de Cerro Corá e gostaria de obter mais informações.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function instagramHref(service: CityService) {
  if (service.instagramUrl) return service.instagramUrl;
  const handle = service.instagram?.replace(/^@/, "").trim();
  return handle ? `https://www.instagram.com/${handle}/` : null;
}

function isServiceOpen(service: CityService, now: Date | null) {
  if (service.is24h) return true;
  if (!now) return false;
  const hours = parseBusinessHours(service.businessHours) || parseLegacyBusinessHours(service.openingHours);
  if (!hours) return false;
  const status = getBusinessStatus(hours, { now }).status;
  return ["open", "closing_soon", "always_open"].includes(status);
}

function getServiceIcon(service: CityService): LucideIcon {
  const value = normalizeText(`${service.subcategory} ${service.name}`);
  if (value.includes("farmacia")) return Pill;
  if (value.includes("hospital") || value.includes("ubs")) return Hospital;
  if (value.includes("combustivel") || value.includes("posto")) return Fuel;
  if (value.includes("banco") || value.includes("loterica")) return Landmark;
  return service.listingType === "commercial" ? Store : Building2;
}

function ServiceBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-md border px-2 py-0.5 text-[0.7rem] font-semibold", className)}>
      {children}
    </span>
  );
}

function ServiceMedia({ service, icon: Icon }: { service: CityService; icon: LucideIcon }) {
  const [failed, setFailed] = useState(false);
  const photo = service.photoUrl || service.imageUrl;
  const source = photo || service.logoUrl;
  const isLogo = service.imageType === "logo" || (!photo && Boolean(service.logoUrl));

  if (!source || failed) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-border/65 bg-muted/25 text-muted-foreground sm:h-[88px] sm:w-[88px]">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className={cn("relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border/65 sm:h-[88px] sm:w-[88px]", isLogo && "bg-white p-1.5")}>
      <Image
        src={source}
        alt={service.altText || `${isLogo ? "Logo" : "Foto"} de ${service.name}`}
        fill
        sizes="88px"
        className={isLogo ? "object-contain p-1.5" : "object-cover"}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function ServiceActions({ service }: { service: CityService }) {
  const callUrl = phoneHref(service.phone || service.whatsapp);
  const whatsappUrl = whatsappHref(service);
  const instagramUrl = instagramHref(service);
  const meta = { establishmentName: service.name, category: service.category };
  const primaryAction = service.isEmergency || service.listingType === "public_service"
    ? "phone"
    : service.detailsEnabled
      ? "details"
      : whatsappUrl
        ? "whatsapp"
        : "maps";
  const buttonClass = "h-10 w-full rounded-[9px] px-3 text-xs sm:w-auto";

  return (
    <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:flex-wrap lg:justify-end lg:border-0 lg:pt-0">
      {callUrl ? (
        <Button asChild variant={primaryAction === "phone" ? "warm" : "outline"} className={buttonClass}>
          <TrackedLink href={callUrl} entityType="city_service" entityId={service.id} eventType="phone_click" {...meta}>
            <Phone className="h-4 w-4" /> Ligar
          </TrackedLink>
        </Button>
      ) : null}
      {service.detailsEnabled ? (
        <Button asChild variant={primaryAction === "details" ? "warm" : "outline"} className={buttonClass}>
          <TrackedLink href={`/servicos/${service.slug}`} entityType="city_service" entityId={service.id} eventType="details_click" {...meta}>
            Ver detalhes <ChevronRight className="h-4 w-4" />
          </TrackedLink>
        </Button>
      ) : null}
      {service.googleMapsUrl ? (
        <Button asChild variant={primaryAction === "maps" ? "warm" : "outline"} className={buttonClass}>
          <TrackedLink href={service.googleMapsUrl} target="_blank" rel="noopener noreferrer" entityType="city_service" entityId={service.id} eventType="map_click" {...meta}>
            <MapPin className="h-4 w-4" /> Como chegar
          </TrackedLink>
        </Button>
      ) : null}
      {whatsappUrl ? (
        <Button asChild variant={primaryAction === "whatsapp" ? "warm" : "outline"} className={buttonClass}>
          <TrackedLink href={whatsappUrl} target="_blank" rel="noopener noreferrer" entityType="city_service" entityId={service.id} eventType="whatsapp_click" {...meta}>
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </TrackedLink>
        </Button>
      ) : null}
      {instagramUrl ? (
        <Button asChild variant="ghost" className={buttonClass}>
          <TrackedLink href={instagramUrl} target="_blank" rel="noopener noreferrer" entityType="city_service" entityId={service.id} eventType="instagram_click" {...meta}>
            <Instagram className="h-4 w-4" /> Instagram
          </TrackedLink>
        </Button>
      ) : null}
    </div>
  );
}

function ServiceRow({ service, group }: { service: CityService; group: ServiceGroupDefinition }) {
  const Icon = getServiceIcon(service);
  const accent = accentStyles[group.accent];
  const address = [hasRealValue(service.address) ? service.address : "", service.neighborhood].filter(Boolean).join(" · ");
  const phone = service.phone || service.whatsapp;

  return (
    <TrackView entityType="city_service" entityId={service.id} establishmentName={service.name} category={service.category}>
      <article className={cn("rounded-lg border border-border/80 border-l-[3px] bg-card/80 p-3.5 shadow-[0_3px_12px_rgba(15,35,29,0.035)]", accent.side)}>
        <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-3.5 sm:grid-cols-[88px_minmax(0,1fr)] lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:items-center">
          <ServiceMedia service={service} icon={Icon} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-semibold leading-tight">{service.name}</h3>
              {service.subcategory ? <ServiceBadge className={accent.badge}>{service.subcategory}</ServiceBadge> : null}
              {service.isEmergency ? <ServiceBadge className="border-alpine-wine/25 bg-alpine-wine/10 text-alpine-wine">Emergência</ServiceBadge> : null}
            </div>
            {service.shortDescription ? <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-muted-foreground">{service.shortDescription}</p> : null}
            <div className="mt-2.5 grid gap-1.5 text-xs leading-5 text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
              {address ? <span className="inline-flex items-start gap-1.5"><MapPin className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", accent.icon)} />{address}</span> : null}
              {hasRealValue(service.openingHours) ? <span className="inline-flex items-start gap-1.5"><Clock className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", accent.icon)} />{service.openingHours}</span> : null}
              {phone ? <span className="inline-flex items-start gap-1.5"><Phone className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", accent.icon)} />{phone}</span> : null}
            </div>
            {service.importantMessage ? <p className="mt-2.5 border-l-2 border-border pl-2.5 text-xs leading-5 text-muted-foreground"><Info className="mr-1.5 inline h-3.5 w-3.5" />{service.importantMessage}</p> : null}
          </div>
          <div className="col-span-2 grid gap-2.5 lg:col-span-1 lg:max-w-[340px] lg:justify-items-end">
            {service.specialStatus ? <ServiceBadge className={accent.badge}>{service.specialStatus}</ServiceBadge> : <BusinessStatusBadge businessHours={service.businessHours} fallbackHours={service.openingHours} context="service" compact />}
            <ServiceActions service={service} />
          </div>
        </div>
      </article>
    </TrackView>
  );
}

export function CityServicesList({ services, initialFilter = "all" }: CityServicesListProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(initialFilter);
  const [visibleCount, setVisibleCount] = useState(12);
  const [now, setNow] = useState<Date | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const eligibleServices = useMemo(() => services
    .filter((service) => service.isActive && service.isPublished)
    .map((service) => ({ service, group: getServiceGroup(service) }))
    .filter((item): item is { service: CityService; group: ServiceGroup } => Boolean(item.group)), [services]);

  const searchTerm = normalizeText(deferredSearch.trim());
  const filteredServices = useMemo(() => eligibleServices.filter(({ service, group }) => {
    if (quickFilter === "open" && !isServiceOpen(service, now)) return false;
    if (quickFilter === "public" && service.listingType !== "public_service") return false;
    if (quickFilter === "health" && group !== "health") return false;
    if (quickFilter === "security" && group !== "security") return false;
    if (quickFilter === "commerce" && group !== "commerce") return false;
    if (!searchTerm) return true;
    return normalizeText([
      service.name,
      service.subcategory,
      service.shortDescription,
      service.neighborhood,
      ...(service.tags || []),
      ...(service.servicesOffered || []),
    ].join(" ")).includes(searchTerm);
  }), [eligibleServices, quickFilter, now, searchTerm]);


  const quickAccess = quickAccessTerms;
  const visibleServices = filteredServices.slice(0, visibleCount);
  const groupedServices = serviceGroups.map((group) => ({
    ...group,
    services: visibleServices.filter((item) => item.group === group.id).map((item) => item.service),
  })).filter((group) => group.services.length > 0);

  const selectFilter = (value: QuickFilter) => {
    setQuickFilter(value);
    setVisibleCount(12);
    const params = new URLSearchParams(window.location.search);
    params.delete("categoria");
    params.delete("subcategoria");
    if (value === "all") params.delete("filtro"); else params.set("filtro", value);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/servicos?${query}` : "/servicos");
    analyticsService.trackDirectoryEvent("category_select", value);
  };

  const applyQuickAccess = (term: string) => {
    setSearch(term);
    setQuickFilter("all");
    setVisibleCount(12);
    analyticsService.trackDirectoryEvent("quick_access_click", term);
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  if (!eligibleServices.length) {
    return <div className="mt-7 border-t border-border py-10 text-center text-sm text-muted-foreground">Em breve, esta página reunirá os principais serviços úteis de Cerro Corá.</div>;
  }

  const filters: Array<[QuickFilter, string]> = [
    ["all", "Todos"],
    ["public", "Serviços públicos"],
    ["health", "Saúde"],
    ["security", "Segurança"],
    ["commerce", "Comércio e utilidades"],
    ["open", "Aberto agora"],
  ];

  return (
    <div className="mt-6 space-y-7">
      <section aria-label="Busca e filtros" className="border-b border-border pb-5">
        <label className="relative block max-w-2xl">
          <span className="sr-only">Buscar serviços</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(12); }} onBlur={() => search.trim() && analyticsService.trackDirectoryEvent("search", search.trim())} placeholder="Buscar por nome ou tipo de serviço" className="h-11 pl-10 pr-11" />
          {search ? <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button> : null}
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Filtros de serviços">
          {filters.map(([value, label]) => (
            <button key={value} type="button" onClick={() => selectFilter(value)} className={cn("h-9 shrink-0 rounded-md border px-3 text-xs font-semibold transition-colors", quickFilter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/50 text-foreground hover:border-primary/35")}>{label}</button>
          ))}
        </div>
      </section>

      {quickAccess.length ? (
        <section aria-labelledby="quick-access-title">
          <h2 id="quick-access-title" className="text-sm font-semibold">Acesso rápido</h2>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {quickAccess.map(({ label, term, icon: Icon }) => <button key={term} type="button" onClick={() => applyQuickAccess(term)} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-border bg-card/60 px-3 text-xs font-semibold hover:border-primary/35"><Icon className="h-4 w-4 text-alpine-wine" />{label}</button>)}
          </div>
        </section>
      ) : null}

      <section ref={resultsRef} aria-labelledby="results-title" className="scroll-mt-24">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
          <h2 id="results-title" className="font-display text-2xl font-semibold md:text-3xl">Serviços encontrados</h2>
          <p className="shrink-0 text-xs text-muted-foreground">{filteredServices.length === 1 ? "1 resultado" : `${filteredServices.length} resultados`}</p>
        </div>

        {groupedServices.length ? (
          <div className="divide-y divide-border">
            {groupedServices.map((group) => (
              <section key={group.id} aria-labelledby={`group-${group.id}`} className="py-6 first:pt-5">
                <h3 id={`group-${group.id}`} className="mb-3 font-display text-xl font-semibold md:text-2xl">{group.label}</h3>
                <div className="grid gap-3">
                  {group.services.map((service) => <ServiceRow key={service.id} service={service} group={group} />)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">Nenhum serviço encontrado. Tente outro nome ou filtro.</div>
        )}

        {visibleCount < filteredServices.length ? <div className="flex justify-center border-t border-border pt-5"><Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + 12)}>Carregar mais</Button></div> : null}
      </section>
    </div>
  );
}