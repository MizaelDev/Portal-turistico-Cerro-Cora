import { createClient } from "@supabase/supabase-js";
import {
  getCommercialFeatures,
  getEffectivePlanStatus,
  getPhotoLimits,
  getPlanPriority,
  normalizeCommercialPlan,
} from "@/lib/commercial";
import {
  attractions as fallbackAttractions,
  foodPlaces as fallbackFoodPlaces,
  lodgings as fallbackLodgings,
  type Attraction,
  type FoodPlace,
  type Lodging,
} from "@/lib/data";
import { slugify } from "@/lib/slug";
import {
  isSupabaseConfigured,
  type PontoTuristicoRow,
  type PousadaRow,
  type RestauranteCategory,
  type RestauranteRow,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase";

type PublicContent<T> = {
  items: T[];
  error: string | null;
  source: "supabase" | "mock";
};

const attractionColumns =
  "id,nome,descricao,categoria,localizacao,imagem_url,imagens_urls,ativo,created_at";
const lodgingColumns =
  "id,nome,descricao,localizacao,distancia_centro,faixa_preco_min,faixa_preco_max,whatsapp,imagens_urls,ativo,created_at";
const legacyExtendedLodgingColumns =
  "id,nome,slug,descricao,historia,categoria,localizacao,endereco,mapa_url,distancia_centro,faixa_preco_min,faixa_preco_max,whatsapp,telefone,instagram,instagram_url,logo_url,hero_image_url,imagens_urls,check_in,check_out,business_hours,capacidade,tipos_acomodacao,formas_pagamento,comodidades,diferenciais,diferencial_principal,aceita_reservas,destaque,plano,whatsapp_message,site_url,pagina_ativa,ativo,created_at,updated_at";
const extendedLodgingColumns = `${legacyExtendedLodgingColumns},plan_type,plan_status,plan_started_at,plan_expires_at,custom_features,carousel_photo_limit,gallery_photo_limit,featured_order,category_priority,professional_photography_included,photography_completed_at,social_media_promotion_included,social_media_publication_url,advanced_report_enabled,priority_support_enabled,seasonal_campaign_enabled,establishment_story_enabled,commercial_notes,plan_change_reason`;
const restaurantColumns =
  "id,nome,descricao,categoria,horario_funcionamento,endereco,mapa_url,instagram,instagram_url,whatsapp,imagem_url,tags,ativo,created_at";
const legacyExtendedRestaurantColumns =
  "id,nome,slug,descricao,descricao_completa,categoria,horario_funcionamento,business_hours,endereco,localizacao_resumida,mapa_url,instagram,instagram_url,whatsapp,telefone,imagem_url,logo_url,imagens_urls,tags,formas_pagamento,diferenciais,especialidades,prato_recomendado,dica_turista,cardapio_url,faixa_preco,destaque,plano,whatsapp_message,site_url,pagina_ativa,ativo,created_at,updated_at";
const extendedRestaurantColumns = `${legacyExtendedRestaurantColumns},plan_type,plan_status,plan_started_at,plan_expires_at,custom_features,carousel_photo_limit,gallery_photo_limit,featured_order,category_priority,professional_photography_included,photography_completed_at,social_media_promotion_included,social_media_publication_url,advanced_report_enabled,priority_support_enabled,seasonal_campaign_enabled,establishment_story_enabled,commercial_notes,plan_change_reason`;
const publicContentTimeoutMs = 8000;

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const upstreamSignal = init?.signal;
  const abortRequest = () => controller.abort();
  const timeout = setTimeout(abortRequest, publicContentTimeoutMs);

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort();
    } else {
      upstreamSignal.addEventListener("abort", abortRequest, { once: true });
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    upstreamSignal?.removeEventListener("abort", abortRequest);
  }
};

