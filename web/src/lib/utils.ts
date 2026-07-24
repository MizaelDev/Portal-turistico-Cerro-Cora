import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function siteUrl(path: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let baseUrl = "http://localhost:3000";

  try {
    const candidate = new URL(configuredUrl);
    if (candidate.protocol === "http:" || candidate.protocol === "https:") {
      baseUrl = candidate.origin;
    }
  } catch {
    // A configuracao invalida nao deve derrubar metadata, sitemap ou build.
  }

  const normalizedPath = "/" + path.replace(/^\/+/, "");
  return new URL(normalizedPath, baseUrl + "/").toString();
}
