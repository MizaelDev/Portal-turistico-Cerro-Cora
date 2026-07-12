export function instagramUrlFromHandle(handle: string) {
  const value = handle.trim();

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
      if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) {
        return url.toString();
      }
    } catch {
      return "https://www.instagram.com/";
    }
  }

  const cleanHandle = value.replace(/^@/, "").split(/[/?#]/)[0]?.replace(/[^a-zA-Z0-9._]/g, "") || "";

  if (!cleanHandle) {
    return "https://www.instagram.com/";
  }

  return `https://www.instagram.com/${cleanHandle}/`;
}

export function instagramLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const handle = new URL(trimmed).pathname.split("/").filter(Boolean)[0];
      return handle ? `@${handle}` : "Instagram";
    } catch {
      return "Instagram";
    }
  }

  return `@${trimmed.replace(/^@/, "")}`;
}

export function googleMapsSearchUrl(name: string, location?: string) {
  const query = [name, location, "Cerro Corá RN"].filter(Boolean).join(" ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