function logPublicContentError(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[public-content:${scope}]`, error);
  }
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isSchemaCacheError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() || "";
  return (
    message.includes("schema cache") ||
    (message.includes("column") && message.includes("does not exist")) ||
    (message.includes("could not find") && message.includes("column"))
  );
}

function mapPontoTuristico(row: PontoTuristicoRow): Attraction {
  const gallery = (row.imagens_urls || []).filter(Boolean);

  return {
    slug: slugify(row.nome),
    name: row.nome,
    image: row.imagem_url,
    gallery,
    description: row.descricao,
    location: row.localizacao,
    category: titleCase(row.categoria),
  };
}

function formatPriceRange(min: number | null, max: number | null) {
  if (min && max) return `R$ ${min} - R$ ${max}`;
  if (min) return `A partir de R$ ${min}`;
  if (max) return `Até R$ ${max}`;
  return "Consulte valores";
}

function mapPousada(row: PousadaRow): Lodging {
  const images = (row.imagens_urls || []).filter(Boolean);
  const location = row.distancia_centro ? `${row.localizacao} - ${row.distancia_centro}` : row.localizacao;
  const plan = normalizeCommercialPlan(row.plan_type || row.plano);
  const planStatus = getEffectivePlanStatus(row.plan_status, row.plan_expires_at);
  const features = getCommercialFeatures(plan, {
    status: planStatus,
    customFeatures: row.custom_features,
    pageEnabled: row.pagina_ativa ?? true,
    galleryEnabled: images.length > 0,
    carouselEnabled: images.length > 1,
    highlighted: row.destaque,
    bookingEnabled: row.aceita_reservas ?? true,
  });
  const photoLimits = getPhotoLimits(plan, row.carousel_photo_limit, row.gallery_photo_limit);
  const publicImages = features.gallery ? images.slice(0, photoLimits.gallery || 1) : images.slice(0, 1);

  return {
    id: row.id,
    slug: row.slug || slugify(row.nome),
    name: row.nome,
    category: row.categoria || "Pousada",
    image: publicImages[0] || row.logo_url || "/images/cerro-cora.jpg",
    imageIsLogo: !publicImages[0] && Boolean(row.logo_url),
    heroImage: row.hero_image_url || undefined,
    logo: row.logo_url || undefined,
    gallery: features.gallery ? publicImages.slice(1) : [],
    description: row.descricao,
    story: features.establishmentStory ? row.historia || undefined : undefined,
    mainDifferential: row.diferencial_principal || row.diferenciais?.[0] || undefined,
    whatsapp: row.whatsapp,
    phone: row.telefone || undefined,
    instagram: row.instagram || undefined,
    instagramUrl: row.instagram_url || undefined,
    location,
    address: row.endereco || row.localizacao,
    mapUrl: row.mapa_url || undefined,
    priceRange: formatPriceRange(row.faixa_preco_min, row.faixa_preco_max),
    checkIn: row.check_in || undefined,
    checkOut: row.check_out || undefined,
    businessHours: row.business_hours || undefined,
    capacity: row.capacidade || undefined,
    accommodationTypes: row.tipos_acomodacao || undefined,
    paymentMethods: row.formas_pagamento || undefined,
    amenities: row.comodidades || undefined,
    highlights: row.diferenciais || undefined,
    acceptsReservations: row.aceita_reservas ?? true,
    isFeatured: features.highlighted,
    plan,
    planStatus,
    customFeatures: row.custom_features || undefined,
    commercialFeatures: features,
    carouselPhotoLimit: photoLimits.carousel,
    galleryPhotoLimit: photoLimits.gallery,
    featuredOrder: row.featured_order ?? undefined,
    categoryPriority: row.category_priority ?? undefined,
    pageEnabled: features.individualPage,
    whatsappMessage: row.whatsapp_message || undefined,
    siteUrl: row.site_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

const restaurantCategoryLabels: Record<RestauranteCategory, FoodPlace["category"]> = {
  restaurante: "Restaurante",
  almoço: "Almoço",
  bar: "Bar",
  café: "Cafeteria",
  lanchonete: "Lanchonete",
};

function deriveRestaurantTags(row: RestauranteRow, category: FoodPlace["category"]) {
  const text = `${row.nome} ${row.descricao} ${row.categoria}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const tags = new Set<string>([category]);

  if (text.includes("pizza")) tags.add("Pizza");
  if (text.includes("hamburg")) tags.add("Hambúrguer");
  if (text.includes("petisc")) tags.add("Petiscos");
  if (text.includes("acai")) tags.add("Açaí");
  if (text.includes("sobremesa") || text.includes("doce")) tags.add("Sobremesas");
  if (text.includes("bar")) tags.add("Bar");
  if (text.includes("delivery")) tags.add("Delivery");
  if (text.includes("almoco")) tags.add("Almoço");

  return Array.from(tags);
}

