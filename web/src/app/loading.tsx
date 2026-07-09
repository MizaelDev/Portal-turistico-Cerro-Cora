import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <section className="container grid gap-8 py-20">
      <div className="mx-auto grid w-full max-w-3xl justify-items-center gap-4 text-center">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-12 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-full max-w-xl animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="grid gap-4 p-5">
              <div className="aspect-[4/3] animate-pulse rounded-md bg-muted" />
              <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
