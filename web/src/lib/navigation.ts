import { enableCityServicesPage } from "@/lib/feature-flags";

export const navItems = [
  { href: "/", label: "Home" },
  { href: "/sobre-a-cidade", label: "Sobre" },
  { href: "/o-que-fazer", label: "Roteiros turísticos" },
  { href: "/festival-de-inverno", label: "Eventos" },
  { href: "/gastronomia", label: "Gastronomia" },
  { href: "/pousadas", label: "Hospedagem" },
  ...(enableCityServicesPage ? [{ href: "/servicos", label: "Serviços da Cidade" }] : []),
] as const;
