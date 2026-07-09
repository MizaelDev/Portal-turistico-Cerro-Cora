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
  capacidade?: string | null;
  tipos_acomodacao?: string[] | null;
  formas_pagamento?: string[] | null;
  comodidades?: string[] | null;
  diferenciais?: string[] | null;
  diferencial_principal?: string | null;
  aceita_reservas?: boolean | null;
  destaque?: boolean | null;
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
  ativo: boolean;
  created_at: string;
  updated_at?: string | null;
};

export type AdminEntity = "pontos_turisticos" | "pousadas" | "restaurantes";

export type AdminData = {
  pontos_turisticos: PontoTuristicoRow[];
  pousadas: PousadaRow[];
  restaurantes: RestauranteRow[];
};
