export type CityServiceCategory =
  | "saude"
  | "seguranca"
  | "transporte_apoio"
  | "comercio_essencial"
  | "emergencia";

export type CityService = {
  id: string;
  name: string;
  slug: string;
  category: CityServiceCategory;
  subcategory: string;
  description: string;
  address: string;
  neighborhood: string;
  phone?: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  openingHours?: string;
  isEmergency: boolean;
  isFeatured: boolean;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const cityServiceCategories: Array<{
  value: CityServiceCategory;
  label: string;
  description: string;
}> = [
  {
    value: "saude",
    label: "Saúde",
    description: "Hospital, UBS, postos de saúde e farmácias.",
  },
  {
    value: "seguranca",
    label: "Segurança",
    description: "Delegacia, Polícia Militar e apoio público.",
  },
  {
    value: "transporte_apoio",
    label: "Transporte e apoio",
    description: "Postos de combustível, oficinas, borracharias, táxi e mototáxi.",
  },
  {
    value: "comercio_essencial",
    label: "Comércio essencial",
    description: "Mercados, bancos, lotéricas e caixas eletrônicos.",
  },
  {
    value: "emergencia",
    label: "Emergência",
    description: "SAMU, Polícia, Bombeiros e contatos importantes.",
  },
];

export const cityServices: CityService[] = [
  {
    id: "hospital-maternidade-cerro-cora",
    name: "Hospital/Maternidade de Cerro Corá",
    slug: "hospital-maternidade-cerro-cora",
    category: "saude",
    subcategory: "Hospital",
    description: "Atendimento de saúde para moradores e visitantes.",
    address: "Informação a confirmar",
    neighborhood: "",
    openingHours: "Atendimento conforme funcionamento da unidade.",
    isEmergency: false,
    isFeatured: true,
    isActive: true,
    notes: "Em caso de emergência, confirme o atendimento pelo telefone informado.",
  },
  {
    id: "delegacia-policia-cerro-cora",
    name: "Delegacia de Polícia de Cerro Corá",
    slug: "delegacia-policia-cerro-cora",
    category: "seguranca",
    subcategory: "Delegacia",
    description: "Atendimento policial e registro de ocorrências.",
    address: "Informação a confirmar",
    neighborhood: "",
    openingHours: "Atendimento conforme funcionamento da unidade.",
    isEmergency: false,
    isFeatured: true,
    isActive: true,
    notes: "Para emergências policiais, acione os canais oficiais de segurança pública.",
  },
];

export const cityServiceAdminFields = [
  "name",
  "slug",
  "category",
  "subcategory",
  "description",
  "address",
  "neighborhood",
  "phone",
  "whatsapp",
  "googleMapsUrl",
  "openingHours",
  "isEmergency",
  "isFeatured",
  "isActive",
  "notes",
] as const;

export function getActiveCityServices() {
  return cityServices.filter((service) => service.isActive);
}

export function getCityServiceCategoryLabel(category: CityServiceCategory) {
  return cityServiceCategories.find((item) => item.value === category)?.label || "Serviço";
}
