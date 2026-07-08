import Link from "next/link";
import { Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LodgingNotFound() {
  return (
    <section className="container grid min-h-[70vh] place-items-center py-20">
      <div className="max-w-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-card text-alpine-wine shadow-sm">
          <Hotel className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold">Hospedagem não encontrada</h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Esta pousada pode ter sido removida ou ainda não está ativa no guia.
        </p>
        <Button asChild variant="warm" className="mt-8">
          <Link href="/pousadas">Ver pousadas disponíveis</Link>
        </Button>
      </div>
    </section>
  );
}
