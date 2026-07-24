export type ServiceCategoryDefinition = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  accent: string;
  sortOrder: number;
  isActive: boolean;
  listingType?: "public_service" | "commercial" | "mixed";
  parentId?: string | null;
  parentSlug?: string | null;
};

type CatalogCategory = Omit<ServiceCategoryDefinition, "parentId" | "parentSlug"> & {
  subcategories: string[];
};

export const cityServiceCatalog: CatalogCategory[] = [
  {
    name: "Saúde e bem-estar",
    slug: "saude",
    description: "Atendimento de saúde, cuidados pessoais e bem-estar.",
    icon: "heart-pulse",
    accent: "green",
    sortOrder: 10,
    isActive: true,
    listingType: "mixed",
    subcategories: [
      "Hospital e maternidade",
      "UBS e postos de saúde",
      "Farmácias",
      "Clínicas",
      "Dentistas",
      "Laboratórios",
      "Fisioterapia",
      "Academias",
      "Nutricionistas",
      "Veterinárias",
      "Pet shops",
      "Salões de beleza",
      "Barbearias",
    ],
  },
  {
    name: "Segurança e serviços públicos",
    slug: "servicos-publicos",
    description: "Segurança, órgãos municipais e serviços de atendimento público.",
    icon: "shield",
    accent: "blue",
    sortOrder: 20,
    isActive: true,
    listingType: "public_service",
    subcategories: [
      "Delegacia",
      "Polícia Militar",
      "Prefeitura",
      "Secretarias municipais",
      "Conselho Tutelar",
      "Cartórios",
      "Correios",
      "Serviços de emergência",
      "Órgãos públicos",
    ],
  },
  {
    name: "Mercados e compras",
    slug: "compras",
    description: "Compras do dia a dia, vestuário e comércio local.",
    icon: "shopping-basket",
    accent: "amber",
    sortOrder: 30,
    isActive: true,
    listingType: "commercial",
    subcategories: [
      "Supermercados",
      "Mercadinhos",
      "Padarias",
      "Lojas de roupas",
      "Calçados",
      "Móveis e eletrodomésticos",
      "Perfumarias e cosméticos",
      "Óticas",
      "Eletrônicos",
      "Papelarias",
      "Lojas de variedades",
    ],
  },
  {
    name: "Casa e construção",
    slug: "casa-construcao",
    description: "Materiais, manutenção e profissionais para casa e construção.",
    icon: "hammer",
    accent: "terracotta",
    sortOrder: 40,
    isActive: true,
    listingType: "commercial",
    subcategories: [
      "Materiais de construção",
      "Materiais elétricos",
      "Materiais hidráulicos",
      "Madeireiras",
      "Serralherias",
      "Vidraçarias",
      "Móveis e decoração",
      "Pintores",
      "Eletricistas",
      "Encanadores",
      "Pedreiros",
      "Outros prestadores da construção",
    ],
  },
  {
    name: "Automotivo e mobilidade",
    slug: "automotivo",
    description: "Abastecimento, manutenção de veículos e transporte local.",
    icon: "car",
    accent: "teal",
    sortOrder: 50,
    isActive: true,
    listingType: "commercial",
    subcategories: [
      "Postos de combustível",
      "Oficinas de carros",
      "Oficinas de motos",
      "Autopeças",
      "Borracharias",
      "Autoelétricas",
      "Lava-jatos",
      "Guinchos",
      "Táxis",
      "Mototáxis",
      "Transportes e fretamentos",
    ],
  },
  {
    name: "Financeiro e conveniência",
    slug: "financeiro",
    description: "Bancos, pagamentos e serviços rápidos de apoio.",
    icon: "landmark",
    accent: "olive",
    sortOrder: 60,
    isActive: true,
    listingType: "commercial",
    subcategories: [
      "Bancos",
      "Lotéricas",
      "Caixas eletrônicos",
      "Correspondentes bancários",
      "Contabilidade",
      "Seguros",
      "Serviços financeiros",
      "Gráficas",
      "Copiadoras",
    ],
  },
  {
    name: "Serviços profissionais e educação",
    slug: "servicos-profissionais",
    description: "Educação, assistência técnica e profissionais autônomos.",
    icon: "briefcase-business",
    accent: "wine",
    sortOrder: 70,
    isActive: true,
    listingType: "commercial",
    subcategories: [
      "Escolas",
      "Creches",
      "Cursos",
      "Informática",
      "Assistência técnica",
      "Fotografia",
      "Advocacia",
      "Contabilidade",
      "Engenharia",
      "Arquitetura",
      "Marketing",
      "Comunicação",
      "Serviços gerais",
      "Prestadores autônomos",
    ],
  },
];

export function slugifyServiceCategory(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const fallbackServiceCategories: ServiceCategoryDefinition[] =
  cityServiceCatalog.flatMap((category) => [
    {
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      accent: category.accent,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      listingType: category.listingType,
      parentId: null,
      parentSlug: null,
    },
    ...category.subcategories.map((name, index) => ({
      name,
      slug: slugifyServiceCategory(name),
      description: "",
      icon: category.icon,
      accent: category.accent,
      sortOrder: category.sortOrder * 100 + index,
      isActive: true,
      listingType: category.listingType,
      parentSlug: category.slug,
      parentId: null,
    })),
  ]);

export function getFallbackServiceCategory(slug: string) {
  return fallbackServiceCategories.find((category) => category.slug === slug);
}

export function findCategoryForLegacyValue(value: string) {
  const normalized = slugifyServiceCategory(value);
  const direct = cityServiceCatalog.find((category) => category.slug === normalized);
  if (direct) return direct;

  if (["seguranca", "emergencia"].includes(normalized)) return cityServiceCatalog[1];
  if (["comercio-essencial"].includes(normalized)) return cityServiceCatalog[2];
  if (["transporte-apoio"].includes(normalized)) return cityServiceCatalog[4];

  return {
    id: normalized || cityServiceCatalog[0].id,
    name: value || cityServiceCatalog[0].name,
    slug: normalized || cityServiceCatalog[0].slug,
    description: "",
    icon: "building-2",
    accent: "green",
    sortOrder: 999,
    isActive: true,
    listingType: "mixed",
    parentId: null,
    parentSlug: null,
  } satisfies ServiceCategoryDefinition;
}
