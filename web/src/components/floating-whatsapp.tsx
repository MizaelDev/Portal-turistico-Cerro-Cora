import { MessageCircle } from "lucide-react";

export function FloatingWhatsApp() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5584999999999";
  const text = encodeURIComponent("Ola! Quero informações turísticas sobre Cerro Corá.");

  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-premium transition-transform hover:scale-105"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
