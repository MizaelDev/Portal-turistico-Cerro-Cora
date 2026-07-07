"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { attractions, foodPlaces, lodgings } from "@/lib/data";
import { navItems } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const items = useMemo(
    () => [
      ...navItems.map((item) => ({ title: item.label, href: item.href, type: "Pagina" })),
      ...attractions.map((item) => ({
        title: item.name,
        href: "/o-que-fazer",
        type: item.category,
      })),
      ...foodPlaces.map((item) => ({
        title: item.name,
        href: "/gastronomia",
        type: item.category,
      })),
      ...lodgings.map((item) => ({
        title: item.name,
        href: "/pousadas",
        type: "Hospedagem",
      })),
    ],
    [],
  );

  const results = items.filter((item) =>
    `${item.title} ${item.type}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-24 z-50 w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 rounded-lg border border-border bg-background p-4 shadow-premium">
          <Dialog.Title className="sr-only">Buscar no site</Dialog.Title>
          <Dialog.Description className="sr-only">
            Pesquise páginas, roteiros, pousadas e estabelecimentos gastronômicos.
          </Dialog.Description>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              autoFocus
              aria-label="Digite sua busca"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar atrativos, pousadas, gastronomia..."
              className="border-0 px-0 text-base focus-visible:ring-0"
            />
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Fechar busca">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="mt-4 max-h-80 overflow-y-auto">
            {results.slice(0, 9).map((item) => (
              <Link
                href={item.href}
                key={`${item.href}-${item.title}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-between rounded-md px-3 py-3 hover:bg-accent"
              >
                <span className="font-medium">{item.title}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {item.type}
                </span>
              </Link>
            ))}
            {!results.length ? (
              <p className="px-3 py-6 text-sm text-muted-foreground">
                Nenhum resultado encontrado.
              </p>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