function mapRestaurante(row: RestauranteRow): FoodPlace {
  const category = restaurantCategoryLabels[row.categoria] || "Restaurante";
  const tags = row.tags?.length ? row.tags : deriveRestaurantTags(row, category);
  const galleryImages = (row.imagens_urls || []).filter(Boolean);
  const specialties = row.especialidades?.length ? row.especialidades : tags;
  const plan = normalizeCommercialPlan(row.plan_type || row.plano);
  const planStatus = getEffectivePlanStatus(row.plan_status, row.plan_expires_at);
  const features = getCommercialFeatures(plan, {
    status: planStatus,
    customFeatures: row.custom_features,
    pageEnabled: row.pagina_ativa ?? true,
    galleryEnabled: galleryImages.length > 0,
    carouselEnabled: galleryImages.length > 1,
    highlighted: row.destaque,
  });
  const photoLimits = getPhotoLimits(plan, row.carousel_photo_limit, row.gallery_photo_limit);
  const publicGalleryImages = features.gallery ? galleryImages.slice(0, photoLimits.gallery) : [];

  return {
    id: row.id,
    slug: row.slug || slugify(row.nome),
    name: row.nome,
    category,
    tags,
    image: row.imagem_url,
    logo: row.logo_url || undefined,
    galleryImages: publicGalleryImages,
    description: row.descricao,
    story: row.descricao_completa || row.descricao,
    hours: row.horario_funcionamento,
    businessHours: row.business_hours || undefined,
    whatsapp: row.whatsapp,
    phone: row.telefone || undefined,
    instagram: row.instagram || "",
    instagramUrl: row.instagram_url || undefined,
    location: row.endereco,
    address: row.endereco,
    locationLabel: row.localizacao_resumida || row.endereco,
    mapUrl: row.mapa_url || undefined,
    menuUrl: row.cardapio_url || undefined,
    priceRange: row.faixa_preco || undefined,
    paymentMethods: row.formas_pagamento || undefined,
    features: row.diferenciais || undefined,
    specialties,
    recommendedDish: row.prato_recomendado || undefined,
    firstVisitTip: row.dica_turista || undefined,
    isFeatured: features.highlighted,
    featuredOrder: row.featured_order ?? undefined,
    plan,
    planStatus,
    customFeatures: row.custom_features || undefined,
    commercialFeatures: features,
    carouselPhotoLimit: photoLimits.carousel,
    galleryPhotoLimit: photoLimits.gallery,
    categoryPriority: row.category_priority ?? undefined,
    pageEnabled: features.individualPage,
    whatsappMessage: row.whatsapp_message || undefined,
    siteUrl: row.site_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

function createSupabasePublicClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  });
}

