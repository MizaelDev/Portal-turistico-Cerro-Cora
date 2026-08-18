"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, GripVertical, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveAdminDisplayOrder } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { AdminEntity } from "@/lib/supabase";

type OrderableEntity = Extract<AdminEntity, "restaurantes" | "pousadas" | "city_services">;

export type AdminOrderItem = {
  id: string;
  name: string;
  order: number | null;
};

function sortItems(items: AdminOrderItem[]) {
  return [...items].sort((first, second) => {
    const orderDifference =
      (first.order ?? Number.MAX_SAFE_INTEGER) -
      (second.order ?? Number.MAX_SAFE_INTEGER);
    return orderDifference || first.name.localeCompare(second.name, "pt-BR");
  });
}

export function AdminOrderManager({
  entity,
  items: initialItems,
}: {
  entity: OrderableEntity;
  items: AdminOrderItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(() => sortItems(initialItems));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function moveItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return;

    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setMessage("");
  }

  function dropItem(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const fromIndex = items.findIndex((item) => item.id === draggedId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    moveItem(fromIndex, toIndex);
    setDraggedId(null);
  }

  function saveOrder() {
    startTransition(async () => {
      const result = await saveAdminDisplayOrder(
        entity,
        items.map((item) => item.id),
      );
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  if (items.length < 2) return null;

  return (
    <section className="grid gap-3 rounded-md border border-border bg-accent/20 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-sm font-semibold">Ordem de exibição</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Arraste os itens ou use as setas. A posição vale somente para esta área do portal.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={saveOrder}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar ordem
        </Button>
      </div>

      <ol className="grid gap-2">
        {items.map((item, index) => (
          <li
            key={item.id}
            draggable={!isPending}
            onDragStart={() => setDraggedId(item.id)}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropItem(item.id)}
            className={[
              "flex items-center gap-2 rounded-md border bg-background/80 p-2 transition-colors",
              draggedId === item.id ? "border-primary/60 opacity-60" : "border-border",
            ].join(" ")}
          >
            <GripVertical className="hidden h-4 w-4 shrink-0 cursor-grab text-muted-foreground sm:block" aria-hidden="true" />
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border text-xs font-semibold">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={index === 0 || isPending}
              onClick={() => moveItem(index, index - 1)}
              aria-label={"Mover " + item.name + " para cima"}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={index === items.length - 1 || isPending}
              onClick={() => moveItem(index, index + 1)}
              aria-label={"Mover " + item.name + " para baixo"}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ol>

      {message ? <p className="text-xs text-muted-foreground" role="status">{message}</p> : null}
    </section>
  );
}