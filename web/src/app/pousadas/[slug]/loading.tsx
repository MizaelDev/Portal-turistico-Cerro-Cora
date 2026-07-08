import { Card, CardContent } from "@/components/ui/card";

export default function LodgingLoading() {
  return (
    <main className="container grid gap-10 py-12 md:py-16">
      <div className="h-[520px] animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <Card>
          <CardContent className="grid gap-4 p-6">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-9 w-2/3 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 rounded-lg bg-muted" />
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
