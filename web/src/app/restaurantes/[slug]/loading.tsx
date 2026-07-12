export default function RestaurantDetailsLoading() {
  return (
    <main className="min-h-screen bg-background" aria-busy="true" aria-label="Carregando restaurante">
      <section className="border-b border-border bg-alpine-pine py-16 text-white">
        <div className="container grid animate-pulse gap-4">
          <div className="h-24 w-24 rounded-lg bg-white/10" />
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-12 max-w-xl rounded bg-white/10" />
        </div>
      </section>
      <section className="container grid animate-pulse gap-6 py-12 lg:grid-cols-2">
        <div className="h-64 rounded-lg bg-muted" />
        <div className="h-64 rounded-lg bg-muted" />
      </section>
    </main>
  );
}
