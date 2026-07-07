import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RestaurantNotFound() {
  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-20">
      <Card className="max-w-xl text-center">
        <CardContent className="grid gap-5 p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-border bg-accent">
            <SearchX className="h-7 w-7 text-alpine-wine" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Restaurante nÃ£o encontrado
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold">Esse estabelecimento nÃ£o estÃ¡ disponÃ­vel.</h1>
            <p className="mt-4 leading-7 text-muted-foreground">
              O link pode ter mudado ou o restaurante pode nÃ£o estar ativo no guia gastronÃ´mico.
            </p>
          </div>
          <Button asChild variant="warm" className="mx-auto">
            <Link href="/gastronomia">
              <ArrowLeft className="h-4 w-4" /> Voltar para Gastronomia
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