function sortCommercialItems<T extends {
  plan?: string;
  planStatus?: string;
  featuredOrder?: number;
  categoryPriority?: number;
  updatedAt?: string;
  name: string;
}>(items: T[]) {
  return [...items].sort((first, second) => {
    const priorityDifference = getPlanPriority(second.plan, second.planStatus) - getPlanPriority(first.plan, first.planStatus);
    if (priorityDifference) return priorityDifference;

    const categoryDifference = (second.categoryPriority || 0) - (first.categoryPriority || 0);
    if (categoryDifference) return categoryDifference;

    const orderDifference = (first.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (second.featuredOrder ?? Number.MAX_SAFE_INTEGER);
    if (orderDifference) return orderDifference;

    const updateDifference = new Date(second.updatedAt || 0).getTime() - new Date(first.updatedAt || 0).getTime();
    if (updateDifference) return updateDifference;

    return first.name.localeCompare(second.name, "pt-BR");
  });
}

export async function getPublicAttractions(): Promise<PublicContent<Attraction>> {
  const supabase = createSupabasePublicClient();
  if (!supabase) {
    return { items: fallbackAttractions, error: null, source: "mock" };
  }

  const { data, error } = await supabase
    .from("pontos_turisticos")
    .select(attractionColumns)
    .eq("ativo", true)
    .order("nome")
    .limit(100);

  if (error) {
    logPublicContentError("attractions", error);
    return { items: [], error: "Não foi possível carregar os roteiros.", source: "supabase" };
  }

  return {
    items: (data as PontoTuristicoRow[]).map(mapPontoTuristico),
    error: null,
    source: "supabase",
  };
}

export async function getPublicLodgings(): Promise<PublicContent<Lodging>> {
  const supabase = createSupabasePublicClient();
  if (!supabase) {
    return { items: fallbackLodgings, error: null, source: "mock" };
  }

  const extendedResult = await supabase
    .from("pousadas")
    .select(extendedLodgingColumns)
    .eq("ativo", true)
    .order("nome")
    .limit(100);
  let data = extendedResult.data as PousadaRow[] | null;
  let error = extendedResult.error;

  if (isSchemaCacheError(error)) {
    const legacyFallback = await supabase
      .from("pousadas")
      .select(legacyExtendedLodgingColumns)
      .eq("ativo", true)
      .order("nome")
      .limit(100);

    data = legacyFallback.data as PousadaRow[] | null;
    error = legacyFallback.error;

    if (isSchemaCacheError(error)) {
      const minimalFallback = await supabase
        .from("pousadas")
        .select(lodgingColumns)
        .eq("ativo", true)
        .order("nome")
        .limit(100);
      data = minimalFallback.data as PousadaRow[] | null;
      error = minimalFallback.error;
    }
  }

  if (error) {
    logPublicContentError("lodgings", error);
    return { items: [], error: "Não foi possível carregar as pousadas.", source: "supabase" };
  }

  return {
    items: sortCommercialItems((data as PousadaRow[]).map(mapPousada)),
    error: null,
    source: "supabase",
  };
}

export async function getPublicFoodPlaces(): Promise<PublicContent<FoodPlace>> {
  const supabase = createSupabasePublicClient();
  if (!supabase) {
    return { items: fallbackFoodPlaces, error: null, source: "mock" };
  }

  const extendedResult = await supabase
    .from("restaurantes")
    .select(extendedRestaurantColumns)
    .eq("ativo", true)
    .order("nome")
    .limit(200);
  let data = extendedResult.data as RestauranteRow[] | null;
  let error = extendedResult.error;

  if (isSchemaCacheError(error)) {
    const legacyFallback = await supabase
      .from("restaurantes")
      .select(legacyExtendedRestaurantColumns)
      .eq("ativo", true)
      .order("nome")
      .limit(200);

    data = legacyFallback.data as RestauranteRow[] | null;
    error = legacyFallback.error;

    if (isSchemaCacheError(error)) {
      const minimalFallback = await supabase
        .from("restaurantes")
        .select(restaurantColumns)
        .eq("ativo", true)
        .order("nome")
        .limit(200);
      data = minimalFallback.data as RestauranteRow[] | null;
      error = minimalFallback.error;
    }
  }

  if (error) {
    logPublicContentError("food", error);
    return { items: [], error: "Não foi possível carregar os estabelecimentos.", source: "supabase" };
  }

  return {
    items: sortCommercialItems((data as RestauranteRow[]).map(mapRestaurante)),
    error: null,
    source: "supabase",
  };
}

export async function getPublicLodgingPage(
  slug: string,
): Promise<PublicContent<Lodging> & { item: Lodging | null; related: Lodging[] }> {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    const item = fallbackLodgings.find(
      (lodging) =>
        (lodging.slug || slugify(lodging.name)) === slug &&
        getCommercialFeatures(lodging.plan, {
          status: lodging.planStatus,
          customFeatures: lodging.customFeatures,
          pageEnabled: lodging.pageEnabled,
        }).individualPage,
    ) || null;

    return {
      items: fallbackLodgings,
      item,
      related: item
        ? fallbackLodgings
            .filter((lodging) => (lodging.slug || slugify(lodging.name)) !== slug)
            .sort((first, second) => Number(Boolean(second.isFeatured)) - Number(Boolean(first.isFeatured)))
            .slice(0, 3)
        : [],
      error: null,
      source: "mock",
    };
  }

  const itemResult = await supabase
    .from("pousadas")
    .select(extendedLodgingColumns)
    .eq("ativo", true)
    .eq("slug", slug)
    .maybeSingle();

  if (isSchemaCacheError(itemResult.error)) {
    const { items, error, source } = await getPublicLodgings();
    const item = items.find(
      (lodging) =>
        (lodging.slug || slugify(lodging.name)) === slug &&
        getCommercialFeatures(lodging.plan, {
          status: lodging.planStatus,
          customFeatures: lodging.customFeatures,
          pageEnabled: lodging.pageEnabled,
        }).individualPage,
    ) || null;

    return {
      items,
      item,
      related: item
        ? items
            .filter((lodging) => (lodging.slug || slugify(lodging.name)) !== slug)
            .sort((first, second) => Number(Boolean(second.isFeatured)) - Number(Boolean(first.isFeatured)))
            .slice(0, 3)
        : [],
      error,
      source,
    };
  }

  if (itemResult.error) {
    logPublicContentError("lodging-page", itemResult.error);
    return { items: [], item: null, related: [], error: "Não foi possível carregar a pousada.", source: "supabase" };
  }

  if (!itemResult.data) {
    return { items: [], item: null, related: [], error: null, source: "supabase" };
  }

  const item = mapPousada(itemResult.data as PousadaRow);
  if (!getCommercialFeatures(item.plan, {
    status: item.planStatus,
    customFeatures: item.customFeatures,
    pageEnabled: item.pageEnabled,
  }).individualPage) {
    return { items: [], item: null, related: [], error: null, source: "supabase" };
  }
  const relatedResult = await supabase
    .from("pousadas")
    .select(extendedLodgingColumns)
    .eq("ativo", true)
    .neq("id", item.id)
    .order("destaque", { ascending: false })
    .order("nome")
    .limit(3);

  const related = relatedResult.error
    ? []
    : ((relatedResult.data || []) as PousadaRow[]).map(mapPousada);

  if (relatedResult.error) {
    logPublicContentError("lodging-related", relatedResult.error);
  }

  return {
    items: [item, ...related],
    item,
    related,
    error: null,
    source: "supabase",
  };
}

