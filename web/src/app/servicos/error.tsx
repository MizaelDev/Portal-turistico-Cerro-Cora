"use client";

import { Button } from "@/components/ui/button";

export default function CityServicesError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="font-display text-3xl font-semibold">
          Não foi possível carregar os serviços
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Verifique sua conexão e tente novamente. Nenhuma informação foi alterada.
        </p>
        <Button type="button" onClick={reset} className="mt-5">
          Tentar novamente
        </Button>
      </div>
    </section>
  );
}
