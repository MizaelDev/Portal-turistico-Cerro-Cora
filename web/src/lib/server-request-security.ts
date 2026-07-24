import "server-only";

import { headers } from "next/headers";

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export async function assertSameOriginRequest(message = "Invalid request origin.") {
  const headersList = await headers();
  const source = headersList.get("origin") || headersList.get("referer");
  const forwardedHost = headersList.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headersList.get("host");
  const forwardedProto = headersList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || (process.env.NODE_ENV === "production" ? "https" : "http");

  if (
    !source ||
    !host ||
    !/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(host) ||
    !["http", "https"].includes(protocol)
  ) {
    throw new Error(message);
  }

  const allowedOrigins = new Set<string>();
  const requestOrigin = normalizeOrigin(protocol + "://" + host);
  const configuredOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (requestOrigin) allowedOrigins.add(requestOrigin);
  if (configuredOrigin) allowedOrigins.add(configuredOrigin);

  const sourceOrigin = normalizeOrigin(source);
  if (!sourceOrigin || !allowedOrigins.has(sourceOrigin)) {
    throw new Error(message);
  }
}
