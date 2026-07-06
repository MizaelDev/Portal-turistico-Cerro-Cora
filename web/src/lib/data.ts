import {
  CalendarDays,
  Coffee,
  Compass,
  Hotel,
  MapPin,
  Mountain,
  Music,
  ScrollText,
  ThermometerSun,
  Utensils,
} from "lucide-react";

export type Attraction = {
  slug: string;
  name: string;
  image: string;
  gallery?: string[];
  description: string;
  location: string;
  mapUrl?: string;
  infoUrl?: string;
  category: string;
};

export type FoodPlace = {
  name: string;
  category: "Restaurante" | "Almoço" | "Hamburgueria" | "Cafeteria" | "Bar" | "Lanchonete";
  tags: string[];
  image: string;
  description: string;
  hours: string;
  whatsapp: string;
  instagram: string;
  instagramUrl?: string;
  location: string;
  mapUrl?: string;
};

export type Lodging = {
  name: string;
  image: string;
  gallery: string[];
  description: string;
  whatsapp: string;
  location: string;
  mapUrl?: string;
  priceRange: string;
  priceDisclaimer?: string;
  
};

export type HistoryMilestone = {
  year: string;
  title: string;
  description: string;
};

export type ClimateMonth = {
  month: string;
  high: number;
  average: number;
  low: number;
  rain: number;
};

export type FestivalArtistRole = "principal" | "regional" | "convidado";

export type FestivalArtistSlot = {
  name: string;
  role: FestivalArtistRole;
  time?: string;
};

export type FestivalScheduleItem = {
  day: string;
  date: string;
  subtitle: string;
  title: string;
  highlight: string;
  artists: FestivalArtistSlot[];
};

export type TourGuide = {
  name: string;
  whatsapp: string;
  description: string;
};

export const navItems = [
  { href: "/", label: "Home" },
  { href: "/sobre-a-cidade", label: "Sobre" },
  { href: "/o-que-fazer", label: "Roteiros" },
  { href: "/festival-de-inverno", label: "Festival" },
  { href: "/gastronomia", label: "Gastronomia" },
  { href: "/pousadas", label: "Pousadas" },
  //{ href: "/admin", label: "Admin" },
];

export const heroImage =
  "/images/cerro-cora.jpg";

