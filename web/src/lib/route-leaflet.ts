import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import {
  PUBLIC_CACHE_TAGS,
  PUBLIC_CONTENT_CACHE_SECONDS,
} from "@/lib/cache-tags";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase";

export type RouteLeafletSettings = {
  imageUrl: string;
  altText: string;
  downloadUrl: string | null;
  isActive: boolean;
};

export const defaultRouteLeafletSettings: RouteLeafletSettings = {
  imageUrl: "/images/roteiros/roteiros-turisticos-cerro-cora.jpeg",
  altText:
    "Panfleto oficial com os cinco roteiros turísticos de Cerro Corá-RN",
  downloadUrl: "/images/roteiros/roteiros-turisticos-cerro-cora.jpeg",
  isActive: true,
};
const routeLeafletTimeoutMs = 8_000;

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const upstreamSignal = init?.signal;
  const abortRequest = () => controller.abort();
  const timeout = setTimeout(abortRequest, routeLeafletTimeoutMs);
  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort();
    else upstreamSignal.addEventListener("abort", abortRequest, { once: true });
  }
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    upstreamSignal?.removeEventListener("abort", abortRequest);
  }
};


type RouteLeafletRow = {
  image_url?: string | null;
  alt_text?: string | null;
  download_url?: string | null;
  is_active?: boolean | null;
};

function isSafeAssetUrl(value?: string | null) {
  if (!value) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeRouteLeafletSettings(
  row?: RouteLeafletRow | null,
): RouteLeafletSettings {
  if (!row) return defaultRouteLeafletSettings;

  return {
    imageUrl: isSafeAssetUrl(row.image_url?.trim())
      ? row.image_url!.trim()
      : defaultRouteLeafletSettings.imageUrl,
    altText: row.alt_text?.trim() || defaultRouteLeafletSettings.altText,
    downloadUrl: isSafeAssetUrl(row.download_url?.trim())
      ? row.download_url!.trim()
      : null,
    isActive: row.is_active ?? true,
  };
}

async function fetchRouteLeafletSettings(): Promise<RouteLeafletSettings> {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return defaultRouteLeafletSettings;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: { fetch: fetchWithTimeout },
  });

  const { data, error } = await supabase
    .from("route_leaflet_settings")
    .select("image_url,alt_text,download_url,is_active")
    .eq("id", 1)
    .maybeSingle();

  // The local default keeps the page complete until the optional settings
  // migration is applied in Supabase.
  if (error || !data) return defaultRouteLeafletSettings;


  return normalizeRouteLeafletSettings(data);
}

export const getRouteLeafletSettings = unstable_cache(
  fetchRouteLeafletSettings,
  [PUBLIC_CACHE_TAGS.routeLeaflet],
  {
    revalidate: PUBLIC_CONTENT_CACHE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.routeLeaflet],
  },
);
