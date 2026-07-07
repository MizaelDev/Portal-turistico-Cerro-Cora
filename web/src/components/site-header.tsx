"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Mountain, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const SearchDialog = dynamic(
  () => import("./search-dialog").then((mod) => mod.SearchDialog),
  { ssr: false },
);

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/78 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Mountain className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-semibold">
              Cerro Corá
            </span>
            <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Suiça do Seridó
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                pathname === item.href && "bg-accent text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Buscar no site"
            title="Buscar"
            onClick={() => setSearchOpen(true)}
            className="bg-background/70 backdrop-blur"
          >
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            title="Menu"
            onClick={() => setOpen((value) => !value)}
            className="bg-background/70 backdrop-blur lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background lg:hidden">
          <nav id="mobile-navigation" className="container grid gap-1 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-3 text-sm font-medium text-muted-foreground",
                  pathname === item.href && "bg-accent text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}

      {searchOpen ? <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} /> : null}
    </header>
  );
}
