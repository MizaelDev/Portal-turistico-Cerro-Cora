import Link from "next/link";
import { Instagram, Mail, MapPin, Mountain, Phone } from "lucide-react";
import { navItems } from "@/lib/data";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#17251f] text-white">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white/10">
              <Mountain className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl font-semibold">Cerro Corá</p>
              <p className="text-sm text-white/70">Portal turístico oficial  </p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-7 text-white/72">
            Um guia digital para descobrir a Suiça do Seridó: natureza, clima frio,
            gastronomia, hospedagem, cultura e experiências de inverno no RN.
          </p>
        </div>
        <div>
          <p className="mb-4 font-semibold">Navegação</p>
          <div className="grid gap-2">
            {navItems.filter((item) => item.href !== "/admin").map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-white/72 hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-4 font-semibold">Contato</p>
          <div className="grid gap-3 text-sm text-white/72">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Cerro Corá, Rio Grande do Norte
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> (84) 8896-7852
            </span>
            <span className="flex items-center gap-2">
              <Instagram className="h-4 w-4" /> @bz.software_
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> eduardo@bzsoftware.com.br
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/55">
        Desenvolvido por: <a href="https://www.instagram.com/_mizaelaraujo/" target="_blank" rel="noopener noreferrer">Mizael Araujo</a> & <a href="https://go.bzsoftware.com.br" target="_blank" rel="noopener noreferrer">BZ Software</a>
      </div>
    </footer>
  );
}
