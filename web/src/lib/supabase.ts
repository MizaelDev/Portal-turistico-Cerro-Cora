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

export type RestauranteCategory = "restaurante" | "bar" | "café" | "lanchonete";

export type PontoTuristicoRow = {
  id: string;
  nome: string;
  descricao: string;
  categoria: PontoTuristicoCategory;
  localizacao: string;
  imagem_url: string;
  ativo: boolean;
  created_at: string;
};

export type PousadaRow = {
  id: string;
  nome: string;
  descricao: string;
  localizacao: string;
  distancia_centro: string | null;
  faixa_preco_min: number | null;
  faixa_preco_max: number | null;
  whatsapp: string;
  imagens_urls: string[];
  ativo: boolean;
  created_at: string;
};

export type RestauranteRow = {
  id: string;
  nome: string;
  descricao: string;
  categoria: RestauranteCategory;
  horario_funcionamento: string;
  endereco: string;
  mapa_url: string | null;
  instagram: string | null;
  instagram_url: string | null;
  whatsapp: string;
  imagem_url: string;
  tags: string[] | null;
  ativo: boolean;
  created_at: string;
};

export type AdminEntity = "pontos_turisticos" | "pousadas" | "restaurantes";

export type AdminData = {
  pontos_turisticos: PontoTuristicoRow[];
  pousadas: PousadaRow[];
  restaurantes: RestauranteRow[];
};
