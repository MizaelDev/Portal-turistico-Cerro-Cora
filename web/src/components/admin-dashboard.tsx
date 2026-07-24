"use client";

import NextImage from "next/image";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  DatabaseBackup,
  Edit3,
  ExternalLink,
  ImagePlus,
  Loader2,
  LogOut,
  Plus,
  Save,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deleteAdminItem,
  logoutAction,
  removeAttractionGalleryImage,
  removeCityServiceGalleryImage,
  removeLodgingGalleryImage,
  removeRestaurantGalleryImage,
  saveAdminItem,
  seedDefaultContent,
  updateAttractionGallery,
  updateCityServiceAssetImage,
  updateLodgingGallery,
  updateLodgingLogoImage,
  updateRestaurantAssetImage,
  updateRestaurantGallery,
  uploadAdminImages,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  parseBusinessHours,
  serializeBusinessHours,
  weekdayLabels,
  weekdays,
  type BusinessDayHours,
  type BusinessHours,
  type BusinessHoursMode,
  type WeekdayKey,
} from "@/lib/business-hours";
import { cityServiceCategories } from "@/lib/city-services";
import type {
  AdminData,
  AdminEntity,
  CityServiceRow,
  PontoTuristicoRow,
  PousadaRow,
  RestauranteRow,
  ServiceCategoryRow,
} from "@/lib/supabase";

type FormState = Record<string, string | boolean>;
type AdminRow = PontoTuristicoRow | PousadaRow | RestauranteRow | CityServiceRow;

const emptyContentSettings: FormState = {
  gallery_enabled: true,
  carousel_enabled: true,
  featured_order: "",
};

const entityLabels: Record<AdminEntity, string> = {
  pontos_turisticos: "Pontos Turísticos",
  pousadas: "Pousadas",
  restaurantes: "Restaurantes",
  city_services: "Serviços da Cidade",
};

const entityDescriptions: Record<AdminEntity, string> = {
  pontos_turisticos: "Cadastre mirantes, trilhas, áreas naturais e pontos de visitação.",
  pousadas: "Gerencie hospedagens, faixas de preço, WhatsApp e galerias.",
  restaurantes: "Gerencie restaurantes, bares, cafés e lanchonetes.",
  city_services: "Prepare contatos úteis, emergências e serviços essenciais da cidade.",
};

const emptyForms: Record<AdminEntity, FormState> = {
  pontos_turisticos: {
    nome: "",
    descricao: "",
    categoria: "mirante",
    localizacao: "",
    info_url: "",
    imagem_url: "",
    imagens_urls: "",
    ativo: true,
  },
  pousadas: {
    ...emptyContentSettings,
    nome: "",
    slug: "",
    descricao: "",
    historia: "",
    categoria: "Pousada",
    localizacao: "",
    endereco: "",
    mapa_url: "",
    distancia_centro: "",
    faixa_preco_min: "",
    faixa_preco_max: "",
    whatsapp: "",
    telefone: "",
    instagram: "",
    instagram_url: "",
    logo_url: "",
    hero_image_url: "",
    imagens_urls: "",
    check_in: "",
    check_out: "",
    business_hours: "",
    capacidade: "",
    tipos_acomodacao: "",
    formas_pagamento: "",
    comodidades: "",
    diferenciais: "",
    diferencial_principal: "",
    aceita_reservas: true,
    whatsapp_message: "",
    site_url: "",
    ativo: true,
  },
  restaurantes: {
    ...emptyContentSettings,
    nome: "",
    slug: "",
    descricao: "",
    descricao_completa: "",
    categoria: "restaurante",
    horario_funcionamento: "",
    business_hours: "",
    endereco: "",
    localizacao_resumida: "",
    mapa_url: "",
    instagram: "",
    instagram_url: "",
    whatsapp: "",
    telefone: "",
    imagem_url: "",
    logo_url: "",
    imagens_urls: "",
    tags: "",
    formas_pagamento: "",
    diferenciais: "",
    especialidades: "",
    prato_recomendado: "",
    dica_turista: "",
    cardapio_url: "",
    faixa_preco: "",
    whatsapp_message: "",
    site_url: "",
    ativo: true,
  },
  city_services: {
    ...emptyContentSettings,
    nome: "",
    slug: "",
    descricao: "",
    categoria: "saude",
    category_id: "",
    listing_type: "commercial",
    subcategory: "",
    subcategory_id: "",
    full_description: "",
    services_offered: "",
    special_status: "",
    address: "",
    neighborhood: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    instagram_url: "",
    site_url: "",
    latitude: "",
    longitude: "",
    image_url: "",
    photo_url: "",
    logo_url: "",
    image_type: "auto",
    alt_text: "",
    gallery_urls: "",
    details_enabled: false,
    gallery_enabled: false,
    is_published: true,
    sort_order: "",
    last_confirmed_at: "",
    public_notice: "",
    tags: "",
    enabled_buttons: "",
    important_message: "",
    whatsapp_message: "",
    google_maps_url: "",
    opening_hours: "",
    business_hours: "",
    is_emergency: false,
    is_featured: false,
    is_24h: false,
    notes: "",
    ativo: true,
  },
};

const attractionCategories = [
  ["mirante", "Mirante"],
  ["natureza", "Natureza"],
  ["geoturismo", "Geoturismo"],
  ["ecoturismo", "Ecoturismo"],
  ["trilha", "Trilha"],
  ["aventura", "Aventura"],
] as const;

const restaurantCategories = [
  ["restaurante", "Restaurante"],
  ["almoço", "Almoço"],
  ["bar", "Bar"],
  ["café", "Café"],
  ["lanchonete", "Lanchonete"],
] as const;

const cityServiceCategoryOptions = cityServiceCategories.map((category) => [
  category.value,
  category.label,
] as const);

function categoryOptionsForEntity(entity: AdminEntity) {
  if (entity === "pontos_turisticos") return attractionCategories;
  if (entity === "city_services") return cityServiceCategoryOptions;
  return restaurantCategories;
}

const restaurantTags = [
  "Açaí",
  "Almoço",
  "Bar",
  "Café",
  "Delivery",
  "Hambúrguer",
  "Jantar",
  "Lanches",
  "Petiscos",
  "Pizza",
  "Pratos regionais",
  "Sobremesas",
] as const;

const restaurantOfferings = [
  "Wi-Fi",
  "Delivery",
  "Bebidas",
  "Sorvetes/açaí",
  "Sobremesas",
  "Drinks",
  "Pizza",
  "Hambúrgueres",
  "Música ao vivo",
  "Ambiente externo",
  "Ambiente climatizado",
  "Pratos",
  "Petiscos",
  "Estacionamento",
  "Pet Friendly",
  "Espaço Kids",
  "Acessibilidade",
  "Vista panorâmica",
] as const;

const lodgingAmenities = [
  "Café da manhã",
  "Piscina",
  "Wi-Fi",
  "Ar-condicionado",
  "TV",
  "Frigobar",
  "Estacionamento",
  "Área Kids",
  "Pet Friendly",
  "Vista panorâmica",
  "Restaurante",
  "Churrasqueira",
  "Cozinha",
  "Acessibilidade",
  "Área verde",
] as const;

const lodgingHighlights = [
  "Vista para a serra",
  "Ambiente familiar",
  "Próximo aos pontos turísticos",
  "Excelente para casais",
  "Ideal para famílias",
  "Contato com a natureza",
  "Silêncio",
  "Clima serrano",
] as const;

