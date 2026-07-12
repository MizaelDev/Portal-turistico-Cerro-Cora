import type { BusinessHours } from "@/lib/business-hours";
import type {
  CommercialPlan,
  CustomCommercialFeatures,
  LegacyCommercialPlan,
  ListingType,
  PlanStatus,
} from "@/lib/commercial";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export type PontoTuristicoCategory =
  | "mirante"
  | "natureza"
  | "geoturismo"
  | "ecoturismo"
  | "trilha"
  | "aventura";

export type RestauranteCategory = "restaurante" | "almoço" | "bar" | "café" | "lanchonete";
export type CityServiceCategory = string;

export type PontoTuristicoRow = {
  id: string;
  nome: string;
  descricao: string;
  categoria: PontoTuristicoCategory;
  localizacao: string;
  imagem_url: string;
  imagens_urls?: string[] | null;
  ativo: boolean;
  created_at: string;
};

export type PousadaRow = {
  id: string;
  nome: string;
  slug?: string | null;
  descricao: string;
  historia?: string | null;
  categoria?: string | null;
  localizacao: string;
  endereco?: string | null;
  mapa_url?: string | null;
  distancia_centro: string | null;
  faixa_preco_min: number | null;
  faixa_preco_max: number | null;
  whatsapp: string;
  telefone?: string | null;
  instagram?: string | null;
  instagram_url?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  imagens_urls: string[] | null;
  check_in?: string | null;
  check_out?: string | null;
  business_hours?: BusinessHours | null;
  capacidade?: string | null;
  tipos_acomodacao?: string[] | null;
  formas_pagamento?: string[] | null;
  comodidades?: string[] | null;
  diferenciais?: string[] | null;
  diferencial_principal?: string | null;
  aceita_reservas?: boolean | null;
  destaque?: boolean | null;
  plano?: CommercialPlan | LegacyCommercialPlan | null;
  plan_type?: CommercialPlan | null;
  plan_status?: PlanStatus | null;
  plan_started_at?: string | null;
  plan_expires_at?: string | null;
  custom_features?: CustomCommercialFeatures | null;
  carousel_photo_limit?: number | null;
  gallery_photo_limit?: number | null;
  featured_order?: number | null;
  category_priority?: number | null;
  professional_photography_included?: boolean | null;
  photography_completed_at?: string | null;
  social_media_promotion_included?: boolean | null;
  social_media_publication_url?: string | null;
  advanced_report_enabled?: boolean | null;
  priority_support_enabled?: boolean | null;
  seasonal_campaign_enabled?: boolean | null;
  establishment_story_enabled?: boolean | null;
  commercial_notes?: string | null;
  plan_change_reason?: string | null;
  whatsapp_message?: string | null;
  site_url?: string | null;
  pagina_ativa?: boolean | null;
  ativo: boolean;
  created_at: string;
  updated_at?: string | null;
};

export type RestauranteRow = {
  id: string;
  nome: string;
  slug?: string | null;
  descricao: string;
  descricao_completa?: string | null;
  categoria: RestauranteCategory;
  horario_funcionamento: string;
  business_hours?: BusinessHours | null;
  endereco: string;
  localizacao_resumida?: string | null;
  mapa_url: string | null;
  instagram: string | null;
  instagram_url: string | null;
  whatsapp: string;
  telefone?: string | null;
  imagem_url: string;
  logo_url?: string | null;
  imagens_urls?: string[] | null;
  tags: string[] | null;
  formas_pagamento?: string[] | null;
  diferenciais?: string[] | null;
  especialidades?: string[] | null;
  prato_recomendado?: string | null;
  dica_turista?: string | null;
  cardapio_url?: string | null;
  faixa_preco?: "R$" | "R$$" | "R$$$" | null;
  destaque?: boolean | null;
  plano?: CommercialPlan | LegacyCommercialPlan | null;
  plan_type?: CommercialPlan | null;
  plan_status?: PlanStatus | null;
  plan_started_at?: string | null;
  plan_expires_at?: string | null;
  custom_features?: CustomCommercialFeatures | null;
  carousel_photo_limit?: number | null;
  gallery_photo_limit?: number | null;
  featured_order?: number | null;
  category_priority?: number | null;
  professional_photography_included?: boolean | null;
  photography_completed_at?: string | null;
  social_media_promotion_included?: boolean | null;
  social_media_publication_url?: string | null;
  advanced_report_enabled?: boolean | null;
  priority_support_enabled?: boolean | null;
  seasonal_campaign_enabled?: boolean | null;
  establishment_story_enabled?: boolean | null;
  commercial_notes?: string | null;
  plan_change_reason?: string | null;
  whatsapp_message?: string | null;
  site_url?: string | null;
  pagina_ativa?: boolean | null;
  ativo: boolean;
  created_at: string;
  updated_at?: string | null;
};

export type CityServiceRow = {
  id: string;
  name: string;
  slug: string;
  category: CityServiceCategory;
  subcategory: string;
  description: string | null;
  address: string | null;
  neighborhood: string | null;
  phone: string | null;
  whatsapp: string | null;
  google_maps_url: string | null;
  opening_hours: string | null;
  business_hours?: BusinessHours | null;
  instagram?: string | null;
  instagram_url?: string | null;
  site_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  logo_url?: string | null;
  plan?: CommercialPlan | LegacyCommercialPlan | null;
  listing_type?: ListingType | null;
  plan_type?: CommercialPlan | null;
  plan_status?: PlanStatus | null;
  plan_started_at?: string | null;
  plan_expires_at?: string | null;
  custom_features?: CustomCommercialFeatures | null;
  carousel_photo_limit?: number | null;
  gallery_photo_limit?: number | null;
  featured_order?: number | null;
  category_priority?: number | null;
  professional_photography_included?: boolean | null;
  photography_completed_at?: string | null;
  social_media_promotion_included?: boolean | null;
  social_media_publication_url?: string | null;
  advanced_report_enabled?: boolean | null;
  priority_support_enabled?: boolean | null;
  seasonal_campaign_enabled?: boolean | null;
  establishment_story_enabled?: boolean | null;
  commercial_notes?: string | null;
  plan_change_reason?: string | null;
  tags?: string[] | null;
  enabled_buttons?: string[] | null;
  important_message?: string | null;
  is_24h?: boolean | null;
  whatsapp_message?: string | null;
  is_emergency: boolean;
  is_featured: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type AdminEntity = "pontos_turisticos" | "pousadas" | "restaurantes" | "city_services";

export type AdminData = {
  pontos_turisticos: PontoTuristicoRow[];
  pousadas: PousadaRow[];
  restaurantes: RestauranteRow[];
  city_services: CityServiceRow[];
};