export const attractions: Attraction[] = [
  {
    slug: "mirante-do-cruzeiro",
    name: "Mirante do Cruzeiro",
    image:
      "/images/cruzeiro-img.png",
    description:
      "Vista panorâmica para o relevo serrano, ideal para contemplar o pôr do sol e registrar a cidade do alto.",
    location: "Área urbana de Cerro Corá",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Mirante%20do%20Cruzeiro%20Area%20urbana%20de%20Cerro%20Cor%C3%A1%20Cerro%20Cora%20RN",
    infoUrl: "https://www.google.com/search?q=Mirante+do+Cruzeiro+Cerro+Cor%C3%A1+RN",
    category: "Mirante",
  },
  {
    slug: "nascente-do-rio-potengi",
    name: "Nascente do Rio Potengi",
    image:
      "/images/nascente.jpg",
    description:
      "Experiência de natureza e educação ambiental no ponto de origem de um dos rios mais importantes do RN.",
    location: "Zona rural de Cerro Corá",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nascente%20do%20Rio%20Potengi%20Zona%20rural%20de%20Cerro%20Cor%C3%A1%20Cerro%20Cora%20RN",
    infoUrl: "https://pt.wikipedia.org/wiki/Rio_Potengi",
    category: "Natureza",
  },
  {
    slug: "vale-vulcanico",
    name: "Vale Vulcanico",
    image:
      "/images/vale-vulcanico.jpg",
    description:
      "Formações rochosas, trilhas e paisagens dramáticas que revelam a personalidade geológica da serra.",
    location: "Região serrana",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Vale%20Vulcanico%20Regi%C3%A3o%20serrana%20Cerro%20Cora%20RN",
    infoUrl: "https://www.google.com/search?q=Vale+Vulcanico+Cerro+Cora+RN",
    category: "Geoturismo",
  },
  {
    slug: "escorrego",
    name: "Escorrego",
    image:
      "/images/escorrego.jpg",
    description:
      "Trilhas em meio à natureza serrana com formações rochosas, paisagens marcantes e pontos ideais para aventura e contemplação.",
    location: "Trilha dentro da cidade",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Escorrego%20%C3%81rea%20de%20mata%20dentro%20da%20cidade%20Cerro%20Cora%20RN",
    infoUrl: "https://www.google.com/search?q=Escorrego+Cerro+Cora+RN",
    category: "Ecoturismo",
  },
  {
    slug: "tanques-naturais",
    name: "Tanques Naturais",
    image:
      "/images/tanques-naturais.jpg",
    description:
      "Piscinas naturais formadas em rochas, perfeitas para visita contemplativa em períodos de chuva.",
    location: "Comunidades rurais",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Tanques%20Naturais%20Comunidades%20rurais%20Cerro%20Cora%20RN",
    infoUrl: "https://www.google.com/search?q=Tanques+Naturais+Cerro+Cora+RN",
    category: "Aventura",
  },
  {
    slug: "serra-verde",
    name: "Serra Verde",
    image:
      "/images/serra-verde.jpg",
    description:
      "Caminhos de altitude, neblina pela manhã e paisagens abertas para respirar o clima frio do Seridó.",
    location: "Serra de Cerro Corá",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Serra%20Verde%20Serra%20de%20Cerro%20Cora%20Cerro%20Cora%20RN",
    infoUrl: "https://www.google.com/search?q=Serra+Verde+Cerro+Cora+RN",
    category: "Trilha",
  },
  {
    slug: "pinturas-rupestres",
    name: "Pinturas Rupestres",
    image:
      "/images/pinturas.jpg",
    description:
      "Patrimônio arqueologico com registros visuais antigos, indicado para visitas guiadas e educativas.",
    location: "Sítios arqueológicos da região",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Pinturas%20Rupestres%20Sítios%20arqueológicos%20da%20regi%C3%A3o%20Cerro%20Cora%20RN",
    infoUrl: "https://pt.wikipedia.org/wiki/Arte_rupestre",
    category: "Cultura",
  },
  {
    slug: "Casa-grande",
    name: "Casa Grande / Casarão Centenário",
    image:
      "/images/casa-grande.jpg",
    description:
      "Construção histórica que preserva a arquitetura e a memória cultural de Cerro Corá, sendo um marco tradicional da cidade.",
    location: "Centro da cidade",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Casa%20Grande%20/%20Casar%C3%A3o%20Centen%C3%A1rio%20Centro%20da%20cidade%20Cerro%20Cora%20RN",
    infoUrl: "https://www.google.com/search?q=Casa+Grande+Casar%C3%A3o+Centen%C3%A1rio+Cerro+Cora+RN",
    category: "História",
  },
];

