"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Clock,
  Fuel,
  HeartPulse,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Shield,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cityServiceCategories,
  getCityServiceCategoryLabel,
  type CityService,
  type CityServiceCategory,
} from "@/lib/city-services";

type CityServicesListProps = {
  services: CityService[];
};

const categoryIcons: Record<CityServiceCategory, LucideIcon> = {
  saude: HeartPulse,
  seguranca: Shield,
  transporte_apoio: Fuel,
  comercio_essencial: ShoppingBasket,
  emergencia: AlertTriangle,
};

const categoryAccent: Record<CityServiceCategory, string> = {
  saude: "border-l-[#547546]",
  seguranca: "border-l-[#426d8d]",
  transporte_apoio: "border-l-alpine-sunset",
  comercio_essencial: "border-l-primary",
  emergencia: "border-l-destructive",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function phoneHref(phone?: string) {
  const digits = phone?.replace(/\D/g, "");
  return digits ? `tel:${digits}` : null;
}

function whatsappHref(whatsapp?: string) {
  const digits = whatsapp?.replace(/\D/g, "");
  if (!digits) return null;

  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

function ServiceBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-border bg-background/65 px-2 py-1 text-xs font-semibold text-foreground/85">
      {children}
    </span>
  );
}

function ServiceActions({ service }: { service: CityService }) {
  const callUrl = phoneHref(service.phone);
  const whatsappUrl = whatsappHref(service.whatsapp);

  if (!callUrl && !whatsappUrl && !service.googleMapsUrl) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border/80 pt-3 sm:flex-row sm:flex-wrap">
      {callUrl ? (
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <a href={callUrl}>
            <Phone className="h-4 w-4" /> Ligar
          </a>
        </Button>
      ) : null}
      {service.googleMapsUrl ? (
        <Button asChild variant="warm" className="w-full sm:w-auto">
          <a href={service.googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <MapPin className="h-4 w-4" /> Como chegar
          </a>
        </Button>
      ) : null}
      {whatsappUrl ? (
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function ServiceInfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-2 rounded-md bg-muted/25 px-3 py-2.5 ring-1 ring-border/35">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-alpine-wine/90" />
      <div className="min-w-0">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium leading-5 text-foreground/88">{value}</p>
      </div>
    </div>
  );
}

function ServiceRow({ service }: { service: CityService }) {
  const CategoryIcon = categoryIcons[service.category] || Building2;
  const accentClassName = categoryAccent[service.category];
  const hasImportantBadge =
    service.isEmergency || normalizeText(service.openingHours || "").includes("24");

  return (
    <article
      className={`rounded-lg border border-border border-l-[6px] bg-card p-4 shadow-sm ${accentClassName}`}
    >
      <div className="grid gap-3">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-accent/60 text-alpine-wine">
                <CategoryIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-2xl font-semibold leading-tight md:text-[1.7rem]">
                  {service.name}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ServiceBadge>{service.subcategory}</ServiceBadge>
                  <ServiceBadge>{getCityServiceCategoryLabel(service.category)}</ServiceBadge>
                  {hasImportantBadge ? (
                    <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                      {service.isEmergency ? "Emergência" : "Atendimento 24h"}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {service.description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {service.description}
            </p>
          ) : null}

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <ServiceInfoItem
              icon={MapPin}
              label="Endereço"
              value={`${service.address || "Endereço a confirmar"}${
                service.neighborhood ? `, ${service.neighborhood}` : ""
              }`}
            />
            {service.openingHours ? (
              <ServiceInfoItem icon={Clock} label="Horário" value={service.openingHours} />
            ) : null}
            <ServiceInfoItem
              icon={Phone}
              label="Telefone"
              value={service.phone || service.whatsapp || "Telefone a confirmar"}
            />
          </div>

          {service.notes ? (
            <div className="mt-3 flex gap-2 rounded-md border border-border/70 border-l-2 border-l-alpine-wine/60 bg-muted/20 px-3 py-2.5 text-xs leading-6 text-muted-foreground">
              <Info className="mt-1 h-3.5 w-3.5 shrink-0 text-alpine-wine" />
              <div>
                <p className="font-semibold text-foreground/80">Importante</p>
                <p>{service.notes}</p>
              </div>
            </div>
          ) : null}
        </div>

        <ServiceActions service={service} />
      </div>
    </article>
  );
}

export function CityServicesList({ services }: CityServicesListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CityServiceCategory | "all">("all");
  const [openGroups, setOpenGroups] = useState<Set<CityServiceCategory>>(
    () => new Set(["saude"]),
  );

  const activeServices = useMemo(() => services.filter((service) => service.isActive), [services]);
  const availableCategories = useMemo(
    () => cityServiceCategories.filter((item) => activeServices.some((service) => service.category === item.value)),
    [activeServices],
  );

  const filteredServices = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());

    return activeServices.filter((service) => {
      const matchesCategory = category === "all" || service.category === category;
      const matchesSearch =
        !normalizedSearch ||
        normalizeText(
          [
            service.name,
            service.subcategory,
            service.description,
            service.address,
            service.neighborhood,
          ].join(" "),
        ).includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeServices, category, search]);

  const hasActiveFilters = Boolean(search.trim()) || category !== "all";
  const groupedServices = availableCategories
    .map((item) => ({
      ...item,
      services: filteredServices.filter((service) => service.category === item.value),
    }))
    .filter((item) => item.services.length);

  const toggleGroup = (group: CityServiceCategory) => {
    setOpenGroups((current) => {
      const next = new Set(current);

      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }

      return next;
    });
  };

  if (!activeServices.length) {
    return (
      <Card className="mx-auto mt-12 max-w-2xl">
        <CardContent className="p-8 text-center text-sm leading-7 text-muted-foreground">
          Em breve, esta página reunirá os principais serviços úteis de Cerro Corá.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-10 grid gap-5">
      <section className="rounded-lg border border-border bg-card p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-alpine-wine">
              Guia rápido
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Encontre um serviço</h2>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            {activeServices.length === 1 ? "1 serviço cadastrado" : `${activeServices.length} serviços cadastrados`}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <span className="sr-only">Buscar serviço</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar hospital, delegacia..."
              className="pl-9"
            />
          </label>
          <Select value={category} onValueChange={(value) => setCategory(value as CityServiceCategory | "all")}>
            <SelectTrigger aria-label="Filtrar por categoria">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {availableCategories.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {groupedServices.length ? (
        groupedServices.map((group) => {
          const isOpen = openGroups.has(group.value) || hasActiveFilters;

          return (
            <section key={group.value} className="rounded-lg border border-border bg-card p-4 md:p-5">
              <button
                type="button"
                onClick={() => toggleGroup(group.value)}
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-4 text-left"
              >
                <span>
                  <span className="font-display text-3xl font-semibold leading-tight">{group.label}</span>
                  <span className="ml-3 align-middle text-xs font-semibold text-muted-foreground">
                    {group.services.length === 1 ? "1 serviço" : `${group.services.length} serviços`}
                  </span>
                  <span className="mt-1 block max-w-2xl text-sm leading-6 text-muted-foreground">
                    {group.description}
                  </span>
                </span>
                <ChevronDown
                  className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-200 ${
                  isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="grid gap-3">
                    {group.services.map((service) => (
                      <ServiceRow key={service.id} service={service} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum serviço encontrado com os filtros selecionados.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
