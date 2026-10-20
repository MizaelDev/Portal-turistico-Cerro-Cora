import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Geist } from "next/font/google";
import { AnalyticsConsentProvider } from "@/components/analytics-consent-provider";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { createMetadata, localBusinessSchema, tourismSchema } from "@/lib/seo";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JsonLd } from "@/components/json-ld";

// Configuração das fontes
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
const configuredGaMeasurementId =
  process.env.NODE_ENV === "production" ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID : undefined;
const gaMeasurementId =
  configuredGaMeasurementId && /^G-[A-Z0-9]+$/.test(configuredGaMeasurementId)
    ? configuredGaMeasurementId
    : undefined;

export const metadata: Metadata = {
  ...createMetadata(),
  icons: {
    icon: "/icon.svg?v=2",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#21473c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${geist.variable} ${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <AnalyticsConsentProvider measurementId={gaMeasurementId}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            enableColorScheme
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={300}>
              <SiteHeader />
              <main>{children}</main>
              <SiteFooter />
              <FloatingWhatsApp />
            </TooltipProvider>
          </ThemeProvider>
        </AnalyticsConsentProvider>

        <JsonLd data={tourismSchema} />
        <JsonLd data={localBusinessSchema} />
      </body>
    </html>
  );
}