export const foodPlaces: FoodPlace[] = [
  {
    name: "Açai Bistrô",
    category: "Restaurante",
    tags: ["Açai", "Sobremesas", "Jantar", "Petiscos"],
    image:
      "/images/logo-bistro.jpeg",
    description: "Cozinha regional autoral, massas e pratos quentes para noites frias.",
    hours: "Ter. a sáb.: 18h às 23h | Dom.: 15h às 22h",
    whatsapp: "5584999991001",
    instagram: "@acaibistrocc",
    instagramUrl: "https://www.instagram.com/acaibistrocc/",
    location: "Centro",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=A%C3%A7ai%20Bistr%C3%B4%20Centro%20Cerro%20Cora%20RN",
  },
  {
    name: "Suiça da Serra",
    category: "Restaurante",
    tags: ["Hambúrguer", "Sobremesas", "Jantar", "Pratos completos","Pizza","Delivery"],
    image:
      "/banners/suica.jpg",
    description: "Pratos completos, hambúrgueres, sobremesas e pizza",
    hours: "Ter. a dom.: 18h às 22h",
    whatsapp: "5584999991002",
    instagram: "@restaurantesuicadaserra",
    instagramUrl: "https://www.instagram.com/restaurantesuicadaserra/",
    location: "Avenida principal",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Sui%C3%A7a%20da%20Serra%20Avenida%20principal%20Cerro%20Cora%20RN",
  },
  {
    name: "Mirante bar e petiscaria",
    category: "Restaurante",
    tags: ["Petiscos", "Almoço", "Bar", "Vista"],
    image:
      "/banners/mirante.jpg",
    description: "Pratos completos, hambúrgueres, sobremesas.",
    hours: "Sab, Dom e feriados - 11h às 17h",
    whatsapp: "5584999991002",
    instagram: "@mirante_pousadaerestaurante",
    instagramUrl: "https://www.instagram.com/mirante_pousadaerestaurante/",
    location: "Área Rural",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Mirante%20bar%20e%20petiscaria%20Area%20Rural%20Cerro%20Cora%20RN",
  },
  {
    name: "Nordestino Bar e petiscaria",
    category: "Restaurante",
    tags: ["Petiscos", "Bar", "Jantar", "Pratos regionais"],
    image:
      "/banners/nordestino.jpg",
    description: "Pratos completos, petiscos e bebidas.",
    hours: "Seg. a dom.: 17h às 22h",
    whatsapp: "5584999991002",
    instagram: "@nordestinobarepetiscarias",
    instagramUrl: "https://www.instagram.com/nordestinobarepetiscarias/",
    location: "Avenida principal",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nordestino%20Bar%20e%20petiscaria%20Avenida%20principal%20Cerro%20Cora%20RN",
  },
  {
    name: "Espetaria do Vaguinho",
    category: "Restaurante",
    tags: ["Espetinho", "Bar", "Petiscos"],
    image:
      "/banners/vaguinho.jpg",
    description: "Petiscos, bebidas, caldos, espetinhos.",
    hours: "Seg. a sáb.: 10h30 às 22h",
    whatsapp: "5584999991002",
    instagram: "@espetariavaguinho",
    instagramUrl: "https://www.instagram.com/espetariavaguinho/",
    location: "Avenida principal",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Espetaria%20do%20Vaguinho%20Avenida%20principal%20Cerro%20Cora%20RN",
  },
  {
    name: "Restaurante da galinha caipira",
    category: "Restaurante",
    tags: ["Almoço", "Galinha caipira", "Pratos regionais"],
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85",
    description: "Pratos completos, hambúrgueres, sobremesas.",
    hours: "Seg. a sáb.: 10h30 às 22h",
    whatsapp: "5584999991002",
    instagram: "@brasadoserido",
    instagramUrl: "https://www.instagram.com/brasadoserido/",
    location: "Avenida principal",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Restaurante%20da%20galinha%20caipira%20Avenida%20principal%20Cerro%20Cora%20RN",
  },
  {
    name: "Parque das Aroeiras",
    category: "Restaurante",
    tags: ["Almoço", "Pratos regionais", "Área verde", "Jantar","Pousada"],
    image:
      "/banners/aroeiras.jpg",
    description: "Pratos completos, jantar, eventos e almoço",
    hours: "Qua á Sab: 11h30 14h00 - Dom: 11h30 ás 15h",
    whatsapp: "5584999991002",
    instagram: "@parquedasaroeirasrn",
    instagramUrl: "https://www.instagram.com/parquedasaroeirasrn/",
    location: "Avenida principal",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Parque%20das%20Aroeiras%20Avenida%20principal%20Cerro%20Cora%20RN",
  },
  {
    name: "Kiosque do magão",
    category: "Hamburgueria",
    tags: ["Hambúrguer", "Lanches", "Jantar", "Delivery"],
    image:
      "/banners/magao.jpg",
    description: "Hambúrgueres artesanais, molhos da casa e batatas rústicas.",
    hours: "Qua á dom, 18h ás 00h",
    whatsapp: "5584999991003",
    instagram: "@kiosquedomagaooficial",
    instagramUrl: "https://www.instagram.com/kiosquedomagaooficial/",
    location: "Praça central",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Hamburgueria%20do%20mag%C3%A3o%20Praça%20central%20Cerro%20Cora%20RN",
  },
  {
    name: "Encontro dos amigos",
    category: "Hamburgueria",
    tags: ["Hambúrguer", "Lanches", "Jantar","Delivery","Açai","Pizza"],
    image:
      "/images/encontro.webp",
    description: "Hambúrgueres artesanais, molhos da casa, pizzas, açai e sorvetes",
    hours: "Ter á Dom, 15:00 ás 22h",
    whatsapp: "5584999991003",
    instagram: "@encontrodosamigoscc",
    instagramUrl: "https://www.instagram.com/encontrodosamigoscc/",
    location: "Avenida principal",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Encontro%20dos%20amigos%20Praça%20central%20Cerro%20Cora%20RN",
  },
  
  {
    name: "Café Bougainville",
    category: "Cafeteria",
    tags: ["Café", "Sobremesas", "Chocolate quente", "Vista"],
    image:
      "/banners/cafe.jpg",
    description: "Cafés especiais, chocolate quente, bolos e vista para o açude elói de Souza.",
    hours: "Todos os dias, 7h ás 20h",
    whatsapp: "5584999991004",
    instagram: "@cafebougainville_",
    instagramUrl: "https://www.instagram.com/cafebougainville_/",
    location: "Ao lado da ponte",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Cafe%20Bougainville%20Rua%20do%20Mirante%20Cerro%20Cora%20RN",
  },
  {
    name: "Pousada Restaurante do Seridó",
    category: "Restaurante",
    tags: ["Pizza", "Jantar", "Restaurante", "Pousada","Almoço"],
    image:
      "/banners/pousada.jpg",
    description: "Pizzas, massas, jantar, almoço",
    hours: "Qui á dom, 18h ás 23h30",
    whatsapp: "5584999991005",
    instagram: "@seridopousadaerestaurante",
    instagramUrl: "https://www.instagram.com/seridopousadaerestaurante/",
    location: "Centro",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Pousada%20Restaurante%20do%20Serid%C3%B3%20Centro%20Cerro%20Cora%20RN",
  },
];

