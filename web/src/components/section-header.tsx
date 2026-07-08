import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  as = "h2",
  inverted = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  as?: "h1" | "h2";
  inverted?: boolean;
}) {
  const Title = as;

  return (
    <div className={cn("mx-auto max-w-3xl text-center", inverted ? "text-white" : "text-foreground", className)}>
      {eyebrow ? <Badge className="mb-4">{eyebrow}</Badge> : null}
      <Title className="font-display text-4xl font-semibold tracking-normal text-current md:text-5xl">
        {title}
      </Title>
      {description ? (
        <p className={cn("mt-4 text-base leading-8 md:text-lg", inverted ? "text-white/72" : "text-muted-foreground")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
