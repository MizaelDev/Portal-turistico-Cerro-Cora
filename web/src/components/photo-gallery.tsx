import Image from "next/image";
import { galleryImages } from "@/lib/data";

export function PhotoGallery() {
  return (
    <div className="grid gap-3 md:grid-cols-4 md:grid-rows-2">
      {galleryImages.map((image, index) => (
        <div
          key={image}
          className={
            index === 0
              ? "relative min-h-72 overflow-hidden rounded-lg md:col-span-2 md:row-span-2"
              : "relative min-h-48 overflow-hidden rounded-lg"
          }
        >
          <Image
            src={image}
            alt={`Galeria turística de Cerro Corá ${index + 1}`}
            fill
            sizes={index === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 100vw"}
            quality={76}
            className="object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