export const lodgings: Lodging[] = [
  {
    name: "Pousada e Restaurante Seridó",
    image: "/pousadas/POUSADA-SUICA-DO-SERIDO/serido-1.jpg",
    gallery: [
  "/pousadas/POUSADA-SUICA-DO-SERIDO/serido-2.jpg",
  "/pousadas/POUSADA-SUICA-DO-SERIDO/serido-3.jpg",
  "/pousadas/POUSADA-SUICA-DO-SERIDO/serido-4.jpg",
],
    description:
      "Tradição e praticidade no coração de Cerro Corá. Uma hospedagem completa com quartos confortáveis e um restaurante pronto para te servir ",
    whatsapp: "5584999992001",
    location: "Próximo ao centro",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Pousada%20e%20Restaurante%20Serid%C3%B3%20Próximo%20ao%20centro%20Cerro%20Cora%20RN",
    priceRange: "R$ 220 - R$ 420",
    priceDisclaimer: "Valores sujeitos a alteração em feriados e eventos locais."
    

  },
  {
    name: "Colina dos Flamboyants",
   image: "/pousadas/COLINA-DOS-Flamboyant/flamboyant-img.jpeg",
gallery: [
  "/pousadas/COLINA-DOS-Flamboyant/colina-flanboyants-2.jpg",
  "/pousadas/COLINA-DOS-Flamboyant/colina-flanboyants-3.jpg",
  "/pousadas/COLINA-DOS-Flamboyant/colina-flanboyants-4.jpg",
    ],
    description:
      "Onde o charme serrano encontra a alta gastronomia. A Colina oferece uma experiência exclusiva em Cerro Corá, unindo hospedagem de alto padrão a um restaurante no próprio local. Desfrute de jardins amplos e pratos inesquecíveis em um cenário paradisíaco.",
    whatsapp: "5584999992002",
    location: "Área Rural - 0,6km do centro",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Colina%20dos%20Flamboyants%20Area%20Rural%20-%200%2C6km%20do%20centro%20Cerro%20Cora%20RN",
    priceRange: "R$ 280 - R$ 560",
    priceDisclaimer: "Valores sujeitos a alteração em feriados e eventos locais."
  },
  {
    name: "Pousada do Teté",
    image:
      "/pousadas/POUSADA-TETE/tete.jpg",
    gallery: [
      "/pousadas/POUSADA-TETE/tete-2.jpg",
      "/pousadas/POUSADA-TETE/tete-3.jpg",
      "/pousadas/POUSADA-TETE/tete-5.jpg",
    ],
    description:
      "Hospedagem familiar no centro de Cerro Corá. Com serviço completo de restaurante e pizzaria, a escolha estratégica para quem busca conforto e praticidade durante o Festival de Inverno ou a passeio.",
    whatsapp: "5584999992003",
    location: "Próximo ao centro",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Pousada%20do%20Tet%C3%A9%20Pr%C3%B3ximo%20ao%20centro%20Cerro%20Cora%20RN",
    priceRange: "R$ 180 - R$ 340",
    priceDisclaimer: "Valores sujeitos a alteração em feriados e eventos locais."
  },
  {
    name: "Parque das Aroeiras",
    image:
      "/pousadas/aroeiras/aroeiras-1.jpg",
    gallery: [
      "/pousadas/aroeiras/aroeiras-2.jpg",
      "/pousadas/aroeiras/aroeiras-3.jpg",
      "/pousadas/aroeiras/aroeiras-4.jpg",
    ],
    description:
      "Seu refúgio natural no centro de Cerro Corá. No Parque das Aroeiras, você desfruta de quartos aconchegantes e restaurante no local, unindo a praticidade da localização central ao charme de um espaço cercado de verde e tranquilidade.",
    whatsapp: "5584999992003",
    location: "Próximo ao centro",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Parque%20das%20Aroeiras%20Pr%C3%B3ximo%20ao%20centro%20Cerro%20Cora%20RN",
    priceRange: "R$ 180 - R$ 340",
    priceDisclaimer: "Valores sujeitos a alteração em feriados e eventos locais."
  },
  {
    name: "Pousada Mirante",
    image:
      "/pousadas/POUSADA-MIRANTE/mirante-4.jpg",
    gallery: [
      "/pousadas/POUSADA-MIRANTE/mirante-2.jpg",
      "/pousadas/POUSADA-MIRANTE/mirante-3.jpg",
      "/pousadas/POUSADA-MIRANTE/mirante-1.jpg",
    ],
    description:
      "Hospedagem com vista panorâmica para o mirante de Cerro Corá. Gastronomia regional, petiscos e o silêncio restaurador.",
    whatsapp: "5584999992003",
    location: "Rota da nascente",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Pousada%20Mirante%20Rota%20da%20nascente%20Cerro%20Cora%20RN",
    priceRange: "R$ 180 - R$ 340",
    priceDisclaimer: "Valores sujeitos a alteração em feriados e eventos locais."
  },
  {
    name: "Pousada Central",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=85",
    ],
    description:
      "Pousada no centro da cidade",
    whatsapp: "5584999992003",
    location: "Rota da nascente",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Pousada%20Central%20Rota%20da%20nascente%20Cerro%20Cora%20RN",
    priceRange: "R$ 180 - R$ 340",
    priceDisclaimer: "Valores sujeitos a alteração em feriados e eventos locais."
  },
  {
    name: "Pousada Platô da Nascente",
    image:
      "/pousadas/Plato/plato-1.jpg",
    gallery: [
      "/pousadas/Plato/palto-2.jpg",
      "/pousadas/Plato/plato-3.jpg",
      "/pousadas/Plato/plato-4.jpg",
    ],
    description:
      "Chalés confortáveis com vista panorâmica, ideal para relaxar e aproveitar o clima serrano.",
    whatsapp: "5584999992003",
    location: "Rota da nascente",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Pousada%20Plat%C3%B4%20da%20Nascente%20Rota%20da%20nascente%20Cerro%20Cora%20RN",
    priceRange: "R$ 180 - R$ 340",
    priceDisclaimer: "Valores sujeitos a alteração em feriados e eventos locais."
  },
];

