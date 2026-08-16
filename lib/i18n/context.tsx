"use client";

// Lean i18n provider (Faz 3) — see messages.ts for why this isn't next-intl.
// Wrapped once around the whole app in app/layout.tsx so both `/` and
// `/player/[steamid]` share one persisted language choice.
//
// Initial locale detection reads localStorage/navigator.language, both
// client-only, so it's done via useSyncExternalStore (server snapshot "en",
// client snapshot the real value) rather than a useEffect+setState — React
// reconciles the server/client mismatch for this hook safely by design,
// whereas setState-in-effect for the same purpose trips the
// react-hooks/set-state-in-effect lint rule and causes an extra render.

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { messages, type Locale } from "./messages";

const LOCALE_KEY = "cs2stats:locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Looks up `key`, substituting `{name}` placeholders from `vars`. Falls back to English, then the raw key. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function subscribeNoop() {
  return () => {};
}

function getClientSnapshot(): Locale {
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (stored === "tr" || stored === "en") return stored;
  } catch {
    // localStorage unavailable — fall through to browser language detection
  }
  return navigator.language?.toLowerCase().startsWith("tr") ? "tr" : "en";
}

function getServerSnapshot(): Locale {
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const detected = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const [override, setOverride] = useState<Locale | null>(null);
  const locale = override ?? detected;

  const setLocale = useCallback((l: Locale) => {
    setOverride(l);
    try {
      window.localStorage.setItem(LOCALE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      let str = messages[locale][key] ?? messages.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, String(v));
      }
      return str;
    };
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
