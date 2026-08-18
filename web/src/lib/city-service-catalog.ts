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
    description: "Saúde, cuidados pessoais e bem-estar.",
    icon: "heart-pulse",
    accent: "green",
    sortOrder: 10,
    isActive: true,
    listingType: "mixed",
    subcategories: ["Hospital", "UBS", "Farmácia", "Clínica", "Academia", "Veterinária", "Salão e barbearia"],
  },
  {
    name: "Segurança e serviços públicos",
    slug: "servicos-publicos",
    description: "Segurança, órgãos municipais e atendimento público.",
    icon: "shield",
    accent: "blue",
    sortOrder: 20,
    isActive: true,
    listingType: "public_service",
    subcategories: ["Delegacia", "Polícia Militar", "Prefeitura", "Secretaria", "Cartório", "Correios", "Conselho Tutelar"],
  },
  {
    name: "Comércio e conveniência",
    slug: "compras",
    description: "Compras do dia a dia e comércio local.",
    icon: "shopping-basket",
    accent: "amber",
    sortOrder: 30,
    isActive: true,
    listingType: "commercial",
    subcategories: ["Mercado", "Supermercado", "Padaria", "Produtos artesanais", "Loja de roupas", "Calçados", "Papelaria", "Loja de variedades", "Ótica", "Móveis e eletrodomésticos"],
  },
  {
    name: "Casa e construção",
    slug: "casa-construcao",
    description: "Materiais, manutenção e profissionais da construção.",
    icon: "hammer",
    accent: "terracotta",
    sortOrder: 40,
    isActive: true,
    listingType: "commercial",
    subcategories: ["Material de construção", "Material elétrico", "Material hidráulico", "Serralheria", "Vidraçaria", "Eletricista", "Encanador", "Pedreiro"],
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
    subcategories: ["Posto de combustível", "Oficina de carros", "Oficina de motos", "Autopeças", "Borracharia", "Lava-jato", "Táxi", "Mototáxi"],
  },
  {
    name: "Financeiro e serviços",
    slug: "financeiro",
    description: "Bancos, pagamentos e serviços de apoio.",
    icon: "landmark",
    accent: "olive",
    sortOrder: 60,
    isActive: true,
    listingType: "commercial",
    subcategories: ["Banco", "Lotérica", "Correspondente bancário", "Contabilidade", "Seguro", "Informática", "Assistência técnica", "Gráfica"],
  },
  {
    name: "Educação e profissionais",
    slug: "servicos-profissionais",
    description: "Educação e profissionais que atendem na cidade.",
    icon: "briefcase-business",
    accent: "wine",
    sortOrder: 70,
    isActive: true,
    listingType: "commercial",
    subcategories: ["Escola", "Creche", "Curso", "Advocacia", "Engenharia", "Arquitetura", "Fotografia", "Marketing", "Prestador autônomo"],
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
  if (["comercio-essencial", "mercados-e-compras"].includes(normalized)) return cityServiceCatalog[2];
  if (["transporte-apoio"].includes(normalized)) return cityServiceCatalog[4];
  if (["financeiro-e-conveniencia"].includes(normalized)) return cityServiceCatalog[5];
  if (["servicos-profissionais-e-educacao"].includes(normalized)) return cityServiceCatalog[6];

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