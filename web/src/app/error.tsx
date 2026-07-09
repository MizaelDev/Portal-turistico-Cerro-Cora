"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <section className="container grid min-h-[70vh] place-items-center py-20">
      <Card className="max-w-xl text-center">
        <CardContent className="grid gap-5 p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-accent text-alpine-wine">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Falha no carregamento
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold">Não foi possível abrir esta página.</h1>
            <p className="mt-4 leading-7 text-muted-foreground">
              Atualize a página ou volte para a tela inicial. Se o problema continuar, tente novamente em alguns minutos.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" variant="warm" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Tentar novamente
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Voltar para Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
