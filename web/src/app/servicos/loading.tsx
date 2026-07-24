export default function CityServicesLoading() {
  return (
    <section className="container animate-pulse py-12 md:py-16" aria-label="Carregando serviços">
      <div className="h-3 w-36 rounded bg-muted" />
      <div className="mt-4 h-12 max-w-2xl rounded bg-muted" />
      <div className="mt-3 h-6 max-w-xl rounded bg-muted/70" />
      <div className="mt-8 h-28 rounded-lg border border-border bg-card" />
      <div className="mt-7 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-20 rounded-md border border-border bg-card" />
        ))}
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 rounded-lg border border-border bg-card" />
        ))}
      </div>
    </section>
  );
}