export const festivalSchedule: FestivalScheduleItem[] = [
  {
    day: "Sexta",
    date: "07 de agosto",
    subtitle: "Abertura Oficial",
    title: "Abertura com pagode, forró e artistas locais",
    highlight: "Só Pra Contrariar",
    artists: [
      { name: "Só Pra Contrariar", role: "principal" },
      { name: "Raynel Guedes", role: "regional" },
      { name: "Banda Tuareg's", role: "regional" },
      { name: "Clau Vianna", role: "convidado" },
      { name: "Victor Costa", role: "convidado" },
    ],
  },
  {
    day: "Sábado",
    date: "08 de agosto",
    subtitle: "Noite Principal",
    title: "Noite romântica, forró e clássicos populares",
    highlight: "Roberta Miranda",
    artists: [
      { name: "Roberta Miranda", role: "principal" },
      { name: "Circuito Musical", role: "regional" },
      { name: "Joãozinho Dantas", role: "regional" },
      { name: "The Clássicos", role: "convidado" },
      { name: "Gilson Fernandes", role: "convidado" },
    ],
  },
  {
    day: "Domingo",
    date: "09 de agosto",
    subtitle: "Encerramento",
    title: "Encerramento com axé, forró e artistas regionais",
    highlight: "Banda Grafith",
    artists: [
      { name: "Banda Grafith", role: "principal" },
      { name: "Acácio Ferinha", role: "regional" },
      { name: "Giovane Soares", role: "convidado" },
    ],
  },
];

export const homeHighlights = [
  {
    title: "Sobre a cidade",
    href: "/sobre-a-cidade",
    icon: ScrollText,
    description: "História, clima, identidade serrana e curiosidades locais.",
  },
  {
    title: "Roteiros",
    href: "/o-que-fazer",
    icon: Compass,
    description: "Mirantes, nascentes, vales, trilhas, história e geoturismo.",
  },
  {
    title: "Onde ficar",
    href: "/pousadas",
    icon: Hotel,
    description: "Pousadas e chalés com clima frio para curtir a serra.",
  },
  {
    title: "Gastronomia",
    href: "/gastronomia",
    icon: Utensils,
    description: "Cafés, restaurantes, pizzas e sabores regionais.",
  },
  {
    title: "Eventos",
    href: "/festival-de-inverno",
    icon: CalendarDays,
    description: "Festival de inverno, música, cultura e experiências sazonais.",
  },
];

