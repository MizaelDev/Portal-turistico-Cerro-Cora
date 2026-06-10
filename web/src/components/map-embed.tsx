export function MapEmbed({ title = "Mapa de Cerro Corá" }: { title?: string }) {
  const src =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ||
    "https://www.google.com/maps?q=Cerro%20Cor%C3%A1%20RN&output=embed";

  return (
    <div className="overflow-hidden rounded-lg border border-border shadow-sm">
      <iframe
        title={title}
        src={src}
        className="h-[380px] w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
