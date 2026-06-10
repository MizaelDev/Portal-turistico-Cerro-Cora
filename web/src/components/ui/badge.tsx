import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-background/80 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
