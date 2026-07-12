import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Geist } from "next/font/google";
import Script from "next/script";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { createMetadata, localBusinessSchema, tourismSchema } from "@/lib/seo";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalyticsPageView } from "@/components/google-analytics-page-view";

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
const gaMeasurementId =
  process.env.NODE_ENV === "production" ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID : undefined;

export const metadata: Metadata = createMetadata();

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
          <Analytics />
        </ThemeProvider>

        {/* Scripts de SEO */}
        <Script
          id="tourism-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(tourismSchema) }}
        />
        <Script
          id="local-business-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaMeasurementId}', { anonymize_ip: true, send_page_view: false });
                `,
              }}
            />
            <GoogleAnalyticsPageView measurementId={gaMeasurementId} />
          </>
        ) : null}
      </body>
    </html>
  );
}