export const cityHistory: HistoryMilestone[] = [
  {
    year: "1764",
    title: "Sesmarias e Serra de Santana",
    description:
      "Registros históricos apontam Adriana Holanda de Vasconcellos como primeira proprietária de terras na Área do atual município. A doação de parte da serra a Nossa Senhora de Santana ajudou a fixar o nome Serra de Santana.",
  },
  {
    year: "1886",
    title: "Sitio Barro Vermelho",
    description:
      "A área onde a cidade cresceu era conhecida como sitio Barro Vermelho, ligado ao Major Lula Gomes, que impulsionou a formação do povoado chamado Caraúbas,  nome dado em referência à existência de carnaubeiras nas redondezas.",
  },
  {
    year: "1922",
    title: "Nome Cerro Corá",
    description:
      "O povoado passou a se chamar Cerro Corá em homenagem ao episódio final da Guerra do Paraguai.",
  },
  {
    year: "1938",
    title: "Distrito de Currais Novos",
    description:
      "Cerro-Corá foi criado como distrito subordinado ao município de Currais Novos pela Lei Estadual n. 603.",
  },
  {
    year: "1953-1954",
    title: "Emancipação política",
    description:
      "O município foi elevado a categoria de cidade pela Lei Estadual n. 1.031, de 11 de dezembro de 1953, com instalação em 1 de janeiro de 1954.",
  },
];

export const climateMonths: ClimateMonth[] = [
  { month: "Jan", high: 32.1, average: 25.3, low: 20.5, rain: 36 },
  { month: "Fev", high: 32.7, average: 25.0, low: 20.4, rain: 70 },
  { month: "Mar", high: 31.2, average: 25.8, low: 19.9, rain: 138 },
  { month: "Abr", high: 30.6, average: 24.4, low: 20.2, rain: 155 },
  { month: "Mai", high: 30.0, average: 24.6, low: 19.7, rain: 75 },
  { month: "Jun", high: 29.1, average: 23.7, low: 18.9, rain: 48 },
  { month: "Jul", high: 29.4, average: 22.3, low: 17.3, rain: 35 },
  { month: "Ago", high: 30.0, average: 23.6, low: 17.4, rain: 12 },
  { month: "Set", high: 32.0, average: 24.6, low: 18.0, rain: 5 },
  { month: "Out", high: 33.1, average: 25.4, low: 18.9, rain: 3 },
  { month: "Nov", high: 32.0, average: 25.0, low: 20.0, rain: 3 },
  { month: "Dez", high: 33.1, average: 26.3, low: 20.3, rain: 12 },
];

export const cityFacts = [
  {
    title: "Apelido turístico",
    value: "Suiça do Seridó",
    description:
      "A identidade turística destaca clima de serra, altitude, natureza e atmosfera acolhedora.",
    icon: Mountain,
  },
  {
    title: "Temperatura média",
    value: "18-32C",
    description:
      "As médias mensais ficam mais baixas entre junho e agosto, periodo associado ao clima de inverno.",
    icon: ThermometerSun,
  },
  {
    title: "Roteiro natural",
    value: "Serra de Santana",
    description:
      "A paisagem serrana e os atrativos naturais posicionam Cerro Corá como destino de descanso e ecoturismo.",
    icon: Compass,
  },
];

export const galleryImages = [
  heroImage,
  "/images/Cerrocora-nariz.jpg",
  "/images/foto-entrada.jpg",
  "/images/festival.webp",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85",
];

export const quickStats = [
  { label: "Altitude agradável", value: "575m", icon: Mountain },
  { label: "Roteiros naturais", value: "8+", icon: MapPin },
  { label: "Festival de inverno", value: "Agosto", icon: Music },
  { label: "Cafés e sabores", value: "Serra", icon: Coffee },
];

export const tourGuides: TourGuide[] = [
  {
    name: "Ronivon",
    whatsapp: "(84) 9622-7175",
    description:
      "",
  },
  {
    name: "Genilson",
    whatsapp: "(84) 9840-6657",
    description:
      "",
  },
];
