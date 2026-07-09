import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <section className="container grid min-h-[70vh] place-items-center py-20">
      <Card className="max-w-xl text-center">
        <CardContent className="grid gap-5 p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-accent text-alpine-wine">
            <SearchX className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Página não encontrada
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold">Esse endereço não existe no portal.</h1>
            <p className="mt-4 leading-7 text-muted-foreground">
              O link pode ter mudado ou o conteúdo pode ter sido removido.
            </p>
          </div>
          <Button asChild variant="warm" className="mx-auto">
            <Link href="/">Voltar para Home</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