export async function getPublicRestaurantPage(slug: string): Promise<
  PublicContent<FoodPlace> & {
    item: FoodPlace | null;
    related: FoodPlace[];
  }
> {
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    const item = fallbackFoodPlaces.find(
      (place) =>
        (place.slug || slugify(place.name)) === slug &&
        getCommercialFeatures(place.plan, {
          status: place.planStatus,
          customFeatures: place.customFeatures,
          pageEnabled: place.pageEnabled,
        }).individualPage,
    ) || null;
    const related = item
      ? fallbackFoodPlaces
          .filter((place) => (place.slug || slugify(place.name)) !== slug)
          .filter((place) => place.category === item.category || place.tags.some((tag) => item.tags.includes(tag)))
          .slice(0, 3)
      : [];

    return {
      items: fallbackFoodPlaces,
      item,
      related,
      error: null,
      source: "mock",
    };
  }

  const itemResult = await supabase
    .from("restaurantes")
    .select(extendedRestaurantColumns)
    .eq("ativo", true)
    .eq("slug", slug)
    .maybeSingle();

  if (isSchemaCacheError(itemResult.error)) {
    const { items, error, source } = await getPublicFoodPlaces();
    const item = items.find(
      (place) =>
        (place.slug || slugify(place.name)) === slug &&
        getCommercialFeatures(place.plan, {
          status: place.planStatus,
          customFeatures: place.customFeatures,
          pageEnabled: place.pageEnabled,
        }).individualPage,
    ) || null;
    const related = item
      ? items
          .filter((place) => (place.slug || slugify(place.name)) !== slug)
          .filter((place) => place.category === item.category || place.tags.some((tag) => item.tags.includes(tag)))
          .slice(0, 3)
      : [];

    return {
      items,
      item,
      related,
      error,
      source,
    };
  }

  if (itemResult.error) {
    logPublicContentError("restaurant-page", itemResult.error);
    return {
      items: [],
      item: null,
      related: [],
      error: "Não foi possível carregar o restaurante.",
      source: "supabase",
    };
  }

  if (!itemResult.data) {
    return { items: [], item: null, related: [], error: null, source: "supabase" };
  }

  const row = itemResult.data as RestauranteRow;
  const item = mapRestaurante(row);
  if (!getCommercialFeatures(item.plan, {
    status: item.planStatus,
    customFeatures: item.customFeatures,
    pageEnabled: item.pageEnabled,
  }).individualPage) {
    return { items: [], item: null, related: [], error: null, source: "supabase" };
  }
  const relatedResult = await supabase
    .from("restaurantes")
    .select(extendedRestaurantColumns)
    .eq("ativo", true)
    .eq("categoria", row.categoria)
    .neq("id", row.id)
    .order("destaque", { ascending: false })
    .order("nome")
    .limit(3);

  const related = relatedResult.error
    ? []
    : ((relatedResult.data || []) as RestauranteRow[]).map(mapRestaurante);

  if (relatedResult.error) {
    logPublicContentError("restaurant-related", relatedResult.error);
  }

  return {
    items: [item, ...related],
    item,
    related,
    error: null,
    source: "supabase",
  };
}