function selectedTags(value: string | boolean | undefined) {
  return String(value || "")
    .split("|")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function selectedOfferings(value: string | boolean | undefined) {
  const selected = selectedTags(value);
  const defaultOptions = new Set<string>(restaurantOfferings);
  return [
    ...restaurantOfferings,
    ...selected.filter((offering) => !defaultOptions.has(offering)),
  ];
}

function selectedLodgingOptions(
  value: string | boolean | undefined,
  options: readonly string[],
) {
  const selected = selectedTags(value);
  const defaultOptions = new Set<string>(options);
  return [...options, ...selected.filter((item) => !defaultOptions.has(item))];
}

function defaultBusinessHours(): BusinessHours {
  return {
    mode: "regular",
    days: Object.fromEntries(
      weekdays.map((day) => [day, { closed: true, open: "08:00", close: "18:00" }]),
    ) as unknown as Record<WeekdayKey, BusinessDayHours>,
  };
}

function businessHoursFromForm(value: string | boolean | undefined): BusinessHours {
  const parsed = parseBusinessHours(typeof value === "string" ? value : "");
  const fallback = defaultBusinessHours();

  if (!parsed) return fallback;
  if (parsed.mode === "24h" || parsed.mode === "appointment") return parsed;

  return {
    mode: "regular",
    days: Object.fromEntries(
      weekdays.map((day) => [
        day,
        {
          closed: parsed.days?.[day]?.closed ?? true,
          open: parsed.days?.[day]?.open || fallback.days?.[day]?.open || "08:00",
          close: parsed.days?.[day]?.close || fallback.days?.[day]?.close || "18:00",
          secondOpen: parsed.days?.[day]?.secondOpen || "",
          secondClose: parsed.days?.[day]?.secondClose || "",
        },
      ]),
    ) as unknown as Record<WeekdayKey, BusinessDayHours>,
  };
}

function BusinessHoursEditor({
  value,
  onChange,
  context = "default",
}: {
  value: string | boolean | undefined;
  onChange: (value: string) => void;
  context?: "default" | "lodging";
}) {
  const hours = businessHoursFromForm(value);
  const mode = hours.mode || "regular";

  function updateHours(next: BusinessHours) {
    onChange(serializeBusinessHours(next));
  }

  function updateMode(nextMode: BusinessHoursMode) {
    if (nextMode === "24h" || nextMode === "appointment") {
      updateHours({ mode: nextMode, days: {} });
      return;
    }

    updateHours({ ...businessHoursFromForm(value), mode: "regular" });
  }

  function updateDay(day: WeekdayKey, nextValue: Partial<{ closed: boolean; open: string; close: string; secondOpen: string; secondClose: string }>) {
    const regularHours = businessHoursFromForm(value);
    const currentDay = regularHours.days?.[day] || { closed: true, open: "08:00", close: "18:00" };

    updateHours({
      mode: "regular",
      days: {
        ...regularHours.days,
        [day]: {
          ...currentDay,
          ...nextValue,
        },
      },
    });
  }

  return (
    <Card className="border-border/70 bg-background/45">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {context === "lodging" ? "Horário da recepção" : "Status de funcionamento"}
        </CardTitle>
        <p className="text-xs leading-6 text-muted-foreground">
          {context === "lodging"
            ? "Este horário será usado para informar quando a recepção ou o atendimento da hospedagem está disponível."
            : "Configure os horários uma vez. O site calcula automaticamente se está aberto, fechado ou perto de fechar."}
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <input type="hidden" name="business_hours" value={String(value || "")} />
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["regular", "Horários por dia"],
            ["24h", "Atendimento 24 horas"],
            ["appointment", context === "lodging" ? "Atendimento mediante reserva" : "Somente agendamento"],
          ].map(([option, label]) => (
            <label
              key={option}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium"
            >
              <input
                type="radio"
                name="business_hours_mode"
                value={option}
                checked={mode === option}
                onChange={() => updateMode(option as BusinessHoursMode)}
              />
              {label}
            </label>
          ))}
        </div>

        {mode === "appointment" ? (
          <p className="rounded-md border border-sky-500/20 bg-sky-500/10 p-3 text-sm text-muted-foreground">
            O site exibirá: {context === "lodging" ? "Atendimento mediante reserva." : "Atendimento mediante agendamento."}
          </p>
        ) : null}

        {mode === "24h" ? (
          <p className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-muted-foreground">
            O site exibirá: Atendimento 24 horas.
          </p>
        ) : null}

        {mode === "regular" ? (
          <div className="grid gap-3">
            {weekdays.map((day) => {
              const dayHours = hours.days?.[day] || { closed: true, open: "08:00", close: "18:00" };

              return (
                <div
                  key={day}
                  className="grid gap-3 rounded-md border border-border bg-card p-3 md:grid-cols-[110px_repeat(4,minmax(100px,1fr))_100px] md:items-center"
                >
                  <p className="text-sm font-semibold">{weekdayLabels[day]}</p>
                  <Label className="grid gap-1 text-xs text-muted-foreground">
                    Abre
                    <Input
                      type="time"
                      value={dayHours.open || "08:00"}
                      disabled={Boolean(dayHours.closed)}
                      onChange={(event) => updateDay(day, { open: event.target.value })}
                    />
                  </Label>
                  <Label className="grid gap-1 text-xs text-muted-foreground">
                    Fecha
                    <Input
                      type="time"
                      value={dayHours.close || "18:00"}
                      disabled={Boolean(dayHours.closed)}
                      onChange={(event) => updateDay(day, { close: event.target.value })}
                    />
                  </Label>
                  <Label className="grid gap-1 text-xs text-muted-foreground">
                    2º período abre
                    <Input
                      type="time"
                      value={dayHours.secondOpen || ""}
                      disabled={Boolean(dayHours.closed)}
                      onChange={(event) => updateDay(day, { secondOpen: event.target.value })}
                    />
                  </Label>
                  <Label className="grid gap-1 text-xs text-muted-foreground">
                    2º período fecha
                    <Input
                      type="time"
                      value={dayHours.secondClose || ""}
                      disabled={Boolean(dayHours.closed)}
                      onChange={(event) => updateDay(day, { secondClose: event.target.value })}
                    />
                  </Label>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(dayHours.closed)}
                      onChange={(event) => updateDay(day, { closed: event.target.checked })}
                    />
                    Fechado
                  </label>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function splitImageLines(value: string | boolean | undefined) {
  return String(value || "")
    .split(/\n+/)
    .map((image) => image.trim())
    .filter(Boolean);
}

function uniqueImages(images: string[]) {
  return Array.from(new Set(images.map((image) => image.trim()).filter(Boolean)));
}

function attractionImagesFromForm(form: FormState) {
  return uniqueImages([String(form.imagem_url || ""), ...splitImageLines(form.imagens_urls)]);
}

function restaurantImagesFromForm(form: FormState) {
  return uniqueImages([String(form.imagem_url || ""), ...splitImageLines(form.imagens_urls)]);
}

function lodgingImagesFromForm(form: FormState) {
  return uniqueImages(splitImageLines(form.imagens_urls));
}

function serializeAdditionalImages(images: string[], coverUrl: string) {
  return uniqueImages(images).filter((image) => image !== coverUrl).join("\n");
}

function imageSourceLabel(url: string) {
  if (url.includes("/storage/v1/object/public/tourism/")) return "Supabase Storage";
  if (url.startsWith("/")) return "Arquivo local";
  return "Imagem externa";
}

function isSafePreviewImage(value: string) {
  return value.startsWith("/") || value.startsWith("https://");
}

function contentFieldsFromRow(row: PousadaRow | RestauranteRow | CityServiceRow): FormState {
  return {
    gallery_enabled: "gallery_enabled" in row ? row.gallery_enabled !== false : true,
    carousel_enabled: "carousel_enabled" in row ? row.carousel_enabled !== false : true,
    featured_order: row.featured_order?.toString() || "",
  };
}

function rowToForm(entity: AdminEntity, row: AdminRow): FormState {
  if (entity === "city_services") {
    const service = row as CityServiceRow;
    return {
      ...contentFieldsFromRow(service),
      nome: service.name,
      slug: service.slug || "",
      descricao: service.description || "",
      categoria: service.category,
      category_id: service.category_id || "",
      listing_type: service.listing_type || "commercial",
      subcategory: service.subcategory || "",
      subcategory_id: service.subcategory_id || "",
      full_description: service.full_description || "",
      services_offered: (service.services_offered || []).join("\n"),
      special_status: service.special_status || "",
      address: service.address || "",
      neighborhood: service.neighborhood || "",
      phone: service.phone || "",
      whatsapp: service.whatsapp || "",
      instagram: service.instagram || "",
      instagram_url: service.instagram_url || "",
      site_url: service.site_url || "",
      latitude: service.latitude?.toString() || "",
      longitude: service.longitude?.toString() || "",
      image_url: service.photo_url || service.image_url || "",
      photo_url: service.photo_url || service.image_url || "",
      logo_url: service.logo_url || "",
      image_type: service.image_type || "auto",
      alt_text: service.alt_text || "",
      gallery_urls: (service.gallery_urls || []).join("\n"),
      details_enabled: Boolean(service.details_enabled),
      gallery_enabled: Boolean(service.gallery_enabled),
      is_published: service.is_published !== false,
      sort_order: service.sort_order?.toString() || "",
      last_confirmed_at: service.last_confirmed_at?.slice(0, 10) || "",
      public_notice: service.public_notice || "",
      tags: (service.tags || []).join("\n"),
      enabled_buttons: (service.enabled_buttons || []).join("\n"),
      important_message: service.important_message || "",
      whatsapp_message: service.whatsapp_message || "",
      google_maps_url: service.google_maps_url || "",
      opening_hours: service.opening_hours || "",
      business_hours: service.business_hours ? serializeBusinessHours(service.business_hours) : "",
      is_emergency: Boolean(service.is_emergency),
      is_featured: Boolean(service.is_featured),
      is_24h: Boolean(service.is_24h),
      notes: service.notes || "",
      ativo: service.is_active,
    };
  }

  if (entity === "pousadas") {
    const lodging = row as PousadaRow;
    return {
      ...contentFieldsFromRow(lodging),
      nome: lodging.nome,
      slug: lodging.slug || "",
      descricao: lodging.descricao,
      historia: lodging.historia || "",
      categoria: lodging.categoria || "Pousada",
      localizacao: lodging.localizacao,
      endereco: lodging.endereco || "",
      mapa_url: lodging.mapa_url || "",
      distancia_centro: lodging.distancia_centro || "",
      faixa_preco_min: lodging.faixa_preco_min?.toString() || "",
      faixa_preco_max: lodging.faixa_preco_max?.toString() || "",
      whatsapp: lodging.whatsapp,
      telefone: lodging.telefone || "",
      instagram: lodging.instagram || "",
      instagram_url: lodging.instagram_url || "",
      logo_url: lodging.logo_url || "",
      hero_image_url: lodging.hero_image_url || "",
      imagens_urls: (lodging.imagens_urls || []).join("\n"),
      check_in: lodging.check_in || "",
      check_out: lodging.check_out || "",
      business_hours: lodging.business_hours ? serializeBusinessHours(lodging.business_hours) : "",
      capacidade: lodging.capacidade || "",
      tipos_acomodacao: (lodging.tipos_acomodacao || []).join("\n"),
      formas_pagamento: (lodging.formas_pagamento || []).join("\n"),
      comodidades: (lodging.comodidades || []).join("|"),
      diferenciais: (lodging.diferenciais || []).join("|"),
      diferencial_principal: lodging.diferencial_principal || "",
      aceita_reservas: lodging.aceita_reservas ?? true,
      whatsapp_message: lodging.whatsapp_message || "",
      site_url: lodging.site_url || "",
      ativo: lodging.ativo,
    };
  }

  if (entity === "restaurantes") {
    const restaurant = row as RestauranteRow;
    return {
      ...contentFieldsFromRow(restaurant),
      nome: restaurant.nome,
      slug: restaurant.slug || "",
      descricao: restaurant.descricao,
      descricao_completa: restaurant.descricao_completa || "",
      categoria: restaurant.categoria,
      horario_funcionamento: restaurant.horario_funcionamento,
      business_hours: restaurant.business_hours ? serializeBusinessHours(restaurant.business_hours) : "",
      endereco: restaurant.endereco,
      localizacao_resumida: restaurant.localizacao_resumida || "",
      mapa_url: restaurant.mapa_url || "",
      instagram: restaurant.instagram || "",
      instagram_url: restaurant.instagram_url || "",
      whatsapp: restaurant.whatsapp,
      telefone: restaurant.telefone || "",
      imagem_url: restaurant.imagem_url,
      logo_url: restaurant.logo_url || "",
      imagens_urls: (restaurant.imagens_urls || []).join("\n"),
      tags: (restaurant.tags || []).join("|"),
      formas_pagamento: (restaurant.formas_pagamento || []).join("\n"),
      diferenciais: (restaurant.diferenciais || []).join("|"),
      especialidades: (restaurant.especialidades || []).join("\n"),
      prato_recomendado: restaurant.prato_recomendado || "",
      dica_turista: restaurant.dica_turista || "",
      cardapio_url: restaurant.cardapio_url || "",
      faixa_preco: restaurant.faixa_preco || "",
      whatsapp_message: restaurant.whatsapp_message || "",
      site_url: restaurant.site_url || "",
      ativo: restaurant.ativo,
    };
  }

  const attraction = row as PontoTuristicoRow;
  return {
    nome: attraction.nome,
    descricao: attraction.descricao,
    categoria: attraction.categoria,
    localizacao: attraction.localizacao,
    info_url: attraction.info_url || "",
    imagem_url: attraction.imagem_url,
    imagens_urls: (attraction.imagens_urls || []).join("\n"),
    ativo: attraction.ativo,
  };
}

function rowSummary(entity: AdminEntity, row: AdminRow) {
  if (entity === "city_services") {
    const service = row as CityServiceRow;
    return `${service.subcategory} · ${service.address || "Endereço a confirmar"}`;
  }

  if (entity === "pousadas") {
    const lodging = row as PousadaRow;
    return lodging.localizacao;
  }

  if (entity === "restaurantes") {
    const restaurant = row as RestauranteRow;
    return `${restaurant.categoria} · ${restaurant.endereco}`;
  }

  const attraction = row as PontoTuristicoRow;
  return `${attraction.categoria} · ${attraction.localizacao}`;
}

function rowName(row: AdminRow) {
  return "nome" in row ? row.nome : row.name;
}

function rowIsActive(row: AdminRow) {
  return "ativo" in row ? row.ativo : row.is_active;
}

function MediaDestinationGuide({
  kind,
}: {
  kind: "restaurant" | "lodging";
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-border bg-accent/20 p-4" aria-labelledby={`${kind}-media-title`}>
      <div>
        <p id={`${kind}-media-title`} className="text-sm font-semibold">Organização das imagens</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Cada upload abaixo tem um destino especifico. Galeria e carrossel podem ser ativados conforme o conteudo disponivel.
        </p>
      </div>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-md border border-border bg-background/60 p-3">
          <strong className="block text-foreground">Logo do estabelecimento</strong>
          <span className="mt-1 block leading-5 text-muted-foreground">Identidade visual exibida sem cortes, em espaço próprio.</span>
        </div>
        <div className="rounded-md border border-border bg-background/60 p-3">
          <strong className="block text-foreground">Foto principal / capa</strong>
          <span className="mt-1 block leading-5 text-muted-foreground">
            {kind === "restaurant" ? "Imagem principal do card na listagem." : "A primeira foto da galeria será a capa do card na listagem."}
          </span>
        </div>
        <div className="rounded-md border border-border bg-background/60 p-3">
          <strong className="block text-foreground">Fotos da galeria</strong>
          <span className="mt-1 block leading-5 text-muted-foreground">
            Exibidas na pagina individual quando a galeria estiver ativa.
          </span>
        </div>
        <div className="rounded-md border border-border bg-background/60 p-3">
          <strong className="block text-foreground">Fotos do carrossel</strong>
          <span className="mt-1 block leading-5 text-muted-foreground">
            As fotos seguem a ordem definida abaixo. Com apenas uma imagem, o portal exibe uma foto estatica.
          </span>
        </div>
      </div>
    </section>
  );
}

function ContentSettingsEditor({
  entity,
  form,
  updateField,
}: {
  entity: AdminEntity;
  form: FormState;
  updateField: (name: string, value: string | boolean) => void;
}) {
  const supportsMedia = entity === "restaurantes" || entity === "pousadas";

  return (
    <div className="grid gap-4 rounded-lg border border-border bg-accent/20 p-4">
      <div>
        <p className="text-sm font-semibold">Publicacao e canais</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Todos os estabelecimentos ativos possuem pagina individual, analytics e os mesmos recursos de divulgacao.
        </p>
      </div>

      {entity === "city_services" ? (
        <div className="grid gap-2">
          <Label>Tipo de cadastro</Label>
          <Select value={String(form.listing_type || "commercial")} onValueChange={(value) => updateField("listing_type", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public_service">Servico publico essencial</SelectItem>
              <SelectItem value="commercial">Estabelecimento comercial</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" name="listing_type" value={String(form.listing_type || "commercial")} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="site_url">Site externo</Label>
          <Input id="site_url" name="site_url" value={String(form.site_url || "")} onChange={(event) => updateField("site_url", event.target.value)} placeholder="https://..." />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="featured_order">Ordem manual</Label>
          <Input id="featured_order" name="featured_order" type="number" min="0" value={String(form.featured_order || "")} onChange={(event) => updateField("featured_order", event.target.value)} placeholder="Opcional" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="whatsapp_message">Mensagem automatica do WhatsApp</Label>
        <Textarea id="whatsapp_message" name="whatsapp_message" value={String(form.whatsapp_message || "")} onChange={(event) => updateField("whatsapp_message", event.target.value)} placeholder="Ola! Encontrei seu estabelecimento atraves do portal..." />
      </div>

      {supportsMedia ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-md border border-border bg-background/55 p-3 text-sm">
            <input type="checkbox" name="gallery_enabled" checked={Boolean(form.gallery_enabled)} onChange={(event) => updateField("gallery_enabled", event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border" />
            <span><strong className="block">Galeria ativa</strong><span className="text-xs text-muted-foreground">Exibe a secao somente quando houver fotos.</span></span>
          </label>
          <label className="flex items-start gap-3 rounded-md border border-border bg-background/55 p-3 text-sm">
            <input type="checkbox" name="carousel_enabled" checked={Boolean(form.carousel_enabled)} onChange={(event) => updateField("carousel_enabled", event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border" />
            <span><strong className="block">Carrossel ativo</strong><span className="text-xs text-muted-foreground">Com uma unica foto, o portal usa imagem estatica.</span></span>
          </label>
        </div>
      ) : null}
    </div>
  );
}
export function AdminDashboard({
  initialData,
  serviceCategories = [],
}: {
  initialData: AdminData;
  serviceCategories?: ServiceCategoryRow[];
}) {
  const router = useRouter();
  const [entity, setEntity] = useState<AdminEntity>("pontos_turisticos");
  const [form, setForm] = useState<FormState>(emptyForms.pontos_turisticos);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; text: string }>({
    type: "idle",
    text: "Selecione uma categoria para cadastrar ou editar conteúdos.",
  });
  const [isPending, startTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();
  const [isGalleryPending, startGalleryTransition] = useTransition();
  const [galleryAction, setGalleryAction] = useState<string | null>(null);
  const [adminSearch, setAdminSearch] = useState("");

  const rows = useMemo(() => initialData[entity] as AdminRow[], [entity, initialData]);
  const filteredRows = useMemo(() => {
    const query = adminSearch.trim().toLocaleLowerCase("pt-BR");
    if (!query || entity !== "city_services") return rows;
    return rows.filter((row) =>
      `${rowName(row)} ${rowSummary(entity, row)}`
        .toLocaleLowerCase("pt-BR")
        .includes(query),
    );
  }, [adminSearch, entity, rows]);
  const attractionImages = useMemo(
    () => (entity === "pontos_turisticos" ? attractionImagesFromForm(form) : []),
    [entity, form],
  );
  const lodgingImages = useMemo(
    () => (entity === "pousadas" ? lodgingImagesFromForm(form) : []),
    [entity, form],
  );
  const restaurantImages = useMemo(
    () => (entity === "restaurantes" ? restaurantImagesFromForm(form) : []),
    [entity, form],
  );
  const cityServiceGalleryImages = useMemo(
    () =>
      entity === "city_services"
        ? uniqueImages(splitImageLines(form.gallery_urls)).filter(isSafePreviewImage)
        : [],
    [entity, form.gallery_urls],
  );
  const supportsEstablishmentSettings = entity === "restaurantes" || entity === "pousadas" || entity === "city_services";
  const activeServiceCategories = useMemo(
    () => serviceCategories.filter((category) => category.is_active),
    [serviceCategories],
  );
  const mainServiceCategories = useMemo(
    () => activeServiceCategories.filter((category) => !category.parent_id && !category.parent_slug),
    [activeServiceCategories],
  );
  const selectedServiceCategory = useMemo(
    () => mainServiceCategories.find((category) => category.slug === String(form.categoria || "")),
    [form.categoria, mainServiceCategories],
  );
  const serviceSubcategories = useMemo(
    () =>
      activeServiceCategories.filter(
        (category) =>
          category.parent_id === selectedServiceCategory?.id ||
          category.parent_slug === selectedServiceCategory?.slug,
      ),
    [activeServiceCategories, selectedServiceCategory],
  );
  const selectedServiceSubcategory = useMemo(
    () =>
      serviceSubcategories.find(
        (subcategory) => subcategory.name === String(form.subcategory || ""),
      ),
    [form.subcategory, serviceSubcategories],
  );

  function selectEntity(nextEntity: AdminEntity) {
    setEntity(nextEntity);
    setForm(emptyForms[nextEntity]);
    setEditingId(null);
    setGalleryAction(null);
    setStatus({
      type: "idle",
      text: `Pronto para gerenciar ${entityLabels[nextEntity].toLowerCase()}.`,
    });
  }

  function updateField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForms[entity]);
    setEditingId(null);
    setGalleryAction(null);
  }

  function duplicateRow(row: AdminRow) {
    const duplicated = rowToForm(entity, row);
    const originalName = String(duplicated.nome || rowName(row));
    const originalSlug = String(duplicated.slug || "");
    setForm({
      ...duplicated,
      nome: `${originalName} (cópia)`,
      slug: originalSlug ? `${originalSlug}-copia` : "",
      ativo: false,
      is_published: false,
    });
    setEditingId(null);
    setGalleryAction(null);
    setStatus({
      type: "idle",
      text: "Cópia criada no formulário. Revise os dados antes de cadastrar.",
    });
  }

  function editRow(row: AdminRow) {
    setForm(rowToForm(entity, row));
    setEditingId(row.id);
    setGalleryAction(null);
    setStatus({ type: "idle", text: `Editando: ${rowName(row)}` });
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveAdminItem(entity, editingId, formData);
      setStatus({ type: result.ok ? "success" : "error", text: result.message });
      if (result.ok) {
        resetForm();
        router.refresh();
        window.location.reload();
      }
    });
  }

  function removeRow(row: AdminRow) {
    const confirmed = window.confirm(`Excluir "${rowName(row)}"? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteAdminItem(entity, row.id);
      setStatus({ type: result.ok ? "success" : "error", text: result.message });
      if (result.ok) {
        resetForm();
        router.refresh();
      }
    });
  }

  function restoreDefaultContent() {
    const confirmed = window.confirm(
      "Repor os dados padrão do site? Itens com o mesmo nome serão atualizados, e itens faltantes serão cadastrados.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await seedDefaultContent();
      setStatus({ type: result.ok ? "success" : "error", text: result.message });
      if (result.ok) {
        router.refresh();
      }
    });
  }

  function uploadLodgingImages(files: FileList | null) {
    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    startUploadTransition(async () => {
      try {
        const result = await uploadAdminImages("pousadas", formData);
        setStatus({ type: result.ok ? "success" : "error", text: result.message });

        if (result.ok && result.urls.length) {
          applyLodgingGallery([...lodgingImages, ...result.urls], "Fotos adicionadas à pousada com sucesso.");
        }
      } catch {
        setStatus({
          type: "error",
          text: "Não foi possível enviar as imagens. Tente fotos menores ou verifique o Supabase Storage.",
        });
      }
    });
  }

  function uploadLodgingLogoImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("files", file);
    const previousLogo = String(form.logo_url || "").trim();

    startUploadTransition(async () => {
      try {
        const result = await uploadAdminImages("pousadas", formData);
        setStatus({ type: result.ok ? "success" : "error", text: result.message });

        if (result.ok && result.urls[0]) {
          const nextUrl = result.urls[0];

          if (editingId) {
            const updateResult = await updateLodgingLogoImage({
              lodgingId: editingId,
              imageUrl: previousLogo || null,
              nextUrl,
            });
            setStatus({ type: updateResult.ok ? "success" : "error", text: updateResult.message });
            if (!updateResult.ok) return;
            router.refresh();
          }

          setForm((current) => ({ ...current, logo_url: nextUrl }));
        }
      } catch {
        setStatus({
          type: "error",
          text: "Não foi possível enviar a logo. Tente uma imagem menor ou verifique o Supabase Storage.",
        });
      }
    });
  }

  function removeLodgingLogo() {
    const currentLogo = String(form.logo_url || "").trim();
    if (!currentLogo || isGalleryPending) return;

    const confirmed = window.confirm("Tem certeza que deseja remover a logo desta pousada?");
    if (!confirmed) return;

    setGalleryAction("lodging-logo");
    startGalleryTransition(async () => {
      if (editingId) {
        const result = await updateLodgingLogoImage({
          lodgingId: editingId,
          imageUrl: currentLogo,
          nextUrl: null,
        });
        setStatus({ type: result.ok ? "success" : "error", text: result.message });
        setGalleryAction(null);
        if (!result.ok) return;
        router.refresh();
      }

      setForm((current) => ({ ...current, logo_url: "" }));
      setStatus({ type: "success", text: "Logo removida da pousada." });
      setGalleryAction(null);
    });
  }

  function uploadLodgingHeroImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("files", file);
    const previousHeroImage = String(form.hero_image_url || "").trim();

    startUploadTransition(async () => {
      try {
        const result = await uploadAdminImages("pousadas", formData);
        setStatus({ type: result.ok ? "success" : "error", text: result.message });

        if (result.ok && result.urls[0]) {
          const nextUrl = result.urls[0];

          if (editingId) {
            const updateResult = await updateLodgingLogoImage({
              lodgingId: editingId,
              field: "hero_image_url",
              imageUrl: previousHeroImage || null,
              nextUrl,
            });
            setStatus({ type: updateResult.ok ? "success" : "error", text: updateResult.message });
            if (!updateResult.ok) return;
            router.refresh();
          }

          setForm((current) => ({ ...current, hero_image_url: nextUrl }));
        }
      } catch {
        setStatus({
          type: "error",
          text: "Não foi possível enviar a imagem principal. Use uma foto horizontal menor ou verifique o Supabase Storage.",
        });
      }
    });
  }

  function removeLodgingHeroImage() {
    const currentHeroImage = String(form.hero_image_url || "").trim();
    if (!currentHeroImage || isGalleryPending) return;

    const confirmed = window.confirm("Tem certeza que deseja remover a imagem principal do Hero desta pousada?");
    if (!confirmed) return;

    setGalleryAction("lodging-hero");
    startGalleryTransition(async () => {
      if (editingId) {
        const result = await updateLodgingLogoImage({
          lodgingId: editingId,
          field: "hero_image_url",
          imageUrl: currentHeroImage,
          nextUrl: null,
        });
        setStatus({ type: result.ok ? "success" : "error", text: result.message });
        setGalleryAction(null);
        if (!result.ok) return;
        router.refresh();
      }

      setForm((current) => ({ ...current, hero_image_url: "" }));
      setStatus({ type: "success", text: "Imagem principal da pousada removida." });
      setGalleryAction(null);
    });
  }

  function applyLodgingGallery(nextImages: string[], successMessage: string) {
    const normalizedImages = uniqueImages(nextImages);
    const previousForm = form;

    setForm((current) => ({
      ...current,
      imagens_urls: normalizedImages.join("\n"),
    }));

    if (!editingId || !normalizedImages.length) {
      setStatus({ type: "success", text: successMessage });
      return;
    }

    setGalleryAction("lodging-gallery");
    startGalleryTransition(async () => {
      const result = await updateLodgingGallery({
        lodgingId: editingId,
        imagens_urls: normalizedImages,
      });

      setStatus({ type: result.ok ? "success" : "error", text: result.ok ? successMessage : result.message });
      setGalleryAction(null);

      if (result.ok) {
        router.refresh();
      } else {
        setForm(previousForm);
      }
    });
  }

  function moveLodgingImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= lodgingImages.length || isGalleryPending) return;

    const nextImages = [...lodgingImages];
    [nextImages[index], nextImages[nextIndex]] = [nextImages[nextIndex], nextImages[index]];
    applyLodgingGallery(nextImages, "Ordem das fotos da pousada atualizada.");
  }

  function setLodgingCover(image: string) {
    if (image === lodgingImages[0] || isGalleryPending) return;
    applyLodgingGallery(
      [image, ...lodgingImages.filter((item) => item !== image)],
      "Foto definida como capa da pousada.",
    );
  }

  function removeLodgingImage(image: string) {
    if (isGalleryPending) return;

    if (lodgingImages.length <= 1) {
      setStatus({
        type: "error",
        text: "Mantenha pelo menos uma foto na pousada para não quebrar o card público.",
      });
      return;
    }

    const confirmed = window.confirm("Tem certeza que deseja remover esta foto?");
    if (!confirmed) return;

    const nextImages = lodgingImages.filter((item) => item !== image);

    setGalleryAction(image);
    startGalleryTransition(async () => {
      const result = await removeLodgingGalleryImage({
        lodgingId: editingId,
        imageUrl: image,
        imagens_urls: nextImages,
      });

      setStatus({ type: result.ok ? "success" : "error", text: result.message });
      setGalleryAction(null);

      if (result.ok) {
        setForm((current) => ({ ...current, imagens_urls: nextImages.join("\n") }));
        router.refresh();
      }
    });
  }

  function uploadAttractionImage(files: FileList | null) {
    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    startUploadTransition(async () => {
      try {
        const result = await uploadAdminImages("pontos_turisticos", formData);
        setStatus({ type: result.ok ? "success" : "error", text: result.message });

        if (result.ok && result.urls.length) {
          setForm((current) => {
            const currentImages = String(current.imagens_urls || "").trim();
            const nextImages = [...(currentImages ? [currentImages] : []), ...result.urls].join("\n");

            return {
              ...current,
              imagens_urls: nextImages,
            };
          });
        }
      } catch {
        setStatus({
          type: "error",
          text: "Não foi possível enviar as imagens. Tente fotos menores ou verifique o Supabase Storage.",
        });
      }
    });
  }

  function applyAttractionGallery(nextImages: string[], successMessage: string) {
    const normalizedImages = uniqueImages(nextImages);
    const nextCover = normalizedImages[0] || String(form.imagem_url || "").trim();
    const nextGallery = serializeAdditionalImages(normalizedImages, nextCover);
    const previousForm = form;

    setForm((current) => ({
      ...current,
      imagem_url: nextCover,
      imagens_urls: nextGallery,
    }));

    if (!editingId || !nextCover) {
      setStatus({ type: "success", text: successMessage });
      return;
    }

    setGalleryAction("update");
    startGalleryTransition(async () => {
      const result = await updateAttractionGallery({
        attractionId: editingId,
        coverUrl: nextCover,
        imagens_urls: splitImageLines(nextGallery),
      });

      setStatus({ type: result.ok ? "success" : "error", text: result.ok ? successMessage : result.message });
      setGalleryAction(null);

      if (result.ok) {
        router.refresh();
      } else {
        setForm(previousForm);
      }
    });
  }

  function moveAttractionImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= attractionImages.length || isGalleryPending) return;

    const nextImages = [...attractionImages];
    [nextImages[index], nextImages[nextIndex]] = [nextImages[nextIndex], nextImages[index]];
    applyAttractionGallery(nextImages, "Ordem das fotos atualizada.");
  }

  function setAttractionCover(image: string) {
    if (image === String(form.imagem_url || "").trim() || isGalleryPending) return;
    applyAttractionGallery(
      [image, ...attractionImages.filter((item) => item !== image)],
      "Foto definida como capa do roteiro.",
    );
  }

  function removeAttractionImage(image: string) {
    if (isGalleryPending) return;

    if (attractionImages.length <= 1) {
      setStatus({
        type: "error",
        text: "Mantenha pelo menos uma foto no roteiro para não quebrar o card público.",
      });
      return;
    }

    const confirmed = window.confirm("Tem certeza que deseja remover esta foto?");
    if (!confirmed) return;

    const nextImages = attractionImages.filter((item) => item !== image);
    const nextCover = nextImages[0] || String(form.imagem_url || "").trim();
    const nextGallery = serializeAdditionalImages(nextImages, nextCover);

    setGalleryAction(image);
    startGalleryTransition(async () => {
      const result = await removeAttractionGalleryImage({
        attractionId: editingId,
        imageUrl: image,
        coverUrl: nextCover,
        imagens_urls: splitImageLines(nextGallery),
      });

      setStatus({ type: result.ok ? "success" : "error", text: result.message });
      setGalleryAction(null);

      if (result.ok) {
        setForm((current) => ({
          ...current,
          imagem_url: nextCover,
          imagens_urls: nextGallery,
        }));
        router.refresh();
      }
    });
  }

  function uploadRestaurantImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("files", file);
    const previousImage = String(form.imagem_url || "").trim();

    startUploadTransition(async () => {
      try {
        const result = await uploadAdminImages("restaurantes", formData);
        setStatus({ type: result.ok ? "success" : "error", text: result.message });

        if (result.ok && result.urls[0]) {
          const nextUrl = result.urls[0];

          if (editingId) {
            const updateResult = await updateRestaurantAssetImage({
              restaurantId: editingId,
              field: "imagem_url",
              imageUrl: previousImage || null,
              nextUrl,
            });
            setStatus({ type: updateResult.ok ? "success" : "error", text: updateResult.message });
            if (!updateResult.ok) return;
            router.refresh();
          }

          setForm((current) => ({ ...current, imagem_url: nextUrl }));
        }
      } catch {
        setStatus({
          type: "error",
          text: "Não foi possível enviar a imagem. Tente uma foto menor ou verifique o Supabase Storage.",
        });
      }
    });
  }

  function uploadRestaurantLogoImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("files", file);
    const previousLogo = String(form.logo_url || "").trim();

    startUploadTransition(async () => {
      try {
        const result = await uploadAdminImages("restaurantes", formData);
        setStatus({ type: result.ok ? "success" : "error", text: result.message });

        if (result.ok && result.urls[0]) {
          const nextUrl = result.urls[0];

          if (editingId) {
            const updateResult = await updateRestaurantAssetImage({
              restaurantId: editingId,
              field: "logo_url",
              imageUrl: previousLogo || null,
              nextUrl,
            });
            setStatus({ type: updateResult.ok ? "success" : "error", text: updateResult.message });
            if (!updateResult.ok) return;
            router.refresh();
          }

          setForm((current) => ({ ...current, logo_url: nextUrl }));
        }
      } catch {
        setStatus({
          type: "error",
          text: "Não foi possível enviar a logo. Tente uma imagem menor ou verifique o Supabase Storage.",
        });
      }
    });
  }

  function removeRestaurantLogo() {
    const currentLogo = String(form.logo_url || "").trim();
    if (!currentLogo || isGalleryPending) return;

    const confirmed = window.confirm("Tem certeza que deseja remover a logo deste restaurante?");
    if (!confirmed) return;

    setGalleryAction("restaurant-logo");
    startGalleryTransition(async () => {
      if (editingId) {
        const result = await updateRestaurantAssetImage({
          restaurantId: editingId,
          field: "logo_url",
          imageUrl: currentLogo,
          nextUrl: null,
        });
        setStatus({ type: result.ok ? "success" : "error", text: result.message });
        setGalleryAction(null);
        if (!result.ok) return;
        router.refresh();
      }

      setForm((current) => ({ ...current, logo_url: "" }));
      setStatus({ type: "success", text: "Logo removida do restaurante." });
      setGalleryAction(null);
    });
  }

  function applyRestaurantGallery(nextImages: string[], successMessage: string) {
    const normalizedImages = uniqueImages(nextImages);
    const nextCover = normalizedImages[0] || String(form.imagem_url || "").trim();
    const nextGallery = serializeAdditionalImages(normalizedImages, nextCover);
    const previousForm = form;

    setForm((current) => ({
      ...current,
      imagem_url: nextCover,
      imagens_urls: nextGallery,
    }));

    if (!editingId || !nextCover) {
      setStatus({ type: "success", text: successMessage });
      return;
    }

    setGalleryAction("restaurant-gallery");
    startGalleryTransition(async () => {
      const result = await updateRestaurantGallery({
        restaurantId: editingId,
        coverUrl: nextCover,
        imagens_urls: splitImageLines(nextGallery),
      });

      setStatus({ type: result.ok ? "success" : "error", text: result.ok ? successMessage : result.message });
      setGalleryAction(null);

      if (result.ok) {
        router.refresh();
      } else {
        setForm(previousForm);
      }
    });
  }

  function moveRestaurantImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= restaurantImages.length || isGalleryPending) return;

    const nextImages = [...restaurantImages];
    [nextImages[index], nextImages[nextIndex]] = [nextImages[nextIndex], nextImages[index]];
    applyRestaurantGallery(nextImages, "Ordem das fotos do restaurante atualizada.");
  }

  function setRestaurantCover(image: string) {
    if (image === String(form.imagem_url || "").trim() || isGalleryPending) return;
    applyRestaurantGallery(
      [image, ...restaurantImages.filter((item) => item !== image)],
      "Foto definida como capa do restaurante.",
    );
  }

  function removeRestaurantImage(image: string) {
    if (isGalleryPending) return;

    if (restaurantImages.length <= 1) {
      setStatus({
        type: "error",
        text: "Mantenha pelo menos uma foto no restaurante para não quebrar o card público.",
      });
      return;
    }

    const confirmed = window.confirm("Tem certeza que deseja remover esta foto?");
    if (!confirmed) return;

    const nextImages = restaurantImages.filter((item) => item !== image);
    const nextCover = nextImages[0] || String(form.imagem_url || "").trim();
    const nextGallery = serializeAdditionalImages(nextImages, nextCover);

    setGalleryAction(image);
    startGalleryTransition(async () => {
      const result = await removeRestaurantGalleryImage({
        restaurantId: editingId,
        imageUrl: image,
        coverUrl: nextCover,
        imagens_urls: splitImageLines(nextGallery),
      });

      setStatus({ type: result.ok ? "success" : "error", text: result.message });
      setGalleryAction(null);

      if (result.ok) {
        setForm((current) => ({
          ...current,
          imagem_url: nextCover,
          imagens_urls: nextGallery,
        }));
        router.refresh();
      }
    });
  }

  function uploadRestaurantGalleryImages(files: FileList | null) {
    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    startUploadTransition(async () => {
      try {
        const result = await uploadAdminImages("restaurantes", formData);
        setStatus({ type: result.ok ? "success" : "error", text: result.message });

        if (result.ok && result.urls.length) {
          applyRestaurantGallery(
            [...restaurantImages, ...result.urls],
            "Fotos adicionadas ao restaurante com sucesso.",
          );
        }
      } catch {
        setStatus({
          type: "error",
          text: "Não foi possível enviar as imagens da galeria. Tente fotos menores ou verifique o Supabase Storage.",
        });
      }
    });
  }

  function uploadCityServiceAsset(
    field: "photo_url" | "logo_url" | "gallery_urls",
    files: FileList | null,
  ) {
    if (!files?.length) return;

    const formData = new FormData();
    const selectedFiles = field === "gallery_urls" ? Array.from(files) : [files[0]];
    selectedFiles.forEach((file) => formData.append("files", file));
    const previousImage = field === "gallery_urls" ? "" : String(form[field] || "").trim();

    startUploadTransition(async () => {
      try {
        const result = await uploadAdminImages("city_services", formData);
        setStatus({ type: result.ok ? "success" : "error", text: result.message });
        if (!result.ok || !result.urls.length) return;

        if (field !== "gallery_urls" && editingId) {
          const updateResult = await updateCityServiceAssetImage({
            serviceId: editingId,
            field,
            imageUrl: previousImage || null,
            nextUrl: result.urls[0],
          });
          setStatus({
            type: updateResult.ok ? "success" : "error",
            text: updateResult.message,
          });
          if (!updateResult.ok) return;
          router.refresh();
        }

        setForm((current) => {
          if (field === "gallery_urls") {
            const currentGallery = splitImageLines(current.gallery_urls);
            return {
              ...current,
              gallery_urls: uniqueImages([...currentGallery, ...result.urls]).join("\n"),
              gallery_enabled: true,
            };
          }

          return {
            ...current,
            [field]: result.urls[0],
            ...(field === "photo_url" ? { image_url: result.urls[0], image_type: "photo" } : {}),
          };
        });
      } catch {
        setStatus({
          type: "error",
          text: "Não foi possível enviar a imagem. Use JPEG, PNG, WebP ou AVIF com até 6 MB.",
        });
      }
    });
  }

  function removeCityServiceAsset(field: "photo_url" | "logo_url") {
    const currentImage = String(form[field] || "").trim();
    if (!currentImage || isGalleryPending) return;
    if (!window.confirm("Tem certeza que deseja remover esta imagem?")) return;

    setGalleryAction(`city-service-${field}`);
    startGalleryTransition(async () => {
      if (editingId) {
        const result = await updateCityServiceAssetImage({
          serviceId: editingId,
          field,
          imageUrl: currentImage,
          nextUrl: null,
        });
        setStatus({ type: result.ok ? "success" : "error", text: result.message });
        if (!result.ok) {
          setGalleryAction(null);
          return;
        }
        router.refresh();
      }

      setForm((current) => ({
        ...current,
        [field]: "",
        ...(field === "photo_url" ? { image_url: "", image_type: "auto" } : {}),
      }));
      setGalleryAction(null);
      setStatus({ type: "success", text: "Imagem removida do serviço." });
    });
  }

  function moveCityServiceGalleryImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= cityServiceGalleryImages.length || isGalleryPending) return;
    const images = [...cityServiceGalleryImages];
    [images[index], images[nextIndex]] = [images[nextIndex], images[index]];
    updateField("gallery_urls", images.join("\n"));
    setStatus({
      type: "idle",
      text: "Ordem alterada no formulário. Salve a edição para publicar a mudança.",
    });
  }

  function removeCityServiceGalleryPhoto(image: string) {
    if (isGalleryPending || !window.confirm("Tem certeza que deseja remover esta foto?")) return;
    const nextImages = cityServiceGalleryImages.filter((item) => item !== image);
    setGalleryAction(image);
    startGalleryTransition(async () => {
      if (editingId) {
        const result = await removeCityServiceGalleryImage({
          serviceId: editingId,
          imageUrl: image,
          gallery_urls: nextImages,
        });
        setStatus({ type: result.ok ? "success" : "error", text: result.message });
        if (!result.ok) {
          setGalleryAction(null);
          return;
        }
        router.refresh();
      }
      setForm((current) => ({
        ...current,
        gallery_urls: nextImages.join("\n"),
        gallery_enabled: nextImages.length > 0,
      }));
      setGalleryAction(null);
    });
  }

  function toggleRestaurantTag(tag: string, checked: boolean) {
    setForm((current) => {
      const tags = new Set(selectedTags(current.tags));
      if (checked) {
        tags.add(tag);
      } else {
        tags.delete(tag);
      }
      return { ...current, tags: Array.from(tags).join("|") };
    });
  }

  function toggleRestaurantOffering(offering: string, checked: boolean) {
    setForm((current) => {
      const offerings = new Set(selectedTags(current.diferenciais));
      if (checked) {
        offerings.add(offering);
      } else {
        offerings.delete(offering);
      }
      return { ...current, diferenciais: Array.from(offerings).join("|") };
    });
  }

  function toggleLodgingOption(field: "comodidades" | "diferenciais", option: string, checked: boolean) {
    setForm((current) => {
      const values = new Set(selectedTags(current[field]));
      if (checked) {
        values.add(option);
      } else {
        values.delete(option);
      }
      return { ...current, [field]: Array.from(values).join("|") };
    });
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm md:flex-row md:items-center">
        <div className="grid gap-2 md:grid-cols-3">
          {(Object.keys(entityLabels) as AdminEntity[]).map((item) => (
            <Button
              key={item}
              type="button"
              variant={entity === item ? "default" : "outline"}
              onClick={() => selectEntity(item)}
            >
              {entityLabels[item]}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild type="button" variant="outline">
            <a href="/admin/categorias-servicos">
              <ExternalLink className="h-4 w-4" />
              Categorias de serviços
            </a>
          </Button>
          <Button asChild type="button" variant="outline">
            <a href="/admin/relatorios">
              <ExternalLink className="h-4 w-4" />
              Relatórios
            </a>
          </Button>
          <Button type="button" variant="outline" onClick={restoreDefaultContent} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />}
            Repor dados padrão
          </Button>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>

      <div
        className={`rounded-md border p-4 text-sm ${
          status.type === "success"
            ? "border-primary/30 bg-primary/10 text-primary"
            : status.type === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-border bg-accent/45 text-muted-foreground"
        }`}
      >
        {status.text}
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{editingId ? "Editar conteúdo" : "Novo conteúdo"}</CardTitle>
            <p className="text-sm text-muted-foreground">{entityDescriptions[entity]}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitForm} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={String(form.nome || "")}
                  onChange={(event) => updateField("nome", event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={String(form.descricao || "")}
                  onChange={(event) => updateField("descricao", event.target.value)}
                  required
                />
              </div>

              {entity !== "pousadas" && entity !== "city_services" ? (
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select
                    value={String(form.categoria || "")}
                    onValueChange={(value) => updateField("categoria", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptionsForEntity(entity).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="categoria" value={String(form.categoria || "")} />
                </div>
              ) : null}

              {supportsEstablishmentSettings ? (
                <ContentSettingsEditor
                  entity={entity}
                  form={form}
                  updateField={updateField}
                />
              ) : null}

              {entity === "city_services" ? (
                <>
                  <div className="rounded-lg border border-border bg-accent/20 p-4">
                    <p className="text-sm font-semibold">Recurso futuro</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Estes dados alimentam a página /servicos. A página continua fora do menu enquanto a flag
                      enableCityServicesPage estiver desativada.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        name="slug"
                        value={String(form.slug || "")}
                        onChange={(event) => updateField("slug", event.target.value)}
                        placeholder="hospital-maternidade"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoria">Categoria principal</Label>
                      {mainServiceCategories.length ? (
                        <select
                          id="categoria"
                          name="categoria"
                          value={String(form.categoria || "")}
                          onChange={(event) => {
                            const category = mainServiceCategories.find(
                              (item) => item.slug === event.target.value,
                            );
                            updateField("categoria", event.target.value);
                            updateField("category_id", category?.id || "");
                            updateField("subcategory", "");
                            updateField("subcategory_id", "");
                            if (category?.listing_type && category.listing_type !== "mixed") {
                              updateField("listing_type", category.listing_type);
                            }
                          }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                          required
                        >
                          <option value="">Selecione uma categoria</option>
                          {mainServiceCategories.map((category) => (
                            <option key={category.id} value={category.slug}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id="categoria"
                          name="categoria"
                          value={String(form.categoria || "")}
                          onChange={(event) => updateField("categoria", event.target.value)}
                          placeholder="Cadastre as categorias na área de categorias"
                          required
                        />
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subcategory">Tipo de serviço</Label>
                      {serviceSubcategories.length ? (
                        <select
                          id="subcategory"
                          name="subcategory"
                          value={String(form.subcategory || "")}
                          onChange={(event) => {
                            const subcategory = serviceSubcategories.find(
                              (item) => item.name === event.target.value,
                            );
                            updateField("subcategory", event.target.value);
                            updateField("subcategory_id", subcategory?.id || "");
                          }}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                          required
                        >
                          <option value="">Selecione uma subcategoria</option>
                          {serviceSubcategories.map((subcategory) => (
                            <option key={subcategory.id} value={subcategory.name}>
                              {subcategory.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id="subcategory"
                          name="subcategory"
                          value={String(form.subcategory || "")}
                          onChange={(event) => {
                            const subcategory = serviceSubcategories.find(
                              (item) => item.name === event.target.value,
                            );
                            updateField("subcategory", event.target.value);
                            updateField("subcategory_id", subcategory?.id || "");
                          }}
                          placeholder="Cadastre uma subcategoria para a categoria selecionada"
                          required
                        />
                      )}
                    </div>
                  </div>
                  <input type="hidden" name="category_id" value={selectedServiceCategory?.id || String(form.category_id || "")} />
                  <input type="hidden" name="subcategory_id" value={selectedServiceSubcategory?.id || String(form.subcategory_id || "")} />

                  <div className="grid gap-2">
                    <Label htmlFor="full_description">Descrição completa</Label>
                    <Textarea id="full_description" name="full_description" value={String(form.full_description || "")} onChange={(event) => updateField("full_description", event.target.value)} placeholder="Informações detalhadas para a página individual." className="min-h-28" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="services_offered">Serviços oferecidos</Label>
                      <Textarea id="services_offered" name="services_offered" value={String(form.services_offered || "")} onChange={(event) => updateField("services_offered", event.target.value)} placeholder="Um serviço por linha" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="special_status">Status especial</Label>
                      <Input id="special_status" name="special_status" value={String(form.special_status || "")} onChange={(event) => updateField("special_status", event.target.value)} placeholder="Plantão, atendimento mediante encaminhamento..." />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        name="address"
                        value={String(form.address || "")}
                        onChange={(event) => updateField("address", event.target.value)}
                        placeholder="Rua, avenida ou referência"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="neighborhood">Bairro / região</Label>
                      <Input
                        id="neighborhood"
                        name="neighborhood"
                        value={String(form.neighborhood || "")}
                        onChange={(event) => updateField("neighborhood", event.target.value)}
                        placeholder="Centro, zona rural..."
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={String(form.phone || "")}
                        onChange={(event) => updateField("phone", event.target.value)}
                        placeholder="(84) 0000-0000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        value={String(form.whatsapp || "")}
                        onChange={(event) => updateField("whatsapp", event.target.value)}
                        placeholder="5584999999999"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="google_maps_url">Link do Google Maps</Label>
                      <Input
                        id="google_maps_url"
                        name="google_maps_url"
                        value={String(form.google_maps_url || "")}
                        onChange={(event) => updateField("google_maps_url", event.target.value)}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="opening_hours">Horário resumido</Label>
                      <Input
                        id="opening_hours"
                        name="opening_hours"
                        value={String(form.opening_hours || "")}
                        onChange={(event) => updateField("opening_hours", event.target.value)}
                        placeholder="Seg. a sáb.: 8h às 18h"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        value={String(form.instagram || "")}
                        onChange={(event) => updateField("instagram", event.target.value)}
                        placeholder="@perfil"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="instagram_url">Link do Instagram</Label>
                      <Input
                        id="instagram_url"
                        name="instagram_url"
                        value={String(form.instagram_url || "")}
                        onChange={(event) => updateField("instagram_url", event.target.value)}
                        placeholder="https://www.instagram.com/perfil/"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        name="latitude"
                        value={String(form.latitude || "")}
                        onChange={(event) => updateField("latitude", event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        name="longitude"
                        value={String(form.longitude || "")}
                        onChange={(event) => updateField("longitude", event.target.value)}
                      />
                    </div>
                  </div>

                  <section className="grid gap-4 rounded-lg border border-border bg-accent/15 p-4">
                    <div>
                      <p className="text-sm font-semibold">Imagens do serviço</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">Foto, logo e galeria têm destinos separados. Use apenas imagens próprias ou autorizadas.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Foto do card</Label>
                        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-background/50 p-4 text-center hover:bg-background/80">
                          {isUploading ? <Loader2 className="mb-2 h-5 w-5 animate-spin" /> : <ImagePlus className="mb-2 h-5 w-5" />}
                          <span className="text-sm font-medium">Enviar foto</span>
                          <span className="mt-1 text-xs text-muted-foreground">Fachada, entrada ou placa. Exibida com corte proporcional.</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={isUploading} onChange={(event) => { uploadCityServiceAsset("photo_url", event.target.files); event.target.value = ""; }} />
                        </label>
                        <Input name="photo_url" value={String(form.photo_url || "")} onChange={(event) => { updateField("photo_url", event.target.value); updateField("image_url", event.target.value); }} placeholder="URL da foto" />
                        {isSafePreviewImage(String(form.photo_url || "")) ? (
                          <div className="flex items-center gap-3 rounded-md border border-border bg-background/60 p-2">
                            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-accent">
                              <NextImage src={String(form.photo_url)} alt="Prévia da foto do serviço" fill sizes="80px" className="object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs text-muted-foreground">{imageSourceLabel(String(form.photo_url))}</p>
                              <Button type="button" variant="ghost" size="sm" disabled={isGalleryPending} onClick={() => removeCityServiceAsset("photo_url")}>
                                {galleryAction === "city-service-photo_url" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Remover foto
                              </Button>
                            </div>
                          </div>
                        ) : null}
                        <input type="hidden" name="image_url" value={String(form.photo_url || form.image_url || "")} />
                      </div>

                      <div className="grid gap-2">
                        <Label>Logo oficial</Label>
                        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-background/50 p-4 text-center hover:bg-background/80">
                          {isUploading ? <Loader2 className="mb-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mb-2 h-5 w-5" />}
                          <span className="text-sm font-medium">Enviar logo</span>
                          <span className="mt-1 text-xs text-muted-foreground">Exibida inteira, sem corte, sobre fundo neutro.</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={isUploading} onChange={(event) => { uploadCityServiceAsset("logo_url", event.target.files); event.target.value = ""; }} />
                        </label>
                        <Input name="logo_url" value={String(form.logo_url || "")} onChange={(event) => updateField("logo_url", event.target.value)} placeholder="URL da logo" />
                        {isSafePreviewImage(String(form.logo_url || "")) ? (
                          <div className="flex items-center gap-3 rounded-md border border-border bg-background/60 p-2">
                            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-white">
                              <NextImage src={String(form.logo_url)} alt="Prévia da logo do serviço" fill sizes="80px" className="object-contain p-1" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs text-muted-foreground">{imageSourceLabel(String(form.logo_url))}</p>
                              <Button type="button" variant="ghost" size="sm" disabled={isGalleryPending} onClick={() => removeCityServiceAsset("logo_url")}>
                                {galleryAction === "city-service-logo_url" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Remover logo
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Tipo de imagem do card</Label>
                        <Select value={String(form.image_type || "auto")} onValueChange={(value) => updateField("image_type", value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Automático: foto antes da logo</SelectItem>
                            <SelectItem value="photo">Foto</SelectItem>
                            <SelectItem value="logo">Logo</SelectItem>
                          </SelectContent>
                        </Select>
                        <input type="hidden" name="image_type" value={String(form.image_type || "auto")} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="alt_text">Texto alternativo da imagem</Label>
                        <Input id="alt_text" name="alt_text" value={String(form.alt_text || "")} onChange={(event) => updateField("alt_text", event.target.value)} placeholder="Fachada da Farmácia..." />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Fotos da galeria da página individual</Label>
                      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-background/50 p-4 text-center hover:bg-background/80">
                        <ImagePlus className="mb-2 h-5 w-5" />
                        <span className="text-sm font-medium">Adicionar fotos à galeria</span>
                        <span className="mt-1 text-xs text-muted-foreground">Até 5 arquivos por envio. A seção só aparece quando estiver ativada e possuir fotos.</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" disabled={isUploading} onChange={(event) => { uploadCityServiceAsset("gallery_urls", event.target.files); event.target.value = ""; }} />
                      </label>
                      <Textarea name="gallery_urls" value={String(form.gallery_urls || "")} onChange={(event) => updateField("gallery_urls", event.target.value)} placeholder="Uma URL por linha" />
                      {cityServiceGalleryImages.length ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {cityServiceGalleryImages.map((image, index) => (
                            <div key={image} className="flex items-center gap-2 rounded-md border border-border bg-background/60 p-2">
                              <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-md bg-accent">
                                <NextImage src={image} alt={`Foto ${index + 1} da galeria`} fill sizes="64px" className="object-cover" />
                              </div>
                              <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
                                <Button type="button" variant="ghost" size="icon" disabled={index === 0 || isGalleryPending} onClick={() => moveCityServiceGalleryImage(index, -1)} aria-label="Mover foto para cima">
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" disabled={index === cityServiceGalleryImages.length - 1 || isGalleryPending} onClick={() => moveCityServiceGalleryImage(index, 1)} aria-label="Mover foto para baixo">
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" disabled={isGalleryPending} onClick={() => removeCityServiceGalleryPhoto(image)} aria-label="Remover foto da galeria">
                                  {galleryAction === image ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="tags">Palavras-chave</Label>
                      <Textarea id="tags" name="tags" value={String(form.tags || "")} onChange={(event) => updateField("tags", event.target.value)} placeholder="Uma palavra por linha" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="enabled_buttons">Botões habilitados</Label>
                      <Textarea id="enabled_buttons" name="enabled_buttons" value={String(form.enabled_buttons || "")} onChange={(event) => updateField("enabled_buttons", event.target.value)} placeholder={"whatsapp\nmapa\ntelefone"} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="public_notice">Aviso público</Label>
                    <Textarea id="public_notice" name="public_notice" value={String(form.public_notice || "")} onChange={(event) => updateField("public_notice", event.target.value)} placeholder="Informação importante que será exibida ao visitante." />
                  </div>
                  <BusinessHoursEditor
                    value={form.business_hours}
                    onChange={(value) => updateField("business_hours", value)}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center gap-2 rounded-lg border border-border bg-accent/25 p-3 text-sm font-medium">
                      <input
                        type="checkbox"
                        name="is_emergency"
                        checked={Boolean(form.is_emergency)}
                        onChange={(event) => updateField("is_emergency", event.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      Marcar como emergência
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-border bg-accent/25 p-3 text-sm font-medium">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={Boolean(form.is_featured)}
                        onChange={(event) => updateField("is_featured", event.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      Destacar na página
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="sort_order">Ordem manual</Label>
                      <Input id="sort_order" name="sort_order" type="number" min="0" value={String(form.sort_order || "")} onChange={(event) => updateField("sort_order", event.target.value)} placeholder="Opcional" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="last_confirmed_at">Data da confirmação</Label>
                      <Input id="last_confirmed_at" name="last_confirmed_at" type="date" value={String(form.last_confirmed_at || "")} onChange={(event) => updateField("last_confirmed_at", event.target.value)} />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-md border border-border bg-accent/20 p-3 text-sm">
                      <input type="checkbox" name="is_published" checked={Boolean(form.is_published)} onChange={(event) => updateField("is_published", event.target.checked)} className="mt-0.5 h-4 w-4" />
                      <span><strong className="block">Publicado</strong><span className="text-xs text-muted-foreground">Somente itens ativos e publicados aparecem no guia.</span></span>
                    </label>
                    <label className="flex items-start gap-3 rounded-md border border-border bg-accent/20 p-3 text-sm">
                      <input type="checkbox" name="details_enabled" checked={Boolean(form.details_enabled)} onChange={(event) => updateField("details_enabled", event.target.checked)} className="mt-0.5 h-4 w-4" />
                      <span><strong className="block">Página individual</strong><span className="text-xs text-muted-foreground">Mostra o botão Ver detalhes e habilita /servicos/[slug].</span></span>
                    </label>
                    <label className="flex items-start gap-3 rounded-md border border-border bg-accent/20 p-3 text-sm">
                      <input type="checkbox" name="gallery_enabled" checked={Boolean(form.gallery_enabled)} onChange={(event) => updateField("gallery_enabled", event.target.checked)} className="mt-0.5 h-4 w-4" />
                      <span><strong className="block">Galeria ativa</strong><span className="text-xs text-muted-foreground">Só é exibida quando também houver fotos.</span></span>
                    </label>
                    <label className="flex items-start gap-3 rounded-md border border-border bg-accent/20 p-3 text-sm">
                      <input type="checkbox" name="is_24h" checked={Boolean(form.is_24h)} onChange={(event) => updateField("is_24h", event.target.checked)} className="mt-0.5 h-4 w-4" />
                      <span><strong className="block">Atendimento 24 horas</strong><span className="text-xs text-muted-foreground">Use apenas quando a informação estiver confirmada.</span></span>
                    </label>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={String(form.notes || "")}
                      onChange={(event) => updateField("notes", event.target.value)}
                      placeholder="Ex: confirme o atendimento antes do deslocamento."
                    />
                  </div>
                </>
              ) : null}

              {entity === "pontos_turisticos" ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="localizacao">Localização</Label>
                    <Input
                      id="localizacao"
                      name="localizacao"
                      value={String(form.localizacao || "")}
                      onChange={(event) => updateField("localizacao", event.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="info_url">Link externo do botão Saiba mais</Label>
                    <Input
                      id="info_url"
                      name="info_url"
                      type="url"
                      inputMode="url"
                      value={String(form.info_url || "")}
                      onChange={(event) => updateField("info_url", event.target.value)}
                      placeholder="https://pt.wikipedia.org/wiki/..."
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      Cole uma página confiável com mais informações sobre o ponto turístico. Se ficar vazio, o portal usará uma pesquisa externa pelo nome do local.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imagem_url">Imagem principal e fotos adicionais</Label>
                    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/40 p-6 text-center transition-colors hover:bg-accent/70">
                      {isUploading ? (
                        <Loader2 className="mb-3 h-7 w-7 animate-spin text-muted-foreground" />
                      ) : (
                        <ImagePlus className="mb-3 h-7 w-7 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {isUploading ? "Enviando imagens..." : "Selecionar fotos do roteiro"}
                      </span>
                      <span className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                        O upload não altera a imagem principal. As fotos enviadas entram apenas como adicionais no carrossel.
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="sr-only"
                        disabled={isUploading}
                        onChange={(event) => {
                          uploadAttractionImage(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {String(form.imagens_urls || "").trim() ? (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UploadCloud className="h-3.5 w-3.5" />
                        {String(form.imagens_urls || "").split(/\n+/).filter(Boolean).length} imagem
                        {String(form.imagens_urls || "").split(/\n+/).filter(Boolean).length === 1 ? "" : "s"} no carrossel.
                      </p>
                    ) : null}
                    {attractionImages.length ? (
                      <div className="grid gap-3 rounded-lg border border-border bg-background/50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">Fotos do carrossel</p>
                          {isGalleryPending ? (
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Atualizando...
                            </span>
                          ) : null}
                        </div>
                        <div className="grid gap-3">
                          {attractionImages.map((image, index) => {
                            const isCover = image === String(form.imagem_url || "").trim();
                            const isRemoving = galleryAction === image && isGalleryPending;

                            return (
                              <div
                                key={image}
                                className="grid gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-[96px_1fr] sm:items-center"
                              >
                                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-accent">
                                  <NextImage
                                    src={image}
                                    alt={`Foto ${index + 1} de ${String(form.nome || "roteiro")}`}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                  />
                                  {isCover ? (
                                    <span className="absolute left-2 top-2 rounded-md bg-alpine-sunset px-2 py-0.5 text-[10px] font-semibold text-[#17251f]">
                                      Capa
                                    </span>
                                  ) : null}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-col justify-between gap-2 lg:flex-row lg:items-start">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold">Foto {index + 1}</p>
                                      <p className="mt-1 text-xs text-muted-foreground">{imageSourceLabel(image)}</p>
                                      <p className="mt-1 truncate text-xs text-muted-foreground">{image}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={index === 0 || isGalleryPending}
                                        onClick={() => moveAttractionImage(index, -1)}
                                      >
                                        <ArrowUp className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={index === attractionImages.length - 1 || isGalleryPending}
                                        onClick={() => moveAttractionImage(index, 1)}
                                      >
                                        <ArrowDown className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={isCover ? "secondary" : "outline"}
                                        size="sm"
                                        disabled={isCover || isGalleryPending}
                                        onClick={() => setAttractionCover(image)}
                                      >
                                        <Star className="h-4 w-4" />
                                        {isCover ? "Capa" : "Capa"}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={attractionImages.length <= 1 || isGalleryPending}
                                        onClick={() => removeAttractionImage(image)}
                                      >
                                        {isRemoving ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                        Remover
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    <Input
                      id="imagem_url"
                      name="imagem_url"
                      placeholder="/images/cruzeiro-img.png ou https://..."
                      value={String(form.imagem_url || "")}
                      onChange={(event) => updateField("imagem_url", event.target.value)}
                      required
                    />
                    <Textarea
                      id="imagens_urls"
                      name="imagens_urls"
                      value={String(form.imagens_urls || "")}
                      onChange={(event) => updateField("imagens_urls", event.target.value)}
                      placeholder="As fotos adicionais enviadas aparecem aqui automaticamente. Você também pode colar uma imagem por linha."
                    />
                  </div>
                </>
              ) : null}

              {entity === "pousadas" ? (
                <>
                  <div className="rounded-lg border border-border bg-accent/20 p-4">
                    <p className="text-sm font-semibold">Página individual da pousada</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Esses campos alimentam a página /pousadas/slug. A imagem principal do Hero, a logo e a galeria
                      são gerenciadas separadamente.
                    </p>
                    {editingId && String(form.slug || "").trim() ? (
                      <Button asChild type="button" variant="outline" size="sm" className="mt-3">
                        <a
                          href={`/pousadas/${String(form.slug).trim()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver página publicada
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Slug da página</Label>
                      <Input
                        id="slug"
                        name="slug"
                        value={String(form.slug || "")}
                        onChange={(event) => updateField("slug", event.target.value)}
                        placeholder="pousada-serido"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Input
                        id="categoria"
                        name="categoria"
                        value={String(form.categoria || "")}
                        onChange={(event) => updateField("categoria", event.target.value)}
                        placeholder="Pousada, Chalé, Camping..."
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="historia">História / texto completo</Label>
                    <Textarea
                      id="historia"
                      name="historia"
                      value={String(form.historia || "")}
                      onChange={(event) => updateField("historia", event.target.value)}
                      placeholder="Texto maior para a seção Sobre a hospedagem."
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="localizacao">Localização</Label>
                      <Input
                        id="localizacao"
                        name="localizacao"
                        value={String(form.localizacao || "")}
                        onChange={(event) => updateField("localizacao", event.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endereco">Endereço completo</Label>
                      <Input
                        id="endereco"
                        name="endereco"
                        value={String(form.endereco || "")}
                        onChange={(event) => updateField("endereco", event.target.value)}
                        placeholder="Rua, bairro, zona rural..."
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="distancia_centro">Distância do centro</Label>
                      <Input
                        id="distancia_centro"
                        name="distancia_centro"
                        value={String(form.distancia_centro || "")}
                        onChange={(event) => updateField("distancia_centro", event.target.value)}
                        placeholder="Ex: 0,6 km do centro"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mapa_url">Link do Google Maps</Label>
                      <Input
                        id="mapa_url"
                        name="mapa_url"
                        value={String(form.mapa_url || "")}
                        onChange={(event) => updateField("mapa_url", event.target.value)}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="faixa_preco_min">Preço mínimo</Label>
                      <Input
                        id="faixa_preco_min"
                        name="faixa_preco_min"
                        inputMode="decimal"
                        value={String(form.faixa_preco_min || "")}
                        onChange={(event) => updateField("faixa_preco_min", event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="faixa_preco_max">Preço máximo</Label>
                      <Input
                        id="faixa_preco_max"
                        name="faixa_preco_max"
                        inputMode="decimal"
                        value={String(form.faixa_preco_max || "")}
                        onChange={(event) => updateField("faixa_preco_max", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center gap-2 rounded-lg border border-border bg-accent/25 p-3 text-sm font-medium">
                      <input
                        type="checkbox"
                        name="aceita_reservas"
                        checked={Boolean(form.aceita_reservas)}
                        onChange={(event) => updateField("aceita_reservas", event.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      Aceita reservas
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="check_in">Check-in</Label>
                      <Input
                        id="check_in"
                        name="check_in"
                        value={String(form.check_in || "")}
                        onChange={(event) => updateField("check_in", event.target.value)}
                        placeholder="14h"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="check_out">Check-out</Label>
                      <Input
                        id="check_out"
                        name="check_out"
                        value={String(form.check_out || "")}
                        onChange={(event) => updateField("check_out", event.target.value)}
                        placeholder="12h"
                      />
                    </div>
                  </div>
                  <BusinessHoursEditor
                    value={form.business_hours}
                    onChange={(value) => updateField("business_hours", value)}
                    context="lodging"
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="capacidade">Capacidade</Label>
                    <Input
                      id="capacidade"
                      name="capacidade"
                      value={String(form.capacidade || "")}
                      onChange={(event) => updateField("capacidade", event.target.value)}
                      placeholder="Até 20 hóspedes"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={String(form.whatsapp || "")}
                      onChange={(event) => updateField("whatsapp", event.target.value)}
                      placeholder="5584999999999"
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="telefone">Telefone visível</Label>
                      <Input
                        id="telefone"
                        name="telefone"
                        value={String(form.telefone || "")}
                        onChange={(event) => updateField("telefone", event.target.value)}
                        placeholder="(84) 99999-9999"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        value={String(form.instagram || "")}
                        onChange={(event) => updateField("instagram", event.target.value)}
                        placeholder="@perfil"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instagram_url">Link do Instagram</Label>
                    <Input
                      id="instagram_url"
                      name="instagram_url"
                      value={String(form.instagram_url || "")}
                      onChange={(event) => updateField("instagram_url", event.target.value)}
                      placeholder="https://www.instagram.com/perfil/"
                    />
                  </div>
                  <MediaDestinationGuide
                    kind="lodging"
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="hero_image_url">1. Foto principal da página</Label>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Use uma foto horizontal em boa qualidade. Não envie logo neste campo. Imagem recomendada:
                      1600x900 ou maior.
                    </p>
                    <div className="grid gap-3 rounded-lg border border-border bg-background/50 p-3 md:grid-cols-[minmax(220px,320px)_1fr] md:items-center">
                      <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-accent/40">
                        {String(form.hero_image_url || "").trim() ? (
                          <NextImage
                            src={String(form.hero_image_url || "")}
                            alt={`Imagem principal de ${String(form.nome || "pousada")}`}
                            fill
                            sizes="320px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted-foreground">
                            <ImagePlus className="h-6 w-6" />
                            Foto horizontal para o topo da página
                          </div>
                        )}
                      </div>
                      <div className="grid gap-3">
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/40 p-4 text-center transition-colors hover:bg-accent/70">
                          {isUploading ? (
                            <Loader2 className="mb-2 h-5 w-5 animate-spin text-muted-foreground" />
                          ) : (
                            <ImagePlus className="mb-2 h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">
                            {isUploading ? "Enviando imagem..." : "Selecionar imagem principal"}
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            disabled={isUploading}
                            onChange={(event) => {
                              uploadLodgingHeroImage(event.target.files);
                              event.target.value = "";
                            }}
                          />
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            id="hero_image_url"
                            name="hero_image_url"
                            value={String(form.hero_image_url || "")}
                            onChange={(event) => updateField("hero_image_url", event.target.value)}
                            placeholder="/images/pousada-hero.jpg ou https://..."
                          />
                          {String(form.hero_image_url || "").trim() ? (
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={isGalleryPending}
                              onClick={removeLodgingHeroImage}
                            >
                              {galleryAction === "lodging-hero" && isGalleryPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Remover
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="logo_url">2. Logo da pousada</Label>
                    <div className="grid gap-3 rounded-lg border border-border bg-background/50 p-3 sm:grid-cols-[96px_1fr] sm:items-center">
                      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-white p-2">
                        {String(form.logo_url || "").trim() ? (
                          <NextImage
                            src={String(form.logo_url || "")}
                            alt={`Logo de ${String(form.nome || "pousada")}`}
                            fill
                            sizes="96px"
                            className="object-contain p-2"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-semibold text-muted-foreground">
                            Sem logo
                          </div>
                        )}
                      </div>
                      <div className="grid gap-3">
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/40 p-4 text-center transition-colors hover:bg-accent/70">
                          {isUploading ? (
                            <Loader2 className="mb-2 h-5 w-5 animate-spin text-muted-foreground" />
                          ) : (
                            <ImagePlus className="mb-2 h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">
                            {isUploading ? "Enviando logo..." : "Selecionar logo"}
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            disabled={isUploading}
                            onChange={(event) => {
                              uploadLodgingLogoImage(event.target.files);
                              event.target.value = "";
                            }}
                          />
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            id="logo_url"
                            name="logo_url"
                            value={String(form.logo_url || "")}
                            onChange={(event) => updateField("logo_url", event.target.value)}
                            placeholder="/images/logo.png ou https://..."
                          />
                          {String(form.logo_url || "").trim() ? (
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={isGalleryPending}
                              onClick={removeLodgingLogo}
                            >
                              {galleryAction === "lodging-logo" && isGalleryPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Remover
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imagens_urls">3. Fotos da galeria</Label>
                    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/40 p-6 text-center transition-colors hover:bg-accent/70">
                      {isUploading ? (
                        <Loader2 className="mb-3 h-7 w-7 animate-spin text-muted-foreground" />
                      ) : (
                        <ImagePlus className="mb-3 h-7 w-7 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {isUploading ? "Enviando imagens..." : "Selecionar fotos para a galeria"}
                      </span>
                      <span className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                        A primeira foto sera a capa do card. As demais alimentam a galeria e, quando ativo, o carrossel conforme a ordem abaixo.
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="sr-only"
                        disabled={isUploading}
                        onChange={(event) => {
                          uploadLodgingImages(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {String(form.imagens_urls || "").trim() ? (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UploadCloud className="h-3.5 w-3.5" />
                        {String(form.imagens_urls || "").split(/\n+/).filter(Boolean).length} imagem
                        {String(form.imagens_urls || "").split(/\n+/).filter(Boolean).length === 1 ? "" : "s"} na lista.
                      </p>
                    ) : null}
                    {lodgingImages.length ? (
                      <div className="grid gap-3 rounded-lg border border-border bg-background/50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              Galeria e ordem do carrossel
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              A primeira foto é a capa da listagem. A foto principal da página usa o campo separado acima.
                            </p>
                          </div>
                          {isGalleryPending ? (
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Atualizando...
                            </span>
                          ) : null}
                        </div>
                        <div className="grid gap-3">
                          {lodgingImages.map((image, index) => {
                            const isCover = index === 0;
                            const isRemoving = galleryAction === image && isGalleryPending;

                            return (
                              <div
                                key={image}
                                className="grid gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-[96px_1fr] sm:items-center"
                              >
                                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-accent">
                                  <NextImage
                                    src={image}
                                    alt={`Foto ${index + 1} de ${String(form.nome || "pousada")}`}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                  />
                                  {isCover ? (
                                    <span className="absolute left-2 top-2 rounded-md bg-alpine-sunset px-2 py-0.5 text-[10px] font-semibold text-[#17251f]">
                                      Capa do card
                                    </span>
                                  ) : null}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-col justify-between gap-2 lg:flex-row lg:items-start">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold">Foto {index + 1}</p>
                                      {Boolean(form.carousel_enabled) && index < 10 ? (
                                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-alpine-wine">
                                          Carrossel · posição {index + 1}
                                        </p>
                                      ) : null}
                                      <p className="mt-1 text-xs text-muted-foreground">{imageSourceLabel(image)}</p>
                                      <p className="mt-1 truncate text-xs text-muted-foreground">{image}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={index === 0 || isGalleryPending}
                                        onClick={() => moveLodgingImage(index, -1)}
                                      >
                                        <ArrowUp className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={index === lodgingImages.length - 1 || isGalleryPending}
                                        onClick={() => moveLodgingImage(index, 1)}
                                      >
                                        <ArrowDown className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={isCover ? "secondary" : "outline"}
                                        size="sm"
                                        disabled={isCover || isGalleryPending}
                                        onClick={() => setLodgingCover(image)}
                                      >
                                        <Star className="h-4 w-4" />
                                        Capa
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={lodgingImages.length <= 1 || isGalleryPending}
                                        onClick={() => removeLodgingImage(image)}
                                      >
                                        {isRemoving ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                        Remover
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    <Textarea
                      id="imagens_urls"
                      name="imagens_urls"
                      value={String(form.imagens_urls || "")}
                      onChange={(event) => updateField("imagens_urls", event.target.value)}
                      placeholder="As URLs enviadas aparecem aqui automaticamente. Você também pode colar uma imagem por linha."
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="tipos_acomodacao">Tipos de acomodação</Label>
                      <Textarea
                        id="tipos_acomodacao"
                        name="tipos_acomodacao"
                        value={String(form.tipos_acomodacao || "")}
                        onChange={(event) => updateField("tipos_acomodacao", event.target.value)}
                        placeholder="Quarto Casal&#10;Suíte&#10;Chalé"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="formas_pagamento">Formas de pagamento</Label>
                      <Textarea
                        id="formas_pagamento"
                        name="formas_pagamento"
                        value={String(form.formas_pagamento || "")}
                        onChange={(event) => updateField("formas_pagamento", event.target.value)}
                        placeholder="Pix&#10;Dinheiro&#10;Cartão"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Comodidades</Label>
                    <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-border bg-accent/25 p-4 sm:grid-cols-2">
                      {selectedLodgingOptions(form.comodidades, lodgingAmenities).map((amenity) => {
                        const checked = selectedTags(form.comodidades).includes(amenity);
                        return (
                          <label key={amenity} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="comodidades"
                              value={amenity}
                              checked={checked}
                              onChange={(event) => toggleLodgingOption("comodidades", amenity, event.target.checked)}
                              className="h-4 w-4 rounded border-border"
                            />
                            {amenity}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Diferenciais</Label>
                    <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-border bg-accent/25 p-4 sm:grid-cols-2">
                      {selectedLodgingOptions(form.diferenciais, lodgingHighlights).map((highlight) => {
                        const checked = selectedTags(form.diferenciais).includes(highlight);
                        return (
                          <label key={highlight} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="diferenciais"
                              value={highlight}
                              checked={checked}
                              onChange={(event) => toggleLodgingOption("diferenciais", highlight, event.target.checked)}
                              className="h-4 w-4 rounded border-border"
                            />
                            {highlight}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="diferencial_principal">Diferencial principal</Label>
                    <Input
                      id="diferencial_principal"
                      name="diferencial_principal"
                      value={String(form.diferencial_principal || "")}
                      onChange={(event) => updateField("diferencial_principal", event.target.value)}
                      placeholder="Ex: Vista para a serra e ambiente silencioso"
                    />
                  </div>
                </>
              ) : null}

              {entity === "restaurantes" ? (
                <>
                  <div className="rounded-lg border border-border bg-accent/20 p-4">
                    <p className="text-sm font-semibold">Página individual do restaurante</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Esses campos alimentam a página /restaurantes/slug. Se deixar o slug vazio, ele será gerado pelo nome.
                    </p>
                    {editingId && String(form.slug || "").trim() ? (
                      <Button asChild type="button" variant="outline" size="sm" className="mt-3">
                        <a
                          href={`/restaurantes/${String(form.slug).trim()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver página publicada
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Slug da página</Label>
                      <Input
                        id="slug"
                        name="slug"
                        value={String(form.slug || "")}
                        onChange={(event) => updateField("slug", event.target.value)}
                        placeholder="acai-bistro"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="faixa_preco">Faixa de preço</Label>
                      <Input
                        id="faixa_preco"
                        name="faixa_preco"
                        value={String(form.faixa_preco || "")}
                        onChange={(event) => updateField("faixa_preco", event.target.value)}
                        placeholder="R$, R$$ ou R$$$"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="descricao_completa">Descrição completa</Label>
                    <Textarea
                      id="descricao_completa"
                      name="descricao_completa"
                      value={String(form.descricao_completa || "")}
                      onChange={(event) => updateField("descricao_completa", event.target.value)}
                      placeholder="Texto maior para a seção Sobre da página individual."
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="horario_funcionamento">Horário</Label>
                      <Input
                        id="horario_funcionamento"
                        name="horario_funcionamento"
                        value={String(form.horario_funcionamento || "")}
                        onChange={(event) => updateField("horario_funcionamento", event.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        name="endereco"
                        value={String(form.endereco || "")}
                        onChange={(event) => updateField("endereco", event.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <BusinessHoursEditor
                    value={form.business_hours}
                    onChange={(value) => updateField("business_hours", value)}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="localizacao_resumida">Localização resumida</Label>
                      <Input
                        id="localizacao_resumida"
                        name="localizacao_resumida"
                        value={String(form.localizacao_resumida || "")}
                        onChange={(event) => updateField("localizacao_resumida", event.target.value)}
                        placeholder="Centro, área rural, avenida principal..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mapa_url">Link do Google Maps</Label>
                      <Input
                        id="mapa_url"
                        name="mapa_url"
                        value={String(form.mapa_url || "")}
                        onChange={(event) => updateField("mapa_url", event.target.value)}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cardapio_url">Link do cardápio</Label>
                    <Input
                      id="cardapio_url"
                      name="cardapio_url"
                      value={String(form.cardapio_url || "")}
                      onChange={(event) => updateField("cardapio_url", event.target.value)}
                      placeholder="https://... (opcional)"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        value={String(form.instagram || "")}
                        onChange={(event) => updateField("instagram", event.target.value)}
                        placeholder="@perfil"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="instagram_url">Link do Instagram</Label>
                      <Input
                        id="instagram_url"
                        name="instagram_url"
                        value={String(form.instagram_url || "")}
                        onChange={(event) => updateField("instagram_url", event.target.value)}
                        placeholder="https://www.instagram.com/perfil/"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        value={String(form.whatsapp || "")}
                        onChange={(event) => updateField("whatsapp", event.target.value)}
                        placeholder="5584999"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="telefone">Telefone visível</Label>
                      <Input
                        id="telefone"
                        name="telefone"
                        value={String(form.telefone || "")}
                        onChange={(event) => updateField("telefone", event.target.value)}
                        placeholder="(84) 99999-9999"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tags do estabelecimento</Label>
                    <div className="grid gap-2 rounded-lg border border-border bg-accent/25 p-4 sm:grid-cols-2">
                      {restaurantTags.map((tag) => {
                        const checked = selectedTags(form.tags).includes(tag);
                        return (
                          <label key={tag} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="tags"
                              value={tag}
                              checked={checked}
                              onChange={(event) => toggleRestaurantTag(tag, event.target.checked)}
                              className="h-4 w-4 rounded border-border"
                            />
                            {tag}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <MediaDestinationGuide
                    kind="restaurant"
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="imagem_url">1. Foto principal / capa do card</Label>
                    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/40 p-5 text-center transition-colors hover:bg-accent/70">
                      {isUploading ? (
                        <Loader2 className="mb-3 h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <ImagePlus className="mb-3 h-6 w-6 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {isUploading ? "Enviando imagem..." : "Selecionar foto principal"}
                      </span>
                      <span className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                        Esta e a imagem principal do card e a primeira imagem do carrossel quando ele estiver ativo.
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        disabled={isUploading}
                        onChange={(event) => {
                          uploadRestaurantImage(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <Input
                      id="imagem_url"
                      name="imagem_url"
                      value={String(form.imagem_url || "")}
                      onChange={(event) => updateField("imagem_url", event.target.value)}
                      placeholder="/banners/cafe.jpg ou https://..."
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="logo_url">2. Logo do estabelecimento</Label>
                    <div className="grid gap-3 rounded-lg border border-border bg-background/50 p-3 sm:grid-cols-[96px_1fr] sm:items-center">
                      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-white p-2">
                        {String(form.logo_url || "").trim() ? (
                          <NextImage
                            src={String(form.logo_url || "")}
                            alt={`Logo de ${String(form.nome || "restaurante")}`}
                            fill
                            sizes="96px"
                            className="object-contain p-2"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-semibold text-muted-foreground">
                            Sem logo
                          </div>
                        )}
                      </div>
                      <div className="grid gap-3">
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/40 p-4 text-center transition-colors hover:bg-accent/70">
                          {isUploading ? (
                            <Loader2 className="mb-2 h-5 w-5 animate-spin text-muted-foreground" />
                          ) : (
                            <ImagePlus className="mb-2 h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">
                            {isUploading ? "Enviando logo..." : "Selecionar logo"}
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            disabled={isUploading}
                            onChange={(event) => {
                              uploadRestaurantLogoImage(event.target.files);
                              event.target.value = "";
                            }}
                          />
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            id="logo_url"
                            name="logo_url"
                            value={String(form.logo_url || "")}
                            onChange={(event) => updateField("logo_url", event.target.value)}
                            placeholder="/images/logo.png ou https://..."
                          />
                          {String(form.logo_url || "").trim() ? (
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={isGalleryPending}
                              onClick={removeRestaurantLogo}
                            >
                              {galleryAction === "restaurant-logo" && isGalleryPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Remover
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imagens_urls">3. Fotos da galeria</Label>
                    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/40 p-5 text-center transition-colors hover:bg-accent/70">
                      {isUploading ? (
                        <Loader2 className="mb-3 h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <ImagePlus className="mb-3 h-6 w-6 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {isUploading ? "Enviando imagens..." : "Selecionar fotos para a galeria"}
                      </span>
                      <span className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                        Use fotos de pratos, ambiente ou fachada. Elas aparecem na galeria e entram no carrossel conforme a ordem abaixo.
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="sr-only"
                        disabled={isUploading}
                        onChange={(event) => {
                          uploadRestaurantGalleryImages(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <Textarea
                      id="imagens_urls"
                      name="imagens_urls"
                      value={String(form.imagens_urls || "")}
                      onChange={(event) => updateField("imagens_urls", event.target.value)}
                      placeholder="Uma URL de imagem por linha."
                    />
                    {restaurantImages.length ? (
                      <div className="grid gap-3 rounded-lg border border-border bg-background/50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              Galeria e ordem do carrossel
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              A foto principal aparece primeiro. Use as setas para organizar a galeria.
                            </p>
                          </div>
                          {isGalleryPending ? (
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Atualizando...
                            </span>
                          ) : null}
                        </div>
                        <div className="grid gap-3">
                          {restaurantImages.map((image, index) => {
                            const isCover = image === String(form.imagem_url || "").trim();
                            const isRemoving = galleryAction === image && isGalleryPending;

                            return (
                              <div
                                key={image}
                                className="grid gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-[96px_1fr] sm:items-center"
                              >
                                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-accent">
                                  <NextImage
                                    src={image}
                                    alt={`Foto ${index + 1} de ${String(form.nome || "restaurante")}`}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                  />
                                  {isCover ? (
                                    <span className="absolute left-2 top-2 rounded-md bg-alpine-sunset px-2 py-0.5 text-[10px] font-semibold text-[#17251f]">
                                      Capa do card
                                    </span>
                                  ) : null}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-col justify-between gap-2 lg:flex-row lg:items-start">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold">Foto {index + 1}</p>
                                      {Boolean(form.carousel_enabled) && index < 10 ? (
                                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-alpine-wine">
                                          Carrossel · posição {index + 1}
                                        </p>
                                      ) : null}
                                      <p className="mt-1 text-xs text-muted-foreground">{imageSourceLabel(image)}</p>
                                      <p className="mt-1 truncate text-xs text-muted-foreground">{image}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={index === 0 || isGalleryPending}
                                        onClick={() => moveRestaurantImage(index, -1)}
                                      >
                                        <ArrowUp className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={index === restaurantImages.length - 1 || isGalleryPending}
                                        onClick={() => moveRestaurantImage(index, 1)}
                                      >
                                        <ArrowDown className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={isCover ? "secondary" : "outline"}
                                        size="sm"
                                        disabled={isCover || isGalleryPending}
                                        onClick={() => setRestaurantCover(image)}
                                      >
                                        <Star className="h-4 w-4" />
                                        Capa
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={restaurantImages.length <= 1 || isGalleryPending}
                                        onClick={() => removeRestaurantImage(image)}
                                      >
                                        {isRemoving ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                        Remover
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="formas_pagamento">Formas de pagamento</Label>
                      <Textarea
                        id="formas_pagamento"
                        name="formas_pagamento"
                        value={String(form.formas_pagamento || "")}
                        onChange={(event) => updateField("formas_pagamento", event.target.value)}
                        placeholder="Pix&#10;Dinheiro&#10;Cartão"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>O que a casa oferece</Label>
                      <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-border bg-accent/25 p-4 sm:grid-cols-2">
                        {selectedOfferings(form.diferenciais).map((offering) => {
                          const checked = selectedTags(form.diferenciais).includes(offering);
                          return (
                            <label key={offering} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                name="diferenciais"
                                value={offering}
                                checked={checked}
                                onChange={(event) => toggleRestaurantOffering(offering, event.target.checked)}
                                className="h-4 w-4 rounded border-border"
                              />
                              {offering}
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Marque tudo que o estabelecimento oferece. Essas opções aparecem no card A casa oferece.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="especialidades">Especialidades</Label>
                    <Textarea
                      id="especialidades"
                      name="especialidades"
                      value={String(form.especialidades || "")}
                      onChange={(event) => updateField("especialidades", event.target.value)}
                      placeholder="Almoço regional&#10;Pizza&#10;Petiscos"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="prato_recomendado">Recomendação da casa</Label>
                    <Input
                      id="prato_recomendado"
                      name="prato_recomendado"
                      value={String(form.prato_recomendado || "")}
                      onChange={(event) => updateField("prato_recomendado", event.target.value)}
                      placeholder="Prato mais famoso"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dica_turista">Dica para quem visita pela primeira vez</Label>
                    <Textarea
                      id="dica_turista"
                      name="dica_turista"
                      value={String(form.dica_turista || "")}
                      onChange={(event) => updateField("dica_turista", event.target.value)}
                      placeholder="Sugestão curta para turistas."
                    />
                  </div>
                </>
              ) : null}

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={Boolean(form.ativo)}
                  onChange={(event) => updateField("ativo", event.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Ativo no site
              </label>

              <div
                className={`rounded-md border p-3 text-sm ${
                  status.type === "success"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : status.type === "error"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border bg-accent/45 text-muted-foreground"
                }`}
              >
                {status.text}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" variant="warm" disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingId ? "Salvar edição" : "Cadastrar"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <Plus className="h-4 w-4" />
                    Novo cadastro
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{entityLabels[entity]} cadastrados</CardTitle>
            <p className="text-sm text-muted-foreground">
              {filteredRows.length} item{filteredRows.length === 1 ? "" : "s"} encontrado{filteredRows.length === 1 ? "" : "s"}.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {entity === "city_services" ? (
              <Input
                type="search"
                value={adminSearch}
                onChange={(event) => setAdminSearch(event.target.value)}
                placeholder="Buscar serviço por nome, categoria ou endereço"
                aria-label="Buscar serviços cadastrados"
              />
            ) : null}
            {filteredRows.length ? (
              filteredRows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col justify-between gap-4 rounded-md border border-border bg-background/60 p-4 md:flex-row md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{rowName(row)}</h3>
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {rowIsActive(row) ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{rowSummary(entity, row)}</p>
                  </div>
                  <div className="flex gap-2">
                    {entity === "city_services" ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => duplicateRow(row)}>
                        <Copy className="h-4 w-4" />
                        Duplicar
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" size="sm" onClick={() => editRow(row)}>
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(row)}>
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhum item cadastrado nesta categoria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
