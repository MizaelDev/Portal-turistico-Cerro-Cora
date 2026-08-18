import { SafeImage } from "@/components/safe-image";
import { cn } from "@/lib/utils";

type EstablishmentLogoProps = {
  src: string;
  name: string;
  imageType?: "photo" | "logo";
  priority?: boolean;
  className?: string;
};

export function EstablishmentLogo({
  src,
  name,
  imageType = "logo",
  priority = false,
  className,
}: EstablishmentLogoProps) {
  const isPhoto = imageType === "photo";

  return (
    <div
      className={cn(
        "relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-white/20 bg-transparent shadow-glass md:h-44 md:w-44",
        className,
      )}
    >
      <SafeImage
        src={src}
        alt={(isPhoto ? "Foto de " : "Logo de ") + name}
        fill
        priority={priority}
        sizes="(min-width: 768px) 176px, 128px"
        quality={90}
        className={isPhoto ? "object-cover object-center" : "object-contain p-1"}
      />
    </div>
  );
}