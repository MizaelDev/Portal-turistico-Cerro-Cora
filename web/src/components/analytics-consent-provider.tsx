"use client";

import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { GoogleAnalyticsPageView } from "@/components/google-analytics-page-view";
import {
  analyticsConsentChangedEvent,
  analyticsConsentStorageKey,
  clearApplicationAnalyticsIdentifiers,
  readAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";

type ConsentContextValue = {
  consent: AnalyticsConsent | null;
  ready: boolean;
  choose: (choice: AnalyticsConsent) => void;
  openPreferences: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function clearGoogleAnalyticsCookies() {
  if (typeof document === "undefined") return;
  const hostnameParts = window.location.hostname.split(".");
  const domains = ["", window.location.hostname];
  if (hostnameParts.length >= 2) domains.push(`.${hostnameParts.slice(-2).join(".")}`);

  document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name?.startsWith("_ga")))
    .forEach((name) => {
      domains.forEach((domain) => {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domain ? `; domain=${domain}` : ""}`;
      });
    });
}

function OptionalAnalytics({ measurementId }: { measurementId?: string }) {
  return (
    <>
      <Analytics />
      {measurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('consent', 'default', { analytics_storage: 'granted' });
              gtag('config', '${measurementId}', { anonymize_ip: true, send_page_view: false });
            `}
          </Script>
          <GoogleAnalyticsPageView measurementId={measurementId} />
        </>
      ) : null}
    </>
  );
}

export function AnalyticsConsentProvider({
  children,
  measurementId,
}: {
  children: ReactNode;
  measurementId?: string;
}) {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [ready, setReady] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const validMeasurementId = measurementId && /^G-[A-Z0-9]+$/.test(measurementId)
    ? measurementId
    : undefined;

  useEffect(() => {
    setConsent(readAnalyticsConsent());
    setReady(true);
  }, []);

  const choose = useCallback((choice: AnalyticsConsent) => {
    const isRevocation = consent === "granted" && choice === "denied";
    try {
      window.localStorage.setItem(analyticsConsentStorageKey, choice);
    } catch {
      // A decisão continua válida nesta navegação mesmo sem persistência local.
    }

    if (choice === "denied") {
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      clearApplicationAnalyticsIdentifiers();
      clearGoogleAnalyticsCookies();
    }

    setConsent(choice);
    setPreferencesOpen(false);
    window.dispatchEvent(new CustomEvent(analyticsConsentChangedEvent, { detail: choice }));
    if (isRevocation) window.location.reload();
  }, [consent]);

  const value = useMemo<ConsentContextValue>(
    () => ({ consent, ready, choose, openPreferences: () => setPreferencesOpen(true) }),
    [choose, consent, ready],
  );
  const showChoice = ready && (consent === null || preferencesOpen);

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {consent === "granted" ? <OptionalAnalytics measurementId={validMeasurementId} /> : null}
      {showChoice ? (
        <section
          aria-label="Preferências de privacidade"
          className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-3xl rounded-lg border border-white/15 bg-[#17251f]/[0.98] p-5 text-white shadow-2xl backdrop-blur-md sm:bottom-5 sm:p-6"
        >
          <p className="font-display text-xl font-semibold">Sua privacidade</p>
          <p className="mt-2 text-sm leading-6 text-white/75">
            Usamos medições opcionais para entender quais páginas são mais acessadas e melhorar o portal.
            Elas ficam desligadas até você autorizar. Você pode mudar esta escolha quando quiser.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => choose("denied")}>
              Recusar medições
            </Button>
            <Button type="button" variant="warm" onClick={() => choose("granted")}>
              Aceitar medições
            </Button>
          </div>
        </section>
      ) : null}
    </ConsentContext.Provider>
  );
}

export function useAnalyticsConsent() {
  const value = useContext(ConsentContext);
  if (!value) throw new Error("useAnalyticsConsent deve ser usado dentro de AnalyticsConsentProvider.");
  return value;
}

export function AnalyticsPreferencesButton({ className }: { className?: string }) {
  const { openPreferences } = useAnalyticsConsent();
  return (
    <button type="button" className={className} onClick={openPreferences}>
      Preferências de privacidade
    </button>
  );
}
