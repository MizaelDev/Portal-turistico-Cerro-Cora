export function instagramUrlFromHandle(handle: string) {
  const cleanHandle = handle.trim().replace(/^@/, "");

  if (!cleanHandle) {
    return "https://www.instagram.com/";
  }

  return `https://www.instagram.com/${cleanHandle}/`;
}

export function googleMapsSearchUrl(name: string, location?: string) {
  const query = [name, location, "Cerro Corá RN"].filter(Boolean).join(" ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
