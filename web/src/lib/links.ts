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
  const query = [name, location, "Cerro Corá-RN"].filter(Boolean).join(" ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const defaultWhatsappMessage =
  "Olá! Encontrei seu estabelecimento através do Portal Turístico de Cerro Corá e gostaria de obter mais informações.";

export function whatsappUrl(phone: string, message?: string | null) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  const text = encodeURIComponent(message?.trim() || defaultWhatsappMessage);

  return `https://wa.me/${normalized}?text=${text}`;
}
