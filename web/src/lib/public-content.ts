import { createClient } from "@supabase/supabase-js";
import {
  attractions as fallbackAttractions,
  foodPlaces as fallbackFoodPlaces,
  lodgings as fallbackLodgings,
  type Attraction,
  type FoodPlace,
  type Lodging,
} from "@/lib/data";
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
const restaurantColumns =
  "id,nome,descricao,categoria,horario_funcionamento,endereco,mapa_url,instagram,instagram_url,whatsapp,imagem_url,tags,ativo,created_at";

function logPublicContentError(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[public-content:${scope}]`, error);
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  const images = row.imagens_urls.filter(Boolean);
  const location = row.distancia_centro
    ? `${row.localizacao} - ${row.distancia_centro}`
    : row.localizacao;

  return {
    name: row.nome,
    image: images[0] || "/images/cerro-cora.jpg",
    gallery: images.slice(1, 4),
    description: row.descricao,
    whatsapp: row.whatsapp,
    location,
    priceRange: formatPriceRange(row.faixa_preco_min, row.faixa_preco_max),
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

  return {
    name: row.nome,
    category,
    tags,
    image: row.imagem_url,
    description: row.descricao,
    hours: row.horario_funcionamento,
    whatsapp: row.whatsapp,
    instagram: row.instagram || "@instagram",
    instagramUrl: row.instagram_url || undefined,
    location: row.endereco,
    mapUrl: row.mapa_url || undefined,
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
    .order("nome");

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

  const { data, error } = await supabase
    .from("pousadas")
    .select(lodgingColumns)
    .eq("ativo", true)
    .order("nome");

  if (error) {
    logPublicContentError("lodgings", error);
    return { items: [], error: "Não foi possível carregar as pousadas.", source: "supabase" };
  }

  return {
    items: (data as PousadaRow[]).map(mapPousada),
    error: null,
    source: "supabase",
  };
}

export async function getPublicFoodPlaces(): Promise<PublicContent<FoodPlace>> {
  const supabase = createSupabasePublicClient();
  if (!supabase) {
    return { items: fallbackFoodPlaces, error: null, source: "mock" };
  }

  const { data, error } = await supabase
    .from("restaurantes")
    .select(restaurantColumns)
    .eq("ativo", true)
    .order("nome");

  if (error) {
    logPublicContentError("food", error);
    return { items: [], error: "Não foi possível carregar os estabelecimentos.", source: "supabase" };
  }

  return {
    items: (data as RestauranteRow[]).map(mapRestaurante),
    error: null,
    source: "supabase",
  };
}
